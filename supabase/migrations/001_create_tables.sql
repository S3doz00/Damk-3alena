-- ============================================
-- Damk 3alena - Database Schema
-- 001_create_tables.sql
-- ============================================

-- ENUM types
CREATE TYPE user_role AS ENUM ('donor', 'staff', 'admin');
CREATE TYPE request_urgency AS ENUM ('normal', 'urgent', 'critical');
CREATE TYPE request_status AS ENUM ('open', 'in_progress', 'fulfilled', 'closed');
CREATE TYPE appointment_status AS ENUM ('booked', 'completed', 'cancelled', 'no_show');
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- ============================================
-- USERS (base table, linked to Supabase Auth)
-- ============================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        user_role NOT NULL DEFAULT 'donor',
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    phone       TEXT UNIQUE,
    email       TEXT UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DONORS (extends users)
-- ============================================
CREATE TABLE donors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    national_id     TEXT UNIQUE NOT NULL,
    blood_type      blood_type NOT NULL,
    gender          TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    birth_date      DATE NOT NULL,
    profile_image   TEXT,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    location_name   TEXT,
    is_eligible     BOOLEAN DEFAULT true,
    next_eligible   DATE,
    total_donations INTEGER DEFAULT 0,
    last_donation   DATE,
    push_token      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FACILITIES (hospitals / blood banks)
-- ============================================
CREATE TABLE facilities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('hospital', 'blood_bank')),
    address         TEXT,
    city            TEXT,
    region          TEXT,
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    phone           TEXT,
    working_hours   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STAFF (extends users, linked to a facility)
-- ============================================
CREATE TABLE staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id     UUID NOT NULL REFERENCES facilities(id),
    position        TEXT,
    is_approved     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BLOOD REQUESTS (created by staff)
-- ============================================
CREATE TABLE blood_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id     UUID NOT NULL REFERENCES facilities(id),
    created_by      UUID NOT NULL REFERENCES staff(id),
    blood_type      blood_type NOT NULL,
    units_needed    INTEGER DEFAULT 1,
    urgency         request_urgency DEFAULT 'normal',
    status          request_status DEFAULT 'open',
    patient_name    TEXT,
    patient_file_no TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id        UUID NOT NULL REFERENCES donors(id),
    facility_id     UUID NOT NULL REFERENCES facilities(id),
    request_id      UUID REFERENCES blood_requests(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status          appointment_status DEFAULT 'booked',
    is_walkin       BOOLEAN DEFAULT false,
    ticket_code     TEXT UNIQUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DONATION RECORDS
-- ============================================
CREATE TABLE donation_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id        UUID NOT NULL REFERENCES donors(id),
    facility_id     UUID NOT NULL REFERENCES facilities(id),
    appointment_id  UUID REFERENCES appointments(id),
    blood_type      blood_type NOT NULL,
    donation_date   DATE NOT NULL,
    units           INTEGER DEFAULT 1,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id        UUID NOT NULL REFERENCES donors(id),
    request_id      UUID REFERENCES blood_requests(id),
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT false,
    sent_at         TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SYSTEM PARAMETERS (admin-configurable)
-- ============================================
CREATE TABLE system_parameters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key             TEXT UNIQUE NOT NULL,
    value           TEXT NOT NULL,
    description     TEXT,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Seed default parameters
INSERT INTO system_parameters (key, value, description) VALUES
    ('shortage_threshold_critical', '5', 'Units below which a blood type is critically short'),
    ('shortage_threshold_warning', '15', 'Units below which a blood type triggers a warning'),
    ('eligibility_days', '56', 'Minimum days between donations'),
    ('notification_radius_km', '50', 'Max distance in km for donor notifications'),
    ('forecast_horizon_weeks', '4', 'Number of weeks to forecast ahead');

-- ============================================
-- AI OUTPUTS (base table)
-- ============================================
CREATE TABLE ai_outputs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id     UUID REFERENCES facilities(id),
    output_type     TEXT NOT NULL CHECK (output_type IN ('forecast', 'shortage_alert', 'donor_recommendation')),
    generated_at    TIMESTAMPTZ DEFAULT now(),
    metadata        JSONB
);

-- ============================================
-- FORECAST RESULTS
-- ============================================
CREATE TABLE forecast_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_output_id    UUID NOT NULL REFERENCES ai_outputs(id) ON DELETE CASCADE,
    facility_id     UUID NOT NULL REFERENCES facilities(id),
    blood_type      blood_type NOT NULL,
    forecast_week   DATE NOT NULL,
    predicted_units INTEGER NOT NULL,
    confidence      DOUBLE PRECISION,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SHORTAGE ALERTS
-- ============================================
CREATE TABLE shortage_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_output_id    UUID NOT NULL REFERENCES ai_outputs(id) ON DELETE CASCADE,
    facility_id     UUID NOT NULL REFERENCES facilities(id),
    blood_type      blood_type NOT NULL,
    severity        TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
    current_units   INTEGER,
    predicted_units INTEGER,
    threshold       INTEGER,
    message         TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DONOR RECOMMENDATIONS
-- ============================================
CREATE TABLE donor_recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_output_id    UUID NOT NULL REFERENCES ai_outputs(id) ON DELETE CASCADE,
    request_id      UUID NOT NULL REFERENCES blood_requests(id),
    donor_id        UUID NOT NULL REFERENCES donors(id),
    score           DOUBLE PRECISION NOT NULL,
    distance_km     DOUBLE PRECISION,
    is_eligible     BOOLEAN,
    blood_compatible BOOLEAN,
    reasoning       TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ACTION LOG (FR-24)
-- ============================================
CREATE TABLE action_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    action          TEXT NOT NULL,
    entity_type     TEXT,
    entity_id       UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_donors_blood_type ON donors(blood_type);
CREATE INDEX idx_donors_eligible ON donors(is_eligible) WHERE is_eligible = true;
CREATE INDEX idx_blood_requests_status ON blood_requests(status);
CREATE INDEX idx_blood_requests_facility ON blood_requests(facility_id);
CREATE INDEX idx_appointments_donor ON appointments(donor_id);
CREATE INDEX idx_appointments_facility ON appointments(facility_id);
CREATE INDEX idx_notifications_donor ON notifications(donor_id);
CREATE INDEX idx_forecast_facility_week ON forecast_results(facility_id, forecast_week);
CREATE INDEX idx_shortage_active ON shortage_alerts(is_active) WHERE is_active = true;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's id
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
    SELECT id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current donor's id
CREATE OR REPLACE FUNCTION get_donor_id()
RETURNS UUID AS $$
    SELECT d.id FROM donors d
    JOIN users u ON d.user_id = u.id
    WHERE u.auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current staff's facility_id
CREATE OR REPLACE FUNCTION get_staff_facility_id()
RETURNS UUID AS $$
    SELECT s.facility_id FROM staff s
    JOIN users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER blood_requests_updated_at BEFORE UPDATE ON blood_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
