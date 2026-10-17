CREATE OR REPLACE VIEW public.workers_public AS
SELECT id, user_id, full_name, sector, sector_other, sectors, city, sub_city, area,
       experience, gender, age, price, photo_url, fayda_verified, guarantor_verified,
       available, verification_status, created_at, latitude, longitude
FROM public.workers
WHERE is_public = true AND verification_status = 'approved' AND available = true;
GRANT SELECT ON public.workers_public TO anon, authenticated;
ALTER POLICY worker_public_profiles_select ON public.worker_public_profiles
USING (verification_status = 'approved' AND available = true);
COMMENT ON VIEW public.workers_public IS 'Public-safe worker projection: only intentionally public, approved, available workers; private worker RLS remains owner/staff scoped.';