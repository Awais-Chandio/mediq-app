-- Demo names for marketing screenshots. LOCAL STACK ONLY, run after `supabase db reset`:
--   docker exec -i supabase_db_QueueLess psql -U postgres -d postgres < marketing/tools/demo-data.sql
-- The seed uses real hospital names for tests; screenshots use made-up ones.

UPDATE service_centers c SET name = v.name, address = v.address
FROM (VALUES
  ('521f1349-05c4-4417-9fa5-5289963af7db'::uuid, 'Sunrise Medical Centre',     'Hospital Road, Hyderabad'),
  ('d2c1a3df-bb89-4fde-b73d-5bb9ec763481'::uuid, 'Little Stars Children''s Clinic', 'Jamshoro Road, Hyderabad'),
  ('07d39e17-af18-45c1-9574-28d59d6a3c65'::uuid, 'Green Valley Hospital',      'Unit 6, Latifabad, Hyderabad'),
  ('89ec7fde-e4d8-4b99-993f-f47525cd3a68'::uuid, 'Riverside Family Clinic',    'Unit 7, Latifabad, Hyderabad')
) AS v (id, name, address)
WHERE c.id = v.id;

UPDATE organizations o SET name = c.name
FROM service_centers c WHERE c.organization_id = o.id;

UPDATE doctors SET name = 'Dr. Imran Qureshi', qualification = 'MBBS, FCPS', experience_years = 12, room = '2', fee = 1000
WHERE id = 'd0000000-0000-4000-8000-00000000000a';
UPDATE doctors SET name = 'Dr. Farah Siddiqui', qualification = 'MBBS, DCH', experience_years = 9, room = '4', fee = 1200
WHERE id = 'd0000000-0000-4000-8000-00000000000b';

UPDATE profiles p SET full_name = v.name, phone = v.phone
FROM (VALUES
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'Ahmed Raza',        '03001234567'),
  ('a0000000-0000-4000-8000-000000000007'::uuid, 'Mariam Khan',       '03007654321'),
  ('a0000000-0000-4000-8000-000000000009'::uuid, 'Dr. Sana Malik',    '03011112222'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'Bilal (Reception)', ''),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'Hina (Reception)',  ''),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'Dr. Imran Qureshi', ''),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 'Dr. Farah Siddiqui', '')
) AS v (id, name, phone)
WHERE p.id = v.id;

UPDATE auth.users u SET raw_user_meta_data = jsonb_build_object('full_name', p.full_name)
FROM profiles p WHERE p.id = u.id;

UPDATE patients pt SET name = p.full_name, phone = p.phone
FROM profiles p WHERE p.id = pt.user_id;
