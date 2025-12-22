-- Update Submissions with Drawing IDs
-- This script links submissions to drawings by matching drawing_number with dwg in drawing_log

-- Update submissions with drawing_id from drawing_log
UPDATE public.submissions s
SET drawing_id = dl.id
FROM public.drawing_log dl
WHERE s.drawing_id IS NULL
  AND s.drawing_number = dl.dwg
  AND s.project_id = dl.project_id;

-- Update submissions with drawing_id from drawings_yet_to_release
UPDATE public.submissions s
SET drawing_id = dyr.id
FROM public.drawings_yet_to_release dyr
WHERE s.drawing_id IS NULL
  AND s.drawing_number = dyr.dwg
  AND s.project_id = dyr.project_id;

-- Update submissions with drawing_id from drawings_yet_to_return
UPDATE public.submissions s
SET drawing_id = dyt.id
FROM public.drawings_yet_to_return dyt
WHERE s.drawing_id IS NULL
  AND s.drawing_number = dyt.dwg
  AND s.project_id = dyt.project_id;

-- If you have a specific drawing ID to link, you can use this:
-- UPDATE public.submissions
-- SET drawing_id = '05f3777a-6f7c-4701-a643-97cb08eb321a'
-- WHERE drawing_id IS NULL
--   AND drawing_number = 'YOUR_DRAWING_NUMBER_HERE'
--   AND project_id = 'YOUR_PROJECT_ID_HERE';

