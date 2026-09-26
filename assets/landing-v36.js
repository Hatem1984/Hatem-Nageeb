/* contact-tracking */
(function(){
  document.querySelectorAll('[data-track-contact]').forEach(function(el){
    el.addEventListener('click',function(){
      var href=String(this.getAttribute('href')||'');
      var channel=href.indexOf('wa.me')>-1?'whatsapp':href.indexOf('m.me')>-1?'messenger':'contact';
      try{fbq('trackCustom','ContactClick',{channel:channel})}catch(e){}
      try{gtag('event','contact_click',{method:channel})}catch(e){}
    });
  });

  document.querySelectorAll('[data-track-leadmagnet]').forEach(function(el){
    el.addEventListener('click',function(){
      try{fbq('trackCustom','DiagnosticToolClick')}catch(e){}
      try{gtag('event','diagnostic_tool_click')}catch(e){}
    });
  });

  function revealHashTarget(){
    if(!window.location.hash) return;
    var target=document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if(target && target.tagName==='DETAILS') target.open=true;
  }
  document.querySelectorAll('a[href^="#"]').forEach(function(el){
    el.addEventListener('click',function(){
      var target=document.getElementById(decodeURIComponent(this.getAttribute('href').slice(1)));
      if(target && target.tagName==='DETAILS') target.open=true;
    });
  });
  window.addEventListener('hashchange',revealHashTarget);
  revealHashTarget();

})();

function copyPay(value,label){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(value).then(function(){
      alert(label + ' — تم نسخ الرقم: ' + value);
    }).catch(function(){ prompt('انسخ الرقم:', value); });
  } else {
    prompt('انسخ الرقم:', value);
  }
}

/* premium-glass-script */
document.addEventListener('DOMContentLoaded', function () {
  const items = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  items.forEach((el, idx) => {
    el.style.transitionDelay = Math.min(idx * 0.03, 0.22) + 's';
    io.observe(el);
  });

  document.querySelectorAll('.lift-hover').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 851) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      card.style.transform = `translateY(-5px) rotateX(${(-y * 2.5).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
});

/* live-icon-motion */
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.live-icon').forEach((icon, idx)=>{
    icon.style.animation = `iconFloat ${4.8 + (idx%4)*0.35}s ease-in-out ${idx*0.04}s infinite`;
  });
});

/* payment-funnel-script */
document.addEventListener('DOMContentLoaded', function(){
  const modal = document.getElementById('paymentModal');
  const amountBtns = modal ? modal.querySelectorAll('[data-payment-plan]') : [];
  const planSummary = document.getElementById('paymentPlanSummary');
  const transferSummary = document.getElementById('paymentTransferSummary');
  let selectedAmount = 2000;
  let selectedPlan = 'reserve';
  let selectedMethod = '';
  let lastPaymentOpener = null;
  let checkoutTracked = false;
  let paymentMethodCheckoutTracked = false;
  const plans = {
    reserve:{amount:2000,summary:'تثبيت المقعد: 2,000 جنيه الآن، ثم 2,500 جنيه قبل أول تدريب فعلي يوم 4 أكتوبر. إجمالي العرض 4,500 جنيه.',transfer:'ابعت الاسم الكامل + Screenshot لإثبات تحويل 2,000 جنيه على WhatsApp. يتأكد المقعد بعد مراجعة التحويل واستلام البيانات.'},
    full:{amount:4500,summary:'السداد الكامل: 4,500 جنيه دفعة واحدة، وبكده تثبت اشتراكك على سعر إطلاق الدفعة الأولى.',transfer:'ابعت الاسم الكامل + Screenshot لإثبات تحويل 4,500 جنيه على WhatsApp. يتأكد الاشتراك بعد مراجعة التحويل واستلام البيانات.'}
  };

  function setPlan(plan){
    selectedPlan = plans[plan] ? plan : 'reserve';
    selectedAmount = plans[selectedPlan].amount;
    amountBtns.forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.paymentPlan === selectedPlan);
    });
    if(planSummary) planSummary.textContent = plans[selectedPlan].summary;
    if(transferSummary) transferSummary.textContent = plans[selectedPlan].transfer;
  }

  function openPayment(plan){
    if(!modal) return;
    lastPaymentOpener = document.activeElement;
    setPlan(plan || 'reserve');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    const closeButton = modal.querySelector('.payment-modal-close');
    if(closeButton) closeButton.focus();

    if(!checkoutTracked){
      checkoutTracked = true;
      try{
        fbq('trackCustom','PaymentModalOpen',{currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
      }catch(e){}
      try{
        gtag('event','payment_modal_open',{currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
      }catch(e){}
    }
  }

  function closePayment(){
    if(!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(lastPaymentOpener&&typeof lastPaymentOpener.focus==='function'){try{lastPaymentOpener.focus();}catch(e){}}
  }

  document.querySelectorAll('.js-open-payment').forEach(el=>{
    el.addEventListener('click', function(e){
      e.preventDefault();
      openPayment(this.dataset.plan || 'reserve');
    });
  });

  amountBtns.forEach(btn=>{
    btn.addEventListener('click',()=>setPlan(btn.dataset.paymentPlan));
  });

  document.querySelectorAll('[data-close-payment]').forEach(el=>{
    el.addEventListener('click', closePayment);
  });

  document.addEventListener('keydown', e=>{
    if(!modal||!modal.classList.contains('open'))return;
    if(e.key === 'Escape'){closePayment();return;}
    if(e.key === 'Tab'){
      const focusable=[...modal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });

  if(modal){
    modal.querySelectorAll('[data-track-payment]').forEach(el=>{
      el.addEventListener('click', async function(e){
        const method = this.dataset.method || 'payment';
        const clicked = this;
        selectedMethod = method;
        if(!paymentMethodCheckoutTracked){
          paymentMethodCheckoutTracked = true;
          try{
            fbq('track','InitiateCheckout',{method:method,currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
          }catch(e){}
          try{
            gtag('event','begin_checkout',{method:method,currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
          }catch(e){}
        }
        try{
          fbq('trackCustom','PaymentMethodClick',{method:method,amount:selectedAmount,payment_plan:selectedPlan,currency:'EGP',placement:'modal'});
        }catch(e){}
        try{
          gtag('event','payment_method_click',{method:method,value:selectedAmount,currency:'EGP',payment_plan:selectedPlan,placement:'modal'});
        }catch(e){}
        if(method==='xpay'){
          e.preventDefault();
          if(clicked.dataset.loading==='1')return;
          clicked.dataset.loading='1';
          const old=clicked.innerHTML;
          clicked.setAttribute('aria-busy','true');
          clicked.classList.add('is-loading');
          const loadingTitle=clicked.querySelector('b');
          const loadingNote=clicked.querySelector('small');
          if(loadingTitle)loadingTitle.textContent='جاري تجهيز الدفع الآمن…';
          if(loadingNote)loadingNote.textContent='ثوانٍ ونحوّلك إلى صفحة XPay';
          try{
            if(!window.Lo3betFunnel)throw new Error('funnel_unavailable');
            await window.Lo3betFunnel.startCheckout(selectedPlan);
          }catch(err){
            clicked.dataset.loading='0';clicked.removeAttribute('aria-busy');clicked.classList.remove('is-loading');clicked.innerHTML=old;
            alert('تعذر فتح الدفع الإلكتروني الآن. جرّب مرة أخرى أو استخدم InstaPay / المحفظة.');
          }
        }else if(method==='instapay'||method==='mobile_wallet'){
          e.preventDefault();
          location.href='/manual-payment/?plan='+encodeURIComponent(selectedPlan)+'&method='+encodeURIComponent(method);
        }
      });
    });
  }

});

/* first-session-countdown-script */
(function(){
  const el = document.getElementById('first-session-countdown');
  if(!el) return;
  const target = new Date('2026-10-04T19:30:00+03:00').getTime();
  const d = el.querySelector('[data-fs-days]');
  const h = el.querySelector('[data-fs-hours]');
  const m = el.querySelector('[data-fs-mins]');
  const s = el.querySelector('[data-fs-secs]');

  function tick(){
    const diff = target - Date.now();
    if(diff <= 0){
      el.classList.add('is-live');
      const units = el.querySelector('.countdown-units');
      units.innerHTML = '<div><strong>بدأ التدريب</strong><span>تواصل للتأكد من إمكانية الانضمام</span></div>';
      return;
    }
    const sec = Math.floor(diff/1000);
    d.textContent = Math.floor(sec/86400);
    h.textContent = String(Math.floor((sec%86400)/3600)).padStart(2,'0');
    m.textContent = String(Math.floor((sec%3600)/60)).padStart(2,'0');
    s.textContent = String(sec%60).padStart(2,'0');
  }
  tick();
  setInterval(tick,1000);
})();

/* conversion-payment-script */
document.addEventListener('DOMContentLoaded',function(){
  var xpay=document.getElementById('xpayCardPayment');
  var title=document.getElementById('xpayCardTitle');

  function activePlan(){
    var active=document.querySelector('.amount-option.active[data-payment-plan]');
    return active?active.getAttribute('data-payment-plan'):'reserve';
  }
  function syncXpay(){
    if(!xpay)return;
    var plan=activePlan();
    var full=plan==='full';
    xpay.href='#';
    if(title)title.textContent=full?'ادفع إلكترونيًا عبر XPay — 4,500 جنيه':'ادفع إلكترونيًا عبر XPay — 2,000 جنيه';
  }

  document.querySelectorAll('[data-payment-plan],.js-open-payment').forEach(function(el){
    el.addEventListener('click',function(){setTimeout(syncXpay,0);});
  });

  var choice=document.querySelector('.payment-method-choice');
  var wallet=null,instapay=null;
  if(choice){
    wallet=choice.querySelector('.payment-method-card.mobile-wallet');
    instapay=choice.querySelector('.payment-method-card.instapay');
    if(wallet||instapay){
      var details=document.createElement('details');
      details.className='manual-payment-options';
      var summary=document.createElement('summary');
      summary.textContent='أو حوّل يدويًا — InstaPay / محفظة إلكترونية';
      var inner=document.createElement('div');
      inner.className='manual-payment-inner';
      if(instapay)inner.appendChild(instapay);
      if(wallet)inner.appendChild(wallet);
      var confirmLink=document.createElement('a');
      confirmLink.className='manual-confirm-link';
      confirmLink.id='manualPaymentConfirmLink';
      confirmLink.textContent='حوّلت بالفعل؟ سجّل بيانات التحويل لتأكيد الحجز';
      inner.appendChild(confirmLink);
      details.appendChild(summary);
      details.appendChild(inner);
      choice.appendChild(details);
    }
  }

  var selectedManualMethod='';
  [instapay,wallet].forEach(function(el){
    if(!el)return;
    el.addEventListener('click',function(){
      selectedManualMethod=el.getAttribute('data-method')||'';
      syncManualConfirm();
    });
  });

  function syncManualConfirm(){
    var link=document.getElementById('manualPaymentConfirmLink');
    if(!link)return;
    var href='/manual-payment/?plan='+encodeURIComponent(activePlan());
    if(selectedManualMethod)href+='&method='+encodeURIComponent(selectedManualMethod);
    link.href=href;
  }
  document.querySelectorAll('[data-payment-plan],.js-open-payment').forEach(function(el){
    el.addEventListener('click',function(){setTimeout(syncManualConfirm,0);});
  });
  syncXpay();
  syncManualConfirm();

  fetch('https://mjavabuxdhueziecypdy.supabase.co/functions/v1/seat-count',{cache:'no-store'})
    .then(function(r){if(!r.ok)throw new Error('seat-count');return r.json();})
    .then(function(s){
      var h=document.getElementById('seatCountHeadline');
      var d=document.getElementById('seatCountDetail');
      if(!h||!d||typeof s.booked!=='number')return;
      h.textContent='الحد الأقصى '+s.capacity+' مقعدًا';
      d.textContent='الدفعة الأولى محدودة · تثبيت المقعد بـ2,000 جنيه';
    }).catch(function(){});

  var requested=new URLSearchParams(window.location.search).get('payment');
  if(requested==='reserve'||requested==='full'){
    window.setTimeout(function(){
      var trigger=document.querySelector('.js-open-payment[data-plan="'+requested+'"]');
      if(trigger)trigger.click();
    },80);
  }
});