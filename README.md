# التشخيص قبل الحل — V36 Full Funnel

النسخة التشغيلية لصفحة برنامج **التشخيص قبل الحل** على `lo3betbusiness.com`.

## المسار الحالي

Meta Ad → `/diagnosis/` → نتيجة التشخيص → WhatsApp أو XPay → Webhook مؤكد → Enrollment → صفحة تأكيد الحجز.

## العرض

- إجمالي الاشتراك: **4,500 جنيه**.
- تثبيت المقعد: **2,000 جنيه**.
- استكمال المتبقي: **2,500 جنيه** قبل أول تدريب فعلي.
- الدفعة الأولى: وصول كامل إلى أداة التشخيص مجانًا لمدة **6 أشهر**.
- السعة: **20 مقعدًا**.
- الجلسة التعريفية: 1 أكتوبر 2026، 7:30 مساءً بتوقيت مصر.
- أول تدريب فعلي: 4 أكتوبر 2026، 7:30 مساءً.
- 24 جلسة تدريبية فعلية + جلسة تعريفية.
- التسجيلات متاحة 6 أشهر.

## الملفات الأساسية

- `_includes/landing-base.html` — الصفحة الأساسية.
- `index.html` — طبقة تركيب GitHub Pages.
- `assets/funnel.js` — حفظ Attribution وتشغيل Checkout Sessions.
- `diagnosis/` — مختبر قرار مشروعك.
- `manual-payment/` — التحويل اليدوي وإثباته.
- `complete-payment/` — استكمال المبلغ المتبقي.
- `payment-success.html` — التحقق من XPay وOnboarding.
- `payment-admin/` — مراجعة التحويلات اليدوية.
- `privacy-policy.html`, `booking-terms.html`, `refund-policy.html`.

## القياس

- Meta Pixel: `2667954303602754`.
- GA4: `G-C2N57VGT70`.
- Standard Lead: أول اكتمال تشخيص فقط خلال نافذة 30 يومًا على نفس الجهاز.
- DiagnosticComplete: كل اكتمال.
- Question progress: يتضمن رقم السؤال ومرحلة Core/Adaptive.
- InitiateCheckout: عند اختيار وسيلة دفع فعلية.
- Purchase: من السيرفر بعد تأكيد الدفع، وليس من صفحة النجاح.
- BalancePayment: Event منفصل لاستكمال الدفعة الثانية.

## الدفع

XPay Checkout Sessions تُنشأ Server-side عبر Supabase باستخدام `XPAY_API_KEY`.
الـWebhook هو مصدر الحقيقة لحالة الدفع.
الحجز منفصل عن عمليات الدفع: Enrollment واحد يمكن أن يحتوي أكثر من Payment.

## التواصل

WhatsApp الرسمي: **01011223667**.

## Rollback

قبل V35 توجد Recovery branch:
`recovery-pre-v35-2026-09-26`.

لا تحذف Recovery branches بدون قرار صريح.


## V36 — الأداء والبنية

- أزيلت طبقة Jekyll post-render القديمة من `index.html` وأصبح المدخل canonical مباشرًا إلى `_includes/landing-base.html`.
- CSS المتراكم جُمّع في `assets/landing-v36.css` مع الحفاظ على ترتيب الـcascade.
- JavaScript التفاعلي جُمّع في `assets/landing-v36.js` بدل عدة inline patches.
- Checkout POST يستخدم simple `text/plain` request لتفادي CORS preflight من المتصفح.
- تجهيز Checkout قبل XPay أصبح RPC واحدة تقريبًا بدل عدة round trips لقاعدة البيانات.
- زر XPay يعرض حالة واضحة: «جاري تجهيز الدفع الآمن…» أثناء انتظار الجلسة.
- Attribution keys القديمة `v35` محفوظة عمدًا حتى لا نفقد بيانات الزوار الحاليين.

## حماية السعة

- جلسة XPay الجديدة صلاحيتها **180 دقيقة**.
- جلسة الدفع المفتوحة تمسك مكانًا مؤقتًا أثناء المحاولة حتى لا يتجاوز العدد 20.
- التحويل اليدوي المرسل للمراجعة يمسك مكانًا مؤقتًا حتى التأكيد أو الرفض.
- إنشاء الحجز محمي بقفل ذري (atomic capacity lock) لمنع overselling عند وصول محاولات متزامنة.
- الجلسات المنتهية أو الفاشلة تُحرر الـhold تلقائيًا.
