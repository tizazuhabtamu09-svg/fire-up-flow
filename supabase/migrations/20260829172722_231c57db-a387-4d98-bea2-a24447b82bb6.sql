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

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

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

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text NOT NULL,
  is_admin_adjustment boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pricing_settings (
  key text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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