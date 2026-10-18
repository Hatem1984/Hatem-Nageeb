/* READ-ONLY source snapshot: only KENZ factory handler from xpay-webhook v23, fetched 2026-10-18; zero provider credentials, zero payment records. */
async function handleFactoryEvent(event: any, eventType: string, session: any) {
  const meta = session?.metadata || {};
  if (String(meta.source || "") !== "digital_factory_v1") return null;

  const sessionId = String(session?.id || "");
  const orderId = String(meta.order_id || "");
  const orderRef = String(meta.order_ref || "");
  const amountMinor = Number(session?.amountTotal);
  const currency = String(session?.currency || "").toUpperCase();
  const paymentStatus = String(session?.paymentStatus || "").toLowerCase();
  if (!sessionId || !orderId || !orderRef || !Number.isFinite(amountMinor)) {
    return json({ error: "factory_session_metadata_incomplete" }, 409);
  }

  const supabase = adminClient();
  const orderQ = await supabase.from("factory_orders")
    .select("id,order_ref,status,total_minor,currency,provider_reference,payment_status,customer_id,delivery_channel,delivery_email,delivery_whatsapp,fulfillment_status")
    .eq("id", orderId)
    .eq("order_ref", orderRef)
    .maybeSingle();

  if (orderQ.error) {
    console.error("factory_order_lookup_error", orderQ.error);
    return json({ error: "factory_database_error" }, 500);
  }
  const order: any = orderQ.data;
  if (!order) return json({ error: "factory_order_not_found" }, 409);

  if (
    String(order.currency || "").toUpperCase() !== currency ||
    Number(order.total_minor) !== amountMinor ||
    (order.provider_reference && String(order.provider_reference) !== sessionId)
  ) {
    return json({ error: "factory_order_session_mismatch" }, 409);
  }

  const providerEventId = String(event?.id || (eventType + ":" + sessionId));
  const ins = await supabase.from("factory_payment_events").insert({
    provider: "xpay",
    provider_event_id: providerEventId,
    provider_session_id: sessionId,
    order_id: order.id,
    event_type: eventType,
    payment_status: paymentStatus || null,
    amount_minor: amountMinor,
    currency,
    verified: true,
    raw_event: event,
  });
  if (ins.error) {
    if (ins.error.code === "23505") return json({ received: true, verified: true, duplicate: true });
    console.error("factory_event_insert_error", ins.error);
    return json({ error: "factory_database_error" }, 500);
  }

  if (
    eventType === "checkout.session.expired" ||
    eventType === "checkout.session.async_payment_failed"
  ) {
    const nextStatus = eventType === "checkout.session.expired" ? "cancelled" : "failed";
    await supabase.from("factory_orders").update({
      status: nextStatus,
      payment_status: paymentStatus || "unpaid",
      provider_reference: sessionId,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id).eq("status", "pending");
    return json({ received: true, verified: true, factory: true, paid: false, status: nextStatus });
  }

  const successEvent =
    eventType === "checkout.session.completed" ||
    eventType === "checkout.session.async_payment_succeeded";
  if (!successEvent) return json({ received: true, verified: true, factory: true, ignored: true });

  if (paymentStatus !== "paid") {
    await supabase.from("factory_orders").update({
      provider_reference: sessionId,
      payment_status: paymentStatus || "unpaid",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    return json({ received: true, verified: true, factory: true, paid: false, awaiting_payment: true });
  }

  const customer = session.customer || session.customerDetails || {};
  const customerEmail = normalizeEmail(customer.email) || null;
  const customerPhone = normalizePhone(customer.phone || customer.phoneNumber) || null;
  const customerName = String(customer.name || "").trim().slice(0, 180) || null;
  let customerId = order.customer_id || null;

  if (!customerId && (customerEmail || customerPhone)) {
    let found: any = null;
    if (customerEmail) {
      found = await supabase.from("factory_customers").select("id")
        .ilike("email", customerEmail).maybeSingle();
    }
    if ((!found || !found.data) && customerPhone) {
      found = await supabase.from("factory_customers").select("id")
        .eq("phone", customerPhone).maybeSingle();
    }
    if (found?.data?.id) customerId = found.data.id;
    else {
      const created = await supabase.from("factory_customers").insert({
        email: customerEmail,
        phone: customerPhone,
        full_name: customerName,
        metadata: { xpay_customer_id: customer.id || null },
      }).select("id").single();
      if (!created.error && created.data?.id) customerId = created.data.id;
      else if (created.error?.code !== "23505") console.error("factory_customer_insert_error", created.error);
    }
  }

  if (customerId) {
    await supabase.from("factory_customers").update({
      email: customerEmail,
      phone: customerPhone,
      full_name: customerName,
      updated_at: new Date().toISOString(),
    }).eq("id", customerId);
  }

  const paidAt = new Date().toISOString();
  const paidUpdate = await supabase.from("factory_orders").update({
    customer_id: customerId,
    status: "paid",
    payment_status: "paid",
    provider_reference: sessionId,
    paid_at: paidAt,
    updated_at: paidAt,
    metadata: {
      product_slug: meta.product_slug || null,
      payment_intent_id: session.paymentIntentId || session.paymentIntent?.id || null,
      fulfillment_status: "pending_delivery",
    },
  }).eq("id", order.id);

  if (paidUpdate.error) {
    console.error("factory_order_paid_update_error", paidUpdate.error);
    return json({ error: "factory_order_update_failed" }, 500);
  }

  const ledger = await supabase.from("factory_cash_ledger")
    .select("id").eq("order_id", order.id).eq("entry_type", "revenue").limit(1);
  if (!ledger.error && (!ledger.data || ledger.data.length === 0)) {
    const li = await supabase.from("factory_cash_ledger").insert({
      entry_type: "revenue",
      bucket: "sales",
      order_id: order.id,
      amount_minor: amountMinor,
      currency,
      note: "Verified XPay payment",
      metadata: { provider: "xpay", session_id: sessionId, event_id: providerEventId },
    });
    if (li.error) console.error("factory_ledger_insert_error", li.error);
  }

  await queuePaidDeliveries(supabase,{...order,id:order.id,order_ref:orderRef});

  return json({
    received: true,
    verified: true,
    factory: true,
    paid: true,
    order_ref: orderRef,
    fulfillment: "queued",
  });
}

Deno.serve(async () => new Response('QA marker only; never deploy'));
