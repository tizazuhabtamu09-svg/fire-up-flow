-- 1. Add education columns to the public mirror table
ALTER TABLE public.worker_public_profiles
  ADD COLUMN IF NOT EXISTS education text,
  ADD COLUMN IF NOT EXISTS education_institution text,
  ADD COLUMN IF NOT EXISTS education_qualification text,
  ADD COLUMN IF NOT EXISTS education_graduation_year integer;

-- 2. Update the sync trigger to mirror education fields
CREATE OR REPLACE FUNCTION public.sync_worker_public_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.worker_public_profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.verification_status = 'approved' THEN
    INSERT INTO public.worker_public_profiles AS t (
      id, full_name, sector, sector_other, sectors, gender, age, experience, price,
      city, sub_city, area, latitude, longitude, photo_url, available,
      global_status, verification_status, created_at, language, language_other,
      education, education_institution, education_qualification, education_graduation_year
    ) VALUES (
      NEW.id, NEW.full_name, NEW.sector, NEW.sector_other, NEW.sectors, NEW.gender, NEW.age,
      NEW.experience, NEW.price, NEW.city, NEW.sub_city, NEW.area,
      round(NEW.latitude::numeric, 2), round(NEW.longitude::numeric, 2),
      NEW.photo_url, NEW.available, NEW.global_status,
      NEW.verification_status, NEW.created_at, NEW.language, NEW.language_other,
      NEW.education, NEW.education_institution, NEW.education_qualification, NEW.education_graduation_year
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      sector = EXCLUDED.sector,
      sector_other = EXCLUDED.sector_other,
      sectors = EXCLUDED.sectors,
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
      language_other = EXCLUDED.language_other,
      education = EXCLUDED.education,
      education_institution = EXCLUDED.education_institution,
      education_qualification = EXCLUDED.education_qualification,
      education_graduation_year = EXCLUDED.education_graduation_year;
  ELSE
    DELETE FROM public.worker_public_profiles WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Backfill education for existing approved workers
UPDATE public.worker_public_profiles p
   SET education = w.education,
       education_institution = w.education_institution,
       education_qualification = w.education_qualification,
       education_graduation_year = w.education_graduation_year
  FROM public.workers w
 WHERE p.id = w.id;

-- 4. Recreate the public view: include sectors + education, and hide unavailable workers
DROP VIEW IF EXISTS public.workers_public;
CREATE VIEW public.workers_public
WITH (security_invoker = on) AS
SELECT id,
       full_name,
       sector,
       sector_other,
       sectors,
       gender,
       age,
       experience,
       price,
       city,
       sub_city,
       area,
       latitude,
       longitude,
       photo_url,
       available,
       global_status,
       verification_status,
       created_at,
       language,
       language_other,
       education,
       education_institution,
       education_qualification,
       education_graduation_year
  FROM public.worker_public_profiles
 WHERE available = true;

GRANT SELECT ON public.workers_public TO anon, authenticated;
GRANT SELECT ON public.worker_public_profiles TO anon, authenticated;