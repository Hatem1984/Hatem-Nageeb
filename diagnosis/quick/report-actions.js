(() => {
  const save = document.getElementById("saveReportBtn");
  const copy = document.getElementById("copySummaryBtn");
  const status = document.getElementById("reportActionStatus");
  const report = () => document.querySelector("#resultReport .report");
  const text = (root, selector) => root.querySelector(selector)?.textContent?.trim() || "";
  const say = message => { status.textContent = message; };
  function extract(){
    const root=report();
    if(!root)return null;
    return {
      heading:text(root,".report-main h3"),
      intro:text(root,".report-main p"),
      clarity:text(root,".clarity strong"),
      boxes:[...root.querySelectorAll(".report-box")].map(item=>({
        label:text(item,"small"),title:text(item,"strong"),body:text(item,"p")
      })),
      evidence:[...root.querySelectorAll(".evidence-item")].map(item=>item.textContent.trim())
    };
  }
  const downloadText = document.getElementById("downloadTextBtn");
  function readableReport(r){
    const evidence = r.evidence.length
      ? ["إجابات رجّحت النتيجة:",...r.evidence.map(x=>"- "+x)]
      : [];
    return [
      "لعبة البزنس | التشخيص قبل الحل",
      "تقرير فحص أولي — "+new Date().toLocaleDateString("ar-EG"),
      "النتيجة: "+r.heading,
      r.intro,
      "وضوح الصورة: "+r.clarity,
      ...r.boxes.map(x=>x.label+" — "+x.title+"\n"+x.body),
      ...evidence,
      "هذه قراءة استرشادية مبنية على إجاباتك؛ ليست تشخيصًا نهائيًا ولا ضمانًا لنتيجة."
    ].join("\n\n");
  }
  if(downloadText)downloadText.addEventListener("click",()=>{
    const r=extract();
    if(!r)return say("أكمل الأسئلة الأول.");
    try{
      const blob=new Blob(["\uFEFF",readableReport(r)],{type:"text/plain;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download="Business-Game-Diagnosis-Text-"+new Date().toISOString().slice(0,10)+".txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),2000);
      say("تم تنزيل النسخة النصية؛ تقدر تبحث وتنسخ منها.");
    }catch(e){
      say("تعذّر تنزيل النص، تقدر تستخدم زر نسخ الملخص.");
    }
  });
  copy.addEventListener("click",async()=>{
    const r=extract();
    if(!r)return say("أكمل الأسئلة الأول.");
    const content=["لعبة البزنس | التشخيص قبل الحل","النتيجة: "+r.heading,r.intro,
      ...r.boxes.map(x=>x.label+" — "+x.title+"\n"+x.body),
      "النتيجة استرشادية وليست تشخيصًا نهائيًا."].join("\n\n");
    try{ await navigator.clipboard.writeText(content); say("تم نسخ ملخص النتيجة."); }
    catch(e){ say("تعذّر النسخ التلقائي. جرّب فتح الصفحة باستخدام HTTPS."); }
  });
  function createPages(data){
    const W=1240,H=1754,margin=86,inner=W-margin*2,pages=[];
    let c,y;
    function newPage(){
      const canvas=document.createElement("canvas");
      canvas.width=W;canvas.height=H;
      c=canvas.getContext("2d");
      c.fillStyle="#FFFFFF";c.fillRect(0,0,W,H);
      c.direction="rtl";c.textAlign="right";
      c.fillStyle="#0D3436";c.fillRect(0,0,W,20);
      c.font="bold 42px Tahoma,Arial,sans-serif";
      c.fillText("لعبة البزنس",W-margin,93);
      c.fillStyle="#B9783F";c.font="25px Tahoma,Arial,sans-serif";
      c.fillText("التشخيص قبل الحل  |  تقرير الفحص الأولي",W-margin,137);
      c.strokeStyle="#DDD7CE";c.lineWidth=2;
      c.beginPath();c.moveTo(margin,162);c.lineTo(W-margin,162);c.stroke();
      y=215;pages.push(canvas);
    }
    function ensure(px){if(y+px>H-130)newPage();}
    function wrap(str,font,size,maxWidth=inner){
      c.font=font+" "+size+"px Tahoma,Arial,sans-serif";
      const words=String(str||"").replace(/\s+/g," ").trim().split(" ");
      const lines=[];let line="";
      for(const word of words){
        const joined=line?line+" "+word:word;
        if(c.measureText(joined).width>maxWidth && line){lines.push(line);line=word;}
        else line=joined;
      }
      if(line)lines.push(line);
      return lines;
    }
    function paragraph(str,opts={}){
      const size=opts.size||29,lineHeight=opts.lineHeight||46;
      const lines=wrap(str,opts.bold?"bold":"normal",size,opts.width||inner);
      ensure(lines.length*lineHeight+18);
      c.fillStyle=opts.color||"#425354";
      c.font=(opts.bold?"bold ":"")+size+"px Tahoma,Arial,sans-serif";
      for(const line of lines){c.fillText(line,W-margin,y);y+=lineHeight;}
      y+=opts.after===undefined?18:opts.after;
    }
    function section(title,body,label){
      const font="normal",width=inner-56;
      const lines=wrap(body,font,27,width);
      const h=118+Math.max(lines.length,1)*43;
      ensure(h+18);
      c.fillStyle="#F4F0E8";c.fillRect(margin,y,inner,h);
      c.fillStyle="#B9783F";c.fillRect(W-margin-9,y,9,h);
      c.fillStyle="#7D6D5D";c.font="23px Tahoma,Arial,sans-serif";
      c.fillText(label||"",W-margin-32,y+36);
      c.fillStyle="#0D3436";c.font="bold 33px Tahoma,Arial,sans-serif";
      c.fillText(title,W-margin-32,y+82);
      c.fillStyle="#435253";c.font="27px Tahoma,Arial,sans-serif";
      let yy=y+124;
      for(const line of lines){c.fillText(line,W-margin-32,yy);yy+=43;}
      y+=h+22;
    }
    newPage();
    paragraph("أقرب منطقة للفحص", {size:22,color:"#B9783F",after:14});
    paragraph(data.heading,{size:47,bold:true,color:"#0D3436",lineHeight:66,after:15});
    paragraph(data.intro,{size:28,lineHeight:45,after:20});
    paragraph("وضوح الصورة: "+data.clarity,{size:27,bold:true,color:"#0D3436",after:32});
    for(const box of data.boxes)section(box.title,box.body,box.label);
    if(data.evidence.length){
      ensure(105);
      paragraph("إجابات رجّحت النتيجة",{size:31,bold:true,color:"#0D3436",after:12});
      for(const item of data.evidence)paragraph("• "+item.replace(/^\d+\s*/,""),{size:25,lineHeight:40,after:8});
    }
    ensure(100);
    paragraph("هذا فحص استرشادي مبني على إجاباتك؛ لا يُعدّ تشخيصًا نهائيًا أو وعدًا بنتيجة.",{size:22,color:"#6D7776"});
    pages.forEach((canvas,i)=>{
      const x=canvas.getContext("2d");x.direction="rtl";x.textAlign="right";
      x.fillStyle="#697573";x.font="21px Tahoma,Arial,sans-serif";
      x.fillText("لعبة البزنس  |  صفحة "+(i+1)+" من "+pages.length,W-margin,H-62);
    });
    return pages;
  }
  save.addEventListener("click",()=>{
    const data=extract();
    if(!data)return say("أكمل الأسئلة الأول.");
    if(!window.jspdf?.jsPDF)return say("مولّد PDF غير متاح.");
    save.disabled=true;say("جاري تجهيز التقرير...");
    try{
      const pages=createPages(data);
      const pdf=new window.jspdf.jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
      pages.forEach((cv,i)=>{
        if(i)pdf.addPage();
        pdf.addImage(cv.toDataURL("image/jpeg",0.88),"JPEG",0,0,210,297,undefined,"FAST");
      });
      const date=new Date().toISOString().slice(0,10);
      pdf.save("Business-Game-Diagnosis-"+date+".pdf");
      say("تم تنزيل التقرير PDF.");
    }catch(e){console.error("PDF export error",e);say("تعذّر تجهيز التقرير، حاول مرة تانية.");}
    finally{save.disabled=false;}
  });
})();
