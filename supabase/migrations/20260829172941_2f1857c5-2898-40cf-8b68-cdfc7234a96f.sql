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

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role_type) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.are_linked(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_employer_ids(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_broker_employer_ids(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.spend_wallet(numeric, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_payment(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_profile_change(uuid, boolean, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_termination(uuid, boolean, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ack_employee_termination(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_employee_termination(uuid, boolean, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_worker_roster_status(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_worker_public_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_compliance_event() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_profile_verification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_worker_verification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_payment_event() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_subscription_event() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
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