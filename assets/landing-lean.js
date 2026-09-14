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

  document.documentElement.classList.add('lean-v4');
});
