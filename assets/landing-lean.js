document.addEventListener('DOMContentLoaded', function(){
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const remove=(s,r=document)=>{const el=qs(s,r); if(el) el.remove();};

  // Step 1: simplify the hero and remove repeated problem statements.
  remove('.hero .lead');
  remove('.hero-pain-strip');

  // Step 2: keep the free diagnostic focused on value + CTA, not a second demo screen.
  const freeTest=qs('#free-test');
  if(freeTest){
    freeTest.classList.add('lean-compact');
    remove('.diagnostic-preview',freeTest);
  }

  // Step 3: keep one video + the three strongest written consultation testimonials.
  const proof=qs('#testimonial');
  if(proof){
    proof.classList.add('lean-compact');
    const keepNames=['أحمد الشيخ','خيري أبو حجر','إيهاب محمود'];
    qsa('.consultation-client-card',proof).forEach(card=>{
      if(!keepNames.some(name=>card.textContent.includes(name))) card.remove();
    });
    const caption=qs('.proof-caption',proof);
    if(caption) caption.innerHTML='<b>أحمد مجدي — مؤسس مذاق سيناء.</b>';
    remove('.consultation-proof-note',proof);
  }

  // Step 4: merge the journey, outputs and the four decision-critical tools into one section.
  const outcomes=qs('#outcomes');
  const tools=qs('#tools');
  if(outcomes && tools){
    const title=qs('.section-title',outcomes);
    if(title) title.textContent='خلال 12 أسبوعًا هتشتغل على إيه وهتخرج بإيه؟';

    const block=document.createElement('div');
    block.className='lean-tools-block';
    block.innerHTML='<div class="lean-tools-head"><span class="mini-kicker">أهم أدوات التطبيق</span><h3>أربع أدوات مرتبطة مباشرة بقرارات السعر والسيولة والتعادل والتنفيذ</h3></div><div class="lean-tools-grid"></div><div class="lean-tool-preview"></div>';
    const grid=qs('.lean-tools-grid',block);
    const preview=qs('.lean-tool-preview',block);
    const wanted=['حاسبة التسعير وهامش المساهمة','حاسبة نقطة التعادل','توقع التدفق النقدي 90 يومًا','مصفوفة القرار وخطة 90 يومًا'];
    qsa('.tool-line',tools).forEach(line=>{
      if(wanted.some(name=>line.textContent.includes(name))) grid.appendChild(line.cloneNode(true));
    });
    const wantedShots=['حاسبة نقطة التعادل','توقع التدفق النقدي'];
    qsa('.toolshot',tools).forEach(shot=>{
      if(wantedShots.some(name=>shot.textContent.includes(name))) preview.appendChild(shot.cloneNode(true));
    });
    const inner=qs('.section-inner',outcomes) || outcomes;
    inner.appendChild(block);
    tools.remove();
  }

  // Step 5: make AI a supporting bonus, not a competing full section.
  const ai=qs('#ai-diagnosis');
  const offer=qs('#offer');
  if(ai && offer){
    const bundle=qs('.gift-bundle',ai);
    const price=qs('.price-top',offer);
    if(bundle && price){
      const wrap=document.createElement('div');
      wrap.className='lean-gift-wrap';
      wrap.appendChild(bundle);
      price.parentNode.insertBefore(wrap,price);
    }
    qsa('.core-value-card',offer).forEach(card=>{
      if(card.textContent.includes('AI التشخيص قبل الحل')){
        const p=qs('p',card);
        if(p) p.textContent='أداة مساعدة لترتيب الحقائق والأسئلة والمعلومات الناقصة قبل قراراتك.';
      }
    });
    ai.remove();
  }

  // Step 6: combine presenter, relevant credentials and confirmed partnership into one trust section.
  const presenter=qs('#presenter');
  const education=qs('#education');
  const trust=qs('#trust');
  if(presenter){
    const copy=qs('.presenter-copy',presenter);
    if(copy){
      remove('.book-mini',copy);
      remove('.boundary-note',copy);
      const trustInline=document.createElement('div');
      trustInline.className='lean-trust-inline';
      trustInline.innerHTML='<h3>خلفية مهنية مرتبطة بالتطبيق</h3><div class="lean-credential-grid"></div><div class="lean-partner"></div>';
      const credGrid=qs('.lean-credential-grid',trustInline);
      const wantedCreds=['ماجستير إدارة الأعمال','Google Project Management Professional Certificate','برنامج إعداد وتأهيل المدربين'];
      if(education){
        qsa('.premium-credential-row',education).forEach(row=>{
          const text=row.textContent;
          if(wantedCreds.some(name=>text.includes(name))){
            const card=document.createElement('div');
            card.className='lean-credential';
            const h=qs('h3',row);
            const p=qs('p',row);
            card.innerHTML='<b>'+(h?h.textContent.trim():'')+'</b><span>'+(p?p.textContent.trim():'')+'</span>';
            credGrid.appendChild(card);
          }
        });
      }
      const partner=qs('.lean-partner',trustInline);
      const trustImg=trust ? qs('.trust-visual img',trust) : null;
      if(partner){
        if(trustImg) partner.appendChild(trustImg.cloneNode(true));
        const text=document.createElement('div');
        text.innerHTML='<b>بالشراكة مع أكاديمية المدرب الأفضل</b>الشراكة مؤكدة ضمن البرنامج، مع بقاء منهج «التشخيص قبل الحل» هو أساس التطبيق.';
        partner.appendChild(text);
      }
      copy.appendChild(trustInline);
    }
  }
  if(education) education.remove();
  if(trust) trust.remove();

  // Step 7: keep scheduling near the buying decision, trim secondary inclusions, and enforce the lean section order.
  const schedule=qs('#schedule');
  if(offer){
    qsa('.subscription-extras .value-stack-card',offer).forEach(card=>{
      if(card.textContent.includes('تطبيق على حالتك') || card.textContent.includes('الخروج من النفق')) card.remove();
    });
    const price=qs('.price-top',offer);
    if(price){
      const scheduleStrip=document.createElement('div');
      scheduleStrip.className='lean-schedule-strip';
      scheduleStrip.innerHTML='<div class="lean-schedule-item"><b>1 أكتوبر · 7:30 مساءً</b><span>جلسة تعريفية مباشرة</span></div><div class="lean-schedule-item"><b>4 أكتوبر · 7:30 مساءً</b><span>أول تدريب فعلي</span></div><div class="lean-schedule-item"><b>الأحد والأربعاء</b><span>7:30–8:30 مساءً · حتى 23 ديسمبر</span></div>';
      price.parentNode.insertBefore(scheduleStrip,price);
    }
  }
  if(schedule) schedule.remove();
  if(presenter && offer) presenter.insertAdjacentElement('afterend',offer);

  // Step 8: retain only the objections that can materially affect the booking decision.
  const faq=qs('#faq');
  if(faq){
    faq.classList.add('lean-compact');
    const keepQuestions=['هل البرنامج مناسب لو عندي مجرد فكرة ولسه ما بدأتش؟','ولو عندي مشروع شغال بالفعل؟','هل ده استشارة فردية لمشروعي؟','لو فاتتني جلسة؟','هل فيه ضمان إني أنجح أو أزود أرباحي؟','ماذا لو حضرت أول جلسة فعلية وحسيت إن البرنامج مش مناسب؟','إيه سياسة الحجز والدفع؟'];
    qsa('details',faq).forEach(item=>{
      const summary=qs('summary',item);
      const question=summary ? summary.textContent.trim() : '';
      if(!keepQuestions.includes(question)) item.remove();
    });
    const inner=qs('.section-inner',faq) || faq;
    const privacy=document.createElement('p');
    privacy.className='lean-privacy-note';
    privacy.textContent='لتأكيد الحجز نطلب الاسم الكامل وصورة إثبات التحويل عبر Messenger. الصفحة تستخدم Google Analytics وMeta Pixel لقياس الزيارات والتفاعل وتحسين أداء الإعلانات.';
    inner.appendChild(privacy);
  }

  document.documentElement.classList.add('lean-v8');
});
