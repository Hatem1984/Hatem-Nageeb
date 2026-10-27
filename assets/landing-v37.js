/* V37: no legacy payment code; no unconsented Meta/GA events. */
(() => {
  "use strict";
  document.documentElement.classList.add("v37-loaded");
  function showHashTarget(){
    const hash=window.location.hash;
    if(!hash)return;
    let target=null;
    try{target=document.getElementById(decodeURIComponent(hash.slice(1)))}catch(e){return}
    if(!target)return;
    if(target.tagName==="DETAILS")target.open=true;
    target.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  }
  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    link.addEventListener("click",()=>{
      const raw=link.getAttribute("href").slice(1);
      if(!raw)return;
      const target=document.getElementById(raw);
      if(target?.tagName==="DETAILS")target.open=true;
    });
  });
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver((entries)=>{
      for(const entry of entries){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },{rootMargin:"0px 0px 12px 0px",threshold:0.05});
    document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
  }else{
    document.querySelectorAll(".reveal").forEach(el=>el.classList.add("is-visible"));
  }
  window.addEventListener("hashchange",showHashTarget);
  if(window.location.hash)requestAnimationFrame(showHashTarget);
})();
