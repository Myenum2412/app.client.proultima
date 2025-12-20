-- Seed Data for Projects Table
-- This file seeds the projects table with initial data from Projects.tsx component
-- Note: Project IDs are generated as UUIDs. Drawing entries reference these UUIDs.

-- Insert Project 1: Valley View Business Park Tilt Panels
INSERT INTO public.projects (
  project_number,
  project_name,
  client_name,
  contractor_name,
  project_location,
  estimated_tons,
  detailed_tons_per_approval,
  detailed_tons_per_latest_rev,
  released_tons,
  detailing_status,
  revision_status,
  release_status,
  status,
  due_date,
  start_date,
  created_at
) VALUES (
  'PRO-2025-001',
  'Valley View Business Park Tilt Panels',
  'RE-STEEL',
  'T&T CONSTRUCTION',
  'JESSUP, PA',
  398.9,
  484.72,
  484.72,
  492.92,
  'COMPLETED',
  'COMPLETED',
  'RELEASED COMPLETELY',
  'completed',
  '2024-12-31',
  '2024-01-01',
  NOW()
)
ON CONFLICT (project_number) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  updated_at = NOW();

-- Insert Drawings Yet to Release for Project 1 (28 drawings)
-- Uses subquery to reference project by project_number
INSERT INTO public.drawings_yet_to_release (
  project_id,
  dwg,
  status,
  description,
  release_status,
  latest_submitted_date,
  total_weight
)
SELECT 
  p.id,
  dwg_data.dwg,
  dwg_data.status,
  dwg_data.description,
  dwg_data.release_status,
  dwg_data.latest_submitted_date,
  dwg_data.total_weight
FROM public.projects p
CROSS JOIN (VALUES
  ('R-1', 'FFU', 'EAST WALL PANELS E1 TO E8', '', '10-05-19', 24.64),
  ('R-2', 'FFU', 'EAST WALL PANELS E9 TO E16', '', '07-17-19', 15.81),
  ('R-3', 'FFU', 'EAST WALL PANELS E17 TO E23', '', '10-05-19', 17.77),
  ('R-4', 'FFU', 'NORTH WALL PANELS N1 TO N8', '', '10-05-19', 19.37),
  ('R-5', 'FFU', 'NORTH WALL PANELS N9 TO N15', '', '10-05-19', 18.45),
  ('R-6', 'FFU', 'NORTH WALL PANELS N16 TO N23', '', '10-05-19', 21.12),
  ('R-7', 'FFU', 'NORTH WALL PANELS N24 TO N31', '', '10-05-19', 20.58),
  ('R-8', 'FFU', 'NORTH WALL PANELS N32 TO N39', '', '10-05-19', 19.89),
  ('R-9', 'FFU', 'NORTH WALL PANELS N40 TO N47', '', '10-05-19', 20.15),
  ('R-10', 'FFU', 'NORTH WALL PANELS N48 TO N55', '', '10-05-19', 20.42),
  ('R-11', 'FFU', 'NORTH WALL PANELS N56 TO N63', '', '10-05-19', 19.76),
  ('R-12', 'FFU', 'NORTH WALL PANELS N64 TO N67', '', '10-05-19', 10.25),
  ('R-13', 'FFU', 'NORTH WALL PANELS N68 TO N70', '', '10-05-19', 7.68),
  ('R-14', 'FFU', 'NORTH WALL PANELS N71 TO N73', '', '10-05-19', 7.68),
  ('R-15', 'FFU', 'NORTH WALL PANELS N74 TO N81', '', '10-05-19', 20.48),
  ('R-16', 'FFU', 'WEST WALL PANELS W1 TO W8', '', '10-05-19', 19.37),
  ('R-17', 'FFU', 'WEST WALL PANELS W9 TO W16', '', '09-19-19', 19.37),
  ('R-18', 'FFU', 'WEST WALL PANELS W17 TO W22', '', '10-01-19', 14.53),
  ('R-19', 'FFU', 'SOUTH WALL PANELS S-1 TO S-8', '', '10-05-19', 19.37),
  ('R-20', 'FFU', 'SOUTH WALL PANELS S-9 TO S-15', '', '10-05-19', 17.36),
  ('R-21', 'FFU', 'SOUTH WALL PANELS S-16 TO S-23', '', '10-05-19', 20.48),
  ('R-22', 'FFU', 'SOUTH WALL PANELS S-24 TO S-31', '', '10-05-19', 20.48),
  ('R-23', 'FFU', 'SOUTH WALL PANELS S-32 TO S-39', '', '10-05-19', 20.48),
  ('R-24', 'FFU', 'SOUTH WALL PANELS S-40 TO S-47', '', '10-05-19', 20.48),
  ('R-25', 'FFU', 'SOUTH WALL PANELS S-48 TO S-55', '', '10-05-19', 20.48),
  ('R-26', 'FFU', 'SOUTH WALL PANELS S-56 TO S-63', '', '10-05-19', 20.48),
  ('R-27', 'FFU', 'SOUTH WALL PANELS S-64 TO S-73', '', '10-05-19', 25.6),
  ('R-28', 'FFU', 'SOUTH WALL PANELS S-74 TO S-80', '', '10-01-18', 17.92)
) AS dwg_data(dwg, status, description, release_status, latest_submitted_date, total_weight)
WHERE p.project_number = 'PRO-2025-001'
ON CONFLICT DO NOTHING;

-- Insert Drawing Log for Project 1 (28 drawings)
INSERT INTO public.drawing_log (
  project_id,
  dwg,
  status,
  description,
  latest_submitted_date,
  total_weight
)
SELECT 
  p.id,
  dwg_data.dwg,
  dwg_data.status,
  dwg_data.description,
  dwg_data.latest_submitted_date,
  dwg_data.total_weight
FROM public.projects p
CROSS JOIN (VALUES
  ('R-1', 'FFU', 'EAST WALL PANELS E1 TO E8', '10-05-19', 24.64),
  ('R-2', 'FFU', 'EAST WALL PANELS E9 TO E16', '07-17-19', 15.81),
  ('R-3', 'FFU', 'EAST WALL PANELS E17 TO E23', '10-05-19', 17.77),
  ('R-4', 'FFU', 'NORTH WALL PANELS N1 TO N8', '10-05-19', 19.37),
  ('R-5', 'FFU', 'NORTH WALL PANELS N9 TO N15', '10-05-19', 18.45),
  ('R-6', 'FFU', 'NORTH WALL PANELS N16 TO N23', '10-05-19', 21.12),
  ('R-7', 'FFU', 'NORTH WALL PANELS N24 TO N31', '10-05-19', 20.58),
  ('R-8', 'FFU', 'NORTH WALL PANELS N32 TO N39', '10-05-19', 19.89),
  ('R-9', 'FFU', 'NORTH WALL PANELS N40 TO N47', '10-05-19', 20.15),
  ('R-10', 'FFU', 'NORTH WALL PANELS N48 TO N55', '10-05-19', 20.42),
  ('R-11', 'FFU', 'NORTH WALL PANELS N56 TO N63', '10-05-19', 19.76),
  ('R-12', 'FFU', 'NORTH WALL PANELS N64 TO N67', '10-05-19', 10.25),
  ('R-13', 'FFU', 'NORTH WALL PANELS N68 TO N70', '10-05-19', 7.68),
  ('R-14', 'FFU', 'NORTH WALL PANELS N71 TO N73', '10-05-19', 7.68),
  ('R-15', 'FFU', 'NORTH WALL PANELS N74 TO N81', '10-05-19', 20.48),
  ('R-16', 'FFU', 'WEST WALL PANELS W1 TO W8', '10-05-19', 19.37),
  ('R-17', 'FFU', 'WEST WALL PANELS W9 TO W16', '09-19-19', 19.37),
  ('R-18', 'FFU', 'WEST WALL PANELS W17 TO W22', '10-01-19', 14.53),
  ('R-19', 'FFU', 'SOUTH WALL PANELS S-1 TO S-8', '10-05-19', 19.37),
  ('R-20', 'FFU', 'SOUTH WALL PANELS S-9 TO S-15', '10-05-19', 17.36),
  ('R-21', 'FFU', 'SOUTH WALL PANELS S-16 TO S-23', '10-05-19', 20.48),
  ('R-22', 'FFU', 'SOUTH WALL PANELS S-24 TO S-31', '10-05-19', 20.48),
  ('R-23', 'FFU', 'SOUTH WALL PANELS S-32 TO S-39', '10-05-19', 20.48),
  ('R-24', 'FFU', 'SOUTH WALL PANELS S-40 TO S-47', '10-05-19', 20.48),
  ('R-25', 'FFU', 'SOUTH WALL PANELS S-48 TO S-55', '10-05-19', 20.48),
  ('R-26', 'FFU', 'SOUTH WALL PANELS S-56 TO S-63', '10-05-19', 20.48),
  ('R-27', 'FFU', 'SOUTH WALL PANELS S-64 TO S-73', '10-05-19', 25.6),
  ('R-28', 'FFU', 'SOUTH WALL PANELS S-74 TO S-80', '10-01-18', 17.92)
) AS dwg_data(dwg, status, description, latest_submitted_date, total_weight)
WHERE p.project_number = 'PRO-2025-001'
ON CONFLICT DO NOTHING;

-- Insert Project 2: MID-WAY SOUTH LOGISTIC CENTER, PANELS
INSERT INTO public.projects (
  id,
  project_number,
  project_name,
  client_name,
  contractor_name,
  project_location,
  estimated_tons,
  detailed_tons_per_approval,
  detailed_tons_per_latest_rev,
  released_tons,
  detailing_status,
  revision_status,
  release_status,
  status,
  due_date,
  start_date,
  created_at,
  updated_at
) VALUES (
  '4e40d2e3-c853-43a7-8cf4-b41e7eb89bc9'::uuid,
  'PRO-2025-002',
  'MID-WAY SOUTH LOGISTIC CENTER, PANELS',
  'RE-STEEL',
  'T&T CONSTRUCTION',
  'BETHEL, PA',
  189,
  172.73,
  172.73,
  172.13,
  'COMPLETED',
  'COMPLETED',
  'RELEASED COMPLETELY',
  'completed',
  '2024-12-31',
  '2024-01-01',
  '2025-12-19 19:31:41.865223+00'::timestamp with time zone,
  '2025-12-19 19:31:41.865223+00'::timestamp with time zone
)
ON CONFLICT (project_number) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  updated_at = NOW();

-- Insert Drawings Yet to Return for Project 2 (3 drawings)
INSERT INTO public.drawings_yet_to_return (
  project_id,
  dwg,
  status,
  description,
  release_status,
  latest_submitted_date
)
SELECT 
  p.id,
  dwg_data.dwg,
  dwg_data.status,
  dwg_data.description,
  dwg_data.release_status,
  dwg_data.latest_submitted_date
FROM public.projects p
CROSS JOIN (VALUES
  ('R-1', 'R&R', 'SOUTH WALL PANELS S1 TO S7', '', '05-30-19'),
  ('R-2', 'R&R', 'SOUTH WALL PANELS S8 TO 14', '', '05-30-19'),
  ('R-3', 'R&R', 'SOUTH WALL PANELS S15 TO S21', '', '05-30-19')
) AS dwg_data(dwg, status, description, release_status, latest_submitted_date)
WHERE p.project_number = 'PRO-2025-002'
ON CONFLICT DO NOTHING;

-- Insert Drawings Yet to Release for Project 2 (10 drawings)
INSERT INTO public.drawings_yet_to_release (
  project_id,
  dwg,
  status,
  description,
  release_status,
  latest_submitted_date,
  total_weight
)
SELECT 
  p.id,
  dwg_data.dwg,
  dwg_data.status,
  dwg_data.description,
  dwg_data.release_status,
  dwg_data.latest_submitted_date,
  dwg_data.total_weight
FROM public.projects p
CROSS JOIN (VALUES
  ('R-4', 'FFU', 'SOUTH WALL PANELS S22 TO S28', '', '05-30-19', 14.45),
  ('R-5', 'FFU', 'SOUTH WALL PANELS S29 & S30', '', '05-30-19', 4.26),
  ('R-6', 'FFU', 'WEST PANELS W-1 TO W-8', '', '05-30-19', 14.4),
  ('R-7', 'FFU', 'WEST PANELS W-9 TO W-15', '', '05-30-19', 13.01),
  ('R-8', 'FFU', 'NORTH PANELS FROM N-1 TO N-8', '', '05-30-19', 14.93),
  ('R-9', 'FFU', 'NORTH PANELS FROM N-9 TO N-16', '', '05-30-19', 14.39),
  ('R-10', 'FFU', 'NORTH PANELS FROM N-17 TO N-24', '', '05-30-19', 13.04),
  ('R-11', 'FFU', 'NORTH PANELS FROM N-15 TO N-30', '', '05-30-19', 12.15),
  ('R-12', 'FFU', 'EAST WALL PANELS E1 TO E8', '', '05-30-19', 15.23),
  ('R-13', 'FFU', 'EAST WALL PANELS E9 TO E15', '', '05-30-19', 12.84)
) AS dwg_data(dwg, status, description, release_status, latest_submitted_date, total_weight)
WHERE p.project_number = 'PRO-2025-002'
ON CONFLICT DO NOTHING;

-- Insert Drawing Log for Project 2 (13 drawings)
INSERT INTO public.drawing_log (
  project_id,
  dwg,
  status,
  description,
  latest_submitted_date,
  total_weight
)
SELECT 
  p.id,
  dwg_data.dwg,
  dwg_data.status,
  dwg_data.description,
  dwg_data.latest_submitted_date,
  dwg_data.total_weight
FROM public.projects p
CROSS JOIN (VALUES
  ('R-1', 'R&R', 'SOUTH WALL PANELS S1 TO S7', '05-30-19', 14.66),
  ('R-2', 'R&R', 'SOUTH WALL PANELS S8 TO 14', '05-30-19', 14.56),
  ('R-3', 'R&R', 'SOUTH WALL PANELS S15 TO S21', '05-30-19', 14.22),
  ('R-4', 'FFU', 'SOUTH WALL PANELS S22 TO S28', '05-30-19', 14.45),
  ('R-5', 'FFU', 'SOUTH WALL PANELS S29 & S30', '05-30-19', 4.26),
  ('R-6', 'FFU', 'WEST PANELS W-1 TO W-8', '05-30-19', 14.4),
  ('R-7', 'FFU', 'WEST PANELS W-9 TO W-15', '05-30-19', 13.01),
  ('R-8', 'FFU', 'NORTH PANELS FROM N-1 TO N-8', '05-30-19', 14.93),
  ('R-9', 'FFU', 'NORTH PANELS FROM N-9 TO N-16', '05-30-19', 14.39),
  ('R-10', 'FFU', 'NORTH PANELS FROM N-17 TO N-24', '05-30-19', 13.04),
  ('R-11', 'FFU', 'NORTH PANELS FROM N-15 TO N-30', '05-30-19', 12.15),
  ('R-12', 'FFU', 'EAST WALL PANELS E1 TO E8', '05-30-19', 15.23),
  ('R-13', 'FFU', 'EAST WALL PANELS E9 TO E15', '05-30-19', 12.84)
) AS dwg_data(dwg, status, description, latest_submitted_date, total_weight)
WHERE p.project_number = 'PRO-2025-002'
ON CONFLICT DO NOTHING;

