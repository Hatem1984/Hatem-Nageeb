from pathlib import Path

p = Path('diagnosis/app.js')
s = p.read_text(encoding='utf-8')
old = """  $('messengerBtn').addEventListener('click',()=>{
    try{if(typeof fbq==='function')fbq('track','Contact',cleanEventData(eventData()));}catch(e){}
    track('DiagnosticMessengerClick','diagnostic_messenger_click');
  });"""
new = """  $('messengerBtn').addEventListener('click',()=>{
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
      ].filter(Boolean).join('\\n');
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
  });"""
count=s.count(old)
if count!=1:
    raise SystemExit(f'expected one Messenger listener, found {count}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
assert 'تم نسخ ملخص نتيجتك' in p.read_text(encoding='utf-8')
print('Diagnosis Messenger share patch passed')
