(function(){
  try{
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init','2667954303602754');fbq('track','PageView');fbq('track','ViewContent',{content_name:'Decision Lab'});
  }catch(e){}
  try{
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){dataLayer.push(arguments)};
    var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-C2N57VGT70';document.head.appendChild(s);
    gtag('js',new Date());gtag('config','G-C2N57VGT70');
  }catch(e){}
})();

(function(){
  function initResultProgramCta(){
    var link=document.querySelector('.back-link');
    var results=document.getElementById('results');
    if(!link||!results)return;

    var style=document.createElement('style');
    style.id='diagnostic-result-cta-style';
    style.textContent='\
      body{padding-bottom:24px!important}\
      .result-program-cta{display:none!important;position:fixed;left:50%;right:auto;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:10000;width:min(760px,calc(100vw - 24px));padding:12px 12px 12px 16px;border:1px solid rgba(255,255,255,.13);border-radius:22px;background:linear-gradient(135deg,rgba(7,17,31,.98),rgba(16,38,78,.98));box-shadow:0 18px 50px rgba(6,18,40,.34);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px}\
      .result-program-cta.is-visible{display:grid!important}\
      .result-program-copy{min-width:0;color:#fff}\
      .result-program-copy b{display:block;margin:0 0 3px;color:#fff;font-size:.86rem;line-height:1.55;font-weight:900}\
      .result-program-copy span{display:block;color:#c8d6e8;font-size:.72rem;line-height:1.65;font-weight:600}\
      .result-program-cta .back-link{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;z-index:auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:56px!important;width:auto!important;max-width:none!important;padding:12px 20px!important;border:0!important;border-radius:16px!important;background:linear-gradient(100deg,#00b8ff 0%,#4f72ff 52%,#7b4dff 100%)!important;color:#fff!important;font-size:.84rem!important;font-weight:900!important;line-height:1.45!important;text-decoration:none!important;white-space:normal!important;text-align:center!important;box-shadow:0 12px 28px rgba(71,94,255,.35)!important;transform:none!important;animation:resultCtaPulse 2.7s ease-in-out infinite!important}\
      .result-program-cta .back-link:after{content:"  ←"!important;font-size:1rem}\
      .result-program-cta .back-link:hover{filter:brightness(1.07);animation-play-state:paused!important}\
      body.result-cta-visible{padding-bottom:122px!important}\
      @keyframes resultCtaPulse{0%,100%{box-shadow:0 12px 28px rgba(71,94,255,.34),0 0 0 0 rgba(44,167,255,0)}50%{box-shadow:0 15px 34px rgba(71,94,255,.44),0 0 0 6px rgba(44,167,255,.09)}}\
      @media(max-width:650px){.result-program-cta{width:calc(100vw - 20px);bottom:max(8px,env(safe-area-inset-bottom));padding:12px;border-radius:20px;grid-template-columns:1fr;gap:9px;text-align:center}.result-program-copy b{font-size:.84rem}.result-program-copy span{font-size:.69rem;line-height:1.55}.result-program-cta .back-link{width:100%!important;min-height:58px!important;padding:12px 14px!important;font-size:.86rem!important;border-radius:15px!important}body.result-cta-visible{padding-bottom:188px!important}}\
      @media(prefers-reduced-motion:reduce){.result-program-cta .back-link{animation:none!important}}';
    document.head.appendChild(style);

    var panel=document.createElement('aside');
    panel.className='result-program-cta';
    panel.id='resultProgramCta';
    panel.setAttribute('aria-hidden','true');
    panel.setAttribute('aria-label','الخطوة التالية بعد نتيجة التشخيص');

    var copy=document.createElement('div');
    copy.className='result-program-copy';
    var title=document.createElement('b');
    title.textContent='عرفت أهم فجوة في قرارك — ما توقفش عند التشخيص.';
    var sub=document.createElement('span');
    sub.textContent='شوف إزاي تحوّل النتيجة لقرار أوضح وخطة تنفيذ تناسب حالتك.';
    copy.appendChild(title);
    copy.appendChild(sub);

    link.textContent='شوف البرنامج مناسب لحالتك إزاي';
    link.setAttribute('aria-label','شوف كيف يساعدك برنامج التشخيص قبل الحل على تطبيق نتيجتك');
    panel.appendChild(copy);
    panel.appendChild(link);
    document.body.appendChild(panel);

    function syncVisibility(){
      var visible=!results.classList.contains('hidden');
      panel.classList.toggle('is-visible',visible);
      panel.setAttribute('aria-hidden',visible?'false':'true');
      document.body.classList.toggle('result-cta-visible',visible);
    }

    syncVisibility();
    var observer=new MutationObserver(syncVisibility);
    observer.observe(results,{attributes:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initResultProgramCta);
  else initResultProgramCta();
})();