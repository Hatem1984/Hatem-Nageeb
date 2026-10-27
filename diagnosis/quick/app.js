(() => {
  const CFG = window.FUNNEL_CONFIG || {};
  const AXES = ["M","O","S","OP","C"];
  const labels = {
    M:"الوصول والتسويق",
    O:"العرض والسعر",
    S:"البيع والمتابعة",
    OP:"التشغيل والتنفيذ",
    C:"السيولة والفلوس"
  };

  const questions = [
    {
      q:"أكتر حاجة مضايقاك في المشروع دلوقتي إيه؟",
      answers:[
        ["الناس مش بتوصل لي كفاية",{M:2}],
        ["الناس بتسأل لكن الشراء قليل",{S:2}],
        ["السعر دايمًا عليه اعتراض",{O:2}],
        ["الشغل موجود بس التنفيذ فيه مشاكل",{OP:2}],
        ["فيه مبيعات بس الفلوس مش باينة",{C:2}],
        ["مش عارف أحدد المشكلة",{U:2}]
      ]
    },
    {
      q:"لما تحس إن المشروع واقف أو النتيجة ضعيفة… أول حاجة بتفكر تعملها إيه؟",
      answers:[
        ["أجيب عملاء أكتر",{M:1}],
        ["أغير السعر أو العرض",{O:1}],
        ["أحسن البيع والمتابعة",{S:1}],
        ["أظبط التشغيل والفريق",{OP:1}],
        ["أقلل المصروفات أو أظبط السيولة",{C:1}],
        ["مش عارف أبدأ منين",{U:1}]
      ]
    },
    {
      q:"الناس اللي بتوصلك غالبًا بيحصل معاهم إيه؟",
      answers:[
        ["عددهم قليل من الأساس",{M:3}],
        ["بيسألوا كتير عن السعر",{O:3}],
        ["بيهتموا لكن عدد قليل بيشتري",{S:3}],
        ["بيشتروا بس تحصل مشاكل في التنفيذ",{OP:3}],
        ["بيشتروا بس الكاش مش مستقر",{C:3}],
        ["مش متابع ده بشكل واضح",{U:2}]
      ]
    },
    {
      q:"أنهي جملة أقرب لوضع مشروعك؟",
      answers:[
        ["محتاج ناس أكتر تعرفني",{M:2}],
        ["محتاج أخلي اللي بقدمه أوضح وأقوى",{O:2}],
        ["محتاج أحوّل الاستفسارات لشراء بشكل أحسن",{S:2}],
        ["محتاج أظبط التشغيل والتنفيذ",{OP:2}],
        ["محتاج أفهم الفلوس بتروح فين",{C:2}],
        ["محتاج أعرف أنا واقف فين الأول",{U:2}]
      ]
    },
    {
      q:"لما العميل ما يشتريش… إنت عارف غالبًا ليه؟",
      answers:[
        ["مش بوصل للعميل المناسب",{M:3}],
        ["السعر أو القيمة مش مقنعين",{O:3}],
        ["بيهتم بس ما بيكملش",{S:3}],
        ["تجربة الخدمة أو التنفيذ بتأثر",{OP:3}],
        ["مش عارف السبب",{U:3}],
        ["ساعات أعرف وساعات لأ",{U:2}]
      ]
    },
    {
      q:"لو تقدر تصلّح حاجة واحدة بس الشهر الجاي… تختار إيه؟",
      answers:[
        ["أوصل لعملاء أكتر",{M:1}],
        ["أظبط العرض والسعر",{O:1}],
        ["أحسن البيع والمتابعة",{S:1}],
        ["أظبط التشغيل والفريق",{OP:1}],
        ["أظبط السيولة والمصاريف",{C:1}],
        ["مش عارف أختار",{U:1}]
      ]
    }
  ];

  const resultCopy = {
    M:{
      desc:"إجاباتك بتشير إن أول سؤال لازم يتجاوب هو: هل العميل المناسب بيوصل لك بالعدد والجودة اللي مشروعك محتاجهم؟",
      action:"راجع آخر 20 عميل أو استفسار، وسجّل كل واحد جه منين وهل كان مناسب فعلًا ولا لأ.",
      avoid:"ما تزودش ميزانية التسويق لمجرد إنك عايز ناس أكتر قبل ما تعرف جودة الناس اللي بتوصل.",
      secondHint:"لو الوصول مش هو السبب الوحيد، غالبًا الخطوة اللي بعدها هتكون البيع أو العرض."
    },
    O:{
      desc:"إجاباتك بتشير إن فيه علامة استفهام حوالين وضوح اللي بتقدمه والقيمة اللي العميل شايفها قدام السعر.",
      action:"راجع آخر 10 اعتراضات أو محادثات بيع، واكتب بالضبط العميل اعترض على السعر ولا على القيمة ولا على وضوح العرض.",
      avoid:"ما تنزلش السعر تلقائيًا لمجرد إن كلمة «غالي» اتقالت كام مرة.",
      secondHint:"لو العرض واضح، يبقى محتاج تشوف هل المشكلة بتظهر بعد الاهتمام أثناء البيع."
    },
    S:{
      desc:"إجاباتك بتقول إن الناس بتوصل وتهتم، لكن جزء من الاهتمام مش بيتحول لشراء بالمعدل المتوقع.",
      action:"راجع آخر 20 استفسار ما تحوّلوش لشراء، وصنّف كل واحد وقف عند أنهي نقطة.",
      avoid:"ما تجيبش ناس أكتر قبل ما تعرف ليه الناس الموجودة أصلًا مش بتكمل.",
      secondHint:"المنطقة الثانية غالبًا هتقولك هل السبب في العرض ولا في طريقة المتابعة نفسها."
    },
    OP:{
      desc:"إجاباتك بتشير إن جزء مهم من المشكلة بيظهر أثناء التنفيذ أو بعد البيع، مش في جلب الشغل بس.",
      action:"لمدة أسبوع، سجّل أكتر 3 حاجات بتسبب تأخير، إعادة شغل، شكوى أو ضغط على الفريق.",
      avoid:"ما تزودش حجم الشغل قبل ما تتأكد إن التشغيل الحالي يقدر يستوعبه.",
      secondHint:"لو التشغيل بيتأثر بسبب ضغط مالي أو تسعير ضعيف، المنطقة الثانية هتساعدك تشوف الرابط."
    },
    C:{
      desc:"إجاباتك بتشير إن حركة الفلوس محتاجة تبقى أوضح؛ لأن وجود مبيعات مش معناه تلقائيًا إن السيولة سليمة.",
      action:"راجع دخل وخرج آخر 30 يوم وحدد أكبر 5 بنود خرجت فيها فلوس، مع التحصيلات اللي لسه متأخرة.",
      avoid:"ما تعتبرش ضخ فلوس أو زيادة المبيعات حل تلقائي قبل ما تعرف الفلوس بتتحرك إزاي.",
      secondHint:"لو الهامش أو التسعير جزء من الضغط، المنطقة الثانية هتظهرلك ده."
    }
  };

  const state={index:0,answers:Array(questions.length).fill(null),result:null};
  const checkpointKey="business_game_quick_diagnosis_v38";
  function saveCheckpoint(){
    try{
      sessionStorage.setItem(checkpointKey,JSON.stringify({
        version:1,index:state.index,answers:state.answers,
        completed:!!state.result
      }));
    }catch(e){}
  }
  function clearCheckpoint(){
    try{sessionStorage.removeItem(checkpointKey);}catch(e){}
  }
  function restoreCheckpoint(){
    let stored=null;
    try{stored=JSON.parse(sessionStorage.getItem(checkpointKey)||"null");}catch(e){clearCheckpoint();}
    if(!stored || stored.version!==1 || !Array.isArray(stored.answers) || stored.answers.length!==questions.length)return;
    const valid=stored.answers.every((a,i)=>a===null || (Number.isInteger(a)&&a>=0&&a<questions[i].answers.length));
    if(!valid || !Number.isInteger(stored.index) || stored.index<0 || stored.index>=questions.length){
      clearCheckpoint();return;
    }
    state.answers=stored.answers.slice();
    state.index=stored.index;
    if(stored.completed && state.answers.every(a=>a!==null)){
      state.result=calculate();
      renderReport(state.result);
      show("result");
      offerSeen=false;
      return;
    }
    if(state.answers.some(a=>a!==null) || state.index>0){
      show("quiz");
      renderQuestion();
    }
  }

  const views={
    start:document.getElementById("start"),
    quiz:document.getElementById("quiz"),
    result:document.getElementById("result")
  };
  const params=new URLSearchParams(location.search);
  const attrib={
    source:params.get("utm_source")||"",
    campaign:params.get("utm_campaign")||"",
    content:params.get("utm_content")||"",
    creative:params.get("creative")||params.get("utm_content")||""
  };

  function track(event,props={}){
    const payload={event,ts:Date.now(),...attrib,...props};
    try{
      const arr=JSON.parse(localStorage.getItem("tashkhees_events")||"[]");
      arr.push(payload);
      localStorage.setItem("tashkhees_events",JSON.stringify(arr.slice(-250)));
    }catch(e){}
    // No advertising events without explicit analytics consent.
    // Starting a questionnaire is never treated as a captured Lead.
    const hasConsent = window.tashkheesAnalyticsConsent === true || CFG.analyticsConsent === true;
    if(hasConsent && Array.isArray(window.dataLayer))window.dataLayer.push(payload);
    if(hasConsent && CFG.metaPixelEnabled === true && typeof window.fbq === "function"){
      if(event === "checkout_start") window.fbq("track","InitiateCheckout",props);
      else window.fbq("trackCustom",event,props);
    }
  }

  function show(name){
    Object.values(views).forEach(v=>v.classList.remove("is-active"));
    views[name].classList.add("is-active");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function renderQuestion(){
    const item=questions[state.index];
    let selectionLocked=false;
    const pct=Math.round(((state.index+1)/questions.length)*100);
    document.getElementById("qLabel").textContent=`السؤال ${state.index+1} من ${questions.length}`;
    document.getElementById("qPct").textContent=`${pct}%`;
    document.getElementById("barFill").style.width=`${pct}%`;
    document.getElementById("quizProgress").setAttribute("aria-valuenow",String(state.index+1));
    document.getElementById("backBtn").style.visibility=state.index===0?"hidden":"visible";

    const html=`
      <h2 tabindex="-1">${item.q}</h2>
      <div class="answers">
        ${item.answers.map((a,i)=>`
          <button class="answer ${state.answers[state.index]===i?"is-selected":""}" data-i="${i}">
            <span class="radio"></span>
            <span>${a[0]}</span>
          </button>
        `).join("")}
      </div>
    `;
    const card=document.getElementById("questionCard");
    card.innerHTML=html;
    card.querySelector("h2").focus({preventScroll:true});

    card.querySelectorAll(".answer").forEach(btn=>{
      btn.addEventListener("click",()=>{
        if(selectionLocked)return;
        selectionLocked=true;
        state.answers[state.index]=Number(btn.dataset.i);
        saveCheckpoint();
        btn.classList.add("is-selected");
        track(`quiz_q${state.index+1}`,{answer:Number(btn.dataset.i)});
        setTimeout(()=>{
          if(state.index<questions.length-1){
            state.index++;
            saveCheckpoint();
            renderQuestion();
          }else{
            finish();
          }
        },140);
      });
    });
  }

  function calculate(){
    const scores={M:0,O:0,S:0,OP:0,C:0,U:0};
    state.answers.forEach((ai,qi)=>{
      const map=questions[qi].answers[ai][1];
      Object.entries(map).forEach(([k,v])=>scores[k]+=v);
    });
    const ranked=AXES.map(k=>[k,scores[k]]).sort((a,b)=>b[1]-a[1]);
    const [topKey,topScore]=ranked[0];
    const [secondKey,secondScore]=ranked[1];

    let type="single";
    if(scores.U>=5||topScore<5) type="unclear";
    else if(topScore-secondScore<=1) type="mixed";

    return {scores,ranked,topKey,secondKey,type};
  }

  function clarityLabel(r){
    if(r.scores.U>=5) return "منخفض";
    if(r.scores.U>=3 || r.type==="mixed") return "متوسط";
    return "جيد";
  }

  function evidenceForAxis(axis){
    const items=[];
    state.answers.forEach((ai,qi)=>{
      const [text,map]=questions[qi].answers[ai];
      if(map[axis]) items.push(text);
    });
    return items.slice(0,3);
  }

  function renderReport(r){
    const box=document.getElementById("resultReport");
    const clarity=clarityLabel(r);

    if(r.type==="unclear"){
      const evidence=state.answers.map((ai,qi)=>questions[qi].answers[ai][0]).filter((t,i)=>questions[i].answers[state.answers[i]][1].U).slice(0,3);
      box.innerHTML=`
        <article class="report">
          <div class="report-head">
            <div class="report-main">
              <small>أقرب قراءة</small>
              <h3>الصورة لسه محتاجة ترتيب</h3>
              <p>إجاباتك متوزعة، وفيه معلومات أساسية مش واضحة كفاية. أول خطوة عندك مش اختيار حل؛ أول خطوة إنك تعرف إيه اللي بيحصل فعلًا.</p>
            </div>
            <div class="clarity"><small>وضوح الصورة</small><strong>${clarity}</strong></div>
          </div>

          <div class="report-grid">
            <div class="report-box accent">
              <small>ابدأ من هنا</small>
              <strong>اجمع صورة بسيطة عن آخر 30 يوم</strong>
              <p>المبيعات، عدد الاستفسارات، المصروفات، وأكتر مشكلة تكررت. الهدف مش تعمل تقرير، الهدف تعرف إيه اللي عندك عليه دليل.</p>
            </div>
            <div class="report-box">
              <small>ما تعملوش دلوقتي</small>
              <strong>ما تختارش حل كبير</strong>
              <p>لأن المشكلة لسه مش واضحة كفاية إنك تبني عليها قرار مكلف.</p>
            </div>
          </div>

          <div class="evidence">
            <div class="evidence-title">إجابات خلت الصورة أقل وضوحًا</div>
            <div class="evidence-list">
              ${(evidence.length?evidence:["فيه أكتر من اتجاه متقارب في إجاباتك"]).map((x,i)=>`<div class="evidence-item"><span>${i+1}</span>${x}</div>`).join("")}
            </div>
          </div>
        </article>`;
      return;
    }

    const top=r.topKey, second=r.secondKey;
    const topData=resultCopy[top];
    const ev=evidenceForAxis(top);
    const mainTitle = r.type==="mixed"
      ? `${labels[top]} + ${labels[second]}`
      : labels[top];

    const mainDesc = r.type==="mixed"
      ? `إجاباتك بتقول إن ${labels[top]} و${labels[second]} قريبين جدًا من بعض. هنا الأهم مش تختار واحدة بالعافية؛ الأهم تعرف مين فيهم سبب ومين نتيجة.`
      : topData.desc;

    const firstAction = r.type==="mixed"
      ? `ابدأ بمراجعة آخر 10–20 حالة حصل فيها التعطل، وشوف هل المشكلة بدأت من ${labels[top]} ولا ظهرت بسبب ${labels[second]}.`
      : topData.action;

    const avoid = r.type==="mixed"
      ? "ما تفتحش الملفين مرة واحدة وتغيّر كذا حاجة مع بعض؛ هتضيع عليك معرفة إيه اللي أثر فعلًا."
      : topData.avoid;

    box.innerHTML=`
      <article class="report">
        <div class="report-head">
          <div class="report-main">
            <small>${r.type==="mixed"?"أقرب منطقتين للفحص":"أول حتة محتاجة فحص"}</small>
            <h3>${mainTitle}</h3>
            <p>${mainDesc}</p>
          </div>
          <div class="clarity"><small>وضوح الصورة</small><strong>${clarity}</strong></div>
        </div>

        <div class="report-grid">
          <div class="report-box">
            <small>المنطقة الثانية</small>
            <strong>${labels[second]}</strong>
            <p>${resultCopy[second].secondHint}</p>
          </div>
          <div class="report-box accent">
            <small>ابدأ من هنا</small>
            <strong>خطوة واحدة قبل أي حل</strong>
            <p>${firstAction}</p>
          </div>
          <div class="report-box">
            <small>ما تعملوش دلوقتي</small>
            <strong>ما تستعجلش الحل</strong>
            <p>${avoid}</p>
          </div>
          <div class="report-box">
            <small>مدى وضوح المؤشرات</small>
            <strong>${clarity==="جيد"?"معقولة كبداية":clarity==="متوسط"?"محتاجة بيانات أكتر":"ضعيفة حاليًا"}</strong>
            <p>الفحص بيعتمد على إجاباتك، فكل ما البيانات عندك أوضح النتيجة تبقى أنفع.</p>
          </div>
        </div>

        <div class="evidence">
          <div class="evidence-title">إيه في إجاباتك رجّح النتيجة دي؟</div>
          <div class="evidence-list">
            ${(ev.length?ev:["النتيجة جاية من تكرار نفس الاتجاه في أكتر من إجابة"]).map((x,i)=>`<div class="evidence-item"><span>${i+1}</span>${x}</div>`).join("")}
          </div>
        </div>
      </article>`;
  }

  let offerSeen = false;
  function updateOfferVisibility(){
    if(offerSeen || !state.result || !views.result.classList.contains("is-active")) return;
    const box = document.querySelector(".offer").getBoundingClientRect();
    if(box.top < window.innerHeight * 0.8 && box.bottom > window.innerHeight * 0.2){
      offerSeen = true;
      track("offer_view",{type:state.result.type,top:state.result.topKey});
    }
  }
  window.addEventListener("scroll",updateOfferVisibility,{passive:true});
  window.addEventListener("resize",updateOfferVisibility);

  function finish(){
    const r=calculate();
    state.result=r;
    saveCheckpoint();
    renderReport(r);
    track("quiz_complete",{type:r.type,top:r.topKey,second:r.secondKey,scores:r.scores});
    show("result");
    offerSeen = false;
    updateOfferVisibility();
  }

  document.getElementById("startBtn").addEventListener("click",()=>{
    track("quiz_start");
    show("quiz");
    renderQuestion();
  });

  document.getElementById("backBtn").addEventListener("click",()=>{
    if(state.index>0){
      state.index--;
      saveCheckpoint();
      renderQuestion();
    }
  });

  function restartQuiz(){
    state.index=0;
    state.answers=Array(questions.length).fill(null);
    state.result=null;
    clearCheckpoint();
    track("quiz_restart");
    show("start");
  }
  document.getElementById("restartBtn").addEventListener("click",restartQuiz);
  document.getElementById("resetQuizBtn").addEventListener("click",restartQuiz);

  const checkoutBtn=document.getElementById("checkoutBtn");
  let checkoutUrl=null;
  try{
    if(typeof CFG.checkoutUrl==="string" && CFG.checkoutUrl.trim()){
      const candidate=new URL(CFG.checkoutUrl,location.href);
      if(["https:","http:"].includes(candidate.protocol)) checkoutUrl=candidate;
    }
  }catch(e){}
  if(!checkoutUrl){
    checkoutBtn.disabled=true;
    checkoutBtn.setAttribute("aria-disabled","true");
    checkoutBtn.textContent="الحجز غير متاح حاليًا";
    checkoutBtn.title="سيظهر زر التسجيل بعد إضافة رابط الحجز المعتمد";
  }
  checkoutBtn.addEventListener("click",()=>{
    if(!checkoutUrl || !state.result)return;
    const r=state.result;
    const url=new URL(checkoutUrl.toString());
    ["utm_source","utm_campaign","utm_content","creative"].forEach(k=>{
      if(params.get(k)) url.searchParams.set(k,params.get(k));
    });
    url.searchParams.set("result",r.topKey||"unclear");
    const amount=Number(CFG.coursePriceEGP);
    const paymentMeta={currency:"EGP",type:r.type,top:r.topKey};
    if(Number.isFinite(amount) && amount>0)paymentMeta.value=amount;
    track("checkout_start",paymentMeta);
    location.assign(url.toString());
  });

  restoreCheckpoint();
  track("quiz_view");
})();