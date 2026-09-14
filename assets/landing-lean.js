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

  document.documentElement.classList.add('lean-v3');
});
