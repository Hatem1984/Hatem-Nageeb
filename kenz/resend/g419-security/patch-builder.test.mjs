import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildCandidate } from './build-worker-candidates.mjs';
const root=path.dirname(new URL(import.meta.url).pathname);
for (const [kind,name,throwBefore,sendAnchor] of [
 ['receipt','receipt-worker-v2.source.ts','dispatch_gate_revoked_before_provider','resend_http_'],
 ['product','product-worker-v4.synthetic.ts','dispatch_revoked_before_provider','resend_http_']
]){
 const filename=path.join(root,'fixtures',name);
 test(`${kind}: candidate uses its labeled QA fixture and inserts three checks`,()=>{
  const input=fs.readFileSync(filename,'utf8');
  const patched=buildCandidate(kind,input);
  assert.equal((patched.match(/kenzG419Ready\(s,/g)||[]).length,4); // includes declaration
  assert.equal((patched.match(/await kenzG419Ready\(s,/g)||[]).length,3);
  assert.equal((patched.match(/https:\/\/api\.resend\.com\/emails/g)||[]).length,1);
  assert.match(patched,/centralDecision\(r.data,kind\)/);
  assert.ok(patched.indexOf('kenzG419Ready(s,')<patched.indexOf('https://api.resend.com/emails'));
  assert.ok(patched.includes(throwBefore));
  // Remove only expected injected blocks; the entire remaining worker must be unchanged.
  let unpatched=patched.replace(/\n\/\/ G4\.19 CENTRAL RESEND EMERGENCY GATE[\s\S]*?\nasync function gates\(/,'async function gates(');
  unpatched=unpatched.replaceAll(`g.active&&(await kenzG419Ready(s,"${kind}"))`,'g.active');
  unpatched=unpatched.replace(`!g.active || !(await kenzG419Ready(s,"${kind}"))`,'!g.active');
  unpatched=unpatched.replace(`||(await kenzG419Ready(s,"${kind}"))`,'');
  unpatched=unpatched.replace(` || !(await kenzG419Ready(s,"${kind}"))`,'');
  assert.equal(unpatched,input);
 });
 test(`${kind}: missing / altered provider-precheck refuses to patch`,()=>{
  const input=fs.readFileSync(filename,'utf8');
  assert.throws(()=>buildCandidate(kind,input.replace(throwBefore,throwBefore+'_CHANGED')),/refuse_source_drift/);
 });
 test(`${kind}: duplicate sender precheck refuses to patch`,()=>{
  const input=fs.readFileSync(filename,'utf8');
  const needle=`if(!(await gates(s)).active)throw Error("${throwBefore}");`;
  assert.throws(()=>buildCandidate(kind,input.replace(needle,needle+'\n'+needle)),/refuse_source_drift/);
 });
}
