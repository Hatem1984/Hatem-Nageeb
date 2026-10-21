-- KENZ G4.27 STAGING CANDIDATE ONLY. DO NOT APPLY TO PRODUCTION.
-- The Edge webhook MUST verify the real XPay HMAC over the raw request,
-- reject test-mode events, and map only source=digital_factory_v1 before calling.
-- The function is one PostgreSQL transaction: event + payment + ledger trigger + queues.
CREATE OR REPLACE FUNCTION public.kenz_g427_atomic_xpay_v1(
    p_event_id text, p_event_type text, p_payment_status text,
    p_order_id uuid, p_order_ref text, p_session_id text,
    p_amount_minor integer, p_currency text, p_raw_event jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  v_order public.factory_orders%ROWTYPE;
  v_event uuid;
  v_exists public.factory_payment_events%ROWTYPE;
  v_now timestamptz := transaction_timestamp();
  v_success boolean;
  v_failure boolean;
  v_status text;
  v_token text;
  v_token_hash text;
  v_token_expires timestamptz;
  v_revenue_count int;
BEGIN
  -- Authorization is by privilege ONLY: do not grant EXECUTE to anon/authenticated.
  -- Raw event input is not independently trusted; signed-edge verification is mandatory.
  IF p_event_id IS NULL OR length(p_event_id) NOT BETWEEN 5 AND 180 OR
     p_session_id IS NULL OR length(p_session_id) NOT BETWEEN 5 AND 180 OR
     p_order_ref IS NULL OR length(p_order_ref) NOT BETWEEN 6 AND 120 OR
     p_raw_event IS NULL OR jsonb_typeof(p_raw_event)<>'object' THEN
    RETURN jsonb_build_object('error','invalid_event_metadata');
  END IF;
  v_success := p_event_type IN ('checkout.session.completed','checkout.session.async_payment_succeeded');
  v_failure := p_event_type IN ('checkout.session.async_payment_failed','checkout.session.expired');
  IF NOT v_success AND NOT v_failure THEN
    RETURN jsonb_build_object('ignored',true,'reason','event_type_not_settleable');
  END IF;
  IF p_payment_status IS NULL OR length(p_payment_status)>30 OR
     p_currency IS DISTINCT FROM 'EGP' OR p_amount_minor IS NULL OR p_amount_minor<=0 THEN
    RETURN jsonb_build_object('error','invalid_amount_currency_or_status');
  END IF;

  -- Per-order row lock serializes two *different* provider event IDs for this order.
  SELECT * INTO v_order FROM public.factory_orders
    WHERE id=p_order_id AND order_ref=p_order_ref AND payment_method='xpay'
    FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','order_not_found'); END IF;
  IF v_order.currency IS DISTINCT FROM p_currency OR
     v_order.total_minor IS DISTINCT FROM p_amount_minor OR
     (v_order.provider_reference IS NOT NULL AND v_order.provider_reference<>p_session_id) THEN
    RETURN jsonb_build_object('error','order_session_amount_mismatch');
  END IF;

  -- Event insertion and all subsequent effects commit or roll back TOGETHER.
  INSERT INTO public.factory_payment_events
    (provider,provider_event_id,provider_session_id,order_id,event_type,
     payment_status,amount_minor,currency,verified,raw_event)
  VALUES ('xpay',p_event_id,p_session_id,p_order_id,p_event_type,
          p_payment_status,p_amount_minor,p_currency,true,p_raw_event)
  ON CONFLICT (provider,provider_event_id) DO NOTHING
  RETURNING id INTO v_event;
  IF v_event IS NULL THEN
    SELECT * INTO v_exists FROM public.factory_payment_events
      WHERE provider='xpay' AND provider_event_id=p_event_id;
    IF v_exists.order_id IS DISTINCT FROM p_order_id OR
       v_exists.provider_session_id IS DISTINCT FROM p_session_id OR
       v_exists.event_type IS DISTINCT FROM p_event_type OR
       v_exists.amount_minor IS DISTINCT FROM p_amount_minor OR
       v_exists.currency IS DISTINCT FROM p_currency OR
       v_exists.payment_status IS DISTINCT FROM p_payment_status THEN
      RETURN jsonb_build_object('error','provider_event_id_collision');
    END IF;
    RETURN jsonb_build_object('ok',true,'duplicate',true,'status',v_order.status);
  END IF;

  IF v_order.status='paid' AND v_order.payment_status='paid' THEN
    RETURN jsonb_build_object('ok',true,'already_paid',true,'no_change',true);
  END IF;

  IF v_failure THEN
    IF v_order.status='pending' AND coalesce(v_order.payment_status,'')<>'paid' THEN
      v_status := CASE WHEN p_event_type='checkout.session.expired' THEN 'cancelled' ELSE 'failed' END;
      UPDATE public.factory_orders SET status=v_status,
        payment_status=coalesce(p_payment_status,'unpaid'),provider_reference=p_session_id,updated_at=v_now
      WHERE id=p_order_id;
      RETURN jsonb_build_object('ok',true,'paid',false,'status',v_status);
    END IF;
    RETURN jsonb_build_object('ok',true,'no_change',true,'reason','non_pending_failure');
  END IF;

  -- A completed session may still be unpaid: no manual or inferred Paid.
  IF p_payment_status<>'paid' THEN
    IF v_order.status='pending' THEN
      UPDATE public.factory_orders SET provider_reference=p_session_id,
        payment_status=p_payment_status,updated_at=v_now WHERE id=p_order_id;
    END IF;
    RETURN jsonb_build_object('ok',true,'paid',false,'awaiting_payment',true);
  END IF;

  -- A late-paid event for expired/cancelled/failed order requires manual review.
  IF v_order.status<>'pending' OR v_order.payment_status='paid' THEN
    INSERT INTO public.factory_exceptions
      (order_id,source,category,severity,summary,details)
    VALUES (p_order_id,'xpay','late_paid_event_review','warning',
      'Signed paid event for non-pending order: independent reconciliation required',
      jsonb_build_object('event_id',p_event_id,'order_ref',p_order_ref,'session_id',p_session_id));
    RETURN jsonb_build_object('ok',true,'paid',false,'requires_review',true);
  END IF;

  UPDATE public.factory_orders SET status='paid',payment_status='paid',
    provider_reference=p_session_id,paid_at=v_now,updated_at=v_now,
    fulfillment_status='queued',
    metadata=coalesce(v_order.metadata,'{}'::jsonb) ||
      jsonb_build_object('g427_atomic_settlement',true,'xpay_event_id',p_event_id)
  WHERE id=p_order_id AND status='pending' AND payment_status IS DISTINCT FROM 'paid';
  IF NOT FOUND THEN RAISE EXCEPTION 'unexpected_paid_transition_race'; END IF;

  -- Actual production order-paid trigger writes bucket NULL. If absent or wrong,
  -- RAISE to roll back BOTH provider event and Paid; replay can safely retry.
  SELECT count(*) INTO v_revenue_count FROM public.factory_cash_ledger
    WHERE order_id=p_order_id AND entry_type='revenue' AND amount_minor=p_amount_minor AND currency=p_currency;
  IF v_revenue_count<>1 THEN RAISE EXCEPTION 'revenue_trigger_reconciliation_failed'; END IF;

  IF v_order.delivery_channel IN ('email','both') AND v_order.delivery_email IS NOT NULL
     AND v_order.delivery_consent_at IS NOT NULL THEN
    -- Token and delivery queue enter the SAME transaction as the Paid transition.
    v_token := encode(extensions.gen_random_bytes(32),'hex');
    v_token_hash := encode(extensions.digest(v_token::bytea,'sha256'),'hex');
    v_token_expires := v_now + interval '90 days';
    INSERT INTO public.factory_order_access_tokens(order_id,token_hash,expires_at,metadata)
      VALUES (p_order_id,v_token_hash,v_token_expires,jsonb_build_object('source','g427_atomic_payment'));
    INSERT INTO public.factory_deliveries
      (order_id,delivery_kind,channel,recipient,status,idempotency_key,payload,metadata)
    VALUES (p_order_id,'payment_confirmed','email',v_order.delivery_email,'queued',
      concat(p_order_id::text,':payment_confirmed:email'),
      jsonb_build_object('order_ref',p_order_ref),jsonb_build_object('source','g427_atomic_payment')),
      (p_order_id,'product_delivery','email',v_order.delivery_email,'queued',
      concat(p_order_id::text,':product_delivery:email'),
      jsonb_build_object('order_ref',p_order_ref,'access_token',v_token,'access_expires_at',v_token_expires),
      jsonb_build_object('source','g427_atomic_payment'))
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  IF v_order.delivery_channel IN ('whatsapp','both') AND v_order.delivery_whatsapp IS NOT NULL THEN
    INSERT INTO public.factory_deliveries
      (order_id,delivery_kind,channel,recipient,status,idempotency_key,payload,metadata)
    VALUES (p_order_id,'product_delivery','whatsapp',v_order.delivery_whatsapp,'awaiting_customer',
      concat(p_order_id::text,':product_delivery:whatsapp'),
      jsonb_build_object('order_ref',p_order_ref),jsonb_build_object('source','g427_atomic_payment'))
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  IF (v_order.delivery_channel NOT IN ('email','both','whatsapp') OR v_order.delivery_channel IS NULL OR
      (v_order.delivery_channel IN ('email','both') AND v_order.delivery_email IS NULL AND v_order.delivery_whatsapp IS NULL)) THEN
    UPDATE public.factory_orders SET fulfillment_status='needs_delivery_contact' WHERE id=p_order_id;
    INSERT INTO public.factory_exceptions(order_id,source,category,severity,summary,details)
      VALUES (p_order_id,'xpay','delivery_contact_missing','warning','Paid order needs delivery contact',jsonb_build_object('order_ref',p_order_ref));
  END IF;
  INSERT INTO public.factory_audit_log (order_id,event_type,entity_type,entity_id,data)
    VALUES (p_order_id,'payment.verified','payment_event',v_event::text,
      jsonb_build_object('provider','xpay','order_ref',p_order_ref,'amount_minor',p_amount_minor,'atomic',true));
  RETURN jsonb_build_object('ok',true,'paid',true,'settled',true,'order_ref',p_order_ref,'fulfillment','queued');
END;
$$;

REVOKE ALL ON FUNCTION public.kenz_g427_atomic_xpay_v1(text,text,text,uuid,text,text,integer,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kenz_g427_atomic_xpay_v1(text,text,text,uuid,text,text,integer,text,jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kenz_g427_atomic_xpay_v1(text,text,text,uuid,text,text,integer,text,jsonb) TO service_role;
