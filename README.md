# موظف AI — mowazefai.com

موقع ثابت ثنائي اللغة (عربي RTL + إنجليزي)، بدون framework وبدون أي npm package.
Vercel بيخدم الملفات المبنية مباشرة.

## البنية

```
src/pages/          ← الصفحات (عدّلي هون بس)
  index.html, privacy.html, 404.html, services/*.html
  en/…              ← النسخة الإنجليزية بنفس المسارات
src/partials/       ← head + header/footer لكل لغة + steps
build.sh            ← بيولّد ملفات HTML بالجذر + sitemap.xml
assets/css/site.css ← نظام التصميم (dark افتراضي + light)
assets/js/site.js   ← القائمة، الوضع الليلي، المحادثة المتحركة، التحليلات
assets/img/         ← icons.svg، لقطات demo، صور OG
```

> **ملفات HTML بالجذر بتتولّد آلياً** — أي تعديل مباشر عليها بيضيع.

## التشغيل المحلي

```bash
bash build.sh
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```
ثم افتحي http://localhost:4173

## الإعدادات

- **واتساب / الإيميل / الهاتف:** أول سطور `build.sh` ثم `bash build.sh`.
  روابط واتساب بالصفحات بتنكتب `href="wa:نص الرسالة"` والبناء بيحوّلها.
- **Google Analytics:** حطي الـ Measurement ID بـ `GA_ID` بأول `assets/js/site.js`.
  ضغطات واتساب بتنبعت كـ event اسمه `whatsapp_click` مع مكان الزر (`data-wa`).
- **روابط السوشال:** بـ `src/partials/footer.*.html` — حطي الرابط بـ `href` وبيظهر الزر.
- **آراء العملاء:** قسم `#testimonials` مخفي بالرئيسية — احذفي `hidden` لما يصير عندك آراء حقيقية.
- **نماذج جديدة:** بقسم `#work`، بدّلي بطاقة «قريباً».
