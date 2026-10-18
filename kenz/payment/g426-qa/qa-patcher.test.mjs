import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const generator = new URL('./build-candidate.mjs', import.meta.url).pathname;
const fixture = `// A separate business: byte-for-byte preservation is mandatory.
const externalBusinessUntouched = 'do not modify';
async function handleFactoryEvent(event: any, eventType: string, session: any) {
  const order = { id: 'safe-order', status: 'pending', payment_status: 'unpaid' };
  const supabase: any = null;
  const orderRef = 'DF-SYNTHETIC';
  const sessionId = 'cs_fixture';
  const providerEventId = 'evt_synthetic';
  const ins: any = {};
  const nextStatus = 'failed';
  const paymentStatus = 'unpaid';
  const amountMinor = 5900;
  const currency = 'EGP';
  if (ins.error) {
    if (ins.error.code === "23505") return json({ received: true, verified: true, duplicate: true });
    console.error("factory_event_insert_error", ins.error);
    return json({ error: "factory_database_error" }, 500);
  }
  if (eventType === 'unknown') return;
  if (eventType === 'failed') {
    await supabase.from('factory_orders').update({
      status: nextStatus,
    }).eq("id", order.id).eq("status", "pending");
    return json({ received: true, verified: true, factory: true, paid: false, status: nextStatus });
  }
  if (paymentStatus !== "paid") {
    await supabase.from('factory_orders').update({
      payment_status: paymentStatus,
    }).eq("id", order.id);
    return json({ received: true, verified: true, factory: true, paid: false, awaiting_payment: true });
  }
  const paidUpdate = await supabase.from("factory_orders").update({
    status: "paid",
    payment_status: "paid"
  }).eq("id", order.id);

  if (paidUpdate.error) {
    console.error("factory_order_paid_update_error", paidUpdate.error);
    return json({ error: "factory_order_update_failed" }, 500);
  }

  const ledger = await supabase.from("factory_cash_ledger")
    .select("id").eq("order_id", order.id).eq("entry_type", "revenue").limit(1);
  if (!ledger.error && (!ledger.data || ledger.data.length === 0)) {
    const li = await supabase.from("factory_cash_ledger").insert({
      entry_type: "revenue", bucket: "sales", order_id: order.id, amount_minor: amountMinor, currency
    });
    if (li.error) console.error("factory_ledger_insert_error", li.error);
  }

  await queuePaidDeliveries(supabase,{...order,id:order.id,order_ref:orderRef});
  return json({ ok: true });
}

Deno.serve(async () => { return new Response('unrelated business'); });
`;
function build(input) {
  const dir=mkdtempSync(join(tmpdir(),'kenz-g426-'));
  try {
    const a=join(dir,'live.ts'), b=join(dir,'candidate.ts');
    writeFileSync(a,input);
    const r=spawnSync('node',[generator,a,b],{encoding:'utf8'});
    return {status:r.status, stdout:r.stdout, stderr:r.stderr,candidate:r.status===0?readFileSync(b,'utf8'):null};
  } finally {rmSync(dir,{recursive:true,force:true});}
}
const positive=build(fixture);
test('patch generator succeeds on representative v23 factory block',()=>assert.equal(positive.status,0,positive.stderr));
test('non-KENZ code is identical before and after patch',()=>{assert.equal(positive.candidate.split('async function handleFactoryEvent(')[0],fixture.split('async function handleFactoryEvent(')[0]);assert.equal(positive.candidate.split('\nDeno.serve(')[1],fixture.split('\nDeno.serve(')[1]);});
test('existing paid order short circuits',()=>assert.match(positive.candidate,/already_paid: true/));
test('unpaid event requires pending and non-paid state',()=>assert.match(positive.candidate,/payment_status: paymentStatus,[\s\S]*?\.eq\("status", "pending"\)\.neq\("payment_status", "paid"\)/));
test('paid state transition must be filtered and return a selected winner',()=>assert.match(positive.candidate,/status: "paid",[\s\S]*?\.eq\("status", "pending"\)\.neq\("payment_status", "paid"\)\s*\.select\("id"\)\.maybeSingle\(\)/));
test('no invalid direct sales bucket ledger insertion',()=>assert.doesNotMatch(positive.candidate,/bucket: "sales"/));
test('late paid event creates human-review exception instead of auto approving',()=>assert.match(positive.candidate,/category: "late_paid_event_review"/));
test('guard refuses different original ledger fragment',()=>{const x=build(fixture.replace('bucket: "sales"','bucket: "reserve"'));assert.notEqual(x.status,0);assert.match(x.stderr,/Ledger block unexpectedly changed/)});
test('guard refuses unknown function name',()=>{const x=build(fixture.replace('async function handleFactoryEvent','async function handleFactoryEventV999'));assert.notEqual(x.status,0)});
test('guard refuses ambiguous duplicate source fragment',()=>{const extra='\n  if (ins.error) {\n    if (ins.error.code === "23505") return json({ received: true, verified: true, duplicate: true });\n    console.error("factory_event_insert_error", ins.error);\n    return json({ error: "factory_database_error" }, 500);\n  }';const x=build(fixture.replace('  if (eventType ===',extra+'\n  if (eventType ==='));assert.notEqual(x.status,0);assert.match(x.stderr,/Ambiguous block/)});
test('guard refuses missing Deno entrypoint boundary',()=>{const x=build(fixture.replace('Deno.serve(','NoDeno.serve('));assert.notEqual(x.status,0)});