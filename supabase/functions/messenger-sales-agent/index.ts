import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const GRAPH_VERSION="v26.0";
const GRAPH=`https://graph.facebook.com/${GRAPH_VERSION}`;
const XPAY_API="https://api.xpay.app/checkout/sessions";

function clean(v:unknown,max=4000){return String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max);}
function adminClient(){
  const url=Deno.env.get("SUPABASE_URL")||"";
  let key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const raw=Deno.env.get("SUPABASE_SECRET_KEYS");
  if(!key&&raw){try{key=JSON.parse(raw).default||"";}catch{}}
  if(!url||!key)throw new Error("supabase_admin_not_configured");
  return createClient(url,key,{auth:{persistSession:false}});
}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});}
function timingSafeText(a:string,b:string){const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);if(x.length!==y.length)return false;let d=0;for(let i=0;i<x.length;i++)d|=x[i]^y[i];return d===0;}
function bytesToHex(b:Uint8Array){return Array.from(b).map(x=>x.toString(16).padStart(2,"0")).join("");}
async function verifyMetaSignature(raw:string,header:string|null,secret:string){
  if(!header?.startsWith("sha256=")||!secret)return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(raw)));
  return timingSafeText("sha256="+bytesToHex(sig),header);
}
async function sha256Text(v:string){const d=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)));return bytesToHex(d);}
function bookingRef(){const d=new Date();const y=d.getUTCFullYear(),m=String(d.getUTCMonth()+1).padStart(2,"0"),day=String(d.getUTCDate()).padStart(2,"0");return "LB-"+y+m+day+"-"+crypto.randomUUID().replace(/-/g,"").slice(0,6).toUpperCase();}
function norm(s:string){return s.toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[ًٌٍَُِّْـ]/g,"").replace(/\s+/g," ").trim();}
function hasAny(t:string,xs:string[]){return xs.some(x=>t.includes(x));}
type Intent="stop"|"human"|"consulting"|"price"|"schedule"|"refund"|"payment"|"fit"|"details"|"objection_price"|"objection_time"|"greeting"|"unknown";
function detectIntent(raw:string):Intent{
  const t=norm(raw);
  if(hasAny(t,["وقف","ستوب","stop","مش عاوز رسائل","الغاء الرسائل","الغي الرسائل"]))return"stop";
  if(hasAny(t,["حاتم","بني ادم","انسان","حد يكلمني","كلمني","مكالمه","اتصل"]))return"human";
  if(hasAny(t,["استشاره","استشارة","consulting","consultation"]))return"consulting";
  if(hasAny(t,["غالي","السعر كبير","مش قادر علي السعر","مش قادر على السعر"]))return"objection_price";
  if(hasAny(t,["مشغول","معنديش وقت","مفيش وقت","مافيش وقت"]))return"objection_time";
  if(hasAny(t,["استرداد","ارجع فلوسي","refund","ريفاند"]))return"refund";
  if(hasAny(t,["موعد","مواعيد","امتي","امتى","ميعاد","يوم ايه","المده","المدة"]))return"schedule";
  if(hasAny(t,["سعر","كام","بكام","تكلفه","تكلفة","فلوس","جنيه"]))return"price";
  if(hasAny(t,["احجز","حجز","ادفع","دفع","لينك","رابط","اشتراك","اشترك","2000","4500"]))return"payment";
  if(hasAny(t,["مناسب","ينفع لي","ينفعلي","فكره مشروع","فكرة مشروع","مشروع قائم"]))return"fit";
  if(hasAny(t,["تفاصيل","البرنامج","الكورس","المحتوي","المحتوى","هتعلم","بيقدم ايه","بيقدم إيه"]))return"details";
  if(hasAny(t,["السلام","سلام","اهلا","هاي","hello","مساء الخير","صباح الخير"]))return"greeting";
  return"unknown";
}
function detectProjectStage(raw:string):"idea"|"existing"|null{
  const t=norm(raw);
  if(hasAny(t,["فكره مشروع","فكرة مشروع","لسه هبدأ","لسه هبدا","تحت التاسيس","قبل الاطلاق"]))return"idea";
  if(hasAny(t,["مشروع قائم","شركه قائمه","شركة قائمة","عندي شركه","عندي شركة","شغال بالفعل","المشروع شغال"]))return"existing";
  return null;
}
function detectPlan(raw:string):"reserve"|"full"|null{
  const t=norm(raw);
  if(hasAny(t,["2000","الفين","ألفين","حجز مقعد","ثبت","تثبيت","احجز"]))return"reserve";
  if(hasAny(t,["4500","اربعه ونص","أربعة ونص","كامل","دفع كامل","السداد الكامل"]))return"full";
  return null;
}
function firstName(name:string|null){return clean(name||"",80).split(/\s+/)[0]||"";}

async function fetchProfile(psid:string,token:string){
  try{
    const r=await fetch(`${GRAPH}/${encodeURIComponent(psid)}?fields=first_name,last_name&access_token=${encodeURIComponent(token)}`);
    if(!r.ok)return"";
    const d:any=await r.json();
    return clean([d?.first_name,d?.last_name].filter(Boolean).join(" "),120);
  }catch{return"";}
}
async function sendMessenger(s:any,pageId:string,token:string,conversationId:string,to:string,body:string){
  const q=await s.rpc("sales_v1_queue_outbound",{p_conversation_id:conversationId,p_recipient:to,p_body:body});
  if(q.error||!q.data)throw new Error("outbox_queue_failed");
  const outboxId=q.data;
  try{
    const r=await fetch(`${GRAPH}/${encodeURIComponent(pageId)}/messages`,{
      method:"POST",
      headers:{authorization:"Bearer "+token,"content-type":"application/json"},
      body:JSON.stringify({recipient:{id:to},messaging_type:"RESPONSE",message:{text:body}})
    });
    let d:any={};try{d=await r.json();}catch{}
    if(!r.ok){
      await s.rpc("sales_v1_mark_outbound",{p_outbox_id:outboxId,p_status:"failed",p_provider_message_id:null,p_error:JSON.stringify(d).slice(0,900)});
      throw new Error("messenger_send_failed");
    }
    const mid=clean(d?.message_id,255);
    await s.rpc("sales_v1_mark_outbound",{p_outbox_id:outboxId,p_status:"sent",p_provider_message_id:mid||null,p_error:null});
    return mid;
  }catch(e){
    try{await s.rpc("sales_v1_mark_outbound",{p_outbox_id:outboxId,p_status:"failed",p_provider_message_id:null,p_error:String(e).slice(0,900)});}catch{}
    throw e;
  }
}
async function createXpayCheckout(s:any,psid:string,plan:"reserve"|"full"){
  const key=Deno.env.get("XPAY_API_KEY")||"";
  if(!key)throw new Error("xpay_not_configured");
  const attribution={utm_source:"messenger",utm_medium:"sales_agent",utm_campaign:"messenger_sales_agent",landing_url:"messenger"};
  const prep=await s.rpc("v36_prepare_checkout",{
    p_plan:plan,p_key_hash:await sha256Text("messenger-sales-v1:"+psid),
    p_new_booking_reference:bookingRef(),p_customer_phone:"",
    p_first_touch:attribution,p_last_touch:attribution,p_diagnosis:{}
  });
  if(prep.error||!prep.data){
    const m=String(prep.error?.message||"");
    if(m.includes("cohort_full"))throw new Error("cohort_full");
    if(m.includes("rate_limited"))throw new Error("rate_limited");
    throw new Error("checkout_prepare_failed");
  }
  const p=Array.isArray(prep.data)?prep.data[0]:prep.data;
  const amount=Number(p.amount_minor||0),enrollmentId=p.enrollment_id,bookingReference=p.booking_reference,createdNew=!!p.created_new;
  const labels:any={
    reserve:{name:"تثبيت مقعد — التشخيص قبل الحل",description:"الدفعة الأولى: 2,000 جنيه الآن ثم استكمال 2,500 جنيه قبل أول تدريب فعلي."},
    full:{name:"اشتراك كامل — التشخيص قبل الحل",description:"السداد الكامل 4,500 جنيه لبرنامج التشخيص قبل الحل."}
  };
  const xr=await fetch(XPAY_API,{
    method:"POST",
    headers:{authorization:"Bearer "+key,"content-type":"application/json"},
    body:JSON.stringify({
      mode:"payment",uiMode:"hosted",submitType:"BOOK",currency:"EGP",expiresAfterMinutes:180,locale:"ar",
      customerCreation:"always",nameCollection:true,phoneNumberCollection:true,
      cancelUrl:"https://lo3betbusiness.com/#offer",
      afterCompletion:{type:"redirect",redirect:{url:"https://lo3betbusiness.com/payment-success/?session_id={CHECKOUT_SESSION_ID}"}},
      metadata:{source:"lo3bet_v35",enrollment_id:enrollmentId,booking_reference:bookingReference,payment_kind:plan,utm_source:"messenger",utm_medium:"sales_agent",utm_campaign:"messenger_sales_agent"},
      lineItems:[{priceData:{currency:"EGP",unitAmount:amount,productData:{name:labels[plan].name,description:labels[plan].description,image:"https://lo3betbusiness.com/assets/%D8%B4%D8%B9%D8%A7%D8%B1_%D9%84%D8%B9%D8%A8%D8%A9_%D8%A7%D9%84%D8%A8%D8%B2%D9%86%D8%B3.webp",metadata:{booking_reference:bookingReference,payment_kind:plan}}},quantity:1}]
    })
  });
  let xd:any={};try{xd=await xr.json();}catch{}
  if(!xr.ok||!xd?.id||!xd?.url){
    if(createdNew)await s.from("course_enrollments").update({status:"cancelled"}).eq("id",enrollmentId);
    throw new Error("xpay_create_failed");
  }
  const pay=await s.from("course_payments").insert({enrollment_id:enrollmentId,provider:"xpay",provider_reference:xd.id,payment_kind:plan,amount_minor:amount,currency:"EGP",status:"pending",attribution});
  if(pay.error&&pay.error.code!=="23505")console.error("messenger_payment_pending_insert_failed",pay.error);
  return{url:xd.url,sessionId:xd.id,bookingReference};
}
function responseFor(intent:Intent,text:string,ctx:any){
  const name=firstName(ctx.display_name),hi=name?`يا ${name}`:"أهلاً بيك";
  const detected=detectProjectStage(text);
  const effective=detected||(ctx.project_stage!=="unknown"?ctx.project_stage:null);
  if(intent==="stop")return{text:"تمام، مش هنبعت لك رسائل متابعة. لو احتجتنا في أي وقت ابعت لنا أنت.",state:"closed",lead:"lost",handoff:false,stage:detected};
  if(intent==="human")return{text:"تمام 👌 هوقف الرد الآلي هنا وسجلت إنك محتاج حاتم/فريق لعبة البزنس يكملوا معاك مباشرة.",state:"handoff",lead:"handoff",handoff:true,reason:"requested_human",stage:detected};
  if(intent==="consulting")return{text:"لو احتياجك استشارة خاصة لمشروعك مش البرنامج التدريبي، الأفضل حاتم يكمل معاك بنفسه بعد فهم الحالة الأول. سجلت طلبك للتحويل البشري.",state:"handoff",lead:"handoff",handoff:true,reason:"consulting_request",interest:"consulting",stage:detected};
  if(!effective&&["greeting","details","fit","unknown"].includes(intent))return{text:`${hi} 👋 أنا مساعد لعبة البزنس مع حاتم. عشان أقولك البرنامج مناسب ليك فعلًا: أنت عندك *فكرة مشروع* ولسه بتختبرها، ولا عندك *مشروع قائم* وعايز تاخد قرار أو تحل مشكلة؟`,state:"qualifying",lead:"engaged",handoff:false};
  if(intent==="price")return{text:"السعر الحالي للدفعة الأولى *4,500 جنيه*. تقدر تثبت المقعد بـ *2,000 جنيه* الآن + *2,500 جنيه* قبل أول تدريب فعلي، أو تسدد *4,500 جنيه* كامل. لو جاهز اكتب «احجز 2000» أو «دفع كامل».",state:"qualified",lead:"qualified",handoff:false,stage:detected};
  if(intent==="schedule")return{text:"الجلسة التعريفية الخميس *1 أكتوبر* 7:30 م، وأول تدريب فعلي الأحد *4 أكتوبر*. بعد كده الأحد والأربعاء 7:30–8:30 م لمدة 12 أسبوعًا: 24 جلسة تدريب + الجلسة التعريفية، والتسجيلات متاحة 6 شهور.",state:"qualified",lead:"qualified",handoff:false,stage:detected};
  if(intent==="refund")return{text:"الاسترداد متاح بعد أول تدريب فعلي يوم 4 أكتوبر بشرط تقديم الطلب قبل الأربعاء 7 أكتوبر الساعة 7:30 م بتوقيت مصر، وفق الشروط المكتوبة.",state:"qualified",lead:"qualified",handoff:false,stage:detected};
  if(intent==="objection_price")return{text:"فاهم اعتراض السعر. عشان كده عندك تثبيت المقعد بـ *2,000 جنيه* والباقي *2,500 جنيه* قبل أول تدريب. المهم تحجز فقط لو البرنامج مناسب لقرار فعلي عندك، مش لمجرد الحماس.",state:"qualified",lead:"qualified",handoff:false,objection:"price",stage:detected};
  if(intent==="objection_time")return{text:"الجلسات ساعتين أسبوعيًا إجمالًا، والتسجيلات متاحة *6 شهور*. التطبيق بين الجلسات مهم؛ لو مش هتقدر تطبق، الأفضل نكون واضحين قبل الحجز.",state:"qualified",lead:"qualified",handoff:false,objection:"time",stage:detected};
  if(intent==="details"||intent==="fit"){
    const track=effective==="idea"?"بما إنك في مرحلة الفكرة، المسار بيركز على اختبار المشكلة والعميل والطلب والتسعير والأرقام قبل التنفيذ.":effective==="existing"?"بما إن عندك مشروع قائم، المسار بيركز على تشخيص السيولة والتسعير والمبيعات والاختناقات والمؤشرات قبل القرار.":"البرنامج له مسارين: فكرة/تحت التأسيس، ومشروع قائم.";
    return{text:`${track}\n\nالناتج النهائي: *ملف قرار مبني على دليل وأرقام + خطة 90 يوم*. المجموعة بحد أقصى 20 شخص، وأول دفعة لها وصول كامل لأداة الـAI لمدة 6 شهور.\n\nاكتب «السعر» أو ابعت سؤالك المحدد.`,state:"qualified",lead:"qualified",handoff:false,stage:detected};
  }
  return{text:`${hi}، وصلتني رسالتك. ابعت لي الجزء اللي يهمك: *السعر، المواعيد، هل البرنامج مناسب لحالتك، أو الحجز*. ولو محتاج حاتم شخصيًا اكتب «حاتم».`,state:effective?"qualified":"qualifying",lead:effective?"qualified":"engaged",handoff:false,stage:detected};
}

Deno.serve(async(req:Request)=>{
  const verifyToken=Deno.env.get("MESSENGER_VERIFY_TOKEN")||"";
  const pageToken=Deno.env.get("MESSENGER_PAGE_ACCESS_TOKEN")||"";
  const pageId=Deno.env.get("MESSENGER_PAGE_ID")||"";
  const appSecret=Deno.env.get("META_APP_SECRET")||"";

  if(req.method==="GET"){
    const u=new URL(req.url);
    if(u.searchParams.get("hub.mode")==="subscribe"){
      const supplied=u.searchParams.get("hub.verify_token")||"";
      const challenge=u.searchParams.get("hub.challenge")||"";
      if(verifyToken&&timingSafeText(supplied,verifyToken))return new Response(challenge,{status:200});
      return new Response("Forbidden",{status:403});
    }
    return json({ok:true,service:"lo3bet-messenger-sales-agent",version:"1.0.0",graph_version:GRAPH_VERSION,configured:{verify_token:!!verifyToken,page_access_token:!!pageToken,page_id:!!pageId,app_secret:!!appSecret,xpay:!!Deno.env.get("XPAY_API_KEY")}});
  }
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  if(!verifyToken||!pageToken||!pageId||!appSecret)return json({error:"messenger_not_configured"},503);

  const raw=await req.text();
  if(!(await verifyMetaSignature(raw,req.headers.get("x-hub-signature-256"),appSecret)))return json({error:"invalid_signature"},401);
  let payload:any={};try{payload=JSON.parse(raw);}catch{return json({error:"invalid_json"},400);}
  if(payload?.object!=="page")return json({ok:true,ignored:"not_page"});

  const s=adminClient();
  const events=(payload?.entry||[]).flatMap((e:any)=>e?.messaging||[]);
  for(const event of events){
    const sender=clean(event?.sender?.id,80),recipient=clean(event?.recipient?.id,80);
    if(!sender||sender===pageId||recipient!==pageId)continue;
    if(event?.message?.is_echo)continue;
    const providerId=clean(event?.message?.mid||event?.postback?.mid,255);
    const body=clean(event?.message?.text||event?.message?.quick_reply?.payload||event?.postback?.payload||event?.postback?.title,4000);
    const type=event?.postback?"postback":event?.message?.quick_reply?"quick_reply":"text";
    const profile=await fetchProfile(sender,pageToken);

    const ingest=await s.rpc("sales_v2_ingest_message",{p_channel:"messenger",p_external_user_id:sender,p_display_name:profile||null,p_provider_message_id:providerId||null,p_body:body,p_message_type:type});
    if(ingest.error||!ingest.data){console.error("messenger_ingest_failed",ingest.error);continue;}
    const ctx=ingest.data;
    if(ctx.duplicate||ctx.human_handoff)continue;

    if(!body){
      await sendMessenger(s,pageId,pageToken,ctx.conversation_id,sender,"وصلتني الرسالة، لكن عشان أرد عليك بدقة ابعت لي سؤالك كنص. ولو محتاج حاتم شخصيًا اكتب «حاتم».");
      continue;
    }

    const intent=detectIntent(body),stage=detectProjectStage(body),plan=detectPlan(body);
    if(intent==="payment"&&plan){
      try{
        const checkout=await createXpayCheckout(s,sender,plan);
        const label=plan==="reserve"?"2,000 جنيه لتثبيت المقعد":"4,500 جنيه للسداد الكامل";
        await s.rpc("sales_v1_update_state",{p_conversation_id:ctx.conversation_id,p_state:"payment_sent",p_intent:"payment",p_lead_stage:"payment_link_sent",p_project_stage:stage,p_interest:"course",p_objection:null,p_handoff:false,p_handoff_reason:null,p_payment_plan:plan,p_booking_reference:checkout.bookingReference,p_xpay_session_id:checkout.sessionId});
        await sendMessenger(s,pageId,pageToken,ctx.conversation_id,sender,`تمام 👌 جهزت لك رابط دفع آمن بقيمة *${label}*:\n${checkout.url}\n\nرقم الحجز: *${checkout.bookingReference}*\nالرابط صالح لمدة 3 ساعات.`);
      }catch(e){
        const reason=String(e?.message||e);
        await s.rpc("sales_v1_log_event",{p_conversation_id:ctx.conversation_id,p_event_type:"checkout_failed",p_details:{channel:"messenger",reason}});
        await s.rpc("sales_v1_update_state",{p_conversation_id:ctx.conversation_id,p_state:"handoff",p_intent:"payment",p_lead_stage:"handoff",p_project_stage:stage,p_interest:"course",p_objection:null,p_handoff:true,p_handoff_reason:"messenger_checkout_failed:"+reason,p_payment_plan:plan,p_booking_reference:null,p_xpay_session_id:null});
        const msg=reason==="cohort_full"?"المجموعة وصلت للحد الأقصى حاليًا. سجلت طلبك وهحوّله لحاتم عشان يراجع معاك أقرب خيار متاح.":"حصلت مشكلة تقنية وأنا بجهز رابط الدفع. سجلت الحالة للتحويل البشري بدل ما أخليك تعيد المحاولة عشوائيًا.";
        await sendMessenger(s,pageId,pageToken,ctx.conversation_id,sender,msg);
      }
      continue;
    }

    if(intent==="payment"&&!plan){
      await s.rpc("sales_v1_update_state",{p_conversation_id:ctx.conversation_id,p_state:"payment_ready",p_intent:"payment",p_lead_stage:"qualified",p_project_stage:stage,p_interest:"course",p_objection:null,p_handoff:false,p_handoff_reason:null,p_payment_plan:null,p_booking_reference:null,p_xpay_session_id:null});
      await sendMessenger(s,pageId,pageToken,ctx.conversation_id,sender,"تمام، نقدر نكمل الحجز دلوقتي. اكتب *احجز 2000* لتثبيت المقعد، أو *دفع كامل* لسداد 4,500 جنيه. مش هطلع رابط دفع قبل ما تختار أنت.");
      continue;
    }

    const r=responseFor(intent,body,ctx);
    await s.rpc("sales_v1_update_state",{p_conversation_id:ctx.conversation_id,p_state:r.state||null,p_intent:intent,p_lead_stage:r.lead||null,p_project_stage:r.stage||null,p_interest:r.interest||"course",p_objection:r.objection||null,p_handoff:r.handoff??false,p_handoff_reason:r.reason||null,p_payment_plan:null,p_booking_reference:null,p_xpay_session_id:null});
    await sendMessenger(s,pageId,pageToken,ctx.conversation_id,sender,r.text);
  }
  return json({ok:true});
});