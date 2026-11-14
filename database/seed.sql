-- ============================================================
-- بيانات تجريبية لنظام إدارة حلقات تحفيظ القرآن
-- Demo / seed data
-- ============================================================

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
INSERT INTO users (phone, password_hash, role) VALUES
  ('0500000001', crypt('123456', gen_salt('bf')), 'ADMIN'),
  ('0500000002', crypt('123456', gen_salt('bf')), 'TEACHER'),
  ('0500000003', crypt('123456', gen_salt('bf')), 'TEACHER'),
  ('0500000004', crypt('123456', gen_salt('bf')), 'PARENT'),
  ('0500000005', crypt('123456', gen_salt('bf')), 'PARENT'),
  ('0500000006', crypt('123456', gen_salt('bf')), 'STUDENT'),
  ('0500000007', crypt('123456', gen_salt('bf')), 'STUDENT')
ON CONFLICT (phone) DO NOTHING;

-- ------------------------------------------------------------
-- MOSQUES
-- ------------------------------------------------------------
INSERT INTO mosques (name, address, phone, description) VALUES
  ('جامع الراجحي', 'الرياض - حي النرجس، شارع الأمير عبدالله', '0112345678', 'جامع الحي الرئيسي'),
  ('جامع النور', 'الرياض - حي الياسمين', '0113456789', 'جامع إداري متميز'),
  ('جامع الأندلس', 'الرياض - حي الأندلس', '0114567890', NULL)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- HALAQAT
-- ------------------------------------------------------------
INSERT INTO halaqat (mosque_id, name, description)
SELECT id, 'حلقة الإمام عاصم', 'حلقة تحفيظ جزء عمّ' FROM mosques WHERE name = 'جامع الراجحي'
ON CONFLICT DO NOTHING;

INSERT INTO halaqat (mosque_id, name, description)
SELECT id, 'حلقة الإمام حفص', 'حلقة تجويد ومخارج الحروف' FROM mosques WHERE name = 'جامع النور'
ON CONFLICT DO NOTHING;

INSERT INTO halaqat (mosque_id, name, description)
SELECT id, 'حلقة الإمام نافع', 'حلقة أحكام التجويد' FROM mosques WHERE name = 'جامع الأندلس'
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- TEACHERS
-- ------------------------------------------------------------
INSERT INTO teachers (user_id, full_name, date_of_birth, phone, address)
SELECT id, 'الأستاذ خالد العتيبي', '1985-04-12', '0551111111', 'الرياض - حي النرجس'
FROM users WHERE phone = '0500000002'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO teachers (user_id, full_name, date_of_birth, phone, address)
SELECT id, 'الأستاذة نورة القحطاني', '1990-09-03', '0552222222', 'الرياض - حي الياسمين'
FROM users WHERE phone = '0500000003'
ON CONFLICT (user_id) DO NOTHING;

-- ربط المعلمين بالحلقات
INSERT INTO teacher_halaqas (teacher_id, halaqa_id, is_primary)
SELECT t.id, h.id, TRUE
FROM teachers t
CROSS JOIN halaqat h
WHERE t.full_name = 'الأستاذ خالد العتيبي' AND h.name = 'حلقة الإمام عاصم'
ON CONFLICT DO NOTHING;

INSERT INTO teacher_halaqas (teacher_id, halaqa_id, is_primary)
SELECT t.id, h.id, TRUE
FROM teachers t
CROSS JOIN halaqat h
WHERE t.full_name = 'الأستاذة نورة القحطاني' AND h.name = 'حلقة الإمام حفص'
ON CONFLICT DO NOTHING;

INSERT INTO teacher_halaqas (teacher_id, halaqa_id, is_primary)
SELECT t.id, h.id, FALSE
FROM teachers t
CROSS JOIN halaqat h
WHERE t.full_name = 'الأستاذ خالد العتيبي' AND h.name = 'حلقة الإمام نافع'
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- STUDENTS
-- ------------------------------------------------------------
INSERT INTO students (user_id, full_name, date_of_birth, gender, phone, account_enabled)
SELECT id, 'عبدالله محمد القحطاني', '2013-02-20', 'MALE', '0561111111', TRUE
FROM users WHERE phone = '0500000006'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO students (user_id, full_name, date_of_birth, gender, phone, account_enabled)
SELECT id, 'يوسف أحمد الغامدي', '2014-07-08', 'MALE', '0562222222', TRUE
FROM users WHERE phone = '0500000007'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO students (full_name, date_of_birth, gender, phone)
VALUES
  ('عمر سعد الحربي', '2012-11-15', 'MALE', '0563333333'),
  ('يوسف إبراهيم الدوسري', '2013-05-30', 'MALE', '0564444444'),
  ('عبدالرحمن ماجد الشمري', '2014-01-22', 'MALE', '0565555555'),
  ('معاذ فهد الزهراني', '2012-08-05', 'MALE', '0566666666'),
  ('خالدين سعيد السبيعي', '2013-09-17', 'FEMALE', '0567777777'),
  ('مريم عبدالله العنزي', '2014-03-11', 'FEMALE', '0568888888'),
  ('راكان ناصر المطيري', '2013-06-25', 'MALE', '0569999999'),
  ('أنس ماجد البقمي', '2014-04-02', 'MALE', '0561010101'),
  ('زياد طلال العمري', '2012-12-09', 'MALE', '0562020202'),
  ('حسام عمر المالكي', '2013-10-14', 'MALE', '0563030303'),
  ('نورا خالد السبيعي', '2014-05-06', 'FEMALE', '0564040404'),
  ('سارة فهد الرشيد', '2013-07-28', 'FEMALE', '0565050505');

-- ------------------------------------------------------------
-- PARENTS
-- ------------------------------------------------------------
INSERT INTO parents (user_id, full_name)
SELECT id, 'محمد سعد القحطاني' FROM users WHERE phone = '0500000004'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO parents (user_id, full_name)
SELECT id, 'أحمد الغامدي' FROM users WHERE phone = '0500000005'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (phone, password_hash, role)
SELECT '0500000008', crypt('123456', gen_salt('bf')), 'PARENT'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '0500000008');

INSERT INTO parents (user_id, full_name)
SELECT id, 'سعد ماجد الحربي'
FROM users
WHERE phone = '0500000008'
  AND NOT EXISTS (SELECT 1 FROM parents WHERE full_name = 'سعد ماجد الحربي');

-- ربط أولياء الأمور بالطلاب
INSERT INTO parent_students (parent_id, student_id, relationship, is_primary)
SELECT p.id, s.id, 'أب', TRUE
FROM parents p, students s
WHERE p.full_name = 'محمد سعد القحطاني' AND s.full_name = 'عبدالله محمد القحطاني';

INSERT INTO parent_students (parent_id, student_id, relationship, is_primary)
SELECT p.id, s.id, 'أب', TRUE
FROM parents p, students s
WHERE p.full_name = 'أحمد الغامدي' AND s.full_name = 'يوسف أحمد الغامدي';

INSERT INTO parent_students (parent_id, student_id, relationship, is_primary)
SELECT p.id, s.id, 'أب', TRUE
FROM parents p, students s
WHERE p.full_name = 'سعد ماجد الحربي' AND s.full_name = 'عمر سعد الحربي'
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- ENROLLMENTS
-- توزيع الطلاب على الحلقات
-- ------------------------------------------------------------
INSERT INTO student_enrollments (student_id, halaqa_id, start_date)
SELECT s.id, h.id, '2025-09-01'
FROM students s
JOIN halaqat h ON h.name = 'حلقة الإمام عاصم'
WHERE s.gender = 'MALE' AND s.full_name <> 'مريم عبدالله العنزي'
ON CONFLICT DO NOTHING;

INSERT INTO student_enrollments (student_id, halaqa_id, start_date)
SELECT s.id, h.id, '2025-09-01'
FROM students s
JOIN halaqat h ON h.name = 'حلقة الإمام حفص'
WHERE s.full_name IN ('خالدين سعيد السبيعي', 'مريم عبدالله العنزي')
ON CONFLICT DO NOTHING;

INSERT INTO student_enrollments (student_id, halaqa_id, start_date)
SELECT s.id, h.id, '2025-09-01'
FROM students s
JOIN halaqat h ON h.name = 'حلقة الإمام نافع'
WHERE s.full_name IN ('نورا خالد السبيعي', 'سارة فهد الرشيد')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- ATTENDANCE
-- 20 يوم حضور لكل تسجيل
-- ------------------------------------------------------------
WITH seed AS (
  SELECT
    e.id,
    ROW_NUMBER() OVER (ORDER BY e.id) AS n
  FROM student_enrollments e
),
marked AS (
  SELECT
    s.id,
    d,
    s.n,
    ((s.n * 7 + EXTRACT(DAY FROM d)::int * 3) % 47) AS bucket,
    EXTRACT(DAY FROM d)::int AS day
  FROM seed s
  CROSS JOIN generate_series(DATE '2025-09-01', DATE '2025-09-20', INTERVAL '1 day') AS d(d)
)
INSERT INTO attendance (student_enrollment_id, attendance_date, status, note, recorded_by)
SELECT
  m.id,
  m.d,
  CASE
    WHEN m.day = 10 THEN 'EXCUSED'::attendance_status
    WHEN m.bucket = 0  THEN 'ABSENT'::attendance_status
    WHEN m.bucket = 1  THEN 'LATE'::attendance_status
    ELSE 'PRESENT'::attendance_status
  END,
  CASE
    WHEN m.day = 10 THEN 'بعذر طبي'
    WHEN m.bucket = 1 THEN 'تأخر عن بداية الحصة'
    ELSE NULL
  END,
  (SELECT id FROM users WHERE role = 'TEACHER' ORDER BY phone LIMIT 1)
FROM marked m
ON CONFLICT (student_enrollment_id, attendance_date) DO NOTHING;

-- ------------------------------------------------------------
-- MEMORIZATION
-- ------------------------------------------------------------
INSERT INTO memorization (student_enrollment_id, surah, from_ayah, to_ayah, evaluation, note, recorded_by)
SELECT
  e.id,
  (ARRAY['البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','التوبة','يونس','هود','يوسف','الكهف','مريم','طه','الأنبياء','النور','فاطر','الشمس','الليل','الضحى','الشرح'])[1 + (ROW_NUMBER() OVER (ORDER BY e.id) % 20)],
  1 + (ROW_NUMBER() OVER (ORDER BY e.id) % 5),
  10 + (ROW_NUMBER() OVER (ORDER BY e.id) % 15),
  (65 + (ROW_NUMBER() OVER (ORDER BY e.id) % 35))::NUMERIC(5,2),
  CASE WHEN ROW_NUMBER() OVER (ORDER BY e.id) % 3 = 0 THEN 'يحتاج مراجعة' ELSE NULL END,
  (SELECT id FROM users WHERE role = 'TEACHER' ORDER BY phone LIMIT 1)
FROM student_enrollments e;

-- ------------------------------------------------------------
-- REVISION
-- ------------------------------------------------------------
INSERT INTO revision (student_enrollment_id, surah, from_ayah, to_ayah, evaluation, note, recorded_by)
SELECT
  e.id,
  (ARRAY['البقرة','آل عمران','النساء','المائدة','الأنعام'])[1 + (ROW_NUMBER() OVER (ORDER BY e.id) % 5)],
  1 + (ROW_NUMBER() OVER (ORDER BY e.id) % 3),
  8 + (ROW_NUMBER() OVER (ORDER BY e.id) % 10),
  (70 + (ROW_NUMBER() OVER (ORDER BY e.id) % 28))::NUMERIC(5,2),
  NULL,
  (SELECT id FROM users WHERE role = 'TEACHER' ORDER BY phone LIMIT 1)
FROM student_enrollments e;

-- ------------------------------------------------------------
-- EVALUATIONS
-- ------------------------------------------------------------
INSERT INTO evaluations (
  student_enrollment_id, memorization_score, revision_score,
  recitation_score, overall_score, note, evaluated_by
)
SELECT
  e.id,
  n,
  LEAST(100, n + 5)::NUMERIC(5,2),
  GREATEST(0, n - 5)::NUMERIC(5,2),
  n::NUMERIC(5,2),
  CASE WHEN n < 75 THEN 'يحتاج إلى متابعة' ELSE 'ممتاز' END,
  (SELECT id FROM users WHERE role = 'TEACHER' ORDER BY phone LIMIT 1)
FROM (
  SELECT e.id, (70 + (ROW_NUMBER() OVER (ORDER BY e.id) % 29)) AS n
  FROM student_enrollments e
) e
WHERE NOT EXISTS (SELECT 1 FROM evaluations ev WHERE ev.student_enrollment_id = e.id);

-- ------------------------------------------------------------
-- NOTES
-- ------------------------------------------------------------
INSERT INTO notes (student_id, teacher_id, category, content)
SELECT s.id, t.id, 'EDUCATIONAL', 'يحتاج إلى مراجعة أحكام التجويد'
FROM students s, teachers t
WHERE s.full_name = 'عبدالله محمد القحطاني' AND t.full_name = 'الأستاذ خالد العتيبي';

INSERT INTO notes (student_id, teacher_id, category, content)
SELECT s.id, t.id, 'BEHAVIORAL', 'تحسن ملحوظ في الالتزام بالحضور'
FROM students s, teachers t
WHERE s.full_name = 'يوسف أحمد الغامدي' AND t.full_name = 'الأستاذ خالد العتيبي';

INSERT INTO notes (student_id, teacher_id, category, content)
SELECT s.id, NULL, 'FOLLOW_UP', 'يُنصح بمتابعة ولي الأمر بخصوص الأداء'
FROM students s
WHERE s.full_name = 'عمر سعد الحربي';

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, type)
SELECT id, 'مرحباً بك', 'نتمنى لك التوفيق في رحلتك مع إدارة الحلقات.', 'SYSTEM'
FROM users WHERE role = 'ADMIN';

INSERT INTO notifications (user_id, title, message, type)
SELECT id, 'تنبيه حضور', 'تم تسجيل الغياب اليوم لبعض الطلاب.', 'ATTENDANCE'
FROM users WHERE role = 'TEACHER';

INSERT INTO notifications (user_id, title, message, type)
SELECT id, 'تقييم جديد', 'تم رفع تقييم جديد لابنك.', 'EVALUATION'
FROM users WHERE role = 'PARENT';