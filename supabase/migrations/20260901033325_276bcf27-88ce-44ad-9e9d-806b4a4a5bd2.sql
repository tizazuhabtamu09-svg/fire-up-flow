
INSERT INTO public.profiles (id, full_name, phone, role, verification_status)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', u.email),
       u.raw_user_meta_data->>'phone',
       COALESCE(
         NULLIF(u.raw_user_meta_data->>'onboarding_role',''),
         NULLIF(u.raw_user_meta_data->>'role',''),
         'employer'
       )::public.app_role_type,
       'pending'::public.verification_status_type
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS on_auth_user_updated_ensure_profile ON auth.users;
CREATE TRIGGER on_auth_user_updated_ensure_profile
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
