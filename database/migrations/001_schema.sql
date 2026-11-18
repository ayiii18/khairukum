-- ============================================================
-- نظام إدارة حلقات تحفيظ القرآن الكريم
-- Quran Memorization Circles Management System
-- Database: PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN
        CREATE TYPE user_role AS ENUM (
            'ADMIN',
            'TEACHER',
            'STUDENT',
            'PARENT'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enrollment_status'
    ) THEN
        CREATE TYPE enrollment_status AS ENUM (
            'ACTIVE',
            'COMPLETED',
            'TRANSFERRED',
            'SUSPENDED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'attendance_status'
    ) THEN
        CREATE TYPE attendance_status AS ENUM (
            'PRESENT',
            'ABSENT',
            'LATE',
            'EXCUSED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'note_category'
    ) THEN
        CREATE TYPE note_category AS ENUM (
            'EDUCATIONAL',
            'BEHAVIORAL',
            'ADMINISTRATIVE',
            'FOLLOW_UP'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'notification_type'
    ) THEN
        CREATE TYPE notification_type AS ENUM (
            'SYSTEM',
            'ATTENDANCE',
            'STUDENT',
            'MEMORIZATION',
            'EVALUATION',
            'ADMINISTRATIVE'
        );
    END IF;
END
$$;


-- ============================================================
-- 2. USERS
-- جميع الحسابات في النظام
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    phone VARCHAR(20) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role user_role NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. MOSQUES
-- المساجد
-- ============================================================

CREATE TABLE IF NOT EXISTS mosques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(200) NOT NULL,

    address TEXT,

    phone VARCHAR(20),

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. HALAQAT
-- الحلقات
-- ============================================================

CREATE TABLE IF NOT EXISTS halaqat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    mosque_id UUID NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_halaqa_mosque
        FOREIGN KEY (mosque_id)
        REFERENCES mosques(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_halaqa_name_per_mosque
        UNIQUE (mosque_id, name)
);


-- ============================================================
-- 5. TEACHERS
-- المعلمون
-- ============================================================

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    full_name VARCHAR(200) NOT NULL,

    date_of_birth DATE,

    phone VARCHAR(20),

    address TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_teacher_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 6. TEACHER HALAQAT
-- ربط المعلمين بالحلقات
-- ============================================================

CREATE TABLE IF NOT EXISTS teacher_halaqas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    teacher_id UUID NOT NULL,

    halaqa_id UUID NOT NULL,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_teacher_halaqa_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_teacher_halaqa_halaqa
        FOREIGN KEY (halaqa_id)
        REFERENCES halaqat(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_teacher_halaqa
        UNIQUE (teacher_id, halaqa_id)
);


-- معلم واحد يمكن أن يكون لديه حلقة أساسية واحدة فقط
CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_primary_halaqa
ON teacher_halaqas(teacher_id)
WHERE is_primary = TRUE;


-- ============================================================
-- 7. STUDENTS
-- الطلاب
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE,

    full_name VARCHAR(200) NOT NULL,

    date_of_birth DATE,

    gender VARCHAR(10) NOT NULL,

    phone VARCHAR(20),

    account_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_student_gender
        CHECK (gender IN ('MALE', 'FEMALE'))
);


-- ============================================================
-- 8. PARENTS
-- أولياء الأمور
-- ============================================================

CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    full_name VARCHAR(200) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_parent_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 9. PARENT STUDENTS
-- ربط ولي الأمر بالطلاب
-- يسمح لأب واحد بامتلاك أكثر من ابن
-- ويسمح للطالب بوجود أكثر من ولي أمر
-- ============================================================

CREATE TABLE IF NOT EXISTS parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    parent_id UUID NOT NULL,

    student_id UUID NOT NULL,

    relationship VARCHAR(50),

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_parent_student_parent
        FOREIGN KEY (parent_id)
        REFERENCES parents(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_parent_student_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_parent_student
        UNIQUE (parent_id, student_id)
);


-- ولي أمر أساسي واحد للطالب
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_primary_parent
ON parent_students(student_id)
WHERE is_primary = TRUE;


-- ============================================================
-- 10. STUDENT ENROLLMENTS
-- تسجيل الطالب في الحلقة
-- ============================================================

CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL,

    halaqa_id UUID NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE,

    status enrollment_status NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_enrollment_halaqa
        FOREIGN KEY (halaqa_id)
        REFERENCES halaqat(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_enrollment_dates
        CHECK (
            end_date IS NULL
            OR end_date >= start_date
        )
);


-- الطالب لا يمكن أن يكون لديه تسجيل ACTIVE أكثر من واحد
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_active_enrollment
ON student_enrollments(student_id)
WHERE status = 'ACTIVE';


-- ============================================================
-- 11. ATTENDANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_enrollment_id UUID NOT NULL,

    attendance_date DATE NOT NULL,

    status attendance_status NOT NULL,

    note TEXT,

    recorded_by UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attendance_enrollment
        FOREIGN KEY (student_enrollment_id)
        REFERENCES student_enrollments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_attendance_recorder
        FOREIGN KEY (recorded_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_attendance_day
        UNIQUE (
            student_enrollment_id,
            attendance_date
        )
);


-- ============================================================
-- 12. MEMORIZATION
-- ============================================================

CREATE TABLE IF NOT EXISTS memorization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_enrollment_id UUID NOT NULL,

    surah VARCHAR(100) NOT NULL,

    from_ayah INTEGER NOT NULL,

    to_ayah INTEGER NOT NULL,

    evaluation NUMERIC(5,2),

    note TEXT,

    recorded_by UUID NOT NULL,

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_memorization_enrollment
        FOREIGN KEY (student_enrollment_id)
        REFERENCES student_enrollments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_memorization_recorder
        FOREIGN KEY (recorded_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_memorization_from_ayah
        CHECK (from_ayah > 0),

    CONSTRAINT chk_memorization_to_ayah
        CHECK (to_ayah >= from_ayah),

    CONSTRAINT chk_memorization_evaluation
        CHECK (
            evaluation IS NULL
            OR (
                evaluation >= 0
                AND evaluation <= 100
            )
        )
);


-- ============================================================
-- 13. REVISION
-- ============================================================

CREATE TABLE IF NOT EXISTS revision (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_enrollment_id UUID NOT NULL,

    surah VARCHAR(100) NOT NULL,

    from_ayah INTEGER NOT NULL,

    to_ayah INTEGER NOT NULL,

    evaluation NUMERIC(5,2),

    note TEXT,

    recorded_by UUID NOT NULL,

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_revision_enrollment
        FOREIGN KEY (student_enrollment_id)
        REFERENCES student_enrollments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_revision_recorder
        FOREIGN KEY (recorded_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_revision_from_ayah
        CHECK (from_ayah > 0),

    CONSTRAINT chk_revision_to_ayah
        CHECK (to_ayah >= from_ayah),

    CONSTRAINT chk_revision_evaluation
        CHECK (
            evaluation IS NULL
            OR (
                evaluation >= 0
                AND evaluation <= 100
            )
        )
);


-- ============================================================
-- 14. EVALUATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_enrollment_id UUID NOT NULL,

    memorization_score NUMERIC(5,2),

    revision_score NUMERIC(5,2),

    recitation_score NUMERIC(5,2),

    overall_score NUMERIC(5,2),

    note TEXT,

    evaluated_by UUID NOT NULL,

    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_evaluation_enrollment
        FOREIGN KEY (student_enrollment_id)
        REFERENCES student_enrollments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_evaluation_teacher
        FOREIGN KEY (evaluated_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_memorization_score
        CHECK (
            memorization_score IS NULL
            OR memorization_score BETWEEN 0 AND 100
        ),

    CONSTRAINT chk_revision_score
        CHECK (
            revision_score IS NULL
            OR revision_score BETWEEN 0 AND 100
        ),

    CONSTRAINT chk_recitation_score
        CHECK (
            recitation_score IS NULL
            OR recitation_score BETWEEN 0 AND 100
        ),

    CONSTRAINT chk_overall_score
        CHECK (
            overall_score IS NULL
            OR overall_score BETWEEN 0 AND 100
        )
);


-- ============================================================
-- 15. NOTES
-- ============================================================

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL,

    teacher_id UUID,

    category note_category NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_note_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_note_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    type notification_type NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 17. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_mosques_active ON mosques(is_active);
CREATE INDEX IF NOT EXISTS idx_halaqat_mosque ON halaqat(mosque_id);
CREATE INDEX IF NOT EXISTS idx_halaqat_active ON halaqat(is_active);
CREATE INDEX IF NOT EXISTS idx_teachers_active ON teachers(is_active);
CREATE INDEX IF NOT EXISTS idx_teacher_halaqas_teacher ON teacher_halaqas(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_halaqas_halaqa ON teacher_halaqas(halaqa_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(full_name);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_parents_name ON parents(full_name);
CREATE INDEX IF NOT EXISTS idx_parent_students_parent ON parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student ON parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_halaqa ON student_enrollments(halaqa_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON student_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_memorization_enrollment ON memorization(student_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_memorization_surah ON memorization(surah);
CREATE INDEX IF NOT EXISTS idx_memorization_date ON memorization(recorded_at);
CREATE INDEX IF NOT EXISTS idx_revision_enrollment ON revision(student_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_revision_surah ON revision(surah);
CREATE INDEX IF NOT EXISTS idx_revision_date ON revision(recorded_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_enrollment ON evaluations(student_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(evaluated_at);
CREATE INDEX IF NOT EXISTS idx_notes_student ON notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_teacher ON notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);


-- ============================================================
-- 18. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_mosques_updated_at ON mosques;
CREATE TRIGGER trg_mosques_updated_at BEFORE UPDATE ON mosques FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_halaqat_updated_at ON halaqat;
CREATE TRIGGER trg_halaqat_updated_at BEFORE UPDATE ON halaqat FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_teachers_updated_at ON teachers;
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_parents_updated_at ON parents;
CREATE TRIGGER trg_parents_updated_at BEFORE UPDATE ON parents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_notes_updated_at ON notes;
CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
