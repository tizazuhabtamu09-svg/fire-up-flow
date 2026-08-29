CREATE OR REPLACE VIEW public.workers_public
WITH (security_invoker = on) AS
SELECT
  id, full_name, sector, sector_other, gender, age, experience, price,
  city, sub_city, area, latitude, longitude, photo_url, available,
  global_status, verification_status, created_at, language, language_other
FROM public.worker_public_profiles;

GRANT SELECT ON public.workers_public TO anon, authenticated;
GRANT ALL ON public.workers_public TO service_role;