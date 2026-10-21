import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import vm from 'node:vm';

const source=readFileSync(new URL('./factory-handler-adapter.ts',import.meta.url),'utf8')
 .replace('event: any, eventType: string, session: any','event, eventType, session')
 .replace('let value: any, error: any;','let value, error;');
function createMock(out={ok:true,paid:true,settled:true,order_ref:'DF-TEST'}){
 const calls=[];
 const db={rpc:async(name,params)=>{calls.push({name,params});return typeof out==='function'?out(name,params):{data:out,error:null}}};
 const sandbox={adminClient:()=>db,json:(value,status=200)=>({...value,http_status:status}),console:{error(){}}};
 const handler=vm.runInNewContext(source+'\nhandleFactoryEvent',sandbox,{timeout:1000});
 const send=(custom={})=>{
  const metadata={source:'digital_factory_v1',order_id:'11111111-1111-1111-1111-111111111111',order_ref:'DF-SYNTHETIC',...(custom.metadata||{})};
  const session={id:'cs_live_synthetic',metadata,amountTotal:5900,currency:'EGP',paymentStatus:'paid',...(custom.session||{})};
  const event={id:'evt_synthetic',type:'checkout.session.completed',data:{object:session},...(custom.event||{})};
  return handler(event,custom.type??event.type,session);
 };
 return {calls,send};
}
test('only verified routing metadata enters KENZ handler',async()=>{const h=createMock(); assert.equal(await h.send({metadata:{source:'other_business'}}),null); assert.equal(h.calls.length,0);});
test('successful signed event routes exactly ONE atomic RPC and does not write separately',async()=>{const h=createMock();const r=await h.send(); assert.equal(r.paid,true);assert.equal(r.settled,true);assert.equal(h.calls.length,1);assert.equal(h.calls[0].name,'kenz_g427_atomic_xpay_v1');assert.equal(h.calls[0].params.p_amount_minor,5900);assert.equal(h.calls[0].params.p_event_id,'evt_synthetic');});
test('zero value, invalid amount, mismatched currency fail closed without RPC',async()=>{for(const session of [{amountTotal:0},{amountTotal:5900.7},{currency:'USD'},{paymentStatus:''}]){const h=createMock();const r=await h.send({session}); assert.equal(r.http_status,409);assert.equal(h.calls.length,0);}});
test('unlisted provider event ignored without settlement',async()=>{const h=createMock();const r=await h.send({type:'payment_intent.succeeded'});assert.equal(r.ignored,true);assert.equal(h.calls.length,0);});
// G4.30 synthetic RefundAPI safety contract. These assertions intentionally FAIL
// against a handler that silently acknowledges KENZ refund notifications.
// This is a release gate, NOT a simulated XPay webhook request or production fix.
for (const refundEvent of ['refund.created', 'refund.failed']) {
 test(`KENZ ${refundEvent} RefundAPI must be accounted for or rejected, never ACK ignored`,async()=>{
  const h=createMock();
  const r=await h.send({
   type:refundEvent,
   session:{
    id:'re_synthetic_no_customer',
    paymentIntentId:'pi_synthetic',
    chargeId:'ch_synthetic',
    amount:5900,
    status:refundEvent==='refund.created'?'pending':'failed',
    amountTotal:undefined,
    paymentStatus:undefined,
   },
  });
  assert.equal(h.calls.length,0,'refund must not run checkout-settlement RPC');
  assert.ok(
    r?.refund_recorded===true || (Number.isInteger(r?.http_status) && r.http_status>=400),
    `${refundEvent} must be durably audited or fail closed; received/ignored HTTP 200 is unsafe`
  );
 });
}
test('RPC unavailable requires provider retry not success ACK',async()=>{const h=createMock(()=>({data:null,error:{code:'PGRST404'}}));const r=await h.send();assert.equal(r.http_status,503);assert.equal(h.calls.length,1);});
test('RPC network exception requires retry',async()=>{const h=createMock(()=>{throw Error('temporary synthetic outage')});const r=await h.send();assert.equal(r.http_status,503);});
test('RPC returns missing response: fail with 503',async()=>{const h=createMock({data:null,error:null});const r=await h.send();assert.equal(r.http_status,503);});
test('wrong order/currency collision from SQL returns 409',async()=>{for(const code of ['order_not_found','order_session_amount_mismatch','provider_event_id_collision']){const h=createMock({error:code});const r=await h.send();assert.equal(r.http_status,409);assert.equal(r.error,code);}});
test('non-whitelisted database internal errors are not exposed',async()=>{const h=createMock({error:'sensitive_rpc_info'});const r=await h.send();assert.equal(r.http_status,409);assert.equal(r.error,'factory_atomic_payment_rejected');});
test('complete-but-unpaid cannot assert Paid',async()=>{const h=createMock({ok:true,paid:false,awaiting_payment:true});const r=await h.send({session:{paymentStatus:'unpaid'}});assert.equal(r.paid,false);assert.equal(r.awaiting_payment,true);});
test('late paid after expiry is reviewed without auto delivery',async()=>{const h=createMock({ok:true,paid:false,requires_review:true});const r=await h.send();assert.equal(r.paid,false);assert.equal(r.requires_review,true);});
test('duplicate event is acknowledged with no independent writes',async()=>{const h=createMock({ok:true,duplicate:true,status:'paid'});const r=await h.send();assert.equal(r.duplicate,true);assert.equal(h.calls.length,1);});
test('no fake OK response when RPC gives object without result',async()=>{const h=createMock({noop:1});const r=await h.send();assert.equal(r.http_status,503);});

test('full source patcher enforces exact v23 KENZ fixture and preserves external route',()=>{
 const fixture=readFileSync(new URL('../g426-qa/factory-handler-live-v23.fixture.ts',import.meta.url),'utf8');
 const dir=mkdtempSync(join(tmpdir(),'kenz-g428-'));
 try{
  const input=join(dir,'live.ts'),output=join(dir,'safe.ts');writeFileSync(input,fixture);
  const cli=new URL('./build-guarded-adapter.mjs',import.meta.url).pathname;
  let r=spawnSync(process.execPath,[cli,input,output],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert(existsSync(output));
  const built=readFileSync(output,'utf8');
  assert.ok(built.startsWith(fixture.split('async function handleFactoryEvent(')[0]),'Original shared preamble must be preserved');
  assert.equal(built.split('\nDeno.serve(')[1],fixture.split('\nDeno.serve(')[1]);
  assert.match(built,/rpc\('kenz_g427_atomic_xpay_v1'/);
  assert.doesNotMatch(built,/bucket: "sales"|from\("factory_payment_events"\)/);
  assert.equal((built.match(/async function handleFactoryEvent\(/g)||[]).length,1);
  r=spawnSync(process.execPath,[cli,input,output],{encoding:'utf8'});assert.equal(r.status,0);
  writeFileSync(input,fixture.replace('const paymentStatus =','const differentPaymentStatus ='));
  r=spawnSync(process.execPath,[cli,input,output],{encoding:'utf8'});
  assert.notEqual(r.status,0);assert.match(r.stderr,/differs from pinned v23 fixture/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
