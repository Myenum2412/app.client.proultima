-- Projects Table Schema
-- This schema creates the projects table and adds foreign key constraints to drawing tables

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_number text NOT NULL,
  project_name text NOT NULL,
  client_name text NOT NULL DEFAULT 'PSG',
  contractor_name text NOT NULL DEFAULT 'TBD',
  project_location text NOT NULL DEFAULT 'TBD',
  estimated_tons numeric DEFAULT 0,
  detailed_tons_per_approval numeric DEFAULT 0,
  detailed_tons_per_latest_rev numeric DEFAULT 0,
  released_tons numeric DEFAULT 0,
  detailing_status text NOT NULL DEFAULT 'IN PROCESS',
  revision_status text NOT NULL DEFAULT 'IN PROCESS',
  release_status text NOT NULL DEFAULT 'IN PROCESS',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  due_date date,
  start_date date,
  actual_delivery_date date,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_project_number_unique UNIQUE (project_number)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_project_number ON public.projects(project_number);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- Add foreign key constraints for drawing tables (only if constraints don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drawing_log_project_id_fkey'
  ) THEN
    ALTER TABLE public.drawing_log 
      ADD CONSTRAINT drawing_log_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drawings_yet_to_release_project_id_fkey'
  ) THEN
    ALTER TABLE public.drawings_yet_to_release 
      ADD CONSTRAINT drawings_yet_to_release_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drawings_yet_to_return_project_id_fkey'
  ) THEN
    ALTER TABLE public.drawings_yet_to_return 
      ADD CONSTRAINT drawings_yet_to_return_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END $$;

