import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';

const fixture=readFileSync(new URL('./factory-handler-live-v23.fixture.ts',import.meta.url),'utf8');
const dir=mkdtempSync(join(tmpdir(),'kenz-g426-runtime-'));
let patched='';
try {
  const orig=join(dir,'original.ts'), out=join(dir,'patched.ts');
  writeFileSync(orig,fixture);
  const r=spawnSync(process.execPath,[new URL('./build-candidate.mjs',import.meta.url).pathname,orig,out],{encoding:'utf8'});
  assert.equal(r.status,0,'Patcher refused actual KENZ v23 fixture: '+r.stderr);
  patched=readFileSync(out,'utf8');
} finally { rmSync(dir,{recursive:true,force:true}); }
let handlerSource=patched.slice(patched.indexOf('async function handleFactoryEvent('),patched.indexOf('\nDeno.serve('));
handlerSource=handlerSource.replace('async function handleFactoryEvent(event: any, eventType: string, session: any)','async function handleFactoryEvent(event, eventType, session)').replace('const order: any =','const order =').replace('let found: any =','let found =');

function makeHarness(state='pending',payStatus='unpaid') {
  const order={id:'qa-order-1',order_ref:'DF-SYNTHETIC-ONLY',total_minor:5900,currency:'EGP',provider_reference:'cs-synthetic',status:state,payment_status:payStatus,customer_id:null,delivery_channel:'email',delivery_email:'synthetic@example.invalid',fulfillment_status:'awaiting_payment'};
  const log={events:[],queue:[],exceptions:[],updates:[],customers:[]};
  const eventIds=new Set();
  function builder(table){
    let op='',payload=null,filters=[];
    const b={
      select(){if(!op)op='select';return b;},
      eq(col,val){filters.push({kind:'eq',col,val});return b;},
      neq(col,val){filters.push({kind:'neq',col,val});return b;},
      ilike(){return b;},
      update(p){op='update';payload=p;return b;},
      insert(p){
        if(table==='factory_payment_events'){
          if(eventIds.has(p.provider_event_id))return Promise.resolve({error:{code:'23505'}});
          eventIds.add(p.provider_event_id); log.events.push(p);
          return Promise.resolve({error:null});
        }
        if(table==='factory_exceptions'){log.exceptions.push(p);return Promise.resolve({error:null});}
        if(table==='factory_customers') {log.customers.push(p);return {select(){return {single:async()=>({data:{id:'qa-customer'},error:null})}}};}
        throw Error('unexpected INSERT '+table);
      },
      async maybeSingle(){
        if(table==='factory_orders'){
          if(op==='update')return applyUpdate();
          const match=filters.every(f=>f.kind==='eq'?order[f.col]===f.val:order[f.col]!==f.val);
          return {data:match?{...order}:null,error:null};
        }
        if(table==='factory_customers')return {data:null,error:null};
        throw Error('unexpected maybeSingle '+table);
      },
      then(resolve,reject){ if(op==='update'){return Promise.resolve(applyUpdate()).then(resolve,reject);}throw Error('unexpected await '+table+' '+op); }
    };
    function applyUpdate(){
      if(table!=='factory_orders')throw Error('unexpected UPDATE '+table);
      const match=filters.every(f=>f.kind==='eq'?order[f.col]===f.val:order[f.col]!==f.val);
      if(match){Object.assign(order,payload);log.updates.push({payload:{...payload},filters:[...filters]});}
      return {data:match?{id:order.id}:null,error:null};
    }
    return b;
  }
  const mock={from:builder};
  const sandbox={adminClient:()=>mock,json:(v,status=200)=>({...v,http_status:status}),normalizeEmail:(s)=>(s||'').trim().toLowerCase(),normalizePhone:(s)=>(s||'').replace(/\D/g,''),queuePaidDeliveries:async(_s,order)=>{log.queue.push(order.order_ref)},console:{error(){}}};
  const handle=vm.runInNewContext(handlerSource+'\nhandleFactoryEvent',sandbox,{timeout:1500});
  async function deliver(id,type,status='paid',opts={}) {
    const session={id:opts.sessionId||'cs-synthetic',currency:opts.currency||'EGP',amountTotal:opts.amount??5900,paymentStatus:status,customer:{},metadata:{source:'digital_factory_v1',order_id:'qa-order-1',order_ref:'DF-SYNTHETIC-ONLY'}};
    const event={id,type,data:{object:session}};
    return await handle(event,type,session);
  }
  return {order,log,deliver};
}

test('actual patched handler: signed-success data updates pending order and queues exactly one delivery',async()=>{
  const h=makeHarness();const r=await h.deliver('evt-1','checkout.session.completed');
  assert.equal(r.paid,true); assert.equal(h.order.status,'paid'); assert.equal(h.order.payment_status,'paid');assert.equal(h.log.queue.length,1);assert.equal(h.log.events.length,1);
});
test('actual patched handler: two different paid events do not duplicate a download queue',async()=>{
  const h=makeHarness();await h.deliver('evt-1','checkout.session.completed');const r=await h.deliver('evt-2','checkout.session.async_payment_succeeded');
  assert.equal(r.already_paid,true); assert.equal(h.log.queue.length,1);assert.equal(h.log.events.length,2);
});
test('actual patched handler: stale non-paid completed event cannot demote Paid',async()=>{
  const h=makeHarness('paid','paid');const r=await h.deliver('evt-2','checkout.session.completed','unpaid');
  assert.equal(r.already_paid,true);assert.equal(h.order.status,'paid');assert.equal(h.order.payment_status,'paid');assert.equal(h.log.queue.length,0);assert.equal(h.log.updates.length,0);
});
test('actual patched handler: stale failure cannot demote Paid',async()=>{
  const h=makeHarness('paid','paid');const r=await h.deliver('evt-2','checkout.session.async_payment_failed','unpaid');
  assert.equal(r.already_paid,true);assert.equal(h.order.payment_status,'paid');assert.equal(h.log.updates.length,0);
});
test('actual patched handler: synthetic expired+paid requires owner review without delivery',async()=>{
  const h=makeHarness('expired','expired');const r=await h.deliver('evt-late','checkout.session.completed');
  assert.equal(r.requires_review,true); assert.equal(h.order.status,'expired');assert.equal(h.log.queue.length,0);assert.equal(h.log.exceptions.length,1);
});
test('actual patched handler: pending unpaid cannot be treated as successful payment',async()=>{
  const h=makeHarness();const r=await h.deliver('evt-await','checkout.session.completed','unpaid');
  assert.equal(r.awaiting_payment,true);assert.equal(h.order.status,'pending');assert.equal(h.log.queue.length,0);
});
test('actual patched handler: duplicate event id is acknowledged without duplicate updates',async()=>{
  const h=makeHarness();await h.deliver('evt-1','checkout.session.completed');const r=await h.deliver('evt-1','checkout.session.completed');
  assert.equal(r.duplicate,true);assert.equal(h.log.queue.length,1);assert.equal(h.log.events.length,1);
});
test('actual patched handler: mismatched amount rejected before mutation',async()=>{
  const h=makeHarness();const r=await h.deliver('evt-1','checkout.session.completed','paid',{amount:4900});
  assert.equal(r.http_status,409);assert.equal(h.log.events.length,0);assert.equal(h.log.queue.length,0);
});
test('actual patched handler: mismatched currency rejected before mutation',async()=>{
  const h=makeHarness();const r=await h.deliver('evt-1','checkout.session.completed','paid',{currency:'USD'});
  assert.equal(r.http_status,409);assert.equal(h.log.events.length,0);
});
test('actual patched handler: wrong session id rejected before mutation',async()=>{
  const h=makeHarness();const r=await h.deliver('evt-1','checkout.session.completed','paid',{sessionId:'cs-other'});
  assert.equal(r.http_status,409);assert.equal(h.log.events.length,0);
});
test('actual patched handler: success after pending failure requires owner review',async()=>{
  const h=makeHarness();await h.deliver('evt-fail','checkout.session.async_payment_failed','unpaid');const r=await h.deliver('evt-paid','checkout.session.completed','paid');
  assert.equal(h.order.status,'failed');assert.equal(r.requires_review,true);assert.equal(h.log.queue.length,0);assert.equal(h.log.exceptions.length,1);
});