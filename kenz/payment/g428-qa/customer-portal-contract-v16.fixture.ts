// KENZ customer portal v16 - READ ONLY verified function excerpts (NO secrets, NO production writes).
function clean(v:any,n=240){return String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,n)}
function normEmail(v:any){return clean(v,254).toLowerCase()}
function normPhone(v:any){return clean(v,40).replace(/\D/g,"")}
function bytesHex(bytes:Uint8Array){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function sha256(v:string){
  const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));
  return bytesHex(new Uint8Array(d));
}

async function verifyAccess(s:any,rawToken:string){
  if(!rawToken)return {error:"access_token_required"};
  const hash=await sha256(rawToken);
  const tq=await s.from("factory_order_access_tokens")
    .select("id,order_id,expires_at,revoked_at")
    .eq("token_hash",hash).maybeSingle();
  if(tq.error||!tq.data)return {error:"access_token_invalid"};
  if(tq.data.revoked_at||new Date(tq.data.expires_at).getTime()<=Date.now())return {error:"access_token_expired"};
  const oq=await s.from("factory_orders")
    .select("id,order_ref,customer_id,status,payment_status,payment_method,total_minor,currency,created_at,paid_at,fulfillment_status")
    .eq("id",tq.data.order_id).maybeSingle();
  if(oq.error||!oq.data)return {error:"order_not_found"};
  await s.from("factory_order_access_tokens").update({last_used_at:new Date().toISOString()}).eq("id",tq.data.id);
  return {order:oq.data,access_token_id:tq.data.id};
}
async function verifyOrder(s:any,ref:string,email:string,phone:string){
  const oq=await s.from("factory_orders")
    .select("id,order_ref,customer_id,status,payment_status,payment_method,total_minor,currency,created_at,paid_at,delivery_email,contact_phone")
    .eq("order_ref",ref).maybeSingle();
  if(oq.error||!oq.data)return {error:"order_not_found"};
  const o:any=oq.data;
  let matched=false;
  if(o.customer_id){
    const cq=await s.from("factory_customers").select("email,phone").eq("id",o.customer_id).maybeSingle();
    if(cq.data){
      const ce=normEmail(cq.data.email),cp=normPhone(cq.data.phone);
      matched=!!((email&&ce&&email===ce)||(phone&&cp&&phone===cp));
    }
  }
  if(!matched){
    const oe=normEmail(o.delivery_email),op=normPhone(o.contact_phone);
    matched=!!((email&&oe&&email===oe)||(phone&&op&&phone===op));
  }
  if(!matched){
    const mq=await s.from("factory_manual_payments").select("payer_phone").eq("order_id",o.id).maybeSingle();
    if(mq.data){
      const mp=normPhone(mq.data.payer_phone);
      matched=!!(phone&&mp&&phone===mp);
    }
  }
  if(!matched)return {error:"order_contact_mismatch"};
  return {order:o};
}
