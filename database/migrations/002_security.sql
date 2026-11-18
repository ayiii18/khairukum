-- ============================================================
-- 002_security.sql
-- Session hardening, login audit trail and editable settings.
-- ============================================================

-- Force a password change on first login for accounts created by an admin.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Track last login so the UI can show real activity.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- ============================================================
-- LOGIN AUDIT / RATE LIMITING
-- ============================================================
CREATE TABLE IF NOT EXISTS login_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(30) NOT NULL,
    ip VARCHAR(64) NOT NULL DEFAULT 'unknown',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    success BOOLEAN NOT NULL,
    reason VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_audit_phone_time
  ON login_audit(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_ip_time
  ON login_audit(ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_success_time
  ON login_audit(success, created_at DESC);

-- ============================================================
-- EDITABLE APPLICATION SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(80) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value)
VALUES
  ('organization', '{"name": "جمعية خيركم لتحفيظ القرآن الكريم", "email": "info@khairukum.sa", "phone": "0112345678"}'::jsonb),
  ('notifications', '{"absenceAlerts": true, "weeklyReport": true, "newStudentAlert": false}'::jsonb),
  ('students', '{"defaultEnrollmentStatus": "ACTIVE", "requireParentPhone": true}'::jsonb),
  ('security', '{"sessionDays": 7, "maxLoginAttempts": 8}'::jsonb)
ON CONFLICT (key) DO NOTHING;
