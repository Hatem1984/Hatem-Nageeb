import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

// G4.10 FUTURE PRODUCTION WORKER, DARK BY DEFAULT. No cron is scheduled.
// Handles newly routed order_received and proof_received; never product_delivery,
// payment_confirmed, Telegram, wallets, or any n8n_smtp delivery.
const FROM_ADDRESS="orders@kenzelyom.com";
const FROM="كنز اليوم <orders@kenzelyom.com>";
const ROUTE_KEY="kenz_customer_receipt_route_v1";
const SEND_KEY="kenz_customer_receipt_dispatch_v1";
const AUTH_KEY="kenz_customer_receipt_auth_v1";
const SENDER_KEY="customer_sender_policy_v1";
const SRC_MARK="g410_customer_receipt_route_v1";
const KINDS=["order_received","proof_received"];
const MAIL_REGEX=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function out(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}})}
function server(){const url=Deno.env.get("SUPABASE_URL")||"";let secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!secret)try{secret=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||""}catch{}
 if(!url||!secret)throw Error("server_secret_missing");return createClient(url,secret,{auth:{persistSession:false}})}
async function sha(raw){const buf=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(raw)));
 return Array.from(buf,v=>v.toString(16).padStart(2,"0")).join("")}
function ctEqual(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function authenticate(s,req){const raw=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!/^[0-9a-f]{64}$/.test(raw))return false;
 const r=await s.from("factory_runtime_config").select("enabled,config_value,metadata").eq("config_key",AUTH_KEY).maybeSingle();
 const c=r.data;return !r.error&&c?.enabled===true&&c.config_value==="G410_AUTH_PROBE_AND_DISPATCH"&&
  c.metadata?.permission==="receipt_and_proof_only"&&ctEqual(await sha(raw),String(c.metadata?.token_hash||""));}
async function senderApproved(s){const r=await s.from("factory_runtime_config").select("enabled,config_value,metadata").eq("config_key",SENDER_KEY).maybeSingle();
 const c=r.data;return !r.error&&c?.enabled===true&&c.config_value===FROM_ADDRESS&&
 c.metadata?.forbid_personal_accounts===true&&c.metadata?.allow_unverified_sender===false}
async function gates(s){const [r,t]=await Promise.all([s.from("factory_runtime_config").select("enabled,config_value,metadata").eq("config_key",ROUTE_KEY).maybeSingle(),
 s.from("factory_runtime_config").select("enabled,config_value,metadata").eq("config_key",SEND_KEY).maybeSingle()]);
 const a=r.data,b=t.data;
 const route=!r.error&&a?.enabled===true&&a.config_value==="G410_CUTOVER_APPROVED"&&
 a.metadata?.scope==="new_order_received_and_proof_received_only"&&a.metadata?.sender===FROM_ADDRESS&&
 a.metadata?.customer_cutover_authorized===true&&a.metadata?.no_historical_backfill===true&&
 a.metadata?.legacy_default==="n8n_smtp"&&Number.isFinite(Date.parse(String(a.metadata?.activated_at_utc||"")));
 const dispatch=!t.error&&b?.enabled===true&&b.config_value==="G410_DISPATCH_APPROVED"&&
 b.metadata?.scope==="new_order_received_and_proof_received_only"&&b.metadata?.sender===FROM_ADDRESS&&
 b.metadata?.worker_cutover_authorized===true&&b.metadata?.no_auto_retry===true&&
 b.metadata?.separate_from_product_delivery===true;
 return {active:route&&dispatch,route,dispatch,activated_at_utc:a?.metadata?.activated_at_utc||null}}
async function preflight(s,d){const fn=d.delivery_kind==="order_received"?"kenz_order_received_preflight_v1":"kenz_proof_received_shadow_preflight_v1";
 const p=await s.rpc(fn,{p_delivery_id:d.id});const v=p.data;
 return !p.error&&v?.ok===true&&v.reason==="policy_pass_shadow_only"&&v.shadow_only===true&&v.would_send===false&&
  (d.delivery_kind==="order_received"?v.delivery_transport==="resend":v.transport==="resend")}
function simpleError(e){return String(e instanceof Error?e.message:"unknown_error").replace(/[\r\n\t]/g," ").slice(0,155)}
async function exception(s,d,reason,ambiguous){await s.from("factory_exceptions").insert({order_id:d.order_id,
 source:"kenz_customer_receipt_worker_v1",category:"delivery_failed",severity:"warning",status:"open",
 summary:"Email receipt via Resend requires review, no automatic retry",
 details:{delivery_id:d.id,kind:d.delivery_kind,reason,submission_uncertain:ambiguous,no_auto_retry:true}})}
async function fail(s,d,reason,submitted){const now=new Date().toISOString();
 await s.from("factory_deliveries").update({status:"failed",failed_at:now,updated_at:now,
 last_error:(submitted?"submission_uncertain_":"pre_send_")+simpleError(reason)}).eq("id",d.id)
 .eq("status","sending").eq("delivery_transport","resend").eq("attempt_count",1);
 await exception(s,d,simpleError(reason),submitted)}
async function skip(s,d,reason){const now=new Date().toISOString();
 await s.from("factory_deliveries").update({status:"cancelled",last_error:reason,updated_at:now})
 .eq("id",d.id).eq("status","sending").eq("delivery_transport","resend").eq("attempt_count",1);}
async function health(s){const [g,valid,queued]=await Promise.all([gates(s),senderApproved(s),
 s.from("factory_deliveries").select("id",{head:true,count:"exact"}).eq("delivery_transport","resend")
 .eq("status","queued").contains("metadata",{[SRC_MARK]:true})]);
 return {ok:true,service:"kenz-customer-receipt-resend-worker",version:1,
  sending_enabled:g.active,route_enabled:g.route,dispatcher_enabled:g.dispatch,
  sender_policy_valid:valid,queued_new_receipts:queued.error?null:(queued.count||0),
  provider_configured:!!Deno.env.get("RESEND_API_KEY"),no_cron_currently_scheduled:true}}
async function drain(s){const g=await gates(s);if(!g.active)return {ok:true,processed:0,enabled:false};
 if(!(await senderApproved(s)))return {ok:false,error:"sender_policy_rejected"};
 const rows=await s.from("factory_deliveries")
  .select("id,order_id,delivery_kind,channel,recipient,status,delivery_transport,attempt_count,metadata,idempotency_key,payload")
  .eq("status","queued").eq("attempt_count",0).eq("channel","email")
  .eq("delivery_transport","resend").contains("metadata",{[SRC_MARK]:true})
  .in("delivery_kind",KINDS).lte("next_attempt_at",new Date().toISOString())
  .order("created_at",{ascending:true}).limit(1);
 if(rows.error)return {ok:false,error:"queue_lookup_error"};const d=(rows.data||[])[0];if(!d)return {ok:true,processed:0,enabled:true};
 if(!UUID_REGEX.test(String(d.order_id||""))||!MAIL_REGEX.test(String(d.recipient||""))||
   d.idempotency_key!==d.order_id+":"+d.delivery_kind+":email")return {ok:false,error:"invalid_delivery_envelope"};
 if(!(await preflight(s,d)))return {ok:false,error:"read_only_preflight_rejected"};
 const now=new Date().toISOString();
 const claimed=await s.from("factory_deliveries").update({status:"sending",attempt_count:1,
  max_attempts:1,last_attempt_at:now,updated_at:now})
 .eq("id",d.id).eq("order_id",d.order_id).eq("delivery_transport","resend")
 .eq("status","queued").eq("attempt_count",0).select("id").maybeSingle();
 if(claimed.error)return {ok:false,error:"claim_error"};
 if(!claimed.data)return {ok:true,processed:0,claimed_elsewhere:true};
 let providerSubmitted=false;
 try{
  const g2=await gates(s);if(!g2.active)throw Error("dispatch_gate_revoked");
  if(!(await senderApproved(s)))throw Error("sender_policy_revoked");
  const ord=await s.from("factory_orders")
    .select("id,order_ref,status,payment_status,delivery_channel,delivery_email,delivery_consent_at,created_at")
    .eq("id",d.order_id).maybeSingle();
  const o=ord.data;
  if(ord.error||!o)throw Error("order_not_found");
  if(o.status!=="pending"|| !["unpaid","pending_review"].includes(o.payment_status)){
   await skip(s,d,"order_no_longer_pending_no_receipt_needed");return {ok:true,processed:1,status:"cancelled_no_receipt_needed"};
  }
  if(!o.delivery_consent_at|| !["email","both"].includes(o.delivery_channel)||
    String(o.delivery_email||"").trim().toLowerCase()!==String(d.recipient).trim().toLowerCase()||
    !g2.activated_at_utc||new Date(o.created_at).getTime()<new Date(g2.activated_at_utc).getTime())
    throw Error("order_not_permitted");
  if(d.delivery_kind==="proof_received"&&o.payment_status!=="pending_review"){
    await skip(s,d,"proof_review_no_longer_pending");return {ok:true,processed:1,status:"cancelled_no_review_needed"};
  }
  if(d.delivery_kind==="proof_received"){
   if(!UUID_REGEX.test(String(d.payload?.manual_payment_id||"")))throw Error("manual_payment_invalid");
   const m=await s.from("factory_manual_payments").select("id,order_id,status,proof_path")
      .eq("id",d.payload.manual_payment_id).maybeSingle();
   if(m.error||!m.data||m.data.order_id!==d.order_id||m.data.status!=="pending_review"||!m.data.proof_path){
    await skip(s,d,"proof_review_no_longer_required");return {ok:true,processed:1,status:"cancelled_no_review_needed"};
   }
  }
  const name=d.delivery_kind==="order_received"?"kenz_order_received_render_v1":"kenz_proof_received_render_v1";
  const template=await s.rpc(name,{p_order_ref:o.order_ref});const t=template.data;
  if(template.error||!t||t.purpose!==(d.delivery_kind==="order_received"?
    "order_received_not_payment_confirmation":"proof_received_not_payment_confirmation"))throw Error("template_invalid");
  if(!(await gates(s)).active)throw Error("dispatch_gate_revoked_before_provider");
  const key=Deno.env.get("RESEND_API_KEY")||"";if(!key)throw Error("resend_not_configured");
  providerSubmitted=true;
  const rr=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
     "authorization":"Bearer "+key,"content-type":"application/json",
     "Idempotency-Key":"kenz-g410-customer-receipt-"+d.id},
    body:JSON.stringify({from:FROM,to:[d.recipient],reply_to:FROM_ADDRESS,
       subject:t.subject,text:t.text,html:t.html}),signal:AbortSignal.timeout(14000)});
  if(!rr.ok)throw Error("resend_http_"+rr.status);
  const response=await rr.json().catch(()=>null);const providerId=String(response?.id||"");
  if(!/^[0-9a-z-]{15,180}$/i.test(providerId))throw Error("provider_ack_missing");
  const saved=await s.from("factory_deliveries").update({status:"sent",provider:"resend",
      provider_message_id:providerId,sent_at:new Date().toISOString(),
      updated_at:new Date().toISOString(),last_error:null})
     .eq("id",d.id).eq("status","sending").eq("delivery_transport","resend")
     .eq("attempt_count",1).select("id").maybeSingle();
  if(saved.error||!saved.data)throw Error("provider_accepted_db_uncertain");
  await s.from("factory_audit_log").insert({order_id:d.order_id,event_type:"delivery.resend_accepted",
    entity_type:"delivery",entity_id:d.id,
    data:{kind:d.delivery_kind,provider_message_id:providerId,transport:"resend",source:"g410"}});
  return {ok:true,processed:1,status:"sent",kind:d.delivery_kind,provider_message_id:providerId};
 }catch(e){await fail(s,d,e,providerSubmitted);
  return {ok:false,processed:1,error:"review_failed_receipt_no_auto_retry",retry:false};}
}
Deno.serve(async req=>{
 if(req.method==="GET")return out({ok:true,service:"kenz-customer-receipt-resend-worker",version:1,mode:"staged"});
 if(req.method!=="POST")return out({error:"method_not_allowed"},405);
 if(!(req.headers.get("content-type")||"").includes("application/json"))return out({error:"json_required"},415);
 let body;try{body=await req.json()}catch{return out({error:"invalid_json"},400)}
 if(!["probe","drain_one"].includes(body?.action))return out({error:"invalid_action"},400);
 let s;try{s=server()}catch{return out({error:"configuration_error"},503)}
 if(!(await authenticate(s,req)))return out({error:"unauthorized"},401);
 if(body.action==="probe")return out(await health(s));
 const result=await drain(s);return out(result,result.ok?200:503);
});