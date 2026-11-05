-- Performance cleanup (20261105100000_perf_cleanup.sql): advisor fixes with no
-- behavior change. Run with: supabase test db. Uses the seed accounts. Rolled back.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated, service_role;
CREATE SCHEMA tests;
GRANT USAGE ON SCHEMA tests TO anon, authenticated, service_role;
CREATE FUNCTION tests.login(p_user uuid) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true),
         set_config('role', 'authenticated', true);
$$;
CREATE FUNCTION tests.anon() RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', '{"role":"anon"}', true), set_config('role', 'anon', true);
$$;
CREATE FUNCTION tests.logout() RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', '', true), set_config('role', 'postgres', true);
$$;
-- Rows an UPDATE/DELETE touched, as the current (RLS-bound) role.
CREATE FUNCTION tests.rows(p_sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO anon, authenticated, service_role;

SELECT plan(19);

-- ---------------------------------------------------------------------------
-- RLS: auth functions evaluated once per statement
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM pg_policies
   WHERE schemaname = 'public'
     AND regexp_replace(coalesce(qual, '') || ' ' || coalesce(with_check, ''),
                        '\( SELECT (auth\.\w+\(\)|current_setting\([^)]*\)) AS \w+\)', '', 'g')
         ~ '(auth\.\w+\(\)|current_setting\()'),
  0, 'no public policy calls auth.*() or current_setting() per row');

-- ---------------------------------------------------------------------------
-- device_tokens: one policy, same access
-- ---------------------------------------------------------------------------
SELECT results_eq(
  $$SELECT policyname::text COLLATE "C", roles::text COLLATE "C", cmd::text COLLATE "C" FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_tokens'$$,
  $$VALUES ('users manage own device tokens'::text COLLATE "C", '{authenticated}'::text COLLATE "C", 'ALL'::text COLLATE "C")$$,
  'device_tokens has one FOR ALL policy for authenticated');

DELETE FROM public.device_tokens;
INSERT INTO public.device_tokens (user_id, fcm_token, platform) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'tok-A', 'android'),
  ('a0000000-0000-4000-8000-000000000003', 'tok-B', 'android');

SELECT tests.login('a0000000-0000-4000-8000-000000000002');
SELECT results_eq($$SELECT fcm_token FROM public.device_tokens$$, $$VALUES ('tok-A'::text)$$, 'a user sees only their own tokens');
SELECT lives_ok(
  $$INSERT INTO public.device_tokens (user_id, fcm_token, platform) VALUES ('a0000000-0000-4000-8000-000000000002', 'tok-A2', 'ios')$$,
  'a user adds their own token');
SELECT throws_ok(
  $$INSERT INTO public.device_tokens (user_id, fcm_token, platform) VALUES ('a0000000-0000-4000-8000-000000000003', 'tok-evil', 'ios')$$,
  '42501', NULL, 'a user cannot add a token for someone else');
SELECT is(
  tests.rows($q$UPDATE public.device_tokens SET fcm_token = 'hijack' WHERE fcm_token = 'tok-B'$q$),
  0, 'a user cannot update someone else''s token');
SELECT throws_ok(
  $$UPDATE public.device_tokens SET user_id = 'a0000000-0000-4000-8000-000000000003' WHERE fcm_token = 'tok-A'$$,
  '42501', NULL, 'a user cannot hand their token to someone else');
SELECT is(
  tests.rows($q$DELETE FROM public.device_tokens WHERE fcm_token = 'tok-B'$q$),
  0, 'a user cannot delete someone else''s token');
SELECT is(
  tests.rows($q$DELETE FROM public.device_tokens WHERE fcm_token = 'tok-A2'$q$),
  1, 'a user deletes their own token');
SELECT tests.anon();
SELECT throws_ok($$SELECT count(*) FROM public.device_tokens$$, '42501', NULL, 'anon still has no access');
SELECT tests.logout();
SELECT is((SELECT count(*)::int FROM public.device_tokens WHERE fcm_token = 'tok-B'), 1, 'the other user''s token is untouched');

-- The rewritten "own rows" policies still let a user see their own rows only.
SELECT tests.login('a0000000-0000-4000-8000-000000000006');
SELECT is((SELECT count(*)::int FROM public.profiles), 1, 'a patient sees one profile: their own');
SELECT is((SELECT count(*)::int FROM public.appointments WHERE user_id <> 'a0000000-0000-4000-8000-000000000006'), 0,
  'a patient sees no one else''s appointments');
SELECT tests.logout();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
SELECT hasnt_index('public', 'appointments', 'idx_appointments_queue', 'duplicate idx_appointments_queue dropped');
SELECT has_index('public', 'appointments', 'idx_appointments_status_token', ARRAY['status', 'token_number'], 'idx_appointments_status_token kept');
SELECT hasnt_index('public', 'profiles', 'profiles_role_idx', 'duplicate profiles_role_idx dropped');
SELECT has_index('public', 'profiles', 'idx_profiles_role', ARRAY['role'], 'idx_profiles_role kept');

-- Every foreign key on the hot tables has an index that starts with its columns.
SELECT is(
  ARRAY(
    SELECT c.conrelid::regclass || '.' || c.conname
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.conrelid::regclass::text IN ('visit_payments', 'push_outbox', 'doctors', 'services', 'staff_centers', 'queue_updates')
      AND NOT (c.conrelid::regclass::text = 'doctors' AND c.conname <> 'doctors_center_id_fkey')
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND (i.indkey::int2[])[0:cardinality(c.conkey) - 1] = c.conkey
      )
    ORDER BY 1
  ),
  '{}'::text[], 'hot-table foreign keys are indexed');

-- ---------------------------------------------------------------------------
-- pg_cron history is pruned nightly
-- ---------------------------------------------------------------------------
SELECT results_eq(
  $$SELECT schedule, command FROM cron.job WHERE jobname = 'prune-cron-history'$$,
  $$VALUES ('15 22 * * *'::text, 'DELETE FROM cron.job_run_details WHERE end_time < now() - interval ''7 days'''::text)$$,
  'prune-cron-history runs nightly and keeps 7 days');

SELECT * FROM finish();
ROLLBACK;
