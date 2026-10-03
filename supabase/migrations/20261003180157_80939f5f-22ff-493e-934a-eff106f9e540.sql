CREATE OR REPLACE VIEW public.workers_public AS
SELECT id, user_id, full_name, sector, sector_other, sectors, city, sub_city, area,
       experience, gender, age, price, photo_url, fayda_verified, guarantor_verified,
       available, verification_status, created_at, latitude, longitude
FROM public.workers
WHERE is_public = true;