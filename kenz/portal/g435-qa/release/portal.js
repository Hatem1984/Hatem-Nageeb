/* KENZ G4.35 QA-only UX candidate based on live /portal.js?v=129, 2026-10-21.
   No payment logic, credentials, Supabase schema or real customer writes.
   This is NOT a production deployment. */
const PORTAL_API='https://mjavabuxdhueziecypdy.supabase.co/functions/v1/factory-customer-portal';
const PORTAL_COMMERCE_API='https://mjavabuxdhueziecypdy.supabase.co/functions/v1/factory-commerce-api';
const moneyMinor=(n,c='EGP')=>new Intl.NumberFormat('ar-EG',{style:'currency',currency:c||'EGP',maximumFractionDigits:0}).format((Number(n)||0)/100);
const escp=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const statusText=s=>({
 paid:'تم الدفع',pending:'قيد الانتظار',cancelled:'ملغي',failed:'لم يكتمل',
 unpaid:'غير مدفوع',pending_review:'بانتظار تأكيد الدفع',manual_review:'تحت المراجعة',
 awaiting_transfer:'بانتظار التحويل',verified:'تم التحقق',submitted:'تم إرسال الإثبات'
}[s]||s||'قيد المعالجة');

function portalAccessToken(forceContact=false){
 if(forceContact)return '';
 const q=new URLSearchParams(location.search).get('token');
 if(q)return q;
 try{return JSON.parse(localStorage.getItem('kenz_last_order_v1')||'null')?.access_token||''}catch{return ''}
}
async function lookupOrder(form,preferContact=false){
 const d=new FormData(form);
 // Explicit order-ref + contact recovery must override a stale saved bearer token.
 const explicitRecovery=preferContact&&String(d.get('order_ref')||'').trim()&&
   (String(d.get('phone')||'').trim()||String(d.get('email')||'').trim());
 const token=portalAccessToken(Boolean(explicitRecovery));
 const body=token?{action:'lookup',access_token:token}:{action:'lookup',order_ref:d.get('order_ref'),email:d.get('email'),phone:d.get('phone')};
 const r=await fetch(PORTAL_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 const j=await r.json();
 if(!r.ok)throw new Error(j.error||'lookup_failed');
 return {j,auth:body}
}
function orderCard(j,downloads=false){
 const o=j.order||{},paid=o.status==='paid'&&o.payment_status==='paid';
 return '<div class="portal-summary">'+
 '<div><small>رقم الطلب</small><b>'+escp(o.order_ref)+'</b></div>'+
 '<div><small>الحالة</small><b class="'+(paid?'status-ok':'')+'">'+escp(statusText(o.payment_status||o.status))+'</b></div>'+
 (downloads?'':'<div><small>إجمالي الطلب وقت الشراء</small><b>'+moneyMinor(o.total_minor,o.currency)+'</b></div>')+
 '<div><small>طريقة الدفع</small><b>'+escp(o.payment_method==='xpay'?'XPay':o.payment_method)+'</b></div>'+
 '</div>'
}
function itemList(j,downloads=false){
 const items=j.items||[];
 if(!items.length)return '<div class="portal-empty">لا توجد منتجات مرتبطة بالطلب.</div>';
 return '<div class="portal-items">'+items.map(x=>'<article class="portal-item"><div><small>'+escp(x.product_type||'منتج رقمي')+'</small><h3>'+escp(x.title)+'</h3><p>'+(x.ready?'جاهز للتحميل':'الملف غير متاح للتحميل حتى الآن')+'</p></div>'+(downloads?'<button class="btn btn-dark" data-download="'+escp(x.slug)+'" '+(x.ready?'':'disabled')+'>إنشاء رابط تحميل</button>':'<span class="status-pill '+(x.ready?'ok':'')+'">'+(x.ready?'جاهز':'قيد التجهيز')+'</span>')+'</article>').join('')+'</div>'
}
function manualPaymentBlock(j){
 const o=j.order||{},m=o.manual_payment,paid=o.status==='paid'&&o.payment_status==='paid';
 if(paid||!m)return '';
 if(m.proof_received)return '<section class="proof-primary portal-proof"><h4>تم استلام إيصال الدفع ✓</h4><p>الدفع تحت المراجعة الآن. لا تعيد التحويل.</p><div class="paystatus" data-portal-live-status>جاري متابعة حالة الدفع تلقائيًا…</div></section>';
 const canUpload=(m.status==='pending_review'||o.payment_status==='pending_review'||o.payment_status==='manual_review'||o.payment_status==='awaiting_transfer');
 if(!canUpload)return '';
 const method=o.payment_method==='instapay'?'InstaPay':'الدفع';
 return '<section class="proof-primary portal-proof"><h4>أكمل '+escp(method)+' من هنا</h4><p>لو حولت بالفعل، ارفع صورة الإيصال هنا. تقدر تعمل الخطوة دي حتى لو قفلت صفحة الدفع ورجعت لمكتبتي لاحقًا.</p><form class="manualform" data-portal-proof><label>صورة الإيصال<input type="file" name="proof" accept="image/jpeg,image/png,image/webp,application/pdf" required></label><button class="btn btn-gold wide" type="submit">رفع الإيصال للتحقق</button></form><div class="portal-proof-msg"></div></section>'
}
function paymentSuccessBlock(j,downloads=false){
 const o=j.order||{},paid=o.status==='paid'&&o.payment_status==='paid';
 if(!paid)return '';
 try{localStorage.removeItem('kenz_cart_v1')}catch{}
 return '<section class="proof-primary portal-proof"><h4>✅ تم تأكيد الدفع</h4><p>تم اعتماد دفعتك بنجاح. '+(downloads?'منتجاتك جاهزة للتحميل من الأسفل.':'تقدر تفتح مكتبتك وتحمل مشترياتك الآن.')+'</p>'+(downloads?'':'<a class="btn btn-gold wide" href="/downloads/?auto=1">فتح مكتبتي الآن</a>')+'</section>'
}
function startPortalPaymentWatch(form,out,j,downloads=false){
 const o=j.order||{},m=o.manual_payment;
 if(!m?.id||!m.proof_received||o.status==='paid'||o.payment_status==='paid')return;
 let tries=0,stopped=false;
 const tick=async()=>{
  if(stopped)return;
  tries++;
  try{
   const u=PORTAL_COMMERCE_API+'?action=manual_status&order_ref='+encodeURIComponent(o.order_ref)+'&manual_payment_id='+encodeURIComponent(m.id);
   const r=await fetch(u,{headers:{accept:'application/json'},cache:'no-store'});
   const x=r.ok?await r.json():null;
   const live=out.querySelector('[data-portal-live-status]');
   if(x?.order_status==='paid'&&x?.payment_status==='paid'){
    stopped=true;
    if(live)live.textContent='✅ تم تأكيد الدفع. جاري تحديث مكتبتك…';
    try{localStorage.removeItem('kenz_cart_v1')}catch{}
    setTimeout(()=>location.reload(),250);
    return
   }
   if(x?.status==='rejected'||x?.order_status==='cancelled'||x?.payment_status==='cancelled'){
    stopped=true;
    if(live){live.className='portal-error';live.textContent='تعذر تأكيد الدفع. راجع التحويل أو تواصل مع الدعم قبل إعادة الدفع.'}
    return
   }
   if(live)live.textContent='الدفع تحت المراجعة… ستتحدث الصفحة تلقائيًا بعد الاعتماد.'
  }catch{}
  if(tries<150)setTimeout(tick,3000)
 };
 tick()
}
function bindManualProof(out,j){
 const form=out.querySelector('[data-portal-proof]');if(!form)return;
 form.onsubmit=async e=>{
  e.preventDefault();
  const o=j.order||{},m=o.manual_payment,btn=form.querySelector('button[type=submit]'),file=form.querySelector('input[name=proof]')?.files?.[0],msg=out.querySelector('.portal-proof-msg');
  if(!m?.id||!o.order_ref||!file){if(msg)msg.textContent='اختَر صورة الإيصال أولًا.';return}
  btn.disabled=true;btn.textContent='جاري رفع الإيصال…';if(msg)msg.textContent='';
  const fd=new FormData();fd.append('action','upload_proof');fd.append('manual_payment_id',m.id);fd.append('order_ref',o.order_ref);fd.append('proof',file);
  try{
   const r=await fetch(PORTAL_COMMERCE_API,{method:'POST',body:fd});
   const x=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(x.error||'upload_failed');
   form.outerHTML='<div class="paystatus ok">✓ تم استلام الإيصال بنجاح. الطلب الآن تحت المراجعة، وبعد تأكيد الدفع هيتفعل التحميل من مكتبتك هنا، من غير ما تحتاج إيميل.</div>';
  }catch(err){
   if(msg)msg.textContent=err.message==='proof_size_invalid'?'حجم الملف أكبر من المسموح':err.message==='proof_type_invalid'?'نوع الملف غير مدعوم':'تعذر رفع الإيصال. حاول مرة أخرى.';
   btn.disabled=false;btn.textContent='رفع الإيصال للتحقق'
  }
 }
}
function bindPortalForm(){
 const form=document.querySelector('#portalForm');if(!form)return;
 const out=document.querySelector('#portalResult'),downloads=form.dataset.mode==='downloads';
 form.onsubmit=async e=>{
  e.preventDefault();const btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='جاري التحقق…';out.innerHTML='';
  try{
   const {j,auth}=await lookupOrder(form,e.isTrusted===true);
   window.__portalAuth=auth;
   out.innerHTML=paymentSuccessBlock(j,downloads)+orderCard(j,downloads)+manualPaymentBlock(j)+itemList(j,downloads);
   bindManualProof(out,j);
   startPortalPaymentWatch(form,out,j,downloads);
   if(downloads&&form.dataset.autoload==='1')form.closest('.portal-card')?.classList.add('portal-card-verified');
   if(downloads)out.querySelectorAll('[data-download]').forEach(b=>b.onclick=()=>createDownload(b.dataset.download,b))
  }catch(e){
   out.innerHTML='<div class="portal-error">لم نجد طلبًا مطابقًا للبيانات المدخلة. راجع رقم الطلب وبيانات التواصل.</div>'
  }finally{btn.disabled=false;btn.textContent=downloads?'عرض تحميلاتي':'عرض حالة الطلب'}
 }
}
async function createDownload(slug,button){
 const a=window.__portalAuth;if(!a)return;
 button.disabled=true;button.textContent='جاري التجهيز…';
 try{
  const r=await fetch(PORTAL_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...a,action:'create_download',slug})});
  const j=await r.json();
  if(!r.ok){button.textContent=j.error==='file_not_ready'?'الملف غير جاهز':'تعذر إنشاء الرابط';return}
  const link=document.createElement('a');link.href=j.download_url;link.target='_blank';link.rel='noopener';link.className='btn btn-dark';link.textContent='تحميل الآن';button.replaceWith(link)
 }catch{button.textContent='تعذر إنشاء الرابط'}
 finally{if(button.isConnected)button.disabled=false}
}
function autoOpenSavedOrder(){
 const form=document.querySelector('#portalForm');if(!form)return;
 try{
  const saved=JSON.parse(localStorage.getItem('kenz_last_order_v1')||'null');
  const urlToken=new URLSearchParams(location.search).get('token');
  if(urlToken||saved?.access_token){
   form.dataset.autoload='1';
   form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   return
  }
  if(!saved?.order_ref||!saved?.phone)return;
  if(Date.now()-Number(saved.saved_at||0)>90*24*60*60*1000)return;
  const ref=form.querySelector('[name="order_ref"]'),phone=form.querySelector('[name="phone"]');
  if(ref)ref.value=saved.order_ref;if(phone)phone.value=saved.phone;
  form.dataset.autoload='1';
  form.requestSubmit()
 }catch{}
}
document.addEventListener('DOMContentLoaded',()=>{bindPortalForm();setTimeout(autoOpenSavedOrder,60)});
