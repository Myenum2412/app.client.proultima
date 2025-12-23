-- ============================================================================
-- Seed Data for Proultima Project Management Platform
-- Inserts all demo data from public/assets.ts into Supabase tables
-- ============================================================================

-- Note: This script is idempotent - it can be run multiple times safely
-- Delete existing data first (in reverse order of dependencies)
DELETE FROM public.payments;
DELETE FROM public.invoices;
DELETE FROM public.submissions;
DELETE FROM public.material_list_fields;
DELETE FROM public.material_list_bar_items;
DELETE FROM public.material_lists;
DELETE FROM public.drawing_log;
DELETE FROM public.drawings_yet_to_release;
DELETE FROM public.drawings_yet_to_return;
DELETE FROM public.projects;

-- ============================================================================
-- PROJECTS DATA
-- ============================================================================

INSERT INTO public.projects (project_number, project_name, client_name, contractor_name, project_location, estimated_tons, detailing_status, revision_status, release_status, status) VALUES
('U2524', 'Valley View Business Park Tilt Panels', 'RE-STEEL', 'T&T CONSTRUCTION', 'JESSUP, PA', 398.9, 'COMPLETED', 'COMPLETED', 'RELEASED COMPLETELY', 'completed'),
('U2532', 'MID-WAY SOUTH LOGISTIC CENTER, PANELS', 'RE-STEEL', 'T&T CONSTRUCTION', 'BETHEL, PA', 189, 'IN PROCESS', 'IN PROCESS', 'IN PROCESS', 'in-progress'),
('U3223P', 'PANATTONI LEHIGH 309 BUILDING B TILT PANELS', 'RE-STEEL', 'FORCINE CONCRETE', 'UPPER SAUCON TWP, PA', 412.5, 'COMPLETED', 'IN PROCESS', 'IN PROCESS', 'in-progress');

-- ============================================================================
-- DRAWINGS_YET_TO_RELEASE DATA (FFU status)
-- ============================================================================

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-1',
  'FFU',
  'FOUNDATION PANELS F1 TO F4',
  12.32,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-2',
  'FFU',
  'FOUNDATION PANELS F5 TO F8',
  12.31,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-3',
  'FFU',
  'NORTH WALL PANELS N1 TO N4',
  14.89,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-4',
  'FFU',
  'NORTH WALL PANELS N1 TO N8',
  17.77,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-5',
  'FFU',
  'NORTH WALL PANELS N9 TO N15',
  19.70,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-6',
  'FFU',
  'NORTH WALL PANELS N16 TO N22',
  14.59,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-7',
  'FFU',
  'NORTH WALL PANELS N23 TO N29',
  18.99,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-8',
  'FFU',
  'NORTH WALL PANELS N30 TO N36',
  18.50,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-9',
  'FFU',
  'NORTH WALL PANELS N37 TO N43',
  15.53,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-10',
  'FFU',
  'NORTH WALL PANELS N44 TO N50',
  19.68,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-11',
  'FFU',
  'NORTH WALL PANELS N51 TO N58',
  18.10,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-12',
  'FFU',
  'NORTH WALL PANELS N59 TO N66',
  21.96,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-13',
  'FFU',
  'NORTH WALL PANELS N67 TO N73',
  15.54,
  '2019-10-05',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-14',
  'FFU',
  'SOUTH WALL PANELS S1 TO S6',
  20.41,
  '2019-09-28',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-15',
  'FFU',
  'SOUTH WALL PANELS S7 TO S14',
  19.88,
  '2019-09-28',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_release (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-16',
  'FFU',
  'WEST WALL PANELS W9 TO W16',
  17.57,
  '2019-09-19',
  'Released',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

-- ============================================================================
-- DRAWINGS_YET_TO_RETURN DATA (APP/R&R status)
-- ============================================================================

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-17',
  'APP',
  'WEST WALL PANELS W17 TO W24',
  18.42,
  '2019-11-02',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-18',
  'APP',
  'EAST WALL PANELS E1 TO E8',
  21.11,
  '2019-11-02',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-19',
  'R&R',
  'EAST WALL PANELS E9 TO E16',
  20.96,
  '2019-11-02',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-20',
  'APP',
  'EAST WALL PANELS E17 TO E24',
  19.84,
  '2019-11-02',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-21',
  'R&R',
  'ROOF PANELS RP1 TO RP6',
  22.05,
  '2019-11-10',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-22',
  'APP',
  'ROOF PANELS RP7 TO RP12',
  21.78,
  '2019-11-10',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-23',
  'R&R',
  'ROOF PANELS RP13 TO RP18',
  22.31,
  '2019-11-10',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-24',
  'APP',
  'ROOF PANELS RP19 TO RP24',
  21.64,
  '2019-11-10',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-25',
  'R&R',
  'MEZZANINE PANELS M1 TO M6',
  18.97,
  '2019-11-15',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-26',
  'APP',
  'MEZZANINE PANELS M7 TO M12',
  19.21,
  '2019-11-15',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-27',
  'R&R',
  'STAIR / RAMP DETAILS',
  9.84,
  '2019-11-20',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawings_yet_to_return (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status)
SELECT 
  p.id,
  'R-28',
  'APP',
  'MISCELLANEOUS DETAILS',
  6.32,
  '2019-11-20',
  'Pending'
FROM public.projects p WHERE p.project_number = 'U2524';

-- ============================================================================
-- DRAWING_LOG DATA
-- ============================================================================

INSERT INTO public.drawing_log (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-1',
  'FFU',
  'EAST WALL PANELS E1 TO E8',
  24.64,
  '2019-10-05',
  'Released',
  'https://drive.google.com/file/d/1ESxOdyph8kZkaBmhjA7eIC7cFwrmiAnJ/view?usp=sharing'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawing_log (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  'R-2',
  'FFU',
  'EAST WALL PANELS E9 TO E16',
  15.81,
  '2019-07-17',
  'Released',
  '/assets/U2524/Drawing-Log/R-2.pdf'
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.drawing_log (project_id, dwg, status, description, total_weight, latest_submitted_date, release_status, pdf_path)
SELECT 
  p.id,
  t.dwg_no,
  'FFU',
  t.description,
  t.total_weight,
  t.latest_submitted_date,
  'Released',
  '/assets/U2524/Drawing-Log/' || t.dwg_no || '.pdf'
FROM (VALUES
  ('R-3', 'EAST WALL PANELS E17 TO E23', 13.23, '2019-10-05'),
  ('R-4', 'NORTH WALL PANELS N1 TO N8', 17.77, '2019-10-05'),
  ('R-5', 'NORTH WALL PANELS N9 TO N15', 19.70, '2019-10-05'),
  ('R-6', 'NORTH WALL PANELS N16 TO N22', 14.59, '2019-10-05'),
  ('R-7', 'NORTH WALL PANELS N23 TO N29', 19.00, '2019-10-05'),
  ('R-8', 'NORTH WALL PANELS N30 TO N36', 18.50, '2019-10-05'),
  ('R-9', 'NORTH WALL PANELS N37 TO N43', 15.53, '2019-10-05'),
  ('R-10', 'NORTH WALL PANELS N44 TO N50', 19.68, '2019-10-05'),
  ('R-11', 'NORTH WALL PANELS N51 TO N58', 18.10, '2019-10-05'),
  ('R-12', 'NORTH WALL PANELS N59 TO N66', 21.96, '2019-10-05'),
  ('R-13', 'NORTH WALL PANELS N67 TO N73', 15.54, '2019-10-05'),
  ('R-14', 'NORTH WALL PANELS N74 TO N81', 16.50, '2019-10-05'),
  ('R-15', 'WEST WALL PANELS W1 TO W8', 15.87, '2019-10-05'),
  ('R-16', 'WEST WALL PANELS W9 TO W16', 17.57, '2019-09-19'),
  ('R-17', 'WEST WALL PANELS W17 TO W22', 23.13, '2019-10-01'),
  ('R-18', 'SOUTH WALL PANELS S-1 TO S-8', 16.62, '2019-10-05'),
  ('R-19', 'SOUTH WALL PANELS S-9 TO S-15', 15.54, '2019-10-05'),
  ('R-20', 'SOUTH WALL PANELS S-16 TO S-22', 18.51, '2019-10-05'),
  ('R-21', 'SOUTH WALL PANELS S-23 TO S-30', 19.07, '2019-10-05'),
  ('R-22', 'SOUTH WALL PANELS S-31 TO S-37', 18.31, '2019-10-05'),
  ('R-23', 'SOUTH WALL PANELS S-38 TO S-44', 18.52, '2019-10-05'),
  ('R-24', 'SOUTH WALL PANELS S-45 TO S-51', 15.53, '2019-10-05'),
  ('R-25', 'SOUTH WALL PANELS S-52 TO S-58', 19.37, '2019-10-05'),
  ('R-26', 'SOUTH WALL PANELS S-59 TO S-66', 17.47, '2019-10-05'),
  ('R-27', 'SOUTH WALL PANELS S-67 TO S-73', 18.29, '2019-10-05'),
  ('R-28', 'SOUTH WALL PANELS S-74 TO S-80', 10.85, '2019-10-01')
) AS t(dwg_no, description, total_weight, latest_submitted_date)
CROSS JOIN public.projects p WHERE p.project_number = 'U2524';

-- ============================================================================
-- INVOICES DATA
-- ============================================================================

INSERT INTO public.invoices (invoice_id, project_number, project_name, billed_tonnage, unit_price_lump_sum, tons_billed_amount, billed_hours_co, co_price, co_billed_amount, total_amount_billed, status, issue_date)
SELECT 
  inv_id,
  proj_num,
  p.project_name,
  billed_tons,
  unit_price,
  tons_amount,
  co_hours,
  co_p,
  co_amount,
  total_amount,
  'Pending',
  NOW() - (CAST(random() * 180 AS INTEGER) || ' days')::INTERVAL
FROM (VALUES
  ('INV-1001', 'U2524', 12.4, 150, 1860.0, 6.5, 975.0, 975.0, 2835.0),
  ('INV-1003', 'U2524', 8.2, 150, 1230.0, 0.0, 0.0, 0.0, 1230.0),
  ('INV-1007', 'U2524', 15.8, 150, 2370.0, 8.0, 1200.0, 1200.0, 3570.0),
  ('INV-1012', 'U2524', 10.5, 150, 1575.0, 4.5, 675.0, 675.0, 2250.0)
) AS t(inv_id, proj_num, billed_tons, unit_price, tons_amount, co_hours, co_p, co_amount, total_amount)
JOIN public.projects p ON p.project_number = t.proj_num;

-- ============================================================================
-- SUBMISSIONS DATA
-- ============================================================================

INSERT INTO public.submissions (project_id, submission_type, work_description, drawing_number, submission_date, submitted_by)
SELECT 
  p.id,
  sub_type,
  work_desc,
  dwg_no,
  sub_date::date,
  'PROULTIMA PM'
FROM (VALUES
  ('U2524', 'RFI', 'Anchor bolt plan update', 'R-71', '2024-12-22'),
  ('U2524', 'SUBMITTAL', 'Embed layout confirmation', 'R-16', '2024-12-18'),
  ('U2532', 'SUBMITTAL', 'Beam connection shop drawings', 'R-28', '2025-03-15'),
  ('U2532', 'RFI', 'Wall panel installation sequence', 'R-35', '2025-02-25'),
  ('U3223P', 'SUBMITTAL', 'Column splice details', 'S-12', '2025-01-28')
) AS t(proj_num, sub_type, work_desc, dwg_no, sub_date)
JOIN public.projects p ON p.project_number = t.proj_num;

-- ============================================================================
-- MATERIAL LISTS DATA
-- ============================================================================

-- Insert material lists
INSERT INTO public.material_lists (project_id, heading, status, priority, note)
SELECT 
  p.id,
  'SLAB ON GRADE AREA-H (STAIR-H2)',
  'released',
  'High',
  NULL
FROM public.projects p WHERE p.project_number = 'U2524';

INSERT INTO public.material_lists (project_id, heading, status, priority, note)
SELECT 
  p.id,
  'BEAM CONNECTIONS LEVEL-2',
  'under_review',
  'Medium',
  'Requires coordination with structural team'
FROM public.projects p WHERE p.project_number = 'U2524';

-- Insert bar items for first material list
INSERT INTO public.material_list_bar_items (material_list_id, dwg_no, release_description, ctrl_code, rel_no, weight_lbs, date, varying_bars, remarks)
SELECT 
  ml.id,
  'R-71',
  'R71 AREA-H STAIR-H2 SOG',
  'BEQ',
  '42',
  591.07,
  '2024-05-13'::date,
  'No',
  'AW BAR LIST'
FROM public.material_lists ml
JOIN public.projects p ON p.id = ml.project_id
WHERE p.project_number = 'U2524' AND ml.heading = 'SLAB ON GRADE AREA-H (STAIR-H2)';

-- Insert bar items for second material list
INSERT INTO public.material_list_bar_items (material_list_id, dwg_no, release_description, ctrl_code, rel_no, weight_lbs, date, varying_bars, remarks)
SELECT 
  ml.id,
  'R-28',
  'R28 LEVEL-2 BEAM CONNECTIONS',
  'BCN',
  '28',
  728.39,
  '2025-03-14'::date,
  'No',
  'UNDER REVIEW'
FROM public.material_lists ml
JOIN public.projects p ON p.id = ml.project_id
WHERE p.project_number = 'U2524' AND ml.heading = 'BEAM CONNECTIONS LEVEL-2';

-- Insert fields for first material list
INSERT INTO public.material_list_fields (material_list_id, label, value)
SELECT 
  ml.id,
  label,
  value
FROM (VALUES
  ('Load Category', 'N/A'),
  ('Delivery Date', '2024-05-14'),
  ('Couplers/Form Savers', 'N/A'),
  ('Special Shapes', 'N/A'),
  ('Coating', 'N/A'),
  ('Grade', 'N/A'),
  ('Accessories', 'N/A')
) AS t(label, value)
CROSS JOIN public.material_lists ml
JOIN public.projects p ON p.id = ml.project_id
WHERE p.project_number = 'U2524' AND ml.heading = 'SLAB ON GRADE AREA-H (STAIR-H2)';

-- Insert fields for second material list
INSERT INTO public.material_list_fields (material_list_id, label, value)
SELECT 
  ml.id,
  label,
  value
FROM (VALUES
  ('Load Category', 'STRUCTURAL'),
  ('Delivery Date', '2025-03-15'),
  ('Couplers/Form Savers', 'N/A'),
  ('Special Shapes', 'YES'),
  ('Coating', 'EPOXY'),
  ('Grade', 'A706'),
  ('Accessories', 'N/A')
) AS t(label, value)
CROSS JOIN public.material_lists ml
JOIN public.projects p ON p.id = ml.project_id
WHERE p.project_number = 'U2524' AND ml.heading = 'BEAM CONNECTIONS LEVEL-2';

-- ============================================================================
-- Verification Queries (Optional - comment out when running in production)
-- ============================================================================

-- Uncomment to verify data after seeding:
-- SELECT 'Projects' as table_name, COUNT(*) as count FROM public.projects
-- UNION ALL
-- SELECT 'Drawing Log', COUNT(*) FROM public.drawing_log
-- UNION ALL
-- SELECT 'Drawings Yet to Release', COUNT(*) FROM public.drawings_yet_to_release
-- UNION ALL
-- SELECT 'Drawings Yet to Return', COUNT(*) FROM public.drawings_yet_to_return
-- UNION ALL
-- SELECT 'Invoices', COUNT(*) FROM public.invoices
-- UNION ALL
-- SELECT 'Submissions', COUNT(*) FROM public.submissions
-- UNION ALL
-- SELECT 'Material Lists', COUNT(*) FROM public.material_lists
-- UNION ALL
-- SELECT 'Material List Bar Items', COUNT(*) FROM public.material_list_bar_items
-- UNION ALL
-- SELECT 'Material List Fields', COUNT(*) FROM public.material_list_fields;

