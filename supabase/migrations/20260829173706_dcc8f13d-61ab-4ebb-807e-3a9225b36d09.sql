ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hired_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termination_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_termination_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "applications_select" ON public.applications;
CREATE POLICY "applications_select" ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "applications_insert" ON public.applications;
CREATE POLICY "applications_insert" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "applications_update" ON public.applications;
CREATE POLICY "applications_update" ON public.applications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "employee_profiles_select" ON public.employee_profiles;
CREATE POLICY "employee_profiles_select" ON public.employee_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "employee_profiles_insert" ON public.employee_profiles;
CREATE POLICY "employee_profiles_insert" ON public.employee_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "employee_profiles_update" ON public.employee_profiles;
CREATE POLICY "employee_profiles_update" ON public.employee_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "workers_select" ON public.workers;
CREATE POLICY "workers_select" ON public.workers FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "workers_insert" ON public.workers;
CREATE POLICY "workers_insert" ON public.workers FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "workers_update" ON public.workers;
CREATE POLICY "workers_update" ON public.workers FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "workers_delete" ON public.workers;
CREATE POLICY "workers_delete" ON public.workers FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "worker_public_profiles_select" ON public.worker_public_profiles;
CREATE POLICY "worker_public_profiles_select" ON public.worker_public_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "broker_employers_all" ON public.broker_employers;
CREATE POLICY "broker_employers_all" ON public.broker_employers FOR ALL TO authenticated
  USING (broker_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (broker_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "assignments_all" ON public.assignments;
CREATE POLICY "assignments_all" ON public.assignments FOR ALL TO authenticated
  USING (broker_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (broker_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "bookings_all" ON public.bookings;
CREATE POLICY "bookings_all" ON public.bookings FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "employee_requests_all" ON public.employee_requests;
CREATE POLICY "employee_requests_all" ON public.employee_requests FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "hired_employees_all" ON public.hired_employees;
CREATE POLICY "hired_employees_all" ON public.hired_employees FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "incident_reports_all" ON public.incident_reports;
CREATE POLICY "incident_reports_all" ON public.incident_reports FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "termination_requests_all" ON public.termination_requests;
CREATE POLICY "termination_requests_all" ON public.termination_requests FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "worker_ratings_all" ON public.worker_ratings;
CREATE POLICY "worker_ratings_all" ON public.worker_ratings FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "employer_ratings_select" ON public.employer_ratings;
CREATE POLICY "employer_ratings_select" ON public.employer_ratings FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.is_staff(auth.uid())
         OR employer_id = auth.uid() OR broker_employer_id IN (SELECT id FROM public.broker_employers WHERE broker_id = auth.uid()));
DROP POLICY IF EXISTS "employer_ratings_insert" ON public.employer_ratings;
CREATE POLICY "employer_ratings_insert" ON public.employer_ratings FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "employer_reports_select" ON public.employer_reports;
CREATE POLICY "employer_reports_select" ON public.employer_reports FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.is_staff(auth.uid())
         OR employer_id = auth.uid() OR broker_employer_id IN (SELECT id FROM public.broker_employers WHERE broker_id = auth.uid()));
DROP POLICY IF EXISTS "employer_reports_insert" ON public.employer_reports;
CREATE POLICY "employer_reports_insert" ON public.employer_reports FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());
DROP POLICY IF EXISTS "employer_reports_update" ON public.employer_reports;
CREATE POLICY "employer_reports_update" ON public.employer_reports FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "employee_termination_requests_select" ON public.employee_termination_requests;
CREATE POLICY "employee_termination_requests_select" ON public.employee_termination_requests FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR employer_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "employee_termination_requests_insert" ON public.employee_termination_requests;
CREATE POLICY "employee_termination_requests_insert" ON public.employee_termination_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "messages_all" ON public.messages;
CREATE POLICY "messages_all" ON public.messages FOR ALL TO authenticated
  USING (sender_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (sender_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "direct_messages_select" ON public.direct_messages;
CREATE POLICY "direct_messages_select" ON public.direct_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
DROP POLICY IF EXISTS "direct_messages_insert" ON public.direct_messages;
CREATE POLICY "direct_messages_insert" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "direct_messages_update" ON public.direct_messages;
CREATE POLICY "direct_messages_update" ON public.direct_messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "review_messages_select" ON public.review_messages;
CREATE POLICY "review_messages_select" ON public.review_messages FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "review_messages_insert" ON public.review_messages;
CREATE POLICY "review_messages_insert" ON public.review_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_all" ON public.payments;
CREATE POLICY "payments_all" ON public.payments FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "wallet_transactions_select" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_select" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "pricing_settings_select" ON public.pricing_settings;
CREATE POLICY "pricing_settings_select" ON public.pricing_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "pricing_settings_staff" ON public.pricing_settings;
CREATE POLICY "pricing_settings_staff" ON public.pricing_settings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "sectors_select" ON public.sectors;
CREATE POLICY "sectors_select" ON public.sectors FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "sectors_staff" ON public.sectors;
CREATE POLICY "sectors_staff" ON public.sectors FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "sub_admins_select" ON public.sub_admins;
CREATE POLICY "sub_admins_select" ON public.sub_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "sub_admins_insert" ON public.sub_admins;
CREATE POLICY "sub_admins_insert" ON public.sub_admins FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "sub_admins_update" ON public.sub_admins;
CREATE POLICY "sub_admins_update" ON public.sub_admins FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "sub_admins_delete" ON public.sub_admins;
CREATE POLICY "sub_admins_delete" ON public.sub_admins FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "subscription_packages_select" ON public.subscription_packages;
CREATE POLICY "subscription_packages_select" ON public.subscription_packages FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "subscription_packages_staff" ON public.subscription_packages;
CREATE POLICY "subscription_packages_staff" ON public.subscription_packages FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "user_subscriptions_select" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_select" ON public.user_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "user_subscriptions_insert" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_insert" ON public.user_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "user_subscriptions_update" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_update" ON public.user_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "profile_change_requests_select" ON public.profile_change_requests;
CREATE POLICY "profile_change_requests_select" ON public.profile_change_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "profile_change_requests_insert" ON public.profile_change_requests;
CREATE POLICY "profile_change_requests_insert" ON public.profile_change_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());
DROP POLICY IF EXISTS "profile_change_requests_update" ON public.profile_change_requests;
CREATE POLICY "profile_change_requests_update" ON public.profile_change_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "compliance_logs_select" ON public.compliance_logs;
CREATE POLICY "compliance_logs_select" ON public.compliance_logs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','applications','employee_profiles','workers','broker_employers',
    'assignments','bookings','employee_requests','hired_employees','incident_reports',
    'termination_requests','worker_ratings','messages','payments','pricing_settings',
    'sectors','sub_admins','subscription_packages','user_subscriptions',
    'profile_change_requests','employee_termination_requests','employer_ratings',
    'employer_reports'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER set_%I_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE TRIGGER sync_worker_public_profile
  AFTER INSERT OR UPDATE OR DELETE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.sync_worker_public_profile();

CREATE OR REPLACE TRIGGER notify_profile_verification
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_profile_verification();

CREATE OR REPLACE TRIGGER notify_worker_verification
  AFTER UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.notify_worker_verification();

CREATE OR REPLACE TRIGGER notify_payment_event
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_event();

CREATE OR REPLACE TRIGGER notify_subscription_event
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_subscription_event();

CREATE OR REPLACE TRIGGER trg_compliance_profile_changes
  AFTER INSERT OR UPDATE ON public.profile_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_compliance_event();

CREATE OR REPLACE TRIGGER trg_compliance_employer_reports
  AFTER INSERT OR UPDATE ON public.employer_reports
  FOR EACH ROW EXECUTE FUNCTION public.log_compliance_event();

CREATE OR REPLACE TRIGGER trg_compliance_employee_terminations
  AFTER INSERT OR UPDATE ON public.employee_termination_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_compliance_event();

DROP POLICY IF EXISTS "files_select" ON storage.objects;
CREATE POLICY "files_select" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('avatars','contracts','id-documents','incident-evidence','receipts','report-evidence')
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid()))
  );
DROP POLICY IF EXISTS "files_insert" ON storage.objects;
CREATE POLICY "files_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars','contracts','id-documents','incident-evidence','receipts','report-evidence')
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid()))
  );
DROP POLICY IF EXISTS "files_update" ON storage.objects;
CREATE POLICY "files_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('avatars','contracts','id-documents','incident-evidence','receipts','report-evidence')
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid()))
  );
DROP POLICY IF EXISTS "files_delete" ON storage.objects;
CREATE POLICY "files_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('avatars','contracts','id-documents','incident-evidence','receipts','report-evidence')
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid()))
  );

INSERT INTO public.pricing_settings (key, label, category, amount, active) VALUES
  ('register_employee', 'Employee registration fee (broker)', 'fees', 50, true),
  ('booking', 'Booking fee', 'fees', 100, true),
  ('pro_feature', 'Pro feature rate', 'fees', 200, true),
  ('subscription_basic', 'Basic subscription', 'subscription', 300, true),
  ('subscription_standard', 'Standard subscription', 'subscription', 700, true),
  ('subscription_premium', 'Premium subscription', 'subscription', 1500, true)
ON CONFLICT (key) DO NOTHING;

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

REVOKE EXECUTE ON FUNCTION public.is_verified_employee(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_verified_employee(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.job_posts (
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

DROP POLICY IF EXISTS "Published jobs are public" ON public.job_posts;
CREATE POLICY "Published jobs are public"
  ON public.job_posts FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Owners and staff read all jobs" ON public.job_posts;
CREATE POLICY "Owners and staff read all jobs"
  ON public.job_posts FOR SELECT TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Employers create their own jobs" ON public.job_posts;
CREATE POLICY "Employers create their own jobs"
  ON public.job_posts FOR INSERT TO authenticated
  WITH CHECK (employer_id = auth.uid());

DROP POLICY IF EXISTS "Owners and staff update jobs" ON public.job_posts;
CREATE POLICY "Owners and staff update jobs"
  ON public.job_posts FOR UPDATE TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Owners and staff delete jobs" ON public.job_posts;
CREATE POLICY "Owners and staff delete jobs"
  ON public.job_posts FOR DELETE TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE TRIGGER set_job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.job_applications (
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

DROP POLICY IF EXISTS "Applicants read their applications" ON public.job_applications;
CREATE POLICY "Applicants read their applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Job owners and staff read applications" ON public.job_applications;
CREATE POLICY "Job owners and staff read applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.job_posts j WHERE j.id = job_id AND j.employer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Verified employees apply" ON public.job_applications;
CREATE POLICY "Verified employees apply"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (
    applicant_id = auth.uid()
    AND public.is_verified_employee(auth.uid())
    AND EXISTS (SELECT 1 FROM public.job_posts j WHERE j.id = job_id AND j.status = 'published')
  );

DROP POLICY IF EXISTS "Owners and staff update applications" ON public.job_applications;
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

CREATE OR REPLACE TRIGGER set_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS job_posts_status_idx ON public.job_posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS job_applications_job_idx ON public.job_applications (job_id, created_at DESC);

INSERT INTO public.pricing_settings (key, label, category, amount, active)
VALUES ('job_post', 'Job posting fee', 'general', 500, true)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  body text,
  cta_label text,
  cta_link text,
  desktop_image text,
  mobile_image text,
  kind text NOT NULL DEFAULT 'graphic',
  placement text NOT NULL DEFAULT 'home_hero',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active banners are public" ON public.banners;
CREATE POLICY "Active banners are public" ON public.banners
  FOR SELECT USING (active = true OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff manage banners" ON public.banners;
CREATE POLICY "Staff manage banners" ON public.banners
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE TRIGGER banners_set_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Banner images are readable by everyone" ON storage.objects;
CREATE POLICY "Banner images are readable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Staff upload banner images" ON storage.objects;
CREATE POLICY "Staff upload banner images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff update banner images" ON storage.objects;
CREATE POLICY "Staff update banner images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'banners' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff delete banner images" ON storage.objects;
CREATE POLICY "Staff delete banner images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'banners' AND public.is_staff(auth.uid()));