ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS sectors text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS sectors text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS sectors text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.subscription_packages(id) ON DELETE SET NULL;