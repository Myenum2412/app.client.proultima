-- Invoice Data for Billing Page
-- This script inserts invoice records that will appear in the Billing page table
-- Run this in Supabase SQL editor
--
-- Usage:
-- 1) Leave owner_email as null to use the most recent Auth user
-- 2) Or set owner_email to your email
-- 3) Run this file in Supabase SQL editor

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000000';
  owner_email text := null;

  proj_ids uuid[];
  proj_count int;
  proj_idx int := 1;
begin
  -- Auto-resolve owner_id
  if owner_id = '00000000-0000-0000-0000-000000000000'::uuid then
    if owner_email is not null then
      select u.id into owner_id from auth.users u where lower(u.email) = lower(owner_email) limit 1;
    else
      select u.id into owner_id from auth.users u order by u.created_at desc limit 1;
    end if;
  end if;

  if owner_id is null or owner_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'No Auth user found. Create a user in Supabase Auth → Users, then re-run this script.';
  end if;

  -- Get all project IDs for this user
  select array_agg(p.id order by p.created_at), count(*) into proj_ids, proj_count
  from public.projects p
  where p.owner_id = owner_id;

  if proj_count = 0 or proj_ids is null then
    raise exception 'No projects found. Please create projects first using seed.sql';
  end if;

  -- Insert 25 invoices, cycling through available projects
  insert into public.invoices (
    project_id, invoice_no, billed_tonnage, unit_price_or_lump_sum,
    tons_billed_amount, billed_hours_co, co_price, co_billed_amount, total_amount_billed
  ) values
    (proj_ids[((1 - 1) % proj_count) + 1], 'INV-1001', 12.4, '$150 / Ton', 1860.0, 6.5, 975.0, 975.0, 2835.0),
    (proj_ids[((2 - 1) % proj_count) + 1], 'INV-1002', 18.2, 'Lump Sum', 0.0, 12.0, 1800.0, 1200.0, 1200.0),
    (proj_ids[((3 - 1) % proj_count) + 1], 'INV-1003', 8.2, '$150 / Ton', 1230.0, 0.0, 0.0, 0.0, 1230.0),
    (proj_ids[((4 - 1) % proj_count) + 1], 'INV-1004', 25.3, '$155 / Ton', 3921.5, 15.0, 2250.0, 2250.0, 6171.5),
    (proj_ids[((5 - 1) % proj_count) + 1], 'INV-1005', 22.5, '$145 / Ton', 3262.5, 10.5, 1575.0, 1575.0, 4837.5),
    (proj_ids[((6 - 1) % proj_count) + 1], 'INV-1006', 30.1, '$160 / Ton', 4816.0, 20.0, 3000.0, 3000.0, 7816.0),
    (proj_ids[((7 - 1) % proj_count) + 1], 'INV-1007', 15.8, '$150 / Ton', 2370.0, 8.0, 1200.0, 1200.0, 3570.0),
    (proj_ids[((8 - 1) % proj_count) + 1], 'INV-1008', 19.7, '$155 / Ton', 3053.5, 0.0, 0.0, 0.0, 3053.5),
    (proj_ids[((9 - 1) % proj_count) + 1], 'INV-1009', 28.4, '$160 / Ton', 4544.0, 0.0, 0.0, 0.0, 4544.0),
    (proj_ids[((10 - 1) % proj_count) + 1], 'INV-1010', 35.2, '$148 / Ton', 5209.6, 18.5, 2775.0, 2775.0, 7984.6),
    (proj_ids[((11 - 1) % proj_count) + 1], 'INV-1011', 32.8, '$148 / Ton', 4854.4, 0.0, 0.0, 0.0, 4854.4),
    (proj_ids[((12 - 1) % proj_count) + 1], 'INV-1012', 10.5, '$150 / Ton', 1575.0, 4.5, 675.0, 675.0, 2250.0),
    (proj_ids[((13 - 1) % proj_count) + 1], 'INV-1013', 20.3, '$145 / Ton', 2943.5, 8.0, 1200.0, 1200.0, 4143.5),
    (proj_ids[((14 - 1) % proj_count) + 1], 'INV-1014', 32.8, '$160 / Ton', 5248.0, 12.5, 1875.0, 1875.0, 7123.0),
    (proj_ids[((15 - 1) % proj_count) + 1], 'INV-1015', 18.5, '$152 / Ton', 2812.0, 9.0, 1350.0, 1350.0, 4162.0),
    (proj_ids[((16 - 1) % proj_count) + 1], 'INV-1016', 14.2, '$158 / Ton', 2243.6, 6.0, 900.0, 900.0, 3143.6),
    (proj_ids[((17 - 1) % proj_count) + 1], 'INV-1017', 28.9, '$150 / Ton', 4335.0, 14.0, 2100.0, 2100.0, 6435.0),
    (proj_ids[((18 - 1) % proj_count) + 1], 'INV-1018', 14.3, '$150 / Ton', 2145.0, 7.0, 1050.0, 1050.0, 3195.0),
    (proj_ids[((19 - 1) % proj_count) + 1], 'INV-1019', 25.7, '$145 / Ton', 3726.5, 12.0, 1800.0, 1800.0, 5526.5),
    (proj_ids[((20 - 1) % proj_count) + 1], 'INV-1020', 28.9, '$155 / Ton', 4479.5, 18.0, 2700.0, 2700.0, 7179.5),
    (proj_ids[((21 - 1) % proj_count) + 1], 'INV-1021', 35.5, '$160 / Ton', 5680.0, 15.0, 2250.0, 2250.0, 7930.0),
    (proj_ids[((22 - 1) % proj_count) + 1], 'INV-1022', 38.6, '$148 / Ton', 5712.8, 20.0, 3000.0, 3000.0, 8712.8),
    (proj_ids[((23 - 1) % proj_count) + 1], 'INV-1023', 22.3, '$152 / Ton', 3389.6, 11.5, 1725.0, 1725.0, 5114.6),
    (proj_ids[((24 - 1) % proj_count) + 1], 'INV-1024', 16.8, '$158 / Ton', 2654.4, 8.5, 1275.0, 1275.0, 3929.4),
    (proj_ids[((25 - 1) % proj_count) + 1], 'INV-1025', 31.4, '$150 / Ton', 4710.0, 16.5, 2475.0, 2475.0, 7185.0);

  raise notice 'Successfully inserted 25 invoices across % projects', proj_count;
  raise notice 'Invoices will appear in the Billing page table at /billing';
end $$;
