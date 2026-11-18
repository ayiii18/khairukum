# نظام إدارة الحلقات — خيركم
نظام متكامل لإدارة حلقات تحفيظ القرآن الكريم: المساجد، الحلقات، المعلمون، الطلاب، أولياء الأمور، الحضور، الحفظ والمراجعة، التقييمات، الملاحظات، التقارير والإشعارات. الواجهة عربية بالكامل (RTL) ومبنية على Next.js 16 وReact 19 وPostgreSQL.

## أبرز المزايا

- **أمان الجلسات**: JWT موقّع (HS256) داخل كوكي `httpOnly`، تحقق من الصلاحيات على الخادم في كل صفحة وكل Server Action.
- **كلمات مرور مشفرة**: عبر `pgcrypto` (`crypt` / `gen_salt('bf')`) دون أي كلمات مرور افتراضية أو نصية.
- **كلمات مرور مؤقتة**: تُولّد عند إنشاء طالب/معلم/ولي أمر وتُعرض مرة واحدة، مع إلزام التغيير عند أول دخول (`must_change_password`).
- **الحماية من الإساءة**: حد لمحاولات تسجيل الدخول + سجل تدقيق `login_audit`، وتنظيف تلقائي للسجلات القديمة.
- **بيانات حقيقية فقط**: لوحة التحكم والتقارير والإشعارات والإعدادات تقرأ من قاعدة البيانات، بدون بيانات وهمية.
- **حذف آمن**: يرفض الحذف عند وجود سجلات مرتبطة (مسجد فيه حلقات، حلقة فيها طلاب، معلم له تكليفات، ولي أمر مرتبط بطلاب).
- **تصدير وطباعة**: تقارير الحضور مع تصدير CSV (بترميز UTF-8 BOM) وطباعة.
- **جودة الكود**: TypeScript صارم، ESLint، اختبارات Vitest، تحقق من البيئة عبر Zod، تسجيل منظم (JSON logs).

## المتطلبات

- Node.js 22 أو أحدث
- PostgreSQL 16 أو أحدث (يفضل 18)
- npm

## التشغيل المحلي

```bash
# 1) تثبيت الحزم
npm ci

# 2) إعداد متغيرات البيئة
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS / Linux

# 3) تطبيق الهجرات (ينشئ الجداول والفهارس وجداول الأمان)
npm run db:migrate

# 4) (اختياري) تعبئة بيانات تجريبية
npm run db:seed

# 5) تشغيل التطبيق
npm run dev
```

ثم افتح <http://localhost:3000>.

### متغيرات البيئة

| المتغير | الوصف |
| --- | --- |
| `DATABASE_URL` | رابط اتصال PostgreSQL. |
| `AUTH_SECRET` | مفتاح توقيع الجلسات، **32 حرفاً على الأقل**. ولّده بـ `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. |

> لا ترفع `.env.local` إلى Git. ملف `.env.example` يحتوي قيماً توضيحية فقط.

## أوامر مفيدة

| الأمر | الوظيفة |
| --- | --- |
| `npm run dev` | تشغيل خادم التطوير. |
| `npm run build` | بناء الإنتاج (وضع `standalone` يُفعّل تلقائياً داخل Docker فقط). |
| `npm start` | تشغيل نسخة الإنتاج. |
| `npm run lint` | فحص ESLint. |
| `npm run typecheck` | فحص TypeScript بدون إخراج. |
| `npm test` | تشغيل اختبارات Vitest مرة واحدة. |
| `npm run test:watch` | اختبارات في وضع المراقبة. |
| `npm run db:migrate` | تطبيق الهجرات غير المطبقة من `database/migrations`. |
| `npm run db:status` | عرض حالة القاعدة والجداول والهجرات. |
| `npm run db:seed` | تطبيق `database/seed.sql`. |
| `npm run db:role` | إنشاء/تدوير دور تطبيق محدود الصلاحيات. |

## الهجرات وقاعدة البيانات

- `database/schema.sql`: المخطط المرجعي الكامل.
- `database/migrations/001_schema.sql`: المخطط الأولي.
- `database/migrations/002_security.sql`: أعمدة الأمان (`must_change_password`, `last_login_at`)، جدول `login_audit`، وجدول `app_settings`.
- `database/seed.sql`: بيانات تجريبية.

المشغّل `scripts/migrate.mjs` يسجل كل هجرة في جدول `schema_migrations` داخل معاملة واحدة، ويعيد التطبيق بأمان.

### دور قاعدة بيانات محدود الصلاحيات (موصى به للإنتاج)

شغّل مرة واحدة بحساب مالك/مدير:

```bash
APP_DB_PASSWORD='ضع-كلمة-مرور-قوية-هنا' node scripts/setup-role.mjs
```

سينشئ الدور `quran_app` بصلاحيات `SELECT/INSERT/UPDATE/DELETE` فقط (بدون DDL)، ثم استخدم رابط اتصال هذا الدور في `DATABASE_URL`:

```
postgresql://quran_app:<password>@<host>:5432/quran_admin
```

## النشر عبر Docker

```bash
# أنشئ ملف .env للإنتاج يحتوي على AUTH_SECRET و POSTGRES_PASSWORD
docker compose up -d --build
```

> ملف `Dockerfile` يضبط `BUILD_STANDALONE=1` تلقائياً، لذا ينتج صورة `standalone` مُحسّنة. أما البناء المحلي فيبقى متوافقاً مع `npm start`.

ثم طبّق الهجرات من جهازك على قاعدة بيانات الحاوية (يُفضّل ذلك على تشغيلها داخل الحاوية):

```bash
DATABASE_URL='postgresql://postgres:<password>@localhost:5432/quran_admin' npm run db:migrate
```

## البنية

```
src/
  app/
    (admin)/        صفحات الإدارة المحمية (لوحة التحكم، الطلاب، الحلقات، ...)
    api/            مسارات API (health, reports/attendance)
    parent-portal/  بوابة ولي الأمر
    teacher-portal/ بوابة المعلم
    profile/        الملف الشخصي وكلمة المرور (لجميع الأدوار)
    login/          توجيه إلى نافذة تسجيل الدخول
  components/       مكونات الواجهة (AppShell, Toast, Button, ...)
  lib/
    actions/        Server Actions مع تحقق من الصلاحيات
    auth/           الجلسات، الأدوار، كلمات المرور، فحوص الملكية
    queries/        استعلامات قراءة البيانات
    __tests__/      اختبارات Vitest
  proxy.ts          بوابة توجيه أولية (Next.js Proxy / middleware)
database/           المخطط، الهجرات، البيانات التجريبية
scripts/            migrate.mjs, db-status.mjs, seed.mjs, setup-role.mjs
```

## الأدوار والصلاحيات

| الدور | الوصول |
| --- | --- |
| `ADMIN` | كل صفحات الإدارة والإجراءات. |
| `TEACHER` | بوابة المعلم فقط، وتعديل طلاب حلقاته فقط. |
| `PARENT` | بوابة ولي الأمر فقط، وأبناؤه فقط. |
| `STUDENT` | غير مفعّل في الواجهة حالياً (يُوجّه إلى صفحة غير مصرح). |

كل Server Action يتحقق من الجلسة والدور وملكية السجل على الخادم؛ لا تعتمد الواجهة وحدها على إخفاء الأزرار.

## قائمة تحقق قبل الإنتاج

- [ ] `AUTH_SECRET` عشوائي بطول 48+ حرفاً ومختلف لكل بيئة.
- [ ] `DATABASE_URL` يستخدم دوراً محدود الصلاحيات (وليس `postgres`).
- [ ] تشغيل `npm run db:migrate` على قاعدة الإنتاج.
- [ ] تفعيل HTTPS (الكوكي `secure` يعمل تلقائياً في `NODE_ENV=production`).
- [ ] مراجعة `next.config.ts` وتفعيل CSP مناسب للنطاقات المستخدمة.
- [ ] أخذ نسخ احتياطية دورية لقاعدة البيانات.
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` كلها ناجحة.

## الترخيص

خاص بجمعية خيركم لتحفيظ القرآن الكريم — جميع الحقوق محفوظة.
