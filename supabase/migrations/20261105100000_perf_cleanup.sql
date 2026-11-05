-- Performance cleanup from the database advisors (2026-11-05). No behavior change:
-- every policy below grants exactly the rows it granted before.
--
-- 1. auth_rls_initplan (19 policies): auth.uid() is wrapped in (SELECT ...) so
--    Postgres evaluates it once per statement instead of once per row.
-- 2. device_tokens had two sets of "own rows" policies doing the same thing:
--    four per-command ones for authenticated, and one FOR ALL for public. One
--    FOR ALL policy for authenticated is left. anon lost nothing: auth.uid()
--    is NULL for anon, so the public policy never matched a row for it.
-- 3. duplicate_index: identical (status, token_number) and (role) indexes.
--    Both copies came from the remote baseline; one of each is kept.
-- 4. unindexed_foreign_keys, hot tables only (payments, pushes, the queue).
--    The rest of that list is small admin/billing tables; see the PR notes.
-- 5. cron.job_run_details grows by ~2,900 rows a day (two jobs every minute).
--    A nightly job keeps 7 days.

-- ---------------------------------------------------------------------------
-- 1. (SELECT auth.uid()) in RLS policies
-- ---------------------------------------------------------------------------
ALTER POLICY "cancel own appointments" ON public.appointments
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (((SELECT auth.uid()) = user_id) AND (status = ANY (ARRAY['cancelled'::text, 'checked_in'::text])));
ALTER POLICY "users_select_own_appointments" ON public.appointments
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "doctor read own record" ON public.doctors
  USING (profile_id = (SELECT auth.uid()));
ALTER POLICY "doctor self update own record" ON public.doctors
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

ALTER POLICY "notifications_delete_own" ON public.notifications
  USING ((SELECT auth.uid()) = user_id);
ALTER POLICY "users_select_own_notifications" ON public.notifications
  USING ((SELECT auth.uid()) = user_id);
ALTER POLICY "users_update_own_notifications" ON public.notifications
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert own profile" ON public.profiles
  WITH CHECK ((SELECT auth.uid()) = id);
ALTER POLICY "Users can update own profile" ON public.profiles
  USING ((SELECT auth.uid()) = id);
ALTER POLICY "Users can view own profile" ON public.profiles
  USING ((SELECT auth.uid()) = id);

ALTER POLICY "users can read own queue updates" ON public.queue_updates
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = queue_updates.appointment_id AND a.user_id = (SELECT auth.uid())
  ));

ALTER POLICY "Users can delete own slot locks" ON public.slot_locks
  USING ((SELECT auth.uid()) = user_id);
ALTER POLICY "Users can insert own slot locks" ON public.slot_locks
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "staff view own center assignments" ON public.staff_centers
  USING (profile_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- 2. device_tokens: one "own rows" policy (covers the other 5 initplan findings)
-- ---------------------------------------------------------------------------
DROP POLICY "Users can view own device tokens" ON public.device_tokens;
DROP POLICY "Users can insert own device tokens" ON public.device_tokens;
DROP POLICY "Users can update own device tokens" ON public.device_tokens;
DROP POLICY "Users can delete own device tokens" ON public.device_tokens;
ALTER POLICY "users manage own device tokens" ON public.device_tokens
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Duplicate indexes (keep the descriptive names)
-- ---------------------------------------------------------------------------
DROP INDEX public.idx_appointments_queue;   -- = idx_appointments_status_token (status, token_number)
DROP INDEX public.profiles_role_idx;        -- = idx_profiles_role (role)

-- ---------------------------------------------------------------------------
-- 4. Foreign keys on hot tables
-- ---------------------------------------------------------------------------
CREATE INDEX idx_visit_payments_patient ON public.visit_payments (patient_id);
CREATE INDEX idx_visit_payments_received_by ON public.visit_payments (received_by);
CREATE INDEX idx_push_outbox_appointment ON public.push_outbox (appointment_id);
CREATE INDEX idx_push_outbox_organization ON public.push_outbox (organization_id);
CREATE INDEX idx_push_outbox_payment ON public.push_outbox (payment_id);
CREATE INDEX idx_doctors_center ON public.doctors (center_id);
CREATE INDEX idx_services_center ON public.services (center_id);
CREATE INDEX idx_staff_centers_center ON public.staff_centers (center_id);   -- PK leads with profile_id
CREATE INDEX idx_queue_updates_appointment ON public.queue_updates (appointment_id);

-- ---------------------------------------------------------------------------
-- 5. Keep a week of pg_cron history (cron.schedule replaces a job with the same name)
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'prune-cron-history',
  '15 22 * * *',   -- 22:15 UTC = 03:15 PKT, after the other nightly jobs
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'$$
);
