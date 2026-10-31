\set ON_ERROR_STOP on
DO $$ DECLARE
  a uuid := '00000000-0000-0000-0000-000000000101';
  b uuid := '00000000-0000-0000-0000-000000000102';
  c uuid := '00000000-0000-0000-0000-000000000103';
  d uuid := '00000000-0000-0000-0000-000000000104';
  e uuid := '00000000-0000-0000-0000-000000000105';
  out jsonb;
  result text;
BEGIN
 IF has_function_privilege('anon','public.kenz_g427_atomic_xpay_v1(text,text,text,uuid,text,text,integer,text,jsonb)','EXECUTE') THEN
   RAISE EXCEPTION 'anon can execute payment RPC'; END IF;
 IF has_function_privilege('authenticated','public.kenz_g427_atomic_xpay_v1(text,text,text,uuid,text,text,integer,text,jsonb)','EXECUTE') THEN
   RAISE EXCEPTION 'authenticated can execute payment RPC'; END IF;
 IF NOT has_function_privilege('service_role','public.kenz_g427_atomic_xpay_v1(text,text,text,uuid,text,text,integer,text,jsonb)','EXECUTE') THEN
   RAISE EXCEPTION 'service_role cannot execute RPC'; END IF;
 INSERT INTO factory_orders(id,order_ref,payment_method,status,payment_status,total_minor,currency,delivery_channel,delivery_email,delivery_consent_at)
 VALUES(a,'KENZ-SYN-101','xpay','pending','unpaid',5900,'EGP','email','synthetic@example.invalid',now()),
 (b,'KENZ-SYN-102','xpay','pending','unpaid',19900,'EGP','email','synthetic@example.invalid',now()),
 (c,'KENZ-SYN-103','xpay','pending','unpaid',11900,'EGP','site',null,null),
 (d,'KENZ-SYN-104','xpay','pending','unpaid',5900,'EGP','email','synthetic@example.invalid',now()),
 (e,'KENZ-SYN-105','xpay','pending','unpaid',5900,'EGP','email','synthetic@example.invalid',now());

 SELECT public.kenz_g427_atomic_xpay_v1('evt-paid-101','checkout.session.completed','paid',a,'KENZ-SYN-101','cs_live_synthetic101',5900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF out->>'settled' <> 'true' THEN RAISE EXCEPTION 'settle 101 failed: %',out; END IF;
 IF (SELECT count(*) FROM factory_payment_events WHERE order_id=a)<>1 OR
    (SELECT count(*) FROM factory_cash_ledger WHERE order_id=a AND entry_type='revenue' AND amount_minor=5900 AND bucket IS NULL)<>1 OR
    (SELECT count(*) FROM factory_deliveries WHERE order_id=a)<>2 OR
    (SELECT count(*) FROM factory_order_access_tokens WHERE order_id=a)<>1 OR
    (SELECT count(*) FROM factory_audit_log WHERE order_id=a)<>1 THEN RAISE EXCEPTION 'atomic 101 counts failed'; END IF;
 IF (SELECT length(payload->>'access_token') FROM factory_deliveries WHERE order_id=a AND delivery_kind='product_delivery')<>64 THEN RAISE EXCEPTION 'token not queued'; END IF;

 SELECT public.kenz_g427_atomic_xpay_v1('evt-paid-101','checkout.session.completed','paid',a,'KENZ-SYN-101','cs_live_synthetic101',5900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF out->>'duplicate'<>'true' OR (SELECT count(*) FROM factory_deliveries WHERE order_id=a)<>2 THEN RAISE EXCEPTION 'same-event replay'; END IF;
 SELECT public.kenz_g427_atomic_xpay_v1('evt-paid-101','checkout.session.completed','paid',b,'KENZ-SYN-102','cs_live_synthetic102',19900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF out->>'error'<>'provider_event_id_collision' THEN RAISE EXCEPTION 'collision not rejected: %',out; END IF;
 SELECT public.kenz_g427_atomic_xpay_v1('evt-paid-101-new','checkout.session.async_payment_succeeded','paid',a,'KENZ-SYN-101','cs_live_synthetic101',5900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF out->>'already_paid'<>'true' OR (SELECT count(*) FROM factory_deliveries WHERE order_id=a)<>2 THEN RAISE EXCEPTION 'distinct paid event replay'; END IF;
 SELECT public.kenz_g427_atomic_xpay_v1('evt-late-101','checkout.session.async_payment_failed','unpaid',a,'KENZ-SYN-101','cs_live_synthetic101',5900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF (SELECT status||'/'||payment_status FROM factory_orders WHERE id=a)<>'paid/paid' THEN RAISE EXCEPTION 'Paid demoted'; END IF;
 SELECT public.kenz_g427_atomic_xpay_v1('evt-wait-102','checkout.session.completed','unpaid',b,'KENZ-SYN-102','cs_live_synthetic102',19900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF out->>'awaiting_payment'<>'true' OR (SELECT status FROM factory_orders WHERE id=b)<>'pending' THEN RAISE EXCEPTION 'unpaid marked paid'; END IF;
 SELECT public.kenz_g427_atomic_xpay_v1('evt-fail-102','checkout.session.expired','unpaid',b,'KENZ-SYN-102','cs_live_synthetic102',19900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF (SELECT status FROM factory_orders WHERE id=b)<>'cancelled' THEN RAISE EXCEPTION 'failed state absent'; END IF;
 SELECT public.kenz_g427_atomic_xpay_v1('evt-after-fail-102','checkout.session.completed','paid',b,'KENZ-SYN-102','cs_live_synthetic102',19900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF out->>'requires_review'<>'true' OR (SELECT count(*) FROM factory_deliveries WHERE order_id=b)<>0 OR (SELECT count(*) FROM factory_exceptions WHERE order_id=b)<>1 THEN RAISE EXCEPTION 'late paid not quarantined'; END IF;
 SELECT public.kenz_g427_atomic_xpay_v1('evt-mismatch-103','checkout.session.completed','paid',c,'KENZ-SYN-103','cs_live_synthetic103',9900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF out->>'error'<>'order_session_amount_mismatch' OR (SELECT count(*) FROM factory_payment_events WHERE order_id=c)<>0 THEN RAISE EXCEPTION 'wrong amount accepted'; END IF;
 SELECT public.kenz_g427_atomic_xpay_v1('evt-wrong-currency-103','checkout.session.completed','paid',c,'KENZ-SYN-103','cs_live_synthetic103',11900,'USD','{"id":"synthetic_only"}') INTO out;
 IF out->>'error'<>'invalid_amount_currency_or_status' THEN RAISE EXCEPTION 'wrong currency accepted'; END IF;
 SELECT public.kenz_g427_atomic_xpay_v1('evt-no-contact-103','checkout.session.completed','paid',c,'KENZ-SYN-103','cs_live_synthetic103',11900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF out->>'settled'<>'true' OR (SELECT fulfillment_status FROM factory_orders WHERE id=c)<>'needs_delivery_contact' OR
 (SELECT count(*) FROM factory_exceptions WHERE order_id=c)<>1 THEN RAISE EXCEPTION 'missing contact was not flagged'; END IF;
 -- Inject a real DB write failure and assert *all* changes roll back (event, order, ledger).
 CREATE FUNCTION public.g427_force_delivery_failure() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''synthetic_delivery_failure''; END';
 CREATE TRIGGER g427_simulate_delivery_failure BEFORE INSERT ON public.factory_deliveries
 FOR EACH ROW WHEN (NEW.order_id='00000000-0000-0000-0000-000000000104'::uuid) EXECUTE FUNCTION public.g427_force_delivery_failure();
 BEGIN
   SELECT public.kenz_g427_atomic_xpay_v1('evt-paid-104','checkout.session.completed','paid',d,'KENZ-SYN-104','cs_live_synthetic104',5900,'EGP','{"id":"synthetic_only"}') INTO out;
   RAISE EXCEPTION 'expected failure did not occur';
 EXCEPTION WHEN others THEN
   IF SQLERRM='expected failure did not occur' THEN RAISE; END IF;
 END;
 IF (SELECT count(*) FROM factory_payment_events WHERE order_id=d)<>0 OR
    (SELECT count(*) FROM factory_cash_ledger WHERE order_id=d)<>0 OR
    (SELECT count(*) FROM factory_order_access_tokens WHERE order_id=d)<>0 OR
    (SELECT status FROM factory_orders WHERE id=d)<>'pending' THEN RAISE EXCEPTION 'partial rollback failed'; END IF;
 DROP TRIGGER g427_simulate_delivery_failure ON public.factory_deliveries;
 DROP FUNCTION public.g427_force_delivery_failure();
 SELECT public.kenz_g427_atomic_xpay_v1('evt-paid-104','checkout.session.completed','paid',d,'KENZ-SYN-104','cs_live_synthetic104',5900,'EGP','{"id":"synthetic_only"}') INTO out;
 IF out->>'settled'<>'true' THEN RAISE EXCEPTION 'replay after rollback failed'; END IF;

 -- Simulate a missing production order-to-revenue trigger. Transaction must roll back.
 ALTER TABLE public.factory_orders DISABLE TRIGGER trg_factory_ensure_xpay_revenue_ledger;
 BEGIN
  SELECT public.kenz_g427_atomic_xpay_v1('evt-paid-105','checkout.session.completed','paid',e,'KENZ-SYN-105','cs_live_synthetic105',5900,'EGP','{"id":"synthetic_only"}') INTO out;
  RAISE EXCEPTION 'missing trigger allowed settlement';
 EXCEPTION WHEN others THEN
  IF SQLERRM='missing trigger allowed settlement' THEN RAISE; END IF;
 END;
 IF (SELECT count(*) FROM factory_payment_events WHERE order_id=e)<>0 OR (SELECT status FROM factory_orders WHERE id=e)<>'pending' THEN
 RAISE EXCEPTION 'trigger absence did not roll back event + order'; END IF;
 ALTER TABLE public.factory_orders ENABLE TRIGGER trg_factory_ensure_xpay_revenue_ledger;
 RAISE NOTICE 'G4.27 integration assertions PASS; all data synthetic';
END $$;
