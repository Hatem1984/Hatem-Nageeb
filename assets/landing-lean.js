document.addEventListener('DOMContentLoaded', function(){
  const qs=(s,r=document)=>r.querySelector(s);
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

  document.documentElement.classList.add('lean-v2');
});
