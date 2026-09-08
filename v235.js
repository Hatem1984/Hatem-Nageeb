/* V23.5 — final premium conversion behavior */
(function(){
  function init(){
    // Fix academy visual identity and keep both partner marks on the same visual canvas.
    document.querySelectorAll('img[src*="tbt_academy_logo_v23"],img[src*="tbt_academy_logo.svg?v=final-234"]').forEach(function(img){
      img.src='tbt_academy_logo.svg?v=v235';
      var card=img.closest('.partner-logo');
      if(card) card.classList.add('academy-partner');
    });

    // Add the AI hook higher in the sales journey, before proof.
    if(!document.getElementById('ai-hook')){
      var proof=document.getElementById('proof');
      if(proof){
        var section=document.createElement('section');
        section.className='section ai-hook-section';
        section.id='ai-hook';
        section.innerHTML=`
          <div class="wrap">
            <div class="ai-hook-shell lux-reveal">
              <div class="ai-hook-copy">
                <div class="kicker">ميزة إطلاق للدفعة الأولى</div>
                <h2><span class="ai-gradient-text">AI التشخيص قبل الحل</span> — مساعد ذكي يختصر عليك أول خطوة في التشخيص.</h2>
                <p class="lead">بدل ما تبدأ من صفحة فاضية، الأداة عند تفعيلها هتساعدك ترتب بيانات مشروعك، تفرّق بين المؤشرات والمعلومات الناقصة، وتحدد إيه اللي محتاج فحص قبل ما تاخد قرار.</p>
                <div class="ai-free-banner"><b>6 أشهر استخدام مجاني للدفعة الأولى</b><span>تبدأ من تاريخ تفعيل حسابك على الأداة — بدون تكلفة إضافية على اشتراك البرنامج.</span></div>
                <div class="ai-how-grid">
                  <div><span>01</span><b>دخل بيانات مشروعك</b><small>مبيعات، تكلفة، تشغيل، عميل أو القرار اللي محتاج تراجعه.</small></div>
                  <div><span>02</span><b>رتّب مؤشرات التشخيص</b><small>الأداة تساعدك تفصل بين الحقيقة والافتراض والمعلومة الناقصة.</small></div>
                  <div><span>03</span><b>شوف أولويات الفحص</b><small>إيه اللي محتاج تسأل عنه أو تختبره قبل التنفيذ.</small></div>
                  <div><span>04</span><b>استخدمها داخل ملف القرار</b><small>النتيجة تساعدك تكمل المنهج أسرع، مش تستبدل فهمك للمشروع.</small></div>
                </div>
                <div class="actions ai-hook-actions">
                  <a class="cta" href="#offer" data-track-pricing>احجز مكانك وخد 6 أشهر عند التفعيل</a>
                  <span class="ai-dev-note">تصور مبدئي للواجهة — الأداة قيد التطوير.</span>
                </div>
              </div>
              <div class="ai-hook-visual" aria-label="تصور افتراضي لواجهة AI التشخيص قبل الحل">
                <div class="ai-browser">
                  <div class="ai-browser-top"><i></i><i></i><i></i><b>AI التشخيص قبل الحل</b></div>
                  <div class="ai-browser-body">
                    <aside class="ai-side-nav"><span>AI</span><i></i><i></i><i></i><i></i></aside>
                    <div class="ai-dashboard">
                      <div class="ai-dash-head"><div><small>لوحة التشخيص</small><b>نظرة سريعة على المشروع</b></div><span>تحليل جديد</span></div>
                      <div class="ai-metrics">
                        <article><small>وضوح البيانات</small><strong>72%</strong><em class="v235-meter"><i style="width:72%"></i></em></article>
                        <article><small>معلومات ناقصة</small><strong>4</strong><em>قبل القرار</em></article>
                        <article><small>أولوية الفحص</small><strong>عالية</strong><em>السيولة والتسعير</em></article>
                      </div>
                      <div class="ai-dashboard-grid">
                        <div class="ai-chart-card"><b>مؤشرات المشروع</b><div class="ai-bars"><i style="height:38%"></i><i style="height:58%"></i><i style="height:76%"></i><i style="height:92%"></i><i style="height:68%"></i></div><small>تصور توضيحي للواجهة</small></div>
                        <div class="ai-focus-card"><b>قبل ما تقرر</b><ul><li>راجع توقيت التحصيل</li><li>اختبر أثر تغيير السعر</li><li>كمّل بيانات التكلفة</li></ul><button type="button">بناء ملخص التشخيص</button></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="ai-float-card fc-one"><b>تشخيص أسرع</b><span>أسئلة منظمة بدل التخمين</span></div>
                <div class="ai-float-card fc-two"><b>خطوات أوضح</b><span>أولويات قبل التنفيذ</span></div>
              </div>
            </div>
          </div>`;
        proof.parentNode.insertBefore(section,proof);
      }
    }

    // Make value-for-money unmistakable at the pricing moment.
    var offer=document.getElementById('offer');
    if(offer && !offer.querySelector('.offer-value-ribbon')){
      var lead=offer.querySelector('.lead');
      if(lead){
        var ribbon=document.createElement('div');
        ribbon.className='offer-value-ribbon lux-reveal';
        ribbon.innerHTML='<span>25 لقاء مباشرًا</span><span>24 أداة تطبيقية</span><span>كتاب رقمي</span><span>تسجيلات 6 أشهر</span><span>AI لمدة 6 أشهر عند التفعيل</span><b>كل ده ضمن عرض الإطلاق</b>';
        lead.insertAdjacentElement('afterend',ribbon);
      }
    }

    // Premium scroll choreography. No external animation library, so load stays light.
    var selectors='.section h2,.section .lead,.item,.stage-card,.guided,.tool-mini,.authority-point,.price-card,.pay-plan,.trust-item,.ai-hook-shell,.offer-value-ribbon';
    var nodes=[].slice.call(document.querySelectorAll(selectors));
    nodes.forEach(function(el,i){
      el.classList.add('lux-reveal');
      el.style.transitionDelay=Math.min((i%4)*55,165)+'ms';
    });
    if(!('IntersectionObserver' in window)){
      nodes.forEach(function(el){el.classList.add('lux-visible');});
      return;
    }
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('lux-visible');io.unobserve(e.target);}
      });
    },{threshold:.10,rootMargin:'0px 0px -6% 0px'});
    nodes.forEach(function(el){io.observe(el);});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
