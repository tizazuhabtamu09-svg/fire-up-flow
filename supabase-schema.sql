-- =====================================================================
-- Agaze / አጋዝ — Complete PostgreSQL schema for Supabase
-- Paste this entire file into the Supabase SQL Editor and run.
-- It is idempotent (uses CREATE ... IF NOT EXISTS / CREATE OR REPLACE)
-- and creates: enum types, all tables, grants, RLS policies, functions,
-- triggers, storage buckets + policies, and seed pricing/sectors.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role_type AS ENUM ('employee','employer','broker','admin','kyc');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_status_type AS ENUM ('pending','accepted','declined','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.gender_type AS ENUM ('male','female','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sector_type AS ENUM (
    'house_maid','baby_sitter','cleaner','waiter','construction_worker',
    'paint_man','plumber','electrician','barber','makeup_artist','driver',
    'delivery_man','barista','beauty_salon_worker_men','beauty_salon_worker_women','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status_type AS ENUM ('pending','approved','declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------

-- Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  city text,
  avatar_url text,
  role public.app_role_type NOT NULL DEFAULT 'employer',
  available boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT false,
  registered_by uuid,
  registered_by_name text,
  registration_type text,
  verification_status public.verification_status_type NOT NULL DEFAULT 'pending',
  verification_note text,
  verified_at timestamptz,
  wallet_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Roles (kept in a dedicated table — never on profiles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Applications (registration submissions)
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  role public.app_role_type,
  age numeric,
  gender public.gender_type,
  city text,
  sub_city text,
  wereda text,
  kebele text,
  address text,
  latitude numeric,
  longitude numeric,
  fayda_number text,
  fayda_front text,
  fayda_back text,
  personal_photo text,
  sector public.sector_type,
  sector_other text,
  experience text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Employee profiles
CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  fayda_number text,
  sector public.sector_type,
  sector_other text,
  gender public.gender_type,
  age integer,
  experience text,
  photo_url text,
  id_photo_front text,
  id_photo_back text,
  contract_path text,
  guarantor_name text,
  guarantor_phone text,
  guarantor_id_number text,
  guarantor_id_photo text,
  guarantor_photo text,
  language text,
  language_other text,
  skills text[] NOT NULL DEFAULT '{}',
  education text,
  education_institution text,
  education_qualification text,
  education_graduation_year integer,
  education_document text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Workers (roster)
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  email text,
  phone text,
  gender public.gender_type,
  age integer,
  sector public.sector_type,
  sector_other text,
  experience text,
  price numeric,
  available boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT true,
  global_status text NOT NULL DEFAULT 'available',
  city text,
  sub_city text,
  wereda text,
  kebele text,
  area text,
  address text,
  latitude numeric,
  longitude numeric,
  photo_url text,
  contract_path text,
  fayda_number text,
  fayda_front text,
  fayda_back text,
  fayda_verified boolean NOT NULL DEFAULT false,
  guarantor_name text,
  guarantor_phone text,
  guarantor_id_number text,
  guarantor_id_photo text,
  guarantor_photo text,
  guarantor_verified boolean NOT NULL DEFAULT false,
  registered_by uuid,
  registered_by_name text,
  registration_type text,
  verification_status public.verification_status_type NOT NULL DEFAULT 'pending',
  verification_note text,
  verified_at timestamptz,
  language text,
  language_other text,
  skills text[] NOT NULL DEFAULT '{}',
  education text,
  education_institution text,
  education_qualification text,
  education_graduation_year integer,
  education_document text,
  guarantor_relationship text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Public worker directory (synced by trigger — safe columns only)
CREATE TABLE IF NOT EXISTS public.worker_public_profiles (
  id uuid PRIMARY KEY REFERENCES public.workers(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  sector public.sector_type,
  sector_other text,
  gender public.gender_type,
  age integer,
  experience text,
  price numeric,
  city text,
  sub_city text,
  area text,
  latitude numeric,
  longitude numeric,
  photo_url text,
  available boolean NOT NULL DEFAULT true,
  global_status text NOT NULL DEFAULT 'available',
  verification_status public.verification_status_type NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  language text,
  language_other text
);

-- Broker-managed employers
CREATE TABLE IF NOT EXISTS public.broker_employers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  city text,
  sub_city text,
  wereda text,
  kebele text,
  address text,
  latitude numeric,
  longitude numeric,
  fayda_number text,
  fayda_front text,
  fayda_back text,
  personal_photo text,
  verification_status public.verification_status_type NOT NULL DEFAULT 'pending',
  verification_note text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Assignments (broker pairs a worker with an employer)
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_ref text NOT NULL,
  employer_ref text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  witness_name text,
  witness_phone text,
  witness_sex public.gender_type,
  agreement_path text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id uuid,
  worker_ref text,
  worker_name text,
  service text NOT NULL,
  status public.booking_status_type NOT NULL DEFAULT 'pending',
  scheduled_date date,
  hours numeric,
  price numeric,
  address text,
  notes text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Employee requests (employer asks for a worker)
CREATE TABLE IF NOT EXISTS public.employee_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  employee_ref text,
  sector text,
  sector_answers jsonb,
  status text NOT NULL DEFAULT 'pending',
  message text,
  location text,
  contact_phone text,
  duration text,
  budget numeric,
  salary numeric,
  allowances numeric,
  allowances_note text,
  service_fee numeric,
  paid_at timestamptz,
  assigned_worker_id uuid,
  assigned_worker_name text,
  admin_note text,
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Hired employees
CREATE TABLE IF NOT EXISTS public.hired_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.employee_requests(id) ON DELETE SET NULL,
  worker_ref text,
  worker_name text NOT NULL,
  sector text,
  salary numeric,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Incident reports
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hired_id uuid REFERENCES public.hired_employees(id) ON DELETE SET NULL,
  worker_ref text,
  worker_name text NOT NULL,
  category text NOT NULL,
  details jsonb,
  attachments jsonb,
  status text NOT NULL DEFAULT 'open',
  admin_response text,
  forwarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Termination requests (employer-initiated)
CREATE TABLE IF NOT EXISTS public.termination_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hired_id uuid REFERENCES public.hired_employees(id) ON DELETE SET NULL,
  worker_ref text,
  worker_name text NOT NULL,
  reason text NOT NULL,
  details text,
  make_available boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Worker ratings (employers rate workers)
CREATE TABLE IF NOT EXISTS public.worker_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hired_id uuid REFERENCES public.hired_employees(id) ON DELETE SET NULL,
  worker_ref text,
  worker_name text NOT NULL,
  rating smallint NOT NULL,
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Employer ratings (employees rate employers / broker-employers)
CREATE TABLE IF NOT EXISTS public.employer_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  employer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_employer_id uuid REFERENCES public.broker_employers(id) ON DELETE CASCADE,
  employer_name text NOT NULL,
  rating smallint NOT NULL,
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Employer reports (employees report employers)
CREATE TABLE IF NOT EXISTS public.employer_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  employer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_employer_id uuid REFERENCES public.broker_employers(id) ON DELETE CASCADE,
  employer_name text NOT NULL,
  reason text NOT NULL,
  details text,
  attachments jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open',
  admin_response text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Employee-initiated termination requests (routes to employer, KYC, admin)
CREATE TABLE IF NOT EXISTS public.employee_termination_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  hired_id uuid REFERENCES public.hired_employees(id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  employer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_employer_id uuid REFERENCES public.broker_employers(id) ON DELETE CASCADE,
  employer_name text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending_employer',
  employer_ack_at timestamptz,
  admin_note text,
  make_available boolean NOT NULL DEFAULT true,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Messages / support inbox
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Direct messages (1:1 chat between linked users)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Review chat (document / request review threads)
CREATE TABLE IF NOT EXISTS public.review_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  subject_id text NOT NULL,
  subject_source text NOT NULL,
  body text NOT NULL,
  from_staff boolean NOT NULL DEFAULT false,
  attachment_bucket text,
  attachment_path text,
  attachment_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications (system-generated alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payments (receipt uploads, approved by staff)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payer_name text NOT NULL,
  amount numeric NOT NULL,
  purpose text,
  receipt_path text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wallet transactions (ledger — insert only via functions)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text NOT NULL,
  is_admin_adjustment boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Pricing settings (admin/sub-admin managed fees & subscriptions)
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  key text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sectors (admin-managed dynamic job categories)
CREATE TABLE IF NOT EXISTS public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  am text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sub-admins (back-office staff)
CREATE TABLE IF NOT EXISTS public.sub_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  sex public.gender_type,
  age integer,
  city text,
  woreda text,
  fayda_number text,
  photo_url text,
  permissions jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Subscription packages (admin-managed plans)
CREATE TABLE IF NOT EXISTS public.subscription_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_type public.app_role_type NOT NULL,
  price numeric NOT NULL,
  duration_days integer NOT NULL,
  fee_overrides jsonb NOT NULL DEFAULT '{}',
  feature_limits jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User subscriptions (active grants of a package)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.subscription_packages(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  granted_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profile change requests (document review workflow)
CREATE TABLE IF NOT EXISTS public.profile_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  target_name text,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name text,
  changes jsonb NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Compliance logs (append-only audit trail)
CREATE TABLE IF NOT EXISTS public.compliance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  subject_type text NOT NULL,
  subject_id text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. FUNCTIONS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role_type)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = _user_id AND r.role IN ('admin','kyc'))
      OR EXISTS (SELECT 1 FROM public.sub_admins s WHERE s.user_id = _user_id AND s.active);
$$;

CREATE OR REPLACE FUNCTION public.are_linked(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hired_employees he
    JOIN public.workers w ON w.id::text = he.worker_ref
    WHERE he.status <> 'terminated'
      AND ((he.employer_id = _a AND w.user_id = _b) OR (he.employer_id = _b AND w.user_id = _a))
  )
$$;

CREATE OR REPLACE FUNCTION public.my_employer_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT he.employer_id FROM public.hired_employees he
  JOIN public.workers w ON w.id::text = he.worker_ref
  WHERE w.user_id = _user_id AND he.status <> 'terminated'
$$;

CREATE OR REPLACE FUNCTION public.my_broker_employer_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT a.employer_ref::uuid FROM public.assignments a
  JOIN public.workers w ON w.id::text = a.worker_ref
  WHERE w.user_id = _user_id AND a.status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.notify_user(_user_id uuid, _type text, _title text, _body text DEFAULT NULL, _link text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_user_id, _type, _title, _body, _link);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role_type, 'employer')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role_type, 'employer'))
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_wallet(_amount numeric, _reason text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _balance numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT wallet_balance INTO _balance FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF _balance IS NULL OR _balance < _amount THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  UPDATE public.profiles SET wallet_balance = wallet_balance - _amount, updated_at = now()
   WHERE id = auth.uid() RETURNING wallet_balance INTO _balance;
  INSERT INTO public.wallet_transactions (user_id, amount, reason, created_by)
  VALUES (auth.uid(), -_amount, _reason, auth.uid());
  RETURN _balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_payment(_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _p public.payments%ROWTYPE;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Only staff can approve payments'; END IF;
  SELECT * INTO _p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF _p.status = 'approved' THEN RETURN; END IF;

  UPDATE public.payments SET status = 'approved', reviewed_at = now(), updated_at = now()
   WHERE id = _payment_id;
  UPDATE public.profiles SET wallet_balance = wallet_balance + _p.amount, updated_at = now()
   WHERE id = _p.user_id;
  INSERT INTO public.wallet_transactions (user_id, amount, reason, created_by)
  VALUES (_p.user_id, _p.amount, COALESCE(_p.purpose, 'Wallet top-up'), auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(_user_id uuid, _amount numeric, _note text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _balance numeric;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Only staff can adjust wallets'; END IF;
  UPDATE public.profiles SET wallet_balance = wallet_balance + _amount, updated_at = now()
   WHERE id = _user_id RETURNING wallet_balance INTO _balance;
  IF _balance IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  INSERT INTO public.wallet_transactions (user_id, amount, reason, is_admin_adjustment, created_by)
  VALUES (_user_id, _amount, COALESCE(NULLIF(btrim(_note), ''), 'Admin adjustment'), true, auth.uid());
  RETURN _balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_profile_change(_id uuid, _approve boolean, _note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _r public.profile_change_requests%ROWTYPE;
  _k text;
  _v jsonb;
  _t text;
  _u text;
  _allowed text[] := ARRAY[
    'full_name','phone','email','age','experience','price','city','sub_city','wereda','kebele','area','address',
    'fayda_number','guarantor_name','guarantor_phone','guarantor_id_number','guarantor_relationship',
    'photo_url','fayda_front','fayda_back','guarantor_photo','guarantor_id_photo','contract_path','personal_photo',
    'language','language_other','sector','sector_other','gender',
    'education','education_institution','education_qualification','education_graduation_year','education_document','skills'
  ];
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Only staff can review change requests'; END IF;
  SELECT * INTO _r FROM public.profile_change_requests WHERE id = _id FOR UPDATE;
  IF _r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF _r.status NOT IN ('pending', 'under_review') THEN RETURN; END IF;

  UPDATE public.profile_change_requests
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'declined' END,
         admin_note = NULLIF(btrim(COALESCE(_note, '')), ''),
         reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   WHERE id = _id;

  IF _approve THEN
    FOR _k, _v IN SELECT key, value FROM jsonb_each(_r.changes) LOOP
      IF NOT (_k = ANY(_allowed)) THEN CONTINUE; END IF;
      SELECT data_type, udt_name INTO _t, _u FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = _r.target_table AND column_name = _k;
      IF _t IS NULL THEN CONTINUE; END IF;
      IF jsonb_typeof(_v) = 'null' THEN
        EXECUTE format('UPDATE public.%I SET %I = NULL, updated_at = now() WHERE id = $1', _r.target_table, _k)
          USING _r.target_id;
      ELSIF _t = 'ARRAY' THEN
        EXECUTE format('UPDATE public.%I SET %I = COALESCE((SELECT array_agg(e) FROM jsonb_array_elements_text($1::jsonb) e), ''{}''::text[]), updated_at = now() WHERE id = $2', _r.target_table, _k)
          USING _v, _r.target_id;
      ELSIF _t IN ('smallint','integer','bigint','numeric','real','double precision') THEN
        EXECUTE format('UPDATE public.%I SET %I = ($1)::%s, updated_at = now() WHERE id = $2', _r.target_table, _k, _t)
          USING trim(both '"' from _v::text), _r.target_id;
      ELSIF _t = 'USER-DEFINED' THEN
        EXECUTE format('UPDATE public.%I SET %I = ($1)::%I, updated_at = now() WHERE id = $2', _r.target_table, _k, _u)
          USING trim(both '"' from _v::text), _r.target_id;
      ELSE
        EXECUTE format('UPDATE public.%I SET %I = $1, updated_at = now() WHERE id = $2', _r.target_table, _k)
          USING trim(both '"' from _v::text), _r.target_id;
      END IF;
    END LOOP;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_termination(_id uuid, _approve boolean, _note text, _make_available boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _r public.termination_requests%ROWTYPE;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Only staff can review terminations'; END IF;
  SELECT * INTO _r FROM public.termination_requests WHERE id = _id FOR UPDATE;
  IF _r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF _r.status <> 'pending' THEN RETURN; END IF;

  UPDATE public.termination_requests
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'declined' END,
         admin_note = NULLIF(btrim(COALESCE(_note, '')), ''),
         reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   WHERE id = _id;

  IF _approve THEN
    IF _r.hired_id IS NOT NULL THEN
      UPDATE public.hired_employees SET status = 'terminated', updated_at = now() WHERE id = _r.hired_id;
    END IF;
    IF _make_available AND _r.worker_ref IS NOT NULL THEN
      UPDATE public.workers
         SET available = true, global_status = 'available', updated_at = now()
       WHERE id::text = _r.worker_ref;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ack_employee_termination(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _r public.employee_termination_requests%ROWTYPE;
BEGIN
  SELECT * INTO _r FROM public.employee_termination_requests WHERE id = _id FOR UPDATE;
  IF _r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF _r.employer_id IS NULL OR _r.employer_id <> auth.uid() THEN RAISE EXCEPTION 'Only the assigned employer can acknowledge'; END IF;
  IF _r.status <> 'pending_employer' THEN RETURN; END IF;
  UPDATE public.employee_termination_requests
     SET status = 'pending_review', employer_ack_at = now(), updated_at = now()
   WHERE id = _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_employee_termination(_id uuid, _approve boolean, _note text, _make_available boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _r public.employee_termination_requests%ROWTYPE;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Only staff can review terminations'; END IF;
  SELECT * INTO _r FROM public.employee_termination_requests WHERE id = _id FOR UPDATE;
  IF _r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF _r.status NOT IN ('pending_employer', 'pending_review') THEN RETURN; END IF;

  UPDATE public.employee_termination_requests
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'declined' END,
         admin_note = NULLIF(btrim(COALESCE(_note, '')), ''),
         make_available = _make_available,
         reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   WHERE id = _id;

  IF _approve THEN
    IF _r.hired_id IS NOT NULL THEN
      UPDATE public.hired_employees SET status = 'terminated', updated_at = now() WHERE id = _r.hired_id;
    END IF;
    IF _r.assignment_id IS NOT NULL THEN
      UPDATE public.assignments SET status = 'ended', updated_at = now() WHERE id = _r.assignment_id;
    END IF;
    IF _make_available AND _r.worker_id IS NOT NULL THEN
      UPDATE public.workers SET available = true, global_status = 'available', updated_at = now() WHERE id = _r.worker_id;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_worker_roster_status(_worker_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Only staff can change roster status'; END IF;
  UPDATE public.workers
     SET global_status = _status,
         available = (_status = 'available'),
         updated_at = now()
   WHERE id = _worker_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_worker_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.worker_public_profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.is_public AND NEW.verification_status = 'approved' THEN
    INSERT INTO public.worker_public_profiles AS t (
      id, full_name, sector, sector_other, gender, age, experience, price,
      city, sub_city, area, latitude, longitude, photo_url, available,
      global_status, verification_status, created_at, language, language_other
    ) VALUES (
      NEW.id, NEW.full_name, NEW.sector, NEW.sector_other, NEW.gender, NEW.age,
      NEW.experience, NEW.price, NEW.city, NEW.sub_city, NEW.area, NEW.latitude,
      NEW.longitude, NEW.photo_url, NEW.available, NEW.global_status,
      NEW.verification_status, NEW.created_at, NEW.language, NEW.language_other
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      sector = EXCLUDED.sector,
      sector_other = EXCLUDED.sector_other,
      gender = EXCLUDED.gender,
      age = EXCLUDED.age,
      experience = EXCLUDED.experience,
      price = EXCLUDED.price,
      city = EXCLUDED.city,
      sub_city = EXCLUDED.sub_city,
      area = EXCLUDED.area,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      photo_url = EXCLUDED.photo_url,
      available = EXCLUDED.available,
      global_status = EXCLUDED.global_status,
      verification_status = EXCLUDED.verification_status,
      created_at = EXCLUDED.created_at,
      language = EXCLUDED.language,
      language_other = EXCLUDED.language_other;
  ELSE
    DELETE FROM public.worker_public_profiles WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_compliance_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME = 'profile_change_requests' THEN
    INSERT INTO public.compliance_logs (actor_id, actor_name, action, subject_type, subject_id, summary)
    VALUES (NEW.requested_by, NEW.requester_name,
      CASE WHEN TG_OP = 'INSERT' THEN 'profile_update_submitted' ELSE 'profile_update_' || NEW.status END,
      NEW.target_table, NEW.target_id::text,
      COALESCE(NEW.target_name, 'Profile') || ': ' || COALESCE((SELECT string_agg(key, ', ') FROM jsonb_each_text(NEW.changes)), 'no fields'));
  ELSIF TG_TABLE_NAME = 'employer_reports' THEN
    INSERT INTO public.compliance_logs (actor_id, actor_name, action, subject_type, subject_id, summary)
    VALUES (NEW.employee_id, NULL,
      CASE WHEN TG_OP = 'INSERT' THEN 'employer_report_filed' ELSE 'employer_report_' || NEW.status END,
      'employer_reports', NEW.id::text,
      NEW.reason || ' — reported employer: ' || NEW.employer_name);
  ELSIF TG_TABLE_NAME = 'employee_termination_requests' THEN
    INSERT INTO public.compliance_logs (actor_id, actor_name, action, subject_type, subject_id, summary)
    VALUES (NEW.employee_id, NULL,
      CASE WHEN TG_OP = 'INSERT' THEN 'termination_requested' ELSE 'termination_' || NEW.status END,
      'employee_termination_requests', NEW.id::text,
      NEW.reason || ' — employer: ' || NEW.employer_name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_profile_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NEW.verification_status IN ('approved', 'declined') THEN
    PERFORM public.notify_user(NEW.id, 'verification',
      CASE WHEN NEW.verification_status = 'approved' THEN 'Your account was approved' ELSE 'Your account was declined' END,
      COALESCE(NEW.verification_note, 'Your verification status is now ' || NEW.verification_status || '.'),
      '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_worker_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NEW.verification_status IN ('approved', 'declined') THEN
    PERFORM public.notify_user(COALESCE(NEW.user_id, NEW.owner_id), 'verification',
      CASE WHEN NEW.verification_status = 'approved' THEN 'Employee registration approved' ELSE 'Employee registration declined' END,
      NEW.full_name || '''s registration was ' || NEW.verification_status || COALESCE(': ' || NEW.verification_note, '.'),
      '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_payment_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'declined', 'rejected') THEN
    PERFORM public.notify_user(NEW.user_id, 'payment',
      CASE WHEN NEW.status = 'approved' THEN 'Payment approved' ELSE 'Payment declined' END,
      'Your payment of ETB ' || NEW.amount || COALESCE(' (' || NEW.purpose || ')', '') || ' was ' || NEW.status || '.',
      '/payment');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_subscription_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _name text;
BEGIN
  SELECT name INTO _name FROM public.subscription_packages WHERE id = NEW.package_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_user(NEW.user_id, 'subscription', 'Subscription started',
      COALESCE(_name, 'Your plan') || ' is active until ' || to_char(NEW.expires_at, 'DD Mon YYYY') || '.',
      '/dashboard');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_user(NEW.user_id, 'subscription', 'Subscription ' || NEW.status,
      COALESCE(_name, 'Your plan') || ' is now ' || NEW.status || '.',
      '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. GRANTS (required — Supabase does not grant these by default)
-- ---------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.employee_profiles TO authenticated;
GRANT ALL ON public.employee_profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workers TO authenticated;
GRANT ALL ON public.workers TO service_role;

GRANT SELECT ON public.worker_public_profiles TO anon, authenticated;
GRANT ALL ON public.worker_public_profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_employers TO authenticated;
GRANT ALL ON public.broker_employers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_requests TO authenticated;
GRANT ALL ON public.employee_requests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hired_employees TO authenticated;
GRANT ALL ON public.hired_employees TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.incident_reports TO authenticated;
GRANT ALL ON public.incident_reports TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.termination_requests TO authenticated;
GRANT ALL ON public.termination_requests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_ratings TO authenticated;
GRANT ALL ON public.worker_ratings TO service_role;

GRANT SELECT, INSERT ON public.employer_ratings TO authenticated;
GRANT ALL ON public.employer_ratings TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.employer_reports TO authenticated;
GRANT ALL ON public.employer_reports TO service_role;

GRANT SELECT, INSERT ON public.employee_termination_requests TO authenticated;
GRANT ALL ON public.employee_termination_requests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

GRANT SELECT, INSERT ON public.review_messages TO authenticated;
GRANT ALL ON public.review_messages TO service_role;

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

GRANT SELECT ON public.pricing_settings TO anon, authenticated;
GRANT ALL ON public.pricing_settings TO service_role;

GRANT SELECT ON public.sectors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sectors TO authenticated;
GRANT ALL ON public.sectors TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sub_admins TO authenticated;
GRANT ALL ON public.sub_admins TO service_role;

GRANT SELECT ON public.subscription_packages TO anon, authenticated;
GRANT ALL ON public.subscription_packages TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profile_change_requests TO authenticated;
GRANT ALL ON public.profile_change_requests TO service_role;

GRANT SELECT ON public.compliance_logs TO authenticated;
GRANT ALL ON public.compliance_logs TO service_role;

-- RPC execute grants
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role_type) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.are_linked(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_employer_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_broker_employer_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_wallet(numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_profile_change(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_termination(uuid, boolean, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ack_employee_termination(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_employee_termination(uuid, boolean, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_worker_roster_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
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

-- profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_staff(auth.uid()));

-- user_roles (read-only for users; writes only via security definer functions / service role)
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- applications
DROP POLICY IF EXISTS "applications_select" ON public.applications;
CREATE POLICY "applications_select" ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "applications_insert" ON public.applications;
CREATE POLICY "applications_insert" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "applications_update" ON public.applications;
CREATE POLICY "applications_update" ON public.applications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- employee_profiles
DROP POLICY IF EXISTS "employee_profiles_select" ON public.employee_profiles;
CREATE POLICY "employee_profiles_select" ON public.employee_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "employee_profiles_insert" ON public.employee_profiles;
CREATE POLICY "employee_profiles_insert" ON public.employee_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "employee_profiles_update" ON public.employee_profiles;
CREATE POLICY "employee_profiles_update" ON public.employee_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- workers
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

-- worker_public_profiles (fully public read, no direct writes)
DROP POLICY IF EXISTS "worker_public_profiles_select" ON public.worker_public_profiles;
CREATE POLICY "worker_public_profiles_select" ON public.worker_public_profiles FOR SELECT
  TO anon, authenticated USING (true);

-- broker_employers
DROP POLICY IF EXISTS "broker_employers_all" ON public.broker_employers;
CREATE POLICY "broker_employers_all" ON public.broker_employers FOR ALL TO authenticated
  USING (broker_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (broker_id = auth.uid() OR public.is_staff(auth.uid()));

-- assignments
DROP POLICY IF EXISTS "assignments_all" ON public.assignments;
CREATE POLICY "assignments_all" ON public.assignments FOR ALL TO authenticated
  USING (broker_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (broker_id = auth.uid() OR public.is_staff(auth.uid()));

-- bookings
DROP POLICY IF EXISTS "bookings_all" ON public.bookings;
CREATE POLICY "bookings_all" ON public.bookings FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

-- employee_requests
DROP POLICY IF EXISTS "employee_requests_all" ON public.employee_requests;
CREATE POLICY "employee_requests_all" ON public.employee_requests FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

-- hired_employees
DROP POLICY IF EXISTS "hired_employees_all" ON public.hired_employees;
CREATE POLICY "hired_employees_all" ON public.hired_employees FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

-- incident_reports
DROP POLICY IF EXISTS "incident_reports_all" ON public.incident_reports;
CREATE POLICY "incident_reports_all" ON public.incident_reports FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

-- termination_requests
DROP POLICY IF EXISTS "termination_requests_all" ON public.termination_requests;
CREATE POLICY "termination_requests_all" ON public.termination_requests FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

-- worker_ratings
DROP POLICY IF EXISTS "worker_ratings_all" ON public.worker_ratings;
CREATE POLICY "worker_ratings_all" ON public.worker_ratings FOR ALL TO authenticated
  USING (employer_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (employer_id = auth.uid() OR public.is_staff(auth.uid()));

-- employer_ratings (employees rate employers; no updates/deletes)
DROP POLICY IF EXISTS "employer_ratings_select" ON public.employer_ratings;
CREATE POLICY "employer_ratings_select" ON public.employer_ratings FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.is_staff(auth.uid())
         OR employer_id = auth.uid() OR broker_employer_id IN (SELECT id FROM public.broker_employers WHERE broker_id = auth.uid()));
DROP POLICY IF EXISTS "employer_ratings_insert" ON public.employer_ratings;
CREATE POLICY "employer_ratings_insert" ON public.employer_ratings FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

-- employer_reports (employees report employers; staff review)
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

-- employee_termination_requests (employee initiates; status changes via security definer RPCs)
DROP POLICY IF EXISTS "employee_termination_requests_select" ON public.employee_termination_requests;
CREATE POLICY "employee_termination_requests_select" ON public.employee_termination_requests FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR employer_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "employee_termination_requests_insert" ON public.employee_termination_requests;
CREATE POLICY "employee_termination_requests_insert" ON public.employee_termination_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

-- messages
DROP POLICY IF EXISTS "messages_all" ON public.messages;
CREATE POLICY "messages_all" ON public.messages FOR ALL TO authenticated
  USING (sender_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (sender_id = auth.uid() OR public.is_staff(auth.uid()));

-- direct_messages (1:1 chat between linked users)
DROP POLICY IF EXISTS "direct_messages_select" ON public.direct_messages;
CREATE POLICY "direct_messages_select" ON public.direct_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
DROP POLICY IF EXISTS "direct_messages_insert" ON public.direct_messages;
CREATE POLICY "direct_messages_insert" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "direct_messages_update" ON public.direct_messages;
CREATE POLICY "direct_messages_update" ON public.direct_messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- review_messages (append-only chat)
DROP POLICY IF EXISTS "review_messages_select" ON public.review_messages;
CREATE POLICY "review_messages_select" ON public.review_messages FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "review_messages_insert" ON public.review_messages;
CREATE POLICY "review_messages_insert" ON public.review_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- notifications (owner reads/marks-read; inserts via security definer notify_user)
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- payments
DROP POLICY IF EXISTS "payments_all" ON public.payments;
CREATE POLICY "payments_all" ON public.payments FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- wallet_transactions (read-only; writes only via security definer functions)
DROP POLICY IF EXISTS "wallet_transactions_select" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_select" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- pricing_settings (public read, staff manage)
DROP POLICY IF EXISTS "pricing_settings_select" ON public.pricing_settings;
CREATE POLICY "pricing_settings_select" ON public.pricing_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "pricing_settings_staff" ON public.pricing_settings;
CREATE POLICY "pricing_settings_staff" ON public.pricing_settings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- sectors (public read, staff manage)
DROP POLICY IF EXISTS "sectors_select" ON public.sectors;
CREATE POLICY "sectors_select" ON public.sectors FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "sectors_staff" ON public.sectors;
CREATE POLICY "sectors_staff" ON public.sectors FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- sub_admins
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

-- subscription_packages (public read, staff manage)
DROP POLICY IF EXISTS "subscription_packages_select" ON public.subscription_packages;
CREATE POLICY "subscription_packages_select" ON public.subscription_packages FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "subscription_packages_staff" ON public.subscription_packages;
CREATE POLICY "subscription_packages_staff" ON public.subscription_packages FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- user_subscriptions
DROP POLICY IF EXISTS "user_subscriptions_select" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_select" ON public.user_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "user_subscriptions_insert" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_insert" ON public.user_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "user_subscriptions_update" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_update" ON public.user_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- profile_change_requests
DROP POLICY IF EXISTS "profile_change_requests_select" ON public.profile_change_requests;
CREATE POLICY "profile_change_requests_select" ON public.profile_change_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "profile_change_requests_insert" ON public.profile_change_requests;
CREATE POLICY "profile_change_requests_insert" ON public.profile_change_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());
DROP POLICY IF EXISTS "profile_change_requests_update" ON public.profile_change_requests;
CREATE POLICY "profile_change_requests_update" ON public.profile_change_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- compliance_logs (read-only audit; written by security definer trigger)
DROP POLICY IF EXISTS "compliance_logs_select" ON public.compliance_logs;
CREATE POLICY "compliance_logs_select" ON public.compliance_logs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- ---------------------------------------------------------------------
-- 6. TRIGGERS
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 7. STORAGE BUCKETS (all private) + access policies
--    Upload convention: first path segment is the owner's user id,
--    e.g. "<user-id>/fayda-front.jpg". Staff can access everything.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', false),
  ('contracts', 'contracts', false),
  ('id-documents', 'id-documents', false),
  ('incident-evidence', 'incident-evidence', false),
  ('receipts', 'receipts', false),
  ('report-evidence', 'report-evidence', false)
ON CONFLICT (id) DO NOTHING;

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

-- ---------------------------------------------------------------------
-- 8. SEED DATA — default pricing (editable in Admin → Pricing)
-- ---------------------------------------------------------------------
INSERT INTO public.pricing_settings (key, label, category, amount, active) VALUES
  ('register_employee', 'Employee registration fee (broker)', 'fees', 50, true),
  ('booking', 'Booking fee', 'fees', 100, true),
  ('pro_feature', 'Pro feature rate', 'fees', 200, true),
  ('subscription_basic', 'Basic subscription', 'subscription', 300, true),
  ('subscription_standard', 'Standard subscription', 'subscription', 700, true),
  ('subscription_premium', 'Premium subscription', 'subscription', 1500, true)
ON CONFLICT (key) DO NOTHING;
