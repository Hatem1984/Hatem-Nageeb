import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS,centralDecision,deliveryDecision,simulatedDispatch} from './central-email-guard.mjs';
const NOW=Date.parse('2026-10-18T09:00:00Z');
const iso=x=>new Date(x).toISOString();
const GEN='a11e4190-1234-4567-8abc-000000000001';
function healthy(){return [
 {config_key:KEYS.gate,enabled:true,config_value:'G419_DURABLE_DISPATCH_APPROVED',metadata:{generation:GEN,owner_authorized:true,scope:'new_consented_email_only',no_historical_backfill:true,no_auto_retry:true,sender:'orders@kenzelyom.com',activated_at_utc:iso(NOW-3600000),lease_expires_at_utc:iso(NOW+90_000)}},
 {config_key:KEYS.heartbeat,enabled:true,config_value:'G419_MONITOR_HEALTHY',metadata:{generation:GEN,observer:'independent_cron_monitor_v1',checked_at_utc:iso(NOW-25_000),cron_receipts_ok:true,cron_products_ok:true,queue_lag_ok:true,dispatch_auth_ok:true,provider_config_ok:true}},
 {config_key:KEYS.stop,enabled:false,config_value:'G419_STOP_CLEAR',metadata:{generation:GEN}}
]}
const delivery=(kind='product_delivery')=>({delivery_kind:kind,status:'queued',channel:'email',delivery_transport:'resend',attempt_count:0,recipient:'test@example.invalid'});
const order=()=>({status:'paid',payment_status:'paid',total_minor:5900,delivery_email:'test@example.invalid',delivery_consent_at:iso(NOW-3450000),delivery_channel:'email',created_at:iso(NOW-3550000),paid_at:iso(NOW-20000)});
function mutate(f){const x=healthy();f(x);return x}
const cases=[
 ['healthy authorized',healthy(),true],
 ['no central row',healthy().slice(1),false],
 ['disabled gate',mutate(x=>x[0].enabled=false),false],
 ['wrong gate mode',mutate(x=>x[0].config_value='PILOT'),false],
 ['absent owner approval',mutate(x=>x[0].metadata.owner_authorized=false),false],
 ['no historical exclusion',mutate(x=>x[0].metadata.no_historical_backfill=false),false],
 ['auto retry not disabled',mutate(x=>x[0].metadata.no_auto_retry=false),false],
 ['sender policy mismatch',mutate(x=>x[0].metadata.sender='unverified@x'),false],
 ['expired lease',mutate(x=>x[0].metadata.lease_expires_at_utc=iso(NOW-1)),false],
 ['lease longer than 2 minutes',mutate(x=>x[0].metadata.lease_expires_at_utc=iso(NOW+600_000)),false],
 ['missing heartbeat',healthy().filter(x=>x.config_key!==KEYS.heartbeat),false],
 ['disabled heartbeat',mutate(x=>x[1].enabled=false),false],
 ['stale heartbeat',mutate(x=>x[1].metadata.checked_at_utc=iso(NOW-120_000)),false],
 ['future heartbeat skew',mutate(x=>x[1].metadata.checked_at_utc=iso(NOW+50_000)),false],
 ['self-reported heartbeat refused',mutate(x=>x[1].metadata.observer='resend_worker'),false],
 ['unhealthy product cron',mutate(x=>x[1].metadata.cron_products_ok=false),false],
 ['unhealthy receipt cron',mutate(x=>x[1].metadata.cron_receipts_ok=false),false],
 ['unhealthy queue backlog',mutate(x=>x[1].metadata.queue_lag_ok=false),false],
 ['unhealthy dispatch auth',mutate(x=>x[1].metadata.dispatch_auth_ok=false),false],
 ['emergency kill active',mutate(x=>x[2].enabled=true),false],
 ['emergency stop row missing',healthy().slice(0,2),false],
 ['unknown or duplicate key', [...healthy(),healthy()[0]],false],
 ['generation mismatch',mutate(x=>x[1].metadata.generation='another-generation'),false],
 ['stop generation mismatch',mutate(x=>x[2].metadata.generation='another-generation'),false],
 ['activation in future',mutate(x=>x[0].metadata.activated_at_utc=iso(NOW+10_000)),false],
 ['missing lease timestamp',mutate(x=>delete x[0].metadata.lease_expires_at_utc),false],
 ];
for (const [name,rows,expected] of cases) test('central lease: '+name,()=> assert.equal(centralDecision(rows,'product',NOW).allowed,expected));
test('invalid kind denied',()=>assert.equal(centralDecision(healthy(),'wallet',NOW).allowed,false));
for(const [name,kind,d,o,allowed] of [
 ['new paid product','product',delivery(),order(),true],
 ['new receipt','receipt',delivery('order_received'),order(),true],
 ['unpaid product','product',delivery(),{...order(),payment_status:'unpaid'},false],
 ['unconfirmed paid status','product',delivery(),{...order(),status:'pending'},false],
 ['old order','product',delivery(),{...order(),created_at:iso(NOW-7200000)},false],
 ['old payment','product',delivery(),{...order(),paid_at:iso(NOW-7200000)},false],
 ['no email consent','product',delivery(),{...order(),delivery_consent_at:null},false],
 ['site-only','product',delivery(),{...order(),delivery_channel:'site'},false],
 ['wrong recipient','product',{...delivery(),recipient:'another@example.invalid'},order(),false],
 ['retry attempt','product',{...delivery(),attempt_count:1},order(),false],
 ['old n8n queue','product',{...delivery(),delivery_transport:'n8n_smtp'},order(),false],
 ['invalid delivery kind','receipt',delivery(),order(),false],
 ]) test('eligibility: '+name,()=>assert.equal(deliveryDecision(d,o,kind,centralDecision(healthy(),kind,NOW),NOW).allowed,allowed));
test('direct authenticated invocation with central OFF never reaches provider',async()=>{let sent=0;const r=await simulatedDispatch({readLease:async()=>mutate(x=>x[0].enabled=false),readOrder:async()=>order(),delivery:delivery(),kind:'product',fakeProvider:async()=>{sent++},now:()=>NOW});assert.equal(sent,0);assert.equal(r.stage,'before_claim')});
test('kill switch changes after claim, before provider: no send',async()=>{let sent=0,reads=0;const r=await simulatedDispatch({readLease:async()=>{reads++;return reads===1?healthy():mutate(x=>x[2].enabled=true)},readOrder:async()=>order(),delivery:delivery(),kind:'product',fakeProvider:async()=>{sent++},now:()=>NOW});assert.equal(sent,0);assert.equal(r.stage,'before_provider');assert.equal(reads,2)});
test('monitor expires after claim before provider: no send',async()=>{let sent=0,reads=0;const r=await simulatedDispatch({readLease:async()=>{reads++;return reads===1?healthy():mutate(x=>x[1].metadata.checked_at_utc=iso(NOW-120000))},readOrder:async()=>order(),delivery:delivery(),kind:'product',fakeProvider:async()=>{sent++},now:()=>NOW});assert.equal(sent,0);assert.equal(r.stage,'before_provider')});
test('healthy mock delivery reaches only fake provider once',async()=>{let count=0;const r=await simulatedDispatch({readLease:async()=>healthy(),readOrder:async()=>order(),delivery:delivery(),kind:'product',fakeProvider:async()=>{count++},now:()=>NOW});assert.deepEqual(r,{sent:true});assert.equal(count,1)});
