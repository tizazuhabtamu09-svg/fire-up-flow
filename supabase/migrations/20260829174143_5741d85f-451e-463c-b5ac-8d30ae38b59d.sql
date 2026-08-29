DO $$
DECLARE r record;
  allowed text[] := ARRAY[
    'admin_adjust_wallet','approve_payment','has_role','is_staff','is_verified_employee',
    'review_employee_termination','review_profile_change','review_termination',
    'set_worker_roster_status','spend_wallet'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype <> 'event_trigger'::regtype
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    IF r.proname = ANY(allowed) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    END IF;
  END LOOP;
END $$;