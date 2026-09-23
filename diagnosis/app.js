(function(){
  'use strict';
  const Lab=window.DecisionLab;
  if(!Lab) throw new Error('DecisionLab engine is unavailable');

  const STORE_KEY='decision_lab_v3';
  const $=id=>document.getElementById(id);
  const views=['intake','confirm','quiz','results'];
  let resumeAvailable=false;
  const state={
    problem:'',quickChoice:'',stage:'',decisionType:'',
    questions:[],answers:{},index:0,result:null,view:'intake'
  };

  function show(id){
    views.forEach(name=>$(name).classList.toggle('hidden',name!==id));
    document.body.classList.toggle('diagnosis-results-ready',id==='results');
    state.view=id; save();
    const active=$(id); active.classList.remove('view-enter'); void active.offsetWidth; active.classList.add('view-enter');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function save(){
    try{localStorage.setItem(STORE_KEY,JSON.stringify(state)); $('saveHint').textContent='يتم حفظ التقدم على جهازك فقط.';}catch(e){}
  }
  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORE_KEY)||'null');
      if(!saved||!saved.stage)return;
      Object.assign(state,saved,{result:null,view:'intake'});
      $('problemInput').value=state.problem||'';
      const stage=document.querySelector(`input[name="stage"][value="${state.stage}"]`); if(stage)stage.checked=true;
      syncDecisionOptions();
      document.querySelectorAll('[data-quick]').forEach(button=>button.classList.toggle('selected',button.dataset.quick===state.quickChoice));
      $('resumeNote').classList.remove('hidden'); validateIntake();
    }catch(e){localStorage.removeItem(STORE_KEY);}
  }

  function cleanEventData(data){
    const allowed=['stage','decision_type','score_band','evidence_band','risk_band'];
    return Object.fromEntries(Object.entries(data||{}).filter(([key,value])=>allowed.includes(key)&&value!==undefined&&value!==''));
  }
  function eventData(){
    if(state.result)return Lab.safeEventData(state.result);
    return {stage:state.stage,decision_type:state.decisionType};
  }
  function track(metaName,gaName,data){
    const safe=cleanEventData(data||eventData());
    try{if(typeof fbq==='function')fbq('trackCustom',metaName,safe);}catch(e){}
    try{if(typeof gtag==='function')gtag('event',gaName,safe);}catch(e){}
  }

  function syncDecisionOptions(){
    const stageInput=document.querySelector('input[name="stage"]:checked');
    const stage=stageInput?stageInput.value:'';
    const hint=$('topicStageHint');
    document.querySelectorAll('[data-quick]').forEach(button=>{
      const allowed=String(button.dataset.stages||'idea,running').split(',');
      const visible=!!stage&&allowed.includes(stage);
      button.dataset.hidden=visible?'false':'true';
      button.disabled=!visible;
      if(!visible&&button.dataset.quick===state.quickChoice){
        state.quickChoice='';
        button.classList.remove('selected');
      }
    });
    if(hint) hint.textContent=stage
      ? (stage==='idea'?'اختار القرار اللي عايز تختبره قبل ما تستثمر وقت أو فلوس أكبر.':'اختار القرار اللي محتاج تشخّصه في مشروعك الحالي.')
      : 'اختار مرحلة المشروع الأول علشان نعرض لك القرارات المناسبة.';
  }

  function validateIntake(){
    const hasProblem=$('problemInput').value.trim().length>=8||state.quickChoice;
    const stage=document.querySelector('input[name="stage"]:checked');
    $('understandBtn').disabled=!(hasProblem&&stage);
  }
  document.querySelectorAll('[data-quick]').forEach(button=>button.addEventListener('click',()=>{
    state.quickChoice=state.quickChoice===button.dataset.quick?'':button.dataset.quick;
    document.querySelectorAll('[data-quick]').forEach(item=>item.classList.toggle('selected',item.dataset.quick===state.quickChoice));
    validateIntake(); save();
  }));
  $('problemInput').addEventListener('input',validateIntake);
  document.querySelectorAll('input[name="stage"]').forEach(input=>input.addEventListener('change',()=>{
    state.stage=input.value;
    syncDecisionOptions();
    validateIntake();
    save();
  }));

  $('understandBtn').addEventListener('click',()=>{
    const nextProblem=$('problemInput').value.trim();
    const nextStage=document.querySelector('input[name="stage"]:checked').value;
    const nextType=Lab.classifyProblem(nextProblem,state.quickChoice,nextStage);
    resumeAvailable=state.problem===nextProblem&&state.stage===nextStage&&state.decisionType===nextType&&state.questions.length>=6&&Object.keys(state.answers).length>0;
    state.problem=nextProblem;
    state.stage=nextStage;
    state.decisionType=nextType;
    const decision=Lab.DECISIONS[state.decisionType];
    $('confirmType').textContent=decision.label;
    $('confirmProblem').textContent=state.problem||state.quickChoice;
    $('confirmQuestion').textContent=decision.confirm;
    track('DiagnosticProblemEntered','diagnostic_problem_entered');
    show('confirm');
  });
  $('editProblemBtn').addEventListener('click',()=>show('intake'));
  $('confirmBtn').addEventListener('click',()=>{
    if(!resumeAvailable){state.questions=Lab.coreQuestions(state.stage);state.answers={};state.index=0;}
    else{state.index=Math.min(state.index,state.questions.length-1);}
    track('DiagnosticProblemConfirmed','diagnostic_problem_confirmed');
    track('DiagnosticStart','diagnostic_start');
    show('quiz'); renderQuestion();
  });

  function renderQuestion(){
    const q=state.questions[state.index];
    $('questionCount').textContent=`السؤال ${state.index+1} من 10`;
    $('progressBar').style.width=`${(state.index+1)*10}%`;
    $('stageText').textContent=Lab.STAGES[state.stage];
    $('axisTag').textContent=q.axis?Lab.AXES[q.axis]:'إجاباتك مبنية على إيه؟';
    $('questionText').textContent=q.prompt;
    $('questionHelp').textContent=q.help||(state.index<6?'اختار الإجابة اللي بتحصل فعلًا دلوقتي، مش اللي نفسك يحصل.':'السؤال ده ظهر مخصوص لأن إجاباتك بتقول إن النقطة دي محتاجة نتأكد منها.');
    $('answers').innerHTML=q.options.map(option=>`<label class="answer"><input type="radio" name="answer" value="${option.value}" ${state.answers[q.id]===option.value?'checked':''}><span>${option.label}</span></label>`).join('');
    document.querySelectorAll('input[name="answer"]').forEach(input=>input.addEventListener('change',e=>{
      state.answers[q.id]=Number(e.target.value); $('nextBtn').disabled=false; save();
    }));
    $('prevBtn').style.visibility=state.index===0?'hidden':'visible';
    $('nextBtn').textContent=state.index===9?'اعرض النتيجة':'التالي';
    $('nextBtn').disabled=state.answers[q.id]===undefined;
  }
  $('prevBtn').addEventListener('click',()=>{if(state.index>0){state.index--;save();renderQuestion();}});
  $('nextBtn').addEventListener('click',()=>{
    const q=state.questions[state.index]; if(state.answers[q.id]===undefined)return;
    track('DiagnosticQuestionProgress','diagnostic_question_progress');
    if(state.index===5&&state.questions.length===6){state.questions.push(...Lab.adaptiveQuestions(state.stage,state.decisionType,state.answers));}
    if(state.index<9){
      state.index++; save(); renderQuestion();
    }else{
      state.result=Lab.analyze({stage:state.stage,decisionType:state.decisionType,problem:state.problem,quickChoice:state.quickChoice,questions:state.questions,answers:state.answers});
      renderResult();
      track('DiagnosticComplete','diagnostic_complete',Lab.safeEventData(state.result));
      show('results');
    }
  });

  function renderResult(){
    const r=state.result;
    $('traffic').className=`traffic ${r.traffic.key}`; $('trafficIcon').textContent=r.traffic.icon; $('trafficTitle').textContent=r.traffic.title;
    $('resultType').textContent=r.decision.label; $('resultSummary').textContent=r.summary;
    $('readinessValue').textContent=`${r.readiness}/100`; $('readinessBand').textContent=`الدرجة: ${r.readinessBand} — ده مش احتمال نجاح`;
    $('evidenceValue').textContent=`${r.evidence}/100`; $('evidenceBand').textContent=`الدرجة: ${r.evidenceBand} — ده مش احتمال نجاح`;
    $('riskBand').textContent=r.riskBand;
    if(r.guidance){
      const box=$('decisionGuidance');
      box.className='decision-guidance '+r.guidance.key;
      $('guidanceTitle').textContent=r.guidance.title;
      $('guidanceReason').textContent=r.guidance.reason;
      $('guidanceAction').textContent=r.guidance.action;
    }
    $('axisBars').innerHTML=Object.entries(r.axisScores).map(([axis,value])=>`<div class="bar-row"><b>${Lab.AXES[axis]}</b><div class="track"><i style="width:${value}%"></i></div><span>${value}/100</span></div>`).join('');
    $('gaps').innerHTML=r.gaps.map((gap,index)=>`<article class="gap"><span>${index+1}</span><div><h4>${gap.label} · ${gap.score}/100</h4><p>${gap.why}</p><small>اللي محتاج تثبته: ${gap.missing}</small></div></article>`).join('');
    $('noGo').textContent=r.decision.noGo;
    $('sevenDays').innerHTML=r.plan.map((step,index)=>`<li><span>اليوم ${index+1}</span>${step}</li>`).join('');
    const x=r.experiment;
    $('experiment').innerHTML=[['إحنا متوقعين إيه؟',x.hypothesis],['هنجرب إزاي؟',x.test],['هنجرب لمدة قد إيه؟',x.duration],['أقصى مبلغ هتصرفه',x.cost],['إمتى نقول إن التجربة ماشية صح؟',x.success],['إمتى نوقف؟',x.stop],['إمتى نرجع نبص على النتيجة؟',x.review]].map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('');
    $('adaptiveCtaContext').textContent='أكبر أولوية قبل أي خطوة أكبر: '+r.gaps[0].missing;
    save();
  }

  $('programBtn').addEventListener('click',()=>track('DiagnosticProgramClick','diagnostic_program_click'));
  $('messengerBtn').addEventListener('click',()=>{
    const r=state.result;
    if(r){
      const firstGap=r.gaps&&r.gaps[0]?r.gaps[0].label:'';
      const message=[
        'نتيجة اختبار قرار مشروعي:',
        `نوع القرار: ${r.decision.label}`,
        `الجاهزية: ${r.readiness}/100`,
        `قوة الدليل: ${r.evidence}/100`,
        firstGap?`أهم نقطة محتاجة مراجعة: ${firstGap}`:'',
        'عايز أعرف: هل برنامج «التشخيص قبل الحل» مناسب لحالتي؟'
      ].filter(Boolean).join('\n');
      try{
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(message).then(()=>{
            $('pdfStatus').textContent='تم نسخ ملخص نتيجتك — الصقه في Messenger.';
          }).catch(()=>{});
        }
      }catch(e){}
    }
    try{if(typeof fbq==='function')fbq('track','Contact',cleanEventData(eventData()));}catch(e){}
    track('DiagnosticMessengerClick','diagnostic_messenger_click');
  });
  const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function fileToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
  async function getLogoData(){const response=await fetch('../assets/شعار_لعبة_البزنس_خفيف.webp',{cache:'force-cache'});if(!response.ok)throw new Error('logo_load_failed');return fileToDataUrl(await response.blob());}
  function pdfCss(){return `
    *{box-sizing:border-box}body{margin:0}.page{position:relative;width:794px;height:1123px;padding:50px 56px 45px;background:#fff;color:#0b1730;direction:rtl;font-family:Arial,Tahoma,sans-serif;overflow:hidden}.top{height:72px;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #07111f;padding-bottom:12px}.brand{display:flex;align-items:center;gap:12px}.brand img{width:58px;height:58px;border-radius:50%}.brand b{display:block;font-size:21px}.brand small{color:#66758b;font-size:11px}.kicker{color:#3157ca;font-weight:700;font-size:12px}.hero{margin-top:24px;padding:24px;border-radius:24px;background:linear-gradient(135deg,#07111f,#0b1f3a);color:#fff}.hero .light{font-size:34px}.hero h1{font-size:28px;margin:7px 0}.hero p{font-size:14px;line-height:1.75;color:#dce7f5}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:17px 0}.metric{padding:14px;background:#f1f6fc;border-radius:14px}.metric span{display:block;color:#66758b;font-size:11px}.metric b{display:block;font-size:21px;margin:4px 0}.title{font-size:22px;margin:22px 0 13px}.axes{display:grid;gap:9px}.axis{display:grid;grid-template-columns:150px 1fr 48px;gap:10px;align-items:center;font-size:12px}.track{height:10px;background:#e7eef7;border-radius:9px;overflow:hidden}.fill{height:100%;background:linear-gradient(90deg,#2ca7ff,#6656ff)}.summary,.warn{padding:17px;border-radius:15px;background:#eef7ff;line-height:1.8;font-size:13px}.warn{background:#fff3e8;border-right:6px solid #e28227}.gaps{display:grid;gap:11px}.gap{padding:16px;background:#f4f7fb;border-radius:15px}.gap h3{font-size:16px;margin:0 0 6px}.gap p{font-size:12px;line-height:1.65;margin:0;color:#596b83}.gap small{display:block;color:#3157ca;margin-top:7px;font-weight:700}.days{display:grid;grid-template-columns:1fr 1fr;gap:9px;list-style:none;padding:0}.days li{padding:13px;background:#f1f6fc;border-radius:13px;font-size:12px;line-height:1.55}.days span{display:block;color:#3157ca;font-size:10px;font-weight:700}.experiment{display:grid;grid-template-columns:1fr 1fr;gap:9px}.experiment div{padding:12px;background:#f5f2ff;border-radius:12px}.experiment span{display:block;color:#6656ff;font-size:10px}.experiment b{display:block;font-size:12px;line-height:1.55;margin-top:4px}.cta{margin-top:18px;background:#07111f;color:#fff;padding:18px;border-radius:16px;text-align:center}.cta h3{margin:0 0 6px;font-size:17px}.cta p{margin:0;color:#dce7f5;font-size:11px;line-height:1.6}.note{font-size:10px;color:#75849a;line-height:1.65;margin-top:15px}.foot{position:absolute;bottom:25px;right:56px;left:56px;border-top:1px solid #dfe7f1;padding-top:9px;display:flex;justify-content:space-between;color:#7a899e;font-size:9px}`;}
  function pdfPage(page,r,logo){
    const brand=`<div class="brand"><img src="${logo}"><div><b>لعبة البزنس</b><small>مختبر قرار مشروعك</small></div></div>`;
    const foot=`<div class="foot"><span>حاتم نجيب · التشخيص قبل الحل</span><span>صفحة ${page} من 3</span></div>`;
    const top=`<div class="top">${brand}<div class="kicker">ملخص يساعدك تراجع قرارك · ${escapeHtml(new Intl.DateTimeFormat('ar-EG',{dateStyle:'long'}).format(new Date()))}</div></div>`;
    if(page===1){
      const axes=Object.entries(r.axisScores).map(([axis,value])=>`<div class="axis"><b>${Lab.AXES[axis]}</b><div class="track"><div class="fill" style="width:${value}%"></div></div><strong>${value}/100</strong></div>`).join('');
      return `<style>${pdfCss()}</style><div class="page">${top}<div class="hero"><div class="light">${r.traffic.icon}</div><h1>${escapeHtml(r.traffic.title)}</h1><p>${escapeHtml(r.summary)}</p></div><div class="metrics"><div class="metric"><span>قد إيه الصورة واضحة قبل ما تتحرك؟</span><b>${r.readiness}/100</b><small>${r.readinessBand}</small></div><div class="metric"><span>قد إيه إجاباتك مبنية على حاجات حصلت فعلًا؟</span><b>${r.evidence}/100</b><small>${r.evidenceBand}</small></div><div class="metric"><span>قد إيه محتاج تتأكد أكتر؟</span><b>${r.riskBand}</b><small>منخفضة / متوسطة / مرتفعة</small></div></div><div class="summary"><b>مهم:</b> الدرجتان من 100 علشان يوضحوا قد إيه الصورة والمعلومات مكتملين. ده مش احتمال نجاح أو فشل للمشروع.<br><br><b>الموقف اللي وصفته</b><br>${escapeHtml(r.problem)}<br><b>أقرب حاجة فهمناها:</b> ${escapeHtml(r.decision.label)}</div><h2 class="title">مشروعك واقف فين دلوقتي؟</h2><div class="axes">${axes}</div><p class="note">النتيجة مبنية على إجاباتك وقواعد ثابتة. هي نقطة بداية للمراجعة، مش ضمانًا لنجاح أو فشل المشروع.</p>${foot}</div>`;
    }
    if(page===2){
      const gaps=r.gaps.map((gap,index)=>`<div class="gap"><h3>${index+1}. ${gap.label} · ${gap.score}/100</h3><p>${gap.why}</p><small>اللي محتاج تثبته: ${gap.missing}</small></div>`).join('');
      return `<style>${pdfCss()}</style><div class="page">${top}<h2 class="title">أهم 3 حاجات ناقصة قبل ما تتحرك</h2><div class="gaps">${gaps}</div><h2 class="title">إيه اللي الأفضل ما تعملوش دلوقتي؟</h2><div class="warn">${escapeHtml(r.decision.noGo)}</div><h2 class="title">النتيجة معناها إيه؟</h2><div class="summary">مش محتاج تجمع معلومات بلا نهاية. ركّز على الحاجة الناقصة اللي ممكن تغيّر قرارك، وبعدها راجع النتيجة في اليوم اللي حددته.</div><p class="note">إجاباتك ونص المشكلة واسمك لم تُرسل إلى Meta أو GA4. التقرير اتعمل داخل متصفحك.</p>${foot}</div>`;
    }
    const days=r.plan.map((step,index)=>`<li><span>اليوم ${index+1}</span>${escapeHtml(step)}</li>`).join('');
    const x=r.experiment,experiment=[['إحنا متوقعين إيه؟',x.hypothesis],['هنجرب إزاي؟',x.test],['هنجرب لمدة قد إيه؟',x.duration],['أقصى مبلغ هتصرفه',x.cost],['إمتى نقول إن التجربة ماشية صح؟',x.success],['إمتى نوقف؟',x.stop],['إمتى نرجع نبص على النتيجة؟',x.review]].map(([label,value])=>`<div><span>${label}</span><b>${escapeHtml(value)}</b></div>`).join('');
    return `<style>${pdfCss()}</style><div class="page">${top}<h2 class="title">خطة العمل خلال 7 أيام</h2><ol class="days">${days}</ol><h2 class="title">جرّب إيه الأول قبل ما تصرف أو تلتزم؟</h2><div class="experiment">${experiment}</div><div class="cta"><h3>الأولوية التالية: ${escapeHtml(r.gaps[0].missing)}</h3><p>استخدم التقرير كخريطة مراجعة: اقفل أكبر فجوة، نفّذ التجربة الصغيرة، وبعدها ارجع للقرار.</p></div><p class="note">دي قراءة أولية تساعدك تفكر، ومش بديلًا عن رأي قانوني أو محاسبي أو ضريبي متخصص.</p>${foot}</div>`;
  }
  async function markupToJpeg(markup){
    const width=794,height=1123,svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${markup}</div></foreignObject></svg>`,url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),image=new Image();
    try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0);return canvas.toDataURL('image/jpeg',.92).split(',')[1];}finally{URL.revokeObjectURL(url);}
  }
  function loadCanvasImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});}
  function roundBox(ctx,x,y,w,h,r,fill,stroke){
    ctx.beginPath();if(typeof ctx.roundRect==='function')ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  function pdfFont(ctx,size,weight='400',color='#0b1730',align='right'){
    ctx.font=`${weight} ${size}px Cairo, Arial, sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';ctx.direction='rtl';
  }
  function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){
    const paragraphs=String(text||'').split('\n');let lineCount=0,currentY=y;
    for(const paragraph of paragraphs){
      const words=paragraph.split(/\s+/).filter(Boolean);let line='';
      for(const word of words){
        const test=line?`${line} ${word}`:word;
        if(line&&ctx.measureText(test).width>maxWidth){ctx.fillText(line,x,currentY);currentY+=lineHeight;lineCount++;line=word;if(lineCount>=maxLines)return currentY;}
        else line=test;
      }
      if(line&&lineCount<maxLines){ctx.fillText(line,x,currentY);currentY+=lineHeight;lineCount++;}
      if(!words.length)currentY+=lineHeight;
      if(lineCount>=maxLines)return currentY;
    }
    return currentY;
  }
  function canvasHeader(ctx,logo,page){
    let logoDrawn=false;try{if(logo&&logo.complete&&logo.naturalWidth){ctx.drawImage(logo,680,28,58,58);logoDrawn=true;}}catch(e){}
    if(!logoDrawn){const mark=ctx.createLinearGradient(680,28,738,86);mark.addColorStop(0,'#2ca7ff');mark.addColorStop(1,'#6656ff');ctx.beginPath();ctx.arc(709,57,29,0,Math.PI*2);ctx.fillStyle=mark;ctx.fill();pdfFont(ctx,22,'700','#fff','center');ctx.fillText('ل',709,41);}
    pdfFont(ctx,21,'700');ctx.fillText('لعبة البزنس',662,35);pdfFont(ctx,11,'400','#66758b');ctx.fillText('مختبر قرار مشروعك',662,65);
    pdfFont(ctx,11,'700','#3157ca','left');ctx.direction='ltr';ctx.fillText(new Intl.DateTimeFormat('ar-EG',{dateStyle:'long'}).format(new Date()),56,50);
    ctx.fillStyle='#07111f';ctx.fillRect(56,103,682,3);pdfFont(ctx,9,'400','#7a899e');ctx.fillText(`صفحة ${page} من 3`,738,1080);ctx.textAlign='left';ctx.direction='rtl';ctx.fillText('حاتم نجيب · التشخيص قبل الحل',56,1080);
  }
  function metricCanvas(ctx,x,y,w,label,value,note){
    roundBox(ctx,x,y,w,96,15,'#f1f6fc','#e0e8f2');pdfFont(ctx,11,'400','#66758b');ctx.fillText(label,x+w-15,y+13);pdfFont(ctx,24,'700','#173a73');ctx.fillText(value,x+w-15,y+36);pdfFont(ctx,10,'400','#66758b');ctx.fillText(note,x+w-15,y+70);
  }
  async function canvasPageToJpeg(page,r){
    const canvas=document.createElement('canvas');canvas.width=794;canvas.height=1123;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,794,1123);const logo=document.querySelector('.brand img');canvasHeader(ctx,logo,page);
    if(page===1){
      const gradient=ctx.createLinearGradient(56,0,738,0);gradient.addColorStop(0,'#102340');gradient.addColorStop(1,'#07111f');roundBox(ctx,56,128,682,165,22,gradient);
      pdfFont(ctx,30,'700','#fff');ctx.fillText(r.traffic.title,700,151);pdfFont(ctx,14,'400','#dce7f5');wrapCanvasText(ctx,r.summary,700,202,610,23,3);
      metricCanvas(ctx,56,313,216,'قد إيه الصورة واضحة؟',`${r.readiness}/100`,r.readinessBand);metricCanvas(ctx,289,313,216,'إجاباتك مبنية على إيه؟',`${r.evidence}/100`,r.evidenceBand);metricCanvas(ctx,522,313,216,'قد إيه محتاج تتأكد أكتر؟',r.riskBand,'منخفضة / متوسطة / مرتفعة');
      roundBox(ctx,56,430,682,150,16,'#eef7ff');pdfFont(ctx,13,'700','#173a73');ctx.fillText('مهم',716,448);pdfFont(ctx,12,'400','#465d79');let y=wrapCanvasText(ctx,'الدرجتان من 100 علشان يوضحوا قد إيه الصورة والمعلومات مكتملين. ده مش احتمال نجاح أو فشل للمشروع.',716,474,640,20,3);pdfFont(ctx,12,'700','#0b1730');ctx.fillText('الموقف اللي وصفته',716,y+5);pdfFont(ctx,11,'400','#53657d');wrapCanvasText(ctx,r.problem,716,y+30,640,19,2);
      pdfFont(ctx,21,'700');ctx.fillText('مشروعك واقف فين دلوقتي؟',738,610);
      let axisY=660;Object.entries(r.axisScores).forEach(([axis,value])=>{pdfFont(ctx,12,'700');ctx.fillText(Lab.AXES[axis],738,axisY-5);roundBox(ctx,220,axisY,350,12,6,'#e5edf6');const bar=ctx.createLinearGradient(220,0,570,0);bar.addColorStop(0,'#6656ff');bar.addColorStop(1,'#2ca7ff');roundBox(ctx,220,axisY,350*value/100,12,6,bar);pdfFont(ctx,12,'700','#3157ca','left');ctx.direction='ltr';ctx.fillText(`${value}/100`,150,axisY-6);axisY+=68;});
      pdfFont(ctx,10,'400','#75849a');wrapCanvasText(ctx,'النتيجة مبنية على إجاباتك وقواعد ثابتة. هي نقطة بداية للمراجعة، مش ضمانًا لنجاح أو فشل المشروع.',738,1015,682,17,2);
    }else if(page===2){
      pdfFont(ctx,23,'700');ctx.fillText('أهم 3 حاجات ناقصة قبل ما تتحرك',738,132);let y=180;
      r.gaps.forEach((gap,index)=>{roundBox(ctx,56,y,682,145,16,'#f4f7fb','#e1e8f1');roundBox(ctx,684,y+16,36,36,18,'#e4edff');pdfFont(ctx,16,'700','#3157ca','center');ctx.direction='ltr';ctx.fillText(String(index+1),702,y+23);pdfFont(ctx,16,'700');ctx.fillText(`${gap.label} · ${gap.score}/100`,666,y+16);pdfFont(ctx,11,'400','#596b83');wrapCanvasText(ctx,gap.why,666,y+49,585,19,2);pdfFont(ctx,11,'700','#3157ca');wrapCanvasText(ctx,`اللي محتاج تثبته: ${gap.missing}`,666,y+93,585,18,2);y+=160;});
      pdfFont(ctx,21,'700');ctx.fillText('إيه اللي الأفضل ما تعملوش دلوقتي؟',738,675);roundBox(ctx,56,718,682,118,16,'#fff3e8','#f0c69e');ctx.fillStyle='#e28227';ctx.fillRect(724,718,14,118);pdfFont(ctx,13,'700','#503822');wrapCanvasText(ctx,r.decision.noGo,704,743,620,23,4);
      pdfFont(ctx,21,'700');ctx.fillText('النتيجة معناها إيه؟',738,866);roundBox(ctx,56,908,682,100,15,'#eef7ff');pdfFont(ctx,12,'400','#465d79');wrapCanvasText(ctx,'مش محتاج تجمع معلومات بلا نهاية. ركّز على الحاجة الناقصة اللي ممكن تغيّر قرارك، وبعدها راجع النتيجة في اليوم اللي حددته.',716,929,640,21,4);
    }else{
      pdfFont(ctx,23,'700');ctx.fillText('خطة العمل خلال 7 أيام',738,132);let y=178;
      r.plan.forEach((step,index)=>{const col=index%2,row=Math.floor(index/2),x=col===0?404:56,boxY=y+row*80,w=334;roundBox(ctx,x,boxY,w,67,13,'#f1f6fc');pdfFont(ctx,10,'700','#3157ca');ctx.fillText(`اليوم ${index+1}`,x+w-13,boxY+10);pdfFont(ctx,11,'600','#0b1730');wrapCanvasText(ctx,step,x+w-13,boxY+29,w-26,17,2);});
      pdfFont(ctx,21,'700');ctx.fillText('جرّب إيه الأول قبل ما تصرف أو تلتزم؟',738,510);const x=r.experiment,items=[['إحنا متوقعين إيه؟',x.hypothesis],['هنجرب إزاي؟',x.test],['هنجرب لمدة قد إيه؟',x.duration],['أقصى مبلغ هتصرفه',x.cost],['إمتى نقول إن التجربة ماشية صح؟',x.success],['إمتى نوقف؟',x.stop],['إمتى نرجع نبص على النتيجة؟',x.review]];
      items.forEach(([label,value],index)=>{const col=index%2,row=Math.floor(index/2),bx=col===0?404:56,by=552+row*70,w=334;roundBox(ctx,bx,by,w,58,12,'#f5f2ff');pdfFont(ctx,9,'700','#6656ff');ctx.fillText(label,bx+w-12,by+8);pdfFont(ctx,10,'600');wrapCanvasText(ctx,value,bx+w-12,by+25,w-24,15,2);});
      roundBox(ctx,56,848,682,128,17,'#07111f');pdfFont(ctx,17,'700','#fff');wrapCanvasText(ctx,'الأولوية التالية: '+r.gaps[0].missing,716,871,640,24,2);pdfFont(ctx,11,'400','#dce7f5');wrapCanvasText(ctx,'برنامج «التشخيص قبل الحل» يساعدك تجمع المعلومات المهمة، تفهم أرقامك، وتحدد خطوة واضحة تراجع نتيجتها.',716,924,640,18,3);pdfFont(ctx,9,'400','#75849a');wrapCanvasText(ctx,'دي قراءة أولية تساعدك تفكر، ومش بديلًا عن رأي قانوني أو محاسبي أو ضريبي متخصص.',738,1015,682,16,2);
    }
    return canvas.toDataURL('image/jpeg',.92).split(',')[1];
  }
  const ascii=value=>new TextEncoder().encode(value),base64Bytes=value=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
  function makePdf(jpegPages){
    const chunks=[],offsets=[],push=part=>{const bytes=typeof part==='string'?ascii(part):part;chunks.push(bytes);return bytes.length;},objectCount=2+jpegPages.length*3;let length=0;const add=part=>{length+=push(part);};
    add(new Uint8Array([37,80,68,70,45,49,46,52,10,37,226,227,207,211,10]));
    const obj=(id,parts)=>{offsets[id]=length;add(`${id} 0 obj\n`);parts.forEach(add);add('\nendobj\n');};
    obj(1,['<< /Type /Catalog /Pages 2 0 R >>']); obj(2,[`<< /Type /Pages /Kids [${jpegPages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${jpegPages.length} >>`]);
    jpegPages.forEach((encoded,i)=>{const pageId=3+i*3,imageId=pageId+1,contentId=pageId+2,imageBytes=base64Bytes(encoded),name=`Im${i+1}`,content=ascii(`q\n595.28 0 0 841.89 0 0 cm\n/${name} Do\nQ`);obj(pageId,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /${name} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`]);obj(imageId,[`<< /Type /XObject /Subtype /Image /Width 794 /Height 1123 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,imageBytes,'\nendstream']);obj(contentId,[`<< /Length ${content.length} >>\nstream\n`,content,'\nendstream']);});
    const xref=length;add(`xref\n0 ${objectCount+1}\n0000000000 65535 f \n`);for(let i=1;i<=objectCount;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${objectCount+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(chunks,{type:'application/pdf'});
  }
  $('pdfBtn').addEventListener('click',async()=>{
    if(!state.result)return;const button=$('pdfBtn'),status=$('pdfStatus'),label=button.textContent;button.disabled=true;button.textContent='جارٍ تجهيز التقرير…';status.textContent='يتم إنشاء 3 صفحات داخل متصفحك.';
    try{await document.fonts.ready;const pages=[];for(let i=1;i<=3;i++)pages.push(await canvasPageToJpeg(i,state.result));const blob=makePdf(pages),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='تقرير-مختبر-قرار-مشروعك.pdf';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='تم تنزيل التقرير.';track('DiagnosticPdfDownload','diagnostic_pdf_download');}
    catch(error){console.error(error);status.textContent='تعذر التنزيل المباشر. جرّب متصفح Chrome أو Safari حديثًا.';}
    finally{button.disabled=false;button.textContent=label;}
  });

  load();
})();
