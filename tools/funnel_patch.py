from pathlib import Path

OLD_BASE = 'https://hatem1984.github.io/Hatem-Nageeb/'
NEW_BASE = 'https://lo3betbusiness.com/'


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)


# Main landing page
p = Path('index.html')
s = p.read_text(encoding='utf-8')
s = s.replace(OLD_BASE, NEW_BASE)
s = replace_once(
    s,
    "  let checkoutTracked = false;",
    "  let checkoutTracked = false;\n  let paymentMethodCheckoutTracked = false;",
    'index checkout tracking declaration',
)

old_modal = """    if(!checkoutTracked){
      checkoutTracked = true;
      try{
        fbq('track','InitiateCheckout',{currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
      }catch(e){}
      try{
        gtag('event','begin_checkout',{currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
      }catch(e){}
    }"""
new_modal = """    if(!checkoutTracked){
      checkoutTracked = true;
      try{
        fbq('trackCustom','PaymentModalOpen',{currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
      }catch(e){}
      try{
        gtag('event','payment_modal_open',{currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
      }catch(e){}
    }"""
s = replace_once(s, old_modal, new_modal, 'index payment modal event')

old_method = """        const method = this.dataset.method || 'payment';
        selectedMethod = method;
        try{
          fbq('trackCustom','PaymentMethodClick',{method:method,amount:selectedAmount,payment_plan:selectedPlan,currency:'EGP',placement:'modal'});
        }catch(e){}
        try{
          gtag('event','payment_method_click',{method:method,value:selectedAmount,currency:'EGP',payment_plan:selectedPlan,placement:'modal'});
        }catch(e){}"""
new_method = """        const method = this.dataset.method || 'payment';
        selectedMethod = method;
        if(!paymentMethodCheckoutTracked){
          paymentMethodCheckoutTracked = true;
          try{
            fbq('track','InitiateCheckout',{method:method,currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
          }catch(e){}
          try{
            gtag('event','begin_checkout',{method:method,currency:'EGP',value:selectedAmount,payment_plan:selectedPlan});
          }catch(e){}
        }
        try{
          fbq('trackCustom','PaymentMethodClick',{method:method,amount:selectedAmount,payment_plan:selectedPlan,currency:'EGP',placement:'modal'});
        }catch(e){}
        try{
          gtag('event','payment_method_click',{method:method,value:selectedAmount,currency:'EGP',payment_plan:selectedPlan,placement:'modal'});
        }catch(e){}"""
s = replace_once(s, old_method, new_method, 'index payment method event')
p.write_text(s, encoding='utf-8')

# Keep fallback metadata aligned with custom domain
p404 = Path('404.html')
if p404.exists():
    p404.write_text(p404.read_text(encoding='utf-8').replace(OLD_BASE, NEW_BASE), encoding='utf-8')

# Diagnosis page
p = Path('diagnosis/index.html')
s = p.read_text(encoding='utf-8').replace(OLD_BASE, NEW_BASE)
old_result = """        <div class=\"cta-box\"><h3>عرفت أول نقطة محتاجة اهتمام</h3><p>في البرنامج هتشتغل على حالتك وتبني ملف قرار وخطة تنفيذ.</p><small class=\"diagnosis-program-difference\">الاختبار المجاني بيديك قراءة أولية وخطة 7 أيام. أداة AI المشمولة في الاشتراك تساعدك ترتب معلومات قراراتك أثناء التطبيق.</small><strong class=\"diagnosis-program-difference\" id=\"adaptiveCtaContext\"></strong><a class=\"primary\" id=\"adaptiveCta\" href=\"../#tracks\">شوف البرنامج مناسب لحالتك إزاي</a></div>
        <div class=\"result-actions\"><button class=\"primary\" id=\"pdfBtn\">تنزيل تقرير PDF من 3 صفحات</button><a class=\"dark-link\" id=\"programBtn\" href=\"../#offer\">شوف تفاصيل البرنامج والحجز</a><a class=\"dark-link\" id=\"messengerBtn\" href=\"https://m.me/891183134080763\" target=\"_blank\" rel=\"noopener\">اسأل على Messenger</a><button class=\"secondary\" id=\"restartBtn\">ابدأ تشخيصًا جديدًا</button></div><p class=\"pdf-status\" id=\"pdfStatus\"></p>"""
new_result = """        <div class=\"cta-box\"><h3>عرفت أول نقطة محتاجة اهتمام</h3><p>في البرنامج هتشتغل على حالتك وتبني ملف قرار وخطة تنفيذ.</p><small class=\"diagnosis-program-difference\">الاختبار المجاني بيديك قراءة أولية وخطة 7 أيام. أداة AI المشمولة في الاشتراك تساعدك ترتب معلومات قراراتك أثناء التطبيق.</small><strong class=\"diagnosis-program-difference\" id=\"adaptiveCtaContext\"></strong><a class=\"dark-link wide\" id=\"adaptiveCta\" href=\"../#tracks\">شوف البرنامج مناسب لحالتك إزاي</a></div>
        <p class=\"small-note\" style=\"margin-top:18px\">لو عايز تعرف هل البرنامج مناسب للنتيجة اللي ظهرت لك، ابعت لنا على Messenger واسأل من غير أي التزام بالحجز.</p>
        <div class=\"result-actions\"><a class=\"primary\" id=\"messengerBtn\" href=\"https://m.me/891183134080763\" target=\"_blank\" rel=\"noopener\">ابعت نتيجتك واسأل هل البرنامج مناسب لحالتك</a><button class=\"secondary\" id=\"pdfBtn\">تنزيل تقرير PDF من 3 صفحات</button><a class=\"dark-link\" id=\"programBtn\" href=\"../#offer\">شوف تفاصيل البرنامج والحجز</a><button class=\"secondary\" id=\"restartBtn\">ابدأ تشخيصًا جديدًا</button></div><p class=\"pdf-status\" id=\"pdfStatus\"></p>"""
s = replace_once(s, old_result, new_result, 'diagnosis result CTA block')
p.write_text(s, encoding='utf-8')

main = Path('index.html').read_text(encoding='utf-8')
diag = Path('diagnosis/index.html').read_text(encoding='utf-8')
assert NEW_BASE in main
assert NEW_BASE + 'diagnosis/' in diag
assert "trackCustom','PaymentModalOpen'" in main
assert "track','InitiateCheckout'" in main
assert 'ابعت نتيجتك واسأل هل البرنامج مناسب لحالتك' in diag
print('Patch checks passed')
