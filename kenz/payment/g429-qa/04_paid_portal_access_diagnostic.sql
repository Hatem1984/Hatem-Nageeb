\set ON_ERROR_STOP on
-- G4.29: SQL contract probe for paid/guest portal tokens on SYNTHETIC data only.
-- THIS DOES NOT CALL THE REAL CUSTOMER PORTAL EDGE ENDPOINT.
-- Synthetic schema fixture has fewer columns than production; add guest identity marker.
ALTER TABLE public.factory_orders ADD COLUMN IF NOT EXISTS customer_id uuid;
DO $$
DECLARE
  v_paid uuid := '00000000-0000-0000-0000-000000000293';
  v_pending uuid := '00000000-0000-0000-0000-000000000294';
  v_raw_paid text := 'synthetic-guest-access-kenz-g429-paid-not-a-real-token';
  v_raw_pending text := 'synthetic-guest-access-kenz-g429-unpaid-not-a-real-token';
  v_can_download_paid boolean;
  v_can_download_pending boolean;
  v_can_download_wrong boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.factory_orders WHERE id=v_paid AND status='paid' AND payment_status='paid'
      AND delivery_channel='site') THEN
      RAISE EXCEPTION 'synthetic paid site order not present; run policy diagnostic first';
  END IF;
  INSERT INTO public.factory_orders(id,order_ref,payment_method,status,payment_status,total_minor,currency,delivery_channel)
    VALUES(v_pending,'KENZ-QA-G429-UNPAID','xpay','pending','unpaid',5900,'EGP','site');
  -- Store only SHA256 token hashes, just as the real checkout does (fixture only).
  INSERT INTO public.factory_order_access_tokens(order_id,token_hash,expires_at)
    VALUES(v_paid,encode(extensions.digest(v_raw_paid::bytea,'sha256'),'hex'), now()+interval '1 day'),
          (v_pending,encode(extensions.digest(v_raw_pending::bytea,'sha256'),'hex'), now()+interval '1 day');
  SELECT EXISTS (
    SELECT 1 FROM public.factory_order_access_tokens t JOIN public.factory_orders o ON o.id=t.order_id
     WHERE t.token_hash=encode(extensions.digest(v_raw_paid::bytea,'sha256'),'hex')
       AND t.expires_at>now() AND o.status='paid' AND o.payment_status='paid'
  ) INTO v_can_download_paid;
  SELECT EXISTS (
    SELECT 1 FROM public.factory_order_access_tokens t JOIN public.factory_orders o ON o.id=t.order_id
     WHERE t.token_hash=encode(extensions.digest(v_raw_pending::bytea,'sha256'),'hex')
       AND t.expires_at>now() AND o.status='paid' AND o.payment_status='paid'
  ) INTO v_can_download_pending;
  SELECT EXISTS (
    SELECT 1 FROM public.factory_order_access_tokens t JOIN public.factory_orders o ON o.id=t.order_id
     WHERE t.token_hash=encode(extensions.digest('synthetic wrong token'::bytea,'sha256'),'hex')
       AND t.expires_at>now() AND o.status='paid' AND o.payment_status='paid'
  ) INTO v_can_download_wrong;
  IF v_can_download_paid IS DISTINCT FROM TRUE OR v_can_download_pending IS DISTINCT FROM FALSE
      OR v_can_download_wrong IS DISTINCT FROM FALSE THEN
    RAISE EXCEPTION 'guest token / paid access contract failed';
  END IF;
  IF (SELECT customer_id FROM public.factory_orders WHERE id=v_paid) IS NOT NULL THEN
    RAISE EXCEPTION 'fixture was expected to prove guest access without customer_id';
  END IF;
  RAISE NOTICE 'PASS synthetic portal storage contract: Paid site guest token valid, unpaid guest denied, wrong token denied; customer_id absent';
  RAISE NOTICE 'LIMITATION: real factory-customer-portal v16 HTTP endpoint, signed URLs, download bytes, and XPay live signature not tested';
END $$;
