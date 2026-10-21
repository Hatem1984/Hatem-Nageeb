import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const sourcePath=process.argv[2];
if (!sourcePath) { console.error('Usage: node build-candidate.mjs original-xpay-webhook-index.ts [output-file]'); process.exit(2); }
const source=fs.readFileSync(sourcePath,'utf8');
const start=source.indexOf('async function handleFactoryEvent(');
const end=source.indexOf('\nDeno.serve(',start);
assert(start>=0 && end>start,'Expected live shared XPay webhook structure missing; refuse to patch');
let isolated=source.slice(start,end);
function replaceOne(oldText,newText,label){
  const a=isolated.indexOf(oldText);
  assert(a>=0,'Missing expected block: '+label);
  assert(isolated.indexOf(oldText,a+1)<0,'Ambiguous block: '+label);
  isolated=isolated.replace(oldText,newText);
}
replaceOne(
'  if (ins.error) {\n    if (ins.error.code === "23505") return json({ received: true, verified: true, duplicate: true });\n    console.error("factory_event_insert_error", ins.error);\n    return json({ error: "factory_database_error" }, 500);\n  }',
'  if (ins.error) {\n    if (ins.error.code === "23505") return json({ received: true, verified: true, duplicate: true });\n    console.error("factory_event_insert_error", ins.error);\n    return json({ error: "factory_database_error" }, 500);\n  }\n\n  // A valid but late signed event must never demote an already paid order.\n  if (order.status === "paid" && order.payment_status === "paid") {\n    return json({ received: true, verified: true, factory: true, paid: true, already_paid: true });\n  }',
'already-paid short-circuit');
replaceOne('    }).eq("id", order.id).eq("status", "pending");\n    return json({ received: true, verified: true, factory: true, paid: false, status: nextStatus });',
'    }).eq("id", order.id).eq("status", "pending").neq("payment_status", "paid");\n    return json({ received: true, verified: true, factory: true, paid: false, status: nextStatus });',
'failure guard');
replaceOne('    }).eq("id", order.id);\n    return json({ received: true, verified: true, factory: true, paid: false, awaiting_payment: true });',
'    }).eq("id", order.id).eq("status", "pending").neq("payment_status", "paid");\n    return json({ received: true, verified: true, factory: true, paid: false, awaiting_payment: true });',
'unpaid success guard');
replaceOne('  }).eq("id", order.id);\n\n  if (paidUpdate.error) {',
'  }).eq("id", order.id).eq("status", "pending").neq("payment_status", "paid")\n    .select("id").maybeSingle();\n\n  if (paidUpdate.error) {',
'atomic paid ownership');
replaceOne('  if (paidUpdate.error) {\n    console.error("factory_order_paid_update_error", paidUpdate.error);\n    return json({ error: "factory_order_update_failed" }, 500);\n  }',
'  if (paidUpdate.error) {\n    console.error("factory_order_paid_update_error", paidUpdate.error);\n    return json({ error: "factory_order_update_failed" }, 500);\n  }\n  if (!paidUpdate.data?.id) {\n    const current = await supabase.from("factory_orders")\n      .select("status,payment_status").eq("id", order.id).maybeSingle();\n    if (current.error) return json({ error: "factory_order_recheck_failed" }, 500);\n    if (current.data?.status === "paid" && current.data?.payment_status === "paid") {\n      return json({ received: true, verified: true, factory: true, paid: true, already_paid: true });\n    }\n    const exception = await supabase.from("factory_exceptions").insert({\n      order_id: order.id, source: "xpay", category: "late_paid_event_review", severity: "warning",\n      summary: "Verified paid event could not update a non-pending order",\n      details: { order_ref: orderRef, event_id: providerEventId, session_id: sessionId },\n    });\n    if (exception.error) {\n      console.error("factory_late_paid_exception_failed", exception.error);\n      return json({ error: "factory_review_queue_failed" }, 500);\n    }\n    return json({ received: true, verified: true, factory: true, paid: false, requires_review: true });\n  }',
'late paid review');
const ledgerStart='  const ledger = await supabase.from("factory_cash_ledger")';
const ledgerEnd='  await queuePaidDeliveries(supabase,{...order,id:order.id,order_ref:orderRef});';
const begin=isolated.indexOf(ledgerStart), stop=isolated.indexOf(ledgerEnd,begin);
assert(begin>=0&&stop>begin,'Could not identify duplicate ledger INSERT');
const ledgerBlock=isolated.slice(begin,stop);
assert(ledgerBlock.includes('bucket: "sales"') && ledgerBlock.includes('entry_type: "revenue"'), 'Ledger block unexpectedly changed');
isolated=isolated.slice(0,begin)+'  // Database trigger trg_factory_ensure_xpay_revenue_ledger writes the single\n  // compatible revenue entry (bucket NULL) as part of the Paid transition.\n  // Never add a second independent ledger INSERT from this handler.\n\n'+isolated.slice(stop);
const candidate=source.slice(0,start)+isolated+source.slice(end);
assert(candidate.startsWith(source.slice(0,start)),'Non-factory preamble was modified');
assert(candidate.endsWith(source.slice(end)),'Non-factory route was modified');
assert(!isolated.includes('bucket: "sales"'),'Incompatible ledger bucket remains');
assert(isolated.includes('.eq("status", "pending").neq("payment_status", "paid")'),'Paid guard missing');
const outputPath=process.argv[3] || path.join(path.dirname(sourcePath),'candidate-xpay-webhook.ts');
fs.writeFileSync(outputPath,candidate);
console.log(JSON.stringify({result:'QA_PATCH_CREATED',source_bytes:source.length,candidate_bytes:candidate.length,isolated_factory_only:true,lo3bet_code_untouched:true,path:outputPath}));