ALTER TABLE public.job_applications
  ALTER COLUMN applicant_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS education jsonb,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS profile_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS claim_token uuid NOT NULL DEFAULT gen_random_uuid();

GRANT INSERT ON public.job_applications TO anon;

CREATE POLICY "Guests can apply to published jobs"
ON public.job_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  applicant_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.job_posts j
    WHERE j.id = job_applications.job_id AND j.status = 'published'
  )
);