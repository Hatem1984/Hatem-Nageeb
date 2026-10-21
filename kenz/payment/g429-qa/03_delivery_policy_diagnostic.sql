\set ON_ERROR_STOP on
-- G4.29 READ-ONLY DIAGNOSTIC OF EXISTING G4.27 STAGING CANDIDATE.
-- Runs only in fresh synthetic PostgreSQL 16 CI, NEVER production.
-- QA acceptance gate: fail CI if a known consent/site-only defect remains.
DO $$
DECLARE
  v_email_ok uuid := '00000000-0000-0000-0000-000000000291';
  v_email_no_consent uuid := '00000000-0000-0000-0000-000000000292';
  v_site uuid := '00000000-0000-0000-0000-000000000293';
  v_out jsonb;
  v_good integer:=0;
  v_gap integer:=0;
BEGIN
  INSERT INTO public.factory_orders(id,order_ref,payment_method,status,payment_status,total_minor,currency,delivery_channel,delivery_email,delivery_consent_at)
  VALUES
    (v_email_ok,'KENZ-QA-G429-EMAIL-OK','xpay','pending','unpaid',5900,'EGP','email','synthetic-accepted@example.invalid',now()),
    (v_email_no_consent,'KENZ-QA-G429-EMAIL-NO-CONSENT','xpay','pending','unpaid',5900,'EGP','email','synthetic-no-consent@example.invalid',NULL),
    (v_site,'KENZ-QA-G429-SITE','xpay','pending','unpaid',5900,'EGP','site',NULL,NULL);
  SELECT public.kenz_g427_atomic_xpay_v1('evt-g429-ok','checkout.session.completed','paid',v_email_ok,'KENZ-QA-G429-EMAIL-OK','cs_qa_g429_ok',5900,'EGP','{"synthetic":true}'::jsonb) INTO v_out;
  IF v_out->>'settled' <> 'true' OR (SELECT COUNT(*) FROM factory_deliveries WHERE order_id=v_email_ok)<>2 THEN
    RAISE EXCEPTION 'expected consented email delivery cannot be queued: %',v_out;
  END IF;
  IF (SELECT COUNT(*) FROM factory_order_access_tokens WHERE order_id=v_email_ok)<>1 THEN
    RAISE EXCEPTION 'consented email requires access token';
  END IF;
  v_good:=v_good+1;
  RAISE NOTICE 'PASS [CONTROL] email with consent: paid, 2 queued email deliveries, 1 access token';

  SELECT public.kenz_g427_atomic_xpay_v1('evt-g429-noconsent','checkout.session.completed','paid',v_email_no_consent,'KENZ-QA-G429-EMAIL-NO-CONSENT','cs_qa_g429_noconsent',5900,'EGP','{"synthetic":true}'::jsonb) INTO v_out;
  IF v_out->>'settled' <> 'true' OR (SELECT COUNT(*) FROM factory_deliveries WHERE order_id=v_email_no_consent)<>0 THEN
    RAISE EXCEPTION 'non-consented email should not trigger a message';
  END IF;
  IF (SELECT fulfillment_status FROM factory_orders WHERE id=v_email_no_consent)='queued' THEN
    v_gap:=v_gap+1;
    RAISE NOTICE 'CONFIRMED BLOCKER 1: without consent, current SQL marks fulfillment queued while no email can be sent';
  ELSE
    RAISE NOTICE 'INFO: no-consent state appears fixed in candidate';
  END IF;

  SELECT public.kenz_g427_atomic_xpay_v1('evt-g429-site','checkout.session.completed','paid',v_site,'KENZ-QA-G429-SITE','cs_qa_g429_site',5900,'EGP','{"synthetic":true}'::jsonb) INTO v_out;
  IF v_out->>'settled' <> 'true' OR (SELECT COUNT(*) FROM factory_deliveries WHERE order_id=v_site)<>0 THEN
    RAISE EXCEPTION 'site-only should settle without outbound delivery';
  END IF;
  IF (SELECT fulfillment_status FROM factory_orders WHERE id=v_site)='needs_delivery_contact' THEN
    v_gap:=v_gap+1;
    RAISE NOTICE 'CONFIRMED BLOCKER 2: site-only (a legitimate paid portal path) incorrectly labeled needs_delivery_contact';
  ELSE
    RAISE NOTICE 'INFO: site-only fulfillment label appears fixed in candidate';
  END IF;
  IF (SELECT COUNT(*) FROM factory_cash_ledger WHERE order_id IN (v_email_ok,v_email_no_consent,v_site))<>3 THEN
    RAISE EXCEPTION 'financial ledger for synthetic settlements did not reconcile';
  END IF;
  RAISE NOTICE 'G4.29 synthetic policy acceptance: controls=%; violations=%; no customer data',v_good,v_gap;
  -- A diagnostic with known violations must NOT be a green release signal.
  -- Synthetic QA only; no production database or real customer data.
  IF v_gap > 0 THEN
    RAISE EXCEPTION 'KENZ_RELEASE_GATE_BLOCKED: % delivery-policy violations remain',v_gap;
  END IF;
END $$;
