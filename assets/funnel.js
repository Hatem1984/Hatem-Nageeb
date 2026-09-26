(function(){
  'use strict';
  const ATTR_KEY='lb_attribution_v35';
  const DIAG_KEY='lb_diagnosis_summary_v35';
  const ATTR_FIELDS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'];
  function clean(v,max){return String(v==null?'':v).trim().slice(0,max||220);}
  function cookie(name){
    const m=document.cookie.match(new RegExp('(?:^|; )'+name.replace(/([.$?*|{}()\[\]\\/+^])/g,'\\$1')+'=([^;]*)'));
    return m?decodeURIComponent(m[1]):'';
  }
  function readCurrent(){
    const p=new URLSearchParams(location.search), out={};
    ATTR_FIELDS.forEach(k=>{const v=clean(p.get(k));if(v)out[k]=v;});
    const fbclid=out.fbclid||'';
    out.fbp=clean(cookie('_fbp'));
    out.fbc=clean(cookie('_fbc'))||(fbclid?'fb.1.'+Date.now()+'.'+fbclid:'');
    out.referrer=clean(document.referrer,500);
    out.landing_url=clean(location.href,500);
    return out;
  }
  function capture(){
    let state={first_touch:{},last_touch:{},captured_at:''};
    try{state=Object.assign(state,JSON.parse(localStorage.getItem(ATTR_KEY)||'{}'));}catch(e){}
    const now=readCurrent();
    const hasCampaign=ATTR_FIELDS.some(k=>now[k]);
    if(!state.captured_at || (hasCampaign && !Object.keys(state.first_touch||{}).length)){
      state.first_touch=Object.assign({},now);
      state.captured_at=new Date().toISOString();
    }
    if(hasCampaign || !Object.keys(state.last_touch||{}).length) state.last_touch=Object.assign({},now);
    try{localStorage.setItem(ATTR_KEY,JSON.stringify(state));}catch(e){}
    return state;
  }
  function attribution(){
    const state=capture(), a=Object.assign({},state.first_touch||{},state.last_touch||{});
    a.first_touch=state.first_touch||{};
    a.last_touch=state.last_touch||{};
    return a;
  }
  function setDiagnosis(data){
    const allowed=['stage','decision_type','score_band','evidence_band','risk_band'];
    const safe={};allowed.forEach(k=>{if(data&&data[k]!=null&&data[k]!=='')safe[k]=clean(data[k],80);});
    try{localStorage.setItem(DIAG_KEY,JSON.stringify(safe));}catch(e){}
    return safe;
  }
  function diagnosis(){try{return JSON.parse(localStorage.getItem(DIAG_KEY)||'{}')||{};}catch(e){return {};}}
  async function startCheckout(plan,extra){
    const payload=Object.assign({plan:plan,attribution:attribution(),diagnosis:diagnosis()},extra||{});
    const r=await fetch('https://mjavabuxdhueziecypdy.supabase.co/functions/v1/checkout-session',{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.checkout_url){
      const e=new Error(d.error||'checkout_unavailable');e.data=d;throw e;
    }
    try{
      if(typeof fbq==='function')fbq('trackCustom','PaymentStarted',{payment_plan:plan,value:d.amount,currency:'EGP'});
      if(typeof gtag==='function')gtag('event','payment_started',{payment_plan:plan,value:d.amount,currency:'EGP'});
    }catch(e){}
    location.href=d.checkout_url;
    return d;
  }
  window.Lo3betFunnel={capture:capture,attribution:attribution,setDiagnosis:setDiagnosis,diagnosis:diagnosis,startCheckout:startCheckout};
  capture();
})();