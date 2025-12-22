-- Seed Data for Submissions Table
-- This file seeds the submissions table with initial data
-- Note: Submission IDs are generated as UUIDs. Submissions reference projects by project_number.

-- Insert Submissions for Project 1: PRO-2025-001 (Valley View Business Park Tilt Panels)
INSERT INTO public.submissions (
  project_id,
  submission_type,
  work_description,
  drawing_number,
  sheets,
  submission_date,
  release_status,
  status,
  submitted_by,
  created_at
)
SELECT 
  p.id,
  submission_data.submission_type,
  submission_data.work_description,
  submission_data.drawing_number,
  submission_data.sheets,
  submission_data.submission_date::date,
  submission_data.release_status,
  submission_data.status,
  submission_data.submitted_by,
  NOW()
FROM public.projects p
CROSS JOIN (VALUES
  ('APP', 'EAST WALL PANELS E1 TO E8 - Initial Submission', 'R-1', '0', '2024-01-15', 'PENDING', 'SUBMITTED', 'John Smith'),
  ('APP', 'EAST WALL PANELS E9 TO E16 - Initial Submission', 'R-2', '0', '2024-01-20', 'PENDING', 'SUBMITTED', 'John Smith'),
  ('R&R', 'EAST WALL PANELS E1 TO E8 - Revision Required', 'R-1', '1', '2024-02-10', 'PENDING', 'IN_REVIEW', 'John Smith'),
  ('FFU', 'EAST WALL PANELS E1 TO E8 - Approved for Field Use', 'R-1', '1', '2024-03-05', 'RELEASED', 'APPROVED', 'John Smith'),
  ('FFU', 'EAST WALL PANELS E9 TO E16 - Approved for Field Use', 'R-2', '0', '2024-03-12', 'RELEASED', 'APPROVED', 'John Smith'),
  ('APP', 'NORTH WALL PANELS N1 TO N8 - Initial Submission', 'R-4', '0', '2024-01-25', 'PENDING', 'SUBMITTED', 'Sarah Johnson'),
  ('APP', 'NORTH WALL PANELS N9 TO N15 - Initial Submission', 'R-5', '0', '2024-01-28', 'PENDING', 'SUBMITTED', 'Sarah Johnson'),
  ('R&R', 'NORTH WALL PANELS N1 TO N8 - Revision Required', 'R-4', '1', '2024-02-15', 'PENDING', 'IN_REVIEW', 'Sarah Johnson'),
  ('FFU', 'NORTH WALL PANELS N1 TO N8 - Approved for Field Use', 'R-4', '1', '2024-03-20', 'RELEASED', 'APPROVED', 'Sarah Johnson'),
  ('FFU', 'NORTH WALL PANELS N9 TO N15 - Approved for Field Use', 'R-5', '0', '2024-03-25', 'RELEASED', 'APPROVED', 'Sarah Johnson'),
  ('APP', 'WEST WALL PANELS W1 TO W8 - Initial Submission', 'R-16', '0', '2024-02-01', 'PENDING', 'SUBMITTED', 'Mike Davis'),
  ('FFU', 'WEST WALL PANELS W1 TO W8 - Approved for Field Use', 'R-16', '0', '2024-03-01', 'RELEASED', 'APPROVED', 'Mike Davis'),
  ('APP', 'SOUTH WALL PANELS S-1 TO S-8 - Initial Submission', 'R-19', '0', '2024-02-05', 'PENDING', 'SUBMITTED', 'Emily Chen'),
  ('R&R', 'SOUTH WALL PANELS S-1 TO S-8 - Revision Required', 'R-19', '1', '2024-02-20', 'PENDING', 'IN_REVIEW', 'Emily Chen'),
  ('FFU', 'SOUTH WALL PANELS S-1 TO S-8 - Approved for Field Use', 'R-19', '1', '2024-03-15', 'RELEASED', 'APPROVED', 'Emily Chen')
) AS submission_data(submission_type, work_description, drawing_number, sheets, submission_date, release_status, status, submitted_by)
WHERE p.project_number = 'PRO-2025-001'
ON CONFLICT DO NOTHING;

-- Insert Submissions for Project 2: PRO-2025-002 (MID-WAY SOUTH LOGISTIC CENTER, PANELS)
INSERT INTO public.submissions (
  project_id,
  submission_type,
  work_description,
  drawing_number,
  sheets,
  submission_date,
  release_status,
  status,
  submitted_by,
  created_at
)
SELECT 
  p.id,
  submission_data.submission_type,
  submission_data.work_description,
  submission_data.drawing_number,
  submission_data.sheets,
  submission_data.submission_date::date,
  submission_data.release_status,
  submission_data.status,
  submission_data.submitted_by,
  NOW()
FROM public.projects p
CROSS JOIN (VALUES
  ('APP', 'SOUTH WALL PANELS S1 TO S7 - Initial Submission', 'R-1', '0', '2024-04-10', 'PENDING', 'SUBMITTED', 'Robert Wilson'),
  ('R&R', 'SOUTH WALL PANELS S1 TO S7 - Revision Required', 'R-1', '1', '2024-04-25', 'PENDING', 'IN_REVIEW', 'Robert Wilson'),
  ('R&R', 'SOUTH WALL PANELS S8 TO 14 - Revision Required', 'R-2', '1', '2024-04-28', 'PENDING', 'IN_REVIEW', 'Robert Wilson'),
  ('R&R', 'SOUTH WALL PANELS S15 TO S21 - Revision Required', 'R-3', '1', '2024-05-02', 'PENDING', 'IN_REVIEW', 'Robert Wilson'),
  ('APP', 'SOUTH WALL PANELS S22 TO S28 - Initial Submission', 'R-4', '0', '2024-05-10', 'PENDING', 'SUBMITTED', 'Robert Wilson'),
  ('FFU', 'SOUTH WALL PANELS S22 TO S28 - Approved for Field Use', 'R-4', '0', '2024-06-01', 'RELEASED', 'APPROVED', 'Robert Wilson'),
  ('APP', 'WEST PANELS W-1 TO W-8 - Initial Submission', 'R-6', '0', '2024-05-15', 'PENDING', 'SUBMITTED', 'Lisa Anderson'),
  ('FFU', 'WEST PANELS W-1 TO W-8 - Approved for Field Use', 'R-6', '0', '2024-06-05', 'RELEASED', 'APPROVED', 'Lisa Anderson'),
  ('APP', 'NORTH PANELS FROM N-1 TO N-8 - Initial Submission', 'R-8', '0', '2024-05-20', 'PENDING', 'SUBMITTED', 'Lisa Anderson'),
  ('FFU', 'NORTH PANELS FROM N-1 TO N-8 - Approved for Field Use', 'R-8', '0', '2024-06-10', 'RELEASED', 'APPROVED', 'Lisa Anderson'),
  ('APP', 'EAST WALL PANELS E1 TO E8 - Initial Submission', 'R-12', '0', '2024-05-25', 'PENDING', 'SUBMITTED', 'David Martinez'),
  ('FFU', 'EAST WALL PANELS E1 TO E8 - Approved for Field Use', 'R-12', '0', '2024-06-15', 'RELEASED', 'APPROVED', 'David Martinez')
) AS submission_data(submission_type, work_description, drawing_number, sheets, submission_date, release_status, status, submitted_by)
WHERE p.project_number = 'PRO-2025-002'
ON CONFLICT DO NOTHING;

-- Insert Additional Submissions with Various Statuses
INSERT INTO public.submissions (
  project_id,
  submission_type,
  work_description,
  drawing_number,
  sheets,
  submission_date,
  release_status,
  status,
  submitted_by,
  evaluation_date,
  evaluated_by,
  created_at
)
SELECT 
  p.id,
  submission_data.submission_type,
  submission_data.work_description,
  submission_data.drawing_number,
  submission_data.sheets,
  submission_data.submission_date::date,
  submission_data.release_status,
  submission_data.status,
  submission_data.submitted_by,
  submission_data.evaluation_date::date,
  submission_data.evaluated_by,
  NOW()
FROM public.projects p
CROSS JOIN (VALUES
  ('PENDING', 'EAST WALL PANELS E17 TO E23 - Pending Submission', 'R-3', '0', '2024-07-01', 'PENDING', 'DRAFT', 'John Smith', NULL, NULL),
  ('APP', 'NORTH WALL PANELS N16 TO N23 - Initial Submission', 'R-6', '0', '2024-07-05', 'PENDING', 'SUBMITTED', 'Sarah Johnson', NULL, NULL),
  ('APP', 'NORTH WALL PANELS N24 TO N31 - Initial Submission', 'R-7', '0', '2024-07-08', 'PENDING', 'SUBMITTED', 'Sarah Johnson', NULL, NULL),
  ('R&R', 'NORTH WALL PANELS N16 TO N23 - Revision Required', 'R-6', '1', '2024-07-20', 'PENDING', 'IN_REVIEW', 'Sarah Johnson', '2024-07-18', 'Michael Brown'),
  ('FFU', 'NORTH WALL PANELS N16 TO N23 - Approved for Field Use', 'R-6', '1', '2024-08-01', 'RELEASED', 'APPROVED', 'Sarah Johnson', '2024-07-30', 'Michael Brown'),
  ('APP', 'SOUTH WALL PANELS S-9 TO S-15 - Initial Submission', 'R-20', '0', '2024-07-10', 'PENDING', 'SUBMITTED', 'Emily Chen', NULL, NULL),
  ('FFU', 'SOUTH WALL PANELS S-9 TO S-15 - Approved for Field Use', 'R-20', '0', '2024-08-05', 'RELEASED', 'APPROVED', 'Emily Chen', '2024-08-03', 'Michael Brown'),
  ('APP', 'WEST WALL PANELS W9 TO W16 - Initial Submission', 'R-17', '0', '2024-07-15', 'PENDING', 'SUBMITTED', 'Mike Davis', NULL, NULL),
  ('R&R', 'WEST WALL PANELS W9 TO W16 - Revision Required', 'R-17', '1', '2024-07-25', 'PENDING', 'IN_REVIEW', 'Mike Davis', '2024-07-23', 'Michael Brown'),
  ('PENDING', 'SOUTH WALL PANELS S-16 TO S-23 - Pending Submission', 'R-21', '0', '2024-08-01', 'PENDING', 'DRAFT', 'Emily Chen', NULL, NULL)
) AS submission_data(submission_type, work_description, drawing_number, sheets, submission_date, release_status, status, submitted_by, evaluation_date, evaluated_by)
WHERE p.project_number = 'PRO-2025-001'
ON CONFLICT DO NOTHING;

-- Insert More Submissions for Project 2
INSERT INTO public.submissions (
  project_id,
  submission_type,
  work_description,
  drawing_number,
  sheets,
  submission_date,
  release_status,
  status,
  submitted_by,
  evaluation_date,
  evaluated_by,
  created_at
)
SELECT 
  p.id,
  submission_data.submission_type,
  submission_data.work_description,
  submission_data.drawing_number,
  submission_data.sheets,
  submission_data.submission_date::date,
  submission_data.release_status,
  submission_data.status,
  submission_data.submitted_by,
  submission_data.evaluation_date::date,
  submission_data.evaluated_by,
  NOW()
FROM public.projects p
CROSS JOIN (VALUES
  ('APP', 'NORTH PANELS FROM N-9 TO N-16 - Initial Submission', 'R-9', '0', '2024-06-01', 'PENDING', 'SUBMITTED', 'Lisa Anderson', NULL, NULL),
  ('FFU', 'NORTH PANELS FROM N-9 TO N-16 - Approved for Field Use', 'R-9', '0', '2024-06-20', 'RELEASED', 'APPROVED', 'Lisa Anderson', '2024-06-18', 'Michael Brown'),
  ('APP', 'EAST WALL PANELS E9 TO E15 - Initial Submission', 'R-13', '0', '2024-06-05', 'PENDING', 'SUBMITTED', 'David Martinez', NULL, NULL),
  ('R&R', 'EAST WALL PANELS E9 TO E15 - Revision Required', 'R-13', '1', '2024-06-25', 'PENDING', 'IN_REVIEW', 'David Martinez', '2024-06-23', 'Michael Brown'),
  ('FFU', 'EAST WALL PANELS E9 TO E15 - Approved for Field Use', 'R-13', '1', '2024-07-10', 'RELEASED', 'APPROVED', 'David Martinez', '2024-07-08', 'Michael Brown'),
  ('PENDING', 'SOUTH WALL PANELS S29 & S30 - Pending Submission', 'R-5', '0', '2024-07-01', 'PENDING', 'DRAFT', 'Robert Wilson', NULL, NULL),
  ('APP', 'WEST PANELS W-9 TO W-15 - Initial Submission', 'R-7', '0', '2024-07-05', 'PENDING', 'SUBMITTED', 'Lisa Anderson', NULL, NULL),
  ('FFU', 'WEST PANELS W-9 TO W-15 - Approved for Field Use', 'R-7', '0', '2024-07-25', 'RELEASED', 'APPROVED', 'Lisa Anderson', '2024-07-23', 'Michael Brown')
) AS submission_data(submission_type, work_description, drawing_number, sheets, submission_date, release_status, status, submitted_by, evaluation_date, evaluated_by)
WHERE p.project_number = 'PRO-2025-002'
ON CONFLICT DO NOTHING;

