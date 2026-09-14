document.addEventListener('DOMContentLoaded', function(){
  const qs=(s,r=document)=>r.querySelector(s);
  const remove=(s,r=document)=>{const el=qs(s,r); if(el) el.remove();};

  // Step 1: simplify the hero and remove repeated problem statements.
  remove('.hero .lead');
  remove('.hero-pain-strip');
  document.documentElement.classList.add('lean-v1');
});
