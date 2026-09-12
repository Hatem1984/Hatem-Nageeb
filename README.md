# التشخيص قبل الحل — Landing Page V34

نسخة GitHub Pages الجاهزة للنشر لصفحة برنامج **التشخيص قبل الحل**.

## النشر السريع

1. ارفع محتويات هذا المجلد إلى جذر المستودع:
   `Hatem1984/Hatem-Nageeb`
2. تأكد أن الملفات الأساسية في الجذر بهذا الشكل:
   - `index.html`
   - `404.html`
   - `assets/`
   - `diagnosis/`
   - `.nojekyll`
3. من GitHub:
   - Settings
   - Pages
   - Build and deployment
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
4. بعد النشر، العنوان المتوقع:
   `https://hatem1984.github.io/Hatem-Nageeb/`

## ملاحظات

- لا تغيّر أسماء الملفات داخل `assets` إلا إذا عدّلت مساراتها داخل `index.html`.
- الصفحة تحتوي على Meta Pixel وGA4 المضافين مسبقًا.
- أداة **اختبار قرار مشروعك** مدمجة داخل المسار `/diagnosis/` وتُصدر تقرير PDF من صفحتين على جهاز الزائر.
- لا تغيّر اسم مجلد `diagnosis` أو مسار زر الاختبار إلا إذا عدّلت الروابط داخل الصفحة.
- اختبر أزرار Vodafone Cash وInstaPay من الموبايل بعد النشر.
- إذا تم ربط دومين مخصص لاحقًا، غيّر `canonical` و`og:url` داخل `index.html` و`diagnosis/index.html` إلى الدومين الجديد.
