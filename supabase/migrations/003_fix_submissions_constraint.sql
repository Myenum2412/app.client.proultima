-- ============================================================================
-- Fix Submissions Table Constraint
-- Adds 'RFI' and 'SUBMITTAL' to allowed submission types
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_submission_type_check;

-- Add the updated constraint with all submission types
ALTER TABLE public.submissions 
ADD CONSTRAINT submissions_submission_type_check 
CHECK (submission_type = ANY (ARRAY['APP'::text, 'R&R'::text, 'FFU'::text, 'PENDING'::text, 'RFI'::text, 'SUBMITTAL'::text]));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'submissions_submission_type_check';

