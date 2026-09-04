ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS cv_path text,
  ADD COLUMN IF NOT EXISTS education_document text;

CREATE POLICY "Applicants upload application files"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'applications');

CREATE POLICY "Job owners and staff read application files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'applications'
  AND (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.job_posts j
      WHERE j.id::text = (storage.foldername(name))[1]
        AND j.employer_id = auth.uid()
    )
  )
);