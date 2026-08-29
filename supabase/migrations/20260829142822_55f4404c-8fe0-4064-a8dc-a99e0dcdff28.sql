CREATE POLICY "Banner images are readable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Staff upload banner images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff update banner images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'banners' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff delete banner images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'banners' AND public.is_staff(auth.uid()));