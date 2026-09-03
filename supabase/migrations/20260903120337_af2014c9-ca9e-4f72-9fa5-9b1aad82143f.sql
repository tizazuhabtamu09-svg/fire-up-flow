ALTER TABLE public.job_posts
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS closing_date date;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'bank';