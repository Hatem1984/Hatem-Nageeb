/* G4.19 QA source patcher; input is snapshots read from Supabase and pinned locally.
   NEVER deploy the output: this is a REVIEW CANDIDATE only. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const here=path.dirname(new URL(import.meta.url).pathname);
const guard=fs.readFileSync(path.join(here,'central-email-guard.mjs'),'utf8');
const inline=guard.split('/** Demonstration of fail-closed call order')[0]
  .replace(/^export \{ KEYS \};\s*$/gm,'').replace(/^export /gm,'');
const loader=`\n// G4.19 CENTRAL RESEND EMERGENCY GATE — QA CANDIDATE, UNDEPLOYED.\n${inline}\nasync function kenzG419Ready(s,kind){\n  // Service role read-only query; no token, no schedule changes, NO send.\n  let r;\n  try { r=await s.from('factory_runtime_config').select('config_key,enabled,config_value,metadata').in('config_key',Object.values(KEYS)); }\n  catch { return false; }\n  return !r.error && centralDecision(r.data,kind).allowed;\n}\n`;
const rules={
 receipt:{
  file:'receipt-worker-v2.source.ts', expectedService:'kenz-customer-receipt-resend-worker',
  anchors:[
   ['const g=await gates(s);if(!g.active)return {ok:true,processed:0,enabled:false};',
    'const g=await gates(s);if(!g.active || !(await kenzG419Ready(s,"receipt")))return {ok:true,processed:0,enabled:false};'],
   ['if(!(await gates(s)).active)throw Error("dispatch_gate_revoked_before_provider");',
    'if(!(await gates(s)).active || !(await kenzG419Ready(s,"receipt")))throw Error("dispatch_gate_revoked_before_provider");'],
   ['sending_enabled:g.active,route_enabled:g.route,dispatcher_enabled:g.dispatch,',
    'sending_enabled:g.active&&(await kenzG419Ready(s,"receipt")),route_enabled:g.route,dispatcher_enabled:g.dispatch,'],
  ]
 },
 product:{
  file:'product-worker-v4.synthetic.ts', expectedService:'kenz-customer-product-resend-worker',
  anchors:[
   ['const g=await gates(s);if(!g.active)return {ok:true,processed:0,enabled:false};',
    'const g=await gates(s);if(!g.active || !(await kenzG419Ready(s,"product")))return {ok:true,processed:0,enabled:false};'],
   ['if(!(await gates(s)).active)throw Error("dispatch_revoked_before_provider");',
    'if(!(await gates(s)).active || !(await kenzG419Ready(s,"product")))throw Error("dispatch_revoked_before_provider");'],
   ['customer_sends_enabled:g.active,sender_policy_valid:policy,',
    'customer_sends_enabled:g.active&&(await kenzG419Ready(s,"product")),sender_policy_valid:policy,'],
  ]
 }
};
function once(text,old,replace){
 if(text.split(old).length!==2) throw Error('refuse_source_drift:'+old.slice(0,70));
 return text.replace(old,replace);
}
export function buildCandidate(kind,source){
 const rule=rules[kind];if(!rule)throw Error('invalid_worker_kind');
 if(source.includes('kenzG419Ready') || !source.includes(rule.expectedService) || !source.includes('https://api.resend.com/emails'))throw Error('unexpected_worker_source');
 // Ensure the original code is the previously-reviewed, isolated QA fixture.
 if(!source.includes('Deno.serve') || !source.includes('Idempotency-Key'))throw Error('worker_baseline_missing');
 let out=source;
 for(const [a,b] of rule.anchors) out=once(out,a,b);
 const marker='async function gates(';
 if(out.split(marker).length!==2)throw Error('gate_anchor_changed');
 out=out.replace(marker,loader+'\n'+marker);
 if((out.match(/kenzG419Ready\(s,/g)||[]).length!==4)throw Error('guard_call_count_incorrect');
 return out;
}
if(import.meta.url === new URL(`file://${process.argv[1]}`).href){
 for(const [kind,rule] of Object.entries(rules)){
  const file=path.join(here,'fixtures',rule.file);
  const source=fs.readFileSync(file,'utf8');
  const built=buildCandidate(kind,source);
  fs.mkdirSync(path.join(here,'candidate'),{recursive:true});
  const target=path.join(here,'candidate',`${kind}-g419-central-gated.NOT-DEPLOYABLE.ts`);
  fs.writeFileSync(target,built);
  console.log(`${kind}: QA_PATCHED_ONLY | original=${crypto.createHash('sha256').update(source).digest('hex').slice(0,16)} | output=${crypto.createHash('sha256').update(built).digest('hex').slice(0,16)} | ${built.length} bytes`);
 }
}
