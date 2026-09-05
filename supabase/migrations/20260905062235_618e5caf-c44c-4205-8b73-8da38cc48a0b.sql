CREATE POLICY "Signed-in candidates apply to published jobs"
ON public.job_applications
FOR INSERT
TO authenticated
WITH CHECK (
  applicant_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.job_posts j
    WHERE j.id = job_applications.job_id AND j.status = 'published'
  )
);