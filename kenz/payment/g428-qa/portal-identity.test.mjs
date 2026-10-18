import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {TextEncoder} from 'node:util';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildPortalPhoneCandidate,ORIGINAL} from './phone-qa.mjs';

const raw=readFileSync(new URL('./customer-portal-contract-v16.fixture.ts',import.meta.url),'utf8');
const patched=buildPortalPhoneCandidate(raw);
function evaluate(src) {
  // This fixture consists ONLY of specific, pinned real production TypeScript functions.
  // Strip known TS type annotations; no dynamic dependency imports or external requests.
  const js=src.replaceAll('v:any','v').replace('bytes:Uint8Array','bytes')
    .replace('v:string','v').replace('s:any,rawToken:string','s,rawToken')
    .replace('s:any,ref:string,email:string,phone:string','s,ref,email,phone')
    .replace('const o:any','const o');
  return vm.runInNewContext(js+'\n({normPhone,verifyAccess,verifyOrder})',
    {crypto:webcrypto,TextEncoder,Date,Uint8Array,console});
}
const current=evaluate(raw), updated=evaluate(patched);
const rawToken='FAKE-ONE-TIME-ACCESS-TOKEN-TEST-ONLY';
const hash=createHash('sha256').update(rawToken).digest('hex');
const expiry=new Date(Date.now()+3600_000).toISOString();
const normalizedPhone='201012345678';
const testEmail='reader@example.invalid';
const paid={id:'SYN-ORDER-ONE',order_ref:'SYN-ORDER-20261018',customer_id:null,
  status:'paid',payment_status:'paid',payment_method:'xpay',total_minor:5900,currency:'EGP',
  delivery_email:testEmail,contact_phone:normalizedPhone};
function fakeDb({orders=[paid],tokens=[{id:'SYN-TOKEN',order_id:paid.id,token_hash:hash,expires_at:expiry,revoked_at:null}],customers=[],manual=[]}={}){
  const data={factory_orders:orders,factory_order_access_tokens:tokens,factory_customers:customers,factory_manual_payments:manual};
  const updates=[];
  const s={from(name){
    if(!(name in data))throw Error('Unexpected table '+name);
    let pairs=[],upd=null;
    const obj={
      select(){return obj},
      update(value){upd=value;return obj},
      eq(key,value){pairs.push([key,value]);if(upd){for(const row of data[name].filter(r=>pairs.every(([k,v])=>r[k]===v)))Object.assign(row,upd);updates.push({table:name});}return obj},
      async maybeSingle(){return {data:data[name].find(r=>pairs.every(([k,v])=>r[k]===v))??null,error:null}}
    }; return obj;
  }};
  return {s,updates};
}

test('current v16 portal phone matcher does NOT normalize Egyptian 010 to 2010 (bug reproduced)',()=>{
  assert.notEqual(current.normPhone('01012345678'),current.normPhone('+201012345678'));
});
test('candidate normalizes common Egyptian domestic/international prefixes',()=>{
  for(const p of ['01012345678','+201012345678','00201012345678','201012345678','010 123 456 78'])
    assert.equal(updated.normPhone(p),normalizedPhone);
});
test('candidate normalizes 011, 012, 015 network prefixes',()=>{
  for(const p of ['01112345678','01212345678','01512345678'])
    assert.equal(updated.normPhone(p),'20'+p.slice(1));
});
test('candidate keeps wrong Egyptian phone distinguishable',()=>{
  assert.notEqual(updated.normPhone('01012345679'),normalizedPhone);
  assert.notEqual(updated.normPhone('0101234567'),normalizedPhone);
});
test('valid order access token retrieves PAID order without customer_id',async()=>{
  const {s}=fakeDb();const x=await updated.verifyAccess(s,rawToken);
  assert.equal(x.order.order_ref,paid.order_ref);assert.equal(x.order.customer_id,null);
});
test('revoked token is refused',async()=>{
  const {s}=fakeDb({tokens:[{id:'SYN-TOKEN',order_id:paid.id,token_hash:hash,expires_at:expiry,revoked_at:new Date().toISOString()}]});
  assert.equal((await updated.verifyAccess(s,rawToken)).error,'access_token_expired');
});
test('expired token is refused',async()=>{
  const {s}=fakeDb({tokens:[{id:'SYN-TOKEN',order_id:paid.id,token_hash:hash,expires_at:new Date(Date.now()-1000).toISOString(),revoked_at:null}]});
  assert.equal((await updated.verifyAccess(s,rawToken)).error,'access_token_expired');
});
test('wrong access token is refused',async()=>{
  assert.equal((await updated.verifyAccess(fakeDb().s,'WRONG')).error,'access_token_invalid');
});
test('domestic phone now retrieves order WITHOUT customer_id',async()=>{
  const x=await updated.verifyOrder(fakeDb().s,paid.order_ref,'',updated.normPhone('01012345678'));
  assert.equal(x.order?.id,paid.id);
});
test('same synthetic order is retrievable by matching email',async()=>{
  const x=await updated.verifyOrder(fakeDb().s,paid.order_ref,testEmail,'');
  assert.equal(x.order?.id,paid.id);
});
test('other phone cannot retrieve order',async()=>{
  const x=await updated.verifyOrder(fakeDb().s,paid.order_ref,'',updated.normPhone('01012345679'));
  assert.equal(x.error,'order_contact_mismatch');
});
test('unknown reference cannot disclose order',async()=>{
  assert.equal((await updated.verifyOrder(fakeDb().s,'NOT-A-REAL-ORDER',testEmail,'')).error,'order_not_found');
});
test('customer record mismatch still allows exact contact saved on the order',async()=>{
  const o={...paid,customer_id:'SYN-CUSTOMER-1'};
  const {s}=fakeDb({orders:[o],customers:[{id:o.customer_id,email:'another@example.invalid',phone:'201111111111'}]});
  const x=await updated.verifyOrder(s,o.order_ref,testEmail,'');
  assert.equal(x.order.id,o.id);
});
test('matching synthetic linked customer contact may resolve order',async()=>{
  const o={...paid,customer_id:'SYN-CUSTOMER-1',delivery_email:null,contact_phone:null};
  const {s}=fakeDb({orders:[o],customers:[{id:o.customer_id,email:testEmail,phone:normalizedPhone}]});
  assert.equal((await updated.verifyOrder(s,o.order_ref,testEmail,'')).order.id,o.id);
});
test('no order/customer contact returns mismatch',async()=>{
  const {s}=fakeDb({orders:[{...paid,delivery_email:null,contact_phone:null}]});
  assert.equal((await updated.verifyOrder(s,paid.order_ref,'',normalizedPhone)).error,'order_contact_mismatch');
});
test('payer phone fallback works on manual order, without adding customer_id',async()=>{
  const o={...paid,delivery_email:null,contact_phone:null};
  const {s}=fakeDb({orders:[o],manual:[{order_id:o.id,payer_phone:normalizedPhone}]});
  assert.equal((await updated.verifyOrder(s,o.order_ref,'',normalizedPhone)).order.id,o.id);
});
test('source drift causes patch builder to refuse',()=>{
  assert.throws(()=>buildPortalPhoneCandidate(raw.replace(ORIGINAL,'function normPhone(v:any){return "DRIFT"}')),/Source changed/);
});
test('proposed patch changes only normPhone, not access checks',()=>{
  const start='async function verifyAccess(';
  assert.equal(patched.slice(patched.indexOf(start)),raw.slice(raw.indexOf(start)));
});
