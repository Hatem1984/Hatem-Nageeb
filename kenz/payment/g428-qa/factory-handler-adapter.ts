// KENZ G4.28 QA-only: replace ONLY handleFactoryEvent in the SHARED signed XPay webhook.
// This function is called only after Deno.serve verifies the XPay signature and live mode.
// Requires kenz_g427_atomic_xpay_v1 to be deployed and service-role-only before any cutover.
async function handleFactoryEvent(event: any, eventType: string, session: any) {
  const meta = session?.metadata || {};
  if (String(meta.source || '') !== 'digital_factory_v1') return null;

  const permitted = [
    'checkout.session.completed', 'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed', 'checkout.session.expired',
  ];
  if (!permitted.includes(eventType)) {
    return json({ received: true, verified: true, factory: true, ignored: true });
  }

  const eventId = String(event?.id || '').trim();
  const orderId = String(meta.order_id || '').trim();
  const orderRef = String(meta.order_ref || '').trim();
  const sessionId = String(session?.id || '').trim();
  const amountMinor = Number(session?.amountTotal);
  const currency = String(session?.currency || '').toUpperCase();
  const paymentStatus = String(session?.paymentStatus || '').toLowerCase();
  if (!eventId || !orderId || !orderRef || !sessionId ||
      !Number.isSafeInteger(amountMinor) || amountMinor <= 0 ||
      currency !== 'EGP' || !paymentStatus) {
    return json({ error: 'factory_payment_fields_invalid' }, 409);
  }

  // One RPC (one DB transaction) owns the event ID, Paid, revenue trigger, token,
  // audit and idempotent deliveries. Never pre-insert event separately.
  const s = adminClient();
  let value: any, error: any;
  try {
    const response = await s.rpc('kenz_g427_atomic_xpay_v1', {
      p_event_id: eventId, p_event_type: eventType,
      p_payment_status: paymentStatus, p_order_id: orderId,
      p_order_ref: orderRef, p_session_id: sessionId,
      p_amount_minor: amountMinor, p_currency: currency, p_raw_event: event,
    });
    value = response.data;
    error = response.error;
  } catch (_e) {
    console.error('factory_atomic_xpay_rpc_exception');
    return json({ error: 'factory_atomic_payment_temporarily_unavailable' }, 503);
  }
  if (error || !value || typeof value !== 'object') {
    console.error('factory_atomic_xpay_rpc_failed', error?.code || 'empty_result');
    // Non-2xx means XPay can retry; DO NOT ACK a partially committed payment.
    return json({ error: 'factory_atomic_payment_temporarily_unavailable' }, 503);
  }
  if (value.error) {
    const publicReason = String(value.error);
    const expected = [
      'invalid_event_metadata', 'invalid_amount_currency_or_status',
      'order_not_found', 'order_session_amount_mismatch', 'provider_event_id_collision',
    ];
    console.error('factory_atomic_xpay_rejected', publicReason);
    return json({ error: expected.includes(publicReason) ? publicReason : 'factory_atomic_payment_rejected' }, 409);
  }
  if (!value.ok && !value.ignored) {
    return json({ error: 'factory_atomic_payment_incomplete' }, 503);
  }

  // Preserve only the existing verified routing boundary. The independent
  // Business Game purchase path in Deno.serve remains byte-for-byte unchanged.
  return json({
    received: true, verified: true, factory: true,
    paid: value.paid === true || value.already_paid === true,
    order_ref: value.order_ref || orderRef,
    duplicate: value.duplicate === true,
    already_paid: value.already_paid === true,
    requires_review: value.requires_review === true,
    awaiting_payment: value.awaiting_payment === true,
    ignored: value.ignored === true,
    settled: value.settled === true,
    fulfillment: value.fulfillment || null,
  });
}
