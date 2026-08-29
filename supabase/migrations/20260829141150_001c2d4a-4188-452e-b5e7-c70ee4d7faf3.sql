-- Helper: verified employee check
CREATE OR REPLACE FUNCTION public.is_verified_employee(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.role = 'employee' AND p.verification_status = 'approved'
  ) OR EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.user_id = _user_id AND w.verification_status = 'approved'
  )
$$;

CREATE TABLE public.job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_name text,
  title text NOT NULL,
  sector public.sector_type,
  sector_other text,
  description text NOT NULL,
  requirements text,
  employment_type text NOT NULL DEFAULT 'full_time',
  duration text,
  salary numeric,
  salary_max numeric,
  city text,
  sub_city text,
  area text,
  address text,
  contact_phone text,
  openings integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'awaiting_payment',
  fee_amount numeric NOT NULL DEFAULT 0,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.job_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_posts TO authenticated;
GRANT ALL ON public.job_posts TO service_role;

ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published jobs are public"
  ON public.job_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Owners and staff read all jobs"
  ON public.job_posts FOR SELECT TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "Employers create their own jobs"
  ON public.job_posts FOR INSERT TO authenticated
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Owners and staff update jobs"
  ON public.job_posts FOR UPDATE TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "Owners and staff delete jobs"
  ON public.job_posts FOR DELETE TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER set_job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  city text,
  experience text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  employer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);

GRANT SELECT, INSERT, UPDATE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants read their applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Job owners and staff read applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.job_posts j WHERE j.id = job_id AND j.employer_id = auth.uid())
  );

CREATE POLICY "Verified employees apply"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (
    applicant_id = auth.uid()
    AND public.is_verified_employee(auth.uid())
    AND EXISTS (SELECT 1 FROM public.job_posts j WHERE j.id = job_id AND j.status = 'published')
  );

CREATE POLICY "Owners and staff update applications"
  ON public.job_applications FOR UPDATE TO authenticated
  USING (
    applicant_id = auth.uid()
    OR public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.job_posts j WHERE j.id = job_id AND j.employer_id = auth.uid())
  )
  WITH CHECK (
    applicant_id = auth.uid()
    OR public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.job_posts j WHERE j.id = job_id AND j.employer_id = auth.uid())
  );

CREATE TRIGGER set_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX job_posts_status_idx ON public.job_posts (status, created_at DESC);
CREATE INDEX job_applications_job_idx ON public.job_applications (job_id, created_at DESC);

INSERT INTO public.pricing_settings (key, label, category, amount, active)
VALUES ('job_post', 'Job posting fee', 'general', 500, true)
ON CONFLICT (key) DO NOTHING;