/* KENZ G4.19 security-review candidate. NO credentials, no I/O, no deployment.
   This module is deliberately pure: a missing, stale, inconsistent or ambiguous
   lease ALWAYS prevents email delivery. Real dispatchers would need to call it
   before claim AND immediately before provider submit, in addition to their
   existing authenticated/consent/payment/source/idempotency guards. */
const KEYS = Object.freeze({
  gate:'kenz_g419_permanent_dispatch_gate_v1',
  heartbeat:'kenz_g419_monitor_heartbeat_v1',
  stop:'kenz_g419_emergency_stop_v1',
});
export { KEYS };
export const MAX_LEASE_MS=120_000;
export const MAX_HEARTBEAT_AGE_MS=75_000;
export const ALLOWED_CLOCK_SKEW_MS=5_000;
export function normalizeRows(rows) {
  if (!Array.isArray(rows) || rows.length!==3) return null;
  const map=Object.create(null);
  for(const row of rows){
    if(!row || !Object.values(KEYS).includes(row.config_key) || map[row.config_key]) return null;
    map[row.config_key]=row;
  }
  return Object.values(KEYS).every(key=>map[key]) ? map : null;
}
const time = value => typeof value==='string' && value.length>0 ? Date.parse(value) : NaN;
const deny = reason => Object.freeze({allowed:false,reason});
/** Check authorization for the exact, fresh, independently monitored dispatch lease. */
export function centralDecision(rows,kind,nowMs=Date.now()) {
  if (!['receipt','product'].includes(kind)) return deny('invalid_kind');
  if(!Number.isSafeInteger(nowMs)) return deny('invalid_clock');
  const map=normalizeRows(rows);
  if(!map) return deny('config_missing_duplicate_or_unknown');
  const gate=map[KEYS.gate], hb=map[KEYS.heartbeat], stop=map[KEYS.stop];
  // A missing or explicitly enabled stop is NOT permitted. An ambiguous stop is also denied.
  if (stop.enabled!==false || stop.config_value!=='G419_STOP_CLEAR' || stop.metadata?.generation!==gate.metadata?.generation) return deny('emergency_stop_or_invalid');
  if (gate.enabled!==true || gate.config_value!=='G419_DURABLE_DISPATCH_APPROVED') return deny('central_gate_closed');
  const gm=gate.metadata||{}, hm=hb.metadata||{};
  if (gm.scope!=='new_consented_email_only' || gm.owner_authorized!==true || gm.no_historical_backfill!==true || gm.no_auto_retry!==true || gm.sender!=='orders@kenzelyom.com') return deny('policy_not_approved');
  if (typeof gm.generation!=='string' || !/^[a-f0-9-]{12,64}$/i.test(gm.generation)) return deny('invalid_generation');
  if (hb.enabled!==true || hb.config_value!=='G419_MONITOR_HEALTHY' || hm.generation!==gm.generation || hm.observer!=='independent_cron_monitor_v1') return deny('monitor_not_healthy');
  if (hm.cron_receipts_ok!==true || hm.cron_products_ok!==true || hm.queue_lag_ok!==true || hm.dispatch_auth_ok!==true || hm.provider_config_ok!==true) return deny('monitor_health_checks_failed');
  const cutover=time(gm.activated_at_utc), expires=time(gm.lease_expires_at_utc), observed=time(hm.checked_at_utc);
  if (![cutover,expires,observed].every(Number.isFinite)) return deny('invalid_timestamps');
  if(cutover>nowMs || nowMs-cutover<0) return deny('activation_in_future');
  if (expires<=nowMs || expires>nowMs+MAX_LEASE_MS) return deny('lease_expired_or_too_long');
  if (observed>nowMs+ALLOWED_CLOCK_SKEW_MS || nowMs-observed>MAX_HEARTBEAT_AGE_MS || observed<cutover) return deny('monitor_stale_or_skewed');
  return Object.freeze({allowed:true,reason:'central_authorized',cutoverMs:cutover,generation:gm.generation});
}
/** Extra new-order constraints in addition to current worker's own stricter rules. */
export function deliveryDecision(d,order,kind,lease,nowMs=Date.now()) {
  if(!lease?.allowed || !['receipt','product'].includes(kind)) return deny('central_or_kind_denied');
  if(!d || !order || d.delivery_transport!=='resend' || d.status!=='queued' || d.channel!=='email' || d.attempt_count!==0) return deny('queue_state_or_transport');
  if(typeof d.recipient!=='string' || !d.recipient.includes('@') || d.recipient.trim().toLowerCase()!==String(order.delivery_email||'').trim().toLowerCase()) return deny('contact_mismatch');
  if(!order.delivery_consent_at || !['email','both'].includes(order.delivery_channel)) return deny('no_delivery_consent');
  const created=time(order.created_at),consent=time(order.delivery_consent_at);
  if(!Number.isFinite(created)||created<lease.cutoverMs || created>nowMs || !Number.isFinite(consent)||consent>nowMs) return deny('historical_or_bad_order_timestamp');
  if(kind==='product') {
    if(d.delivery_kind!=='product_delivery' || order.status!=='paid' || order.payment_status!=='paid' || !(Number(order.total_minor)>0)) return deny('payment_not_independently_verified');
    const paid=time(order.paid_at);
    if(!Number.isFinite(paid)||paid<lease.cutoverMs||paid>nowMs||nowMs-paid>86_400_000) return deny('historical_or_bad_paid_timestamp');
  } else if (!['order_received','proof_received'].includes(d.delivery_kind)) return deny('receipt_kind_invalid');
  return Object.freeze({allowed:true,reason:'eligible_new_delivery'});
}
/** Demonstration of fail-closed call order, never calls a real provider. */
export async function simulatedDispatch({readLease, readOrder, delivery, kind, fakeProvider, now=()=>Date.now()}) {
  const before=centralDecision(await readLease(),kind,now());
  if(!before.allowed) return {sent:false,stage:'before_claim',reason:before.reason};
  const order=await readOrder();
  const eligible=deliveryDecision(delivery,order,kind,before,now());
  if(!eligible.allowed) return {sent:false,stage:'eligibility',reason:eligible.reason};
  // Must re-fetch lease from DB; cached earlier heartbeat is not sufficient.
  const fresh=centralDecision(await readLease(),kind,now());
  if(!fresh.allowed || fresh.generation!==before.generation) return {sent:false,stage:'before_provider',reason:fresh.reason};
  await fakeProvider({recipient:delivery.recipient,kind});
  return {sent:true};
}
