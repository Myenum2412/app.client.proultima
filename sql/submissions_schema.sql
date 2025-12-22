-- Submissions Table Schema
-- This schema creates the submissions table for tracking project submissions

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  drawing_id uuid,
  submission_type text NOT NULL CHECK (submission_type IN ('APP', 'R&R', 'FFU', 'PENDING')),
  work_description text,
  drawing_number text,
  sheets text,
  submission_date date NOT NULL,
  release_status text,
  pdf_path text,
  status text,
  evaluation_date date,
  submitted_by text,
  evaluated_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_project_id_fkey FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_project_id ON public.submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_drawing_id ON public.submissions(drawing_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_type ON public.submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_date ON public.submissions(submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_submissions_updated_at_trigger
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submissions_updated_at();

