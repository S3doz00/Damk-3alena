-- ============================================
-- Damk 3alena - Row Level Security Policies
-- 002_rls_policies.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS
-- ============================================
CREATE POLICY "users_read_own" ON users
    FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "admins_read_all_users" ON users
    FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "admins_update_users" ON users
    FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "users_insert" ON users
    FOR INSERT WITH CHECK (auth_id = auth.uid());
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth_id = auth.uid());

-- ============================================
-- DONORS
-- ============================================
CREATE POLICY "donors_read_own" ON donors
    FOR SELECT USING (user_id = get_user_id());
CREATE POLICY "donors_update_own" ON donors
    FOR UPDATE USING (user_id = get_user_id());
CREATE POLICY "staff_read_donors" ON donors
    FOR SELECT USING (get_user_role() IN ('staff', 'admin'));
CREATE POLICY "donors_insert" ON donors
    FOR INSERT WITH CHECK (user_id = get_user_id());

-- ============================================
-- FACILITIES (everyone can read for map)
-- ============================================
CREATE POLICY "facilities_read_all" ON facilities
    FOR SELECT USING (true);
CREATE POLICY "admins_manage_facilities" ON facilities
    FOR ALL USING (get_user_role() = 'admin');

-- ============================================
-- STAFF
-- ============================================
CREATE POLICY "staff_read_own" ON staff
    FOR SELECT USING (user_id = get_user_id());
CREATE POLICY "staff_insert" ON staff
    FOR INSERT WITH CHECK (user_id = get_user_id());
CREATE POLICY "admins_read_all_staff" ON staff
    FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "admins_update_staff" ON staff
    FOR UPDATE USING (get_user_role() = 'admin');

-- ============================================
-- BLOOD REQUESTS
-- ============================================
CREATE POLICY "donors_read_open_requests" ON blood_requests
    FOR SELECT USING (status IN ('open', 'in_progress'));
CREATE POLICY "staff_read_own_requests" ON blood_requests
    FOR SELECT USING (facility_id = get_staff_facility_id());
CREATE POLICY "staff_create_requests" ON blood_requests
    FOR INSERT WITH CHECK (facility_id = get_staff_facility_id());
CREATE POLICY "staff_update_requests" ON blood_requests
    FOR UPDATE USING (facility_id = get_staff_facility_id());
CREATE POLICY "admins_manage_requests" ON blood_requests
    FOR ALL USING (get_user_role() = 'admin');

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE POLICY "donors_read_own_appointments" ON appointments
    FOR SELECT USING (donor_id = get_donor_id());
CREATE POLICY "donors_create_appointments" ON appointments
    FOR INSERT WITH CHECK (donor_id = get_donor_id());
CREATE POLICY "donors_update_appointments" ON appointments
    FOR UPDATE USING (donor_id = get_donor_id());
CREATE POLICY "staff_read_facility_appointments" ON appointments
    FOR SELECT USING (facility_id = get_staff_facility_id());
CREATE POLICY "admins_read_appointments" ON appointments
    FOR SELECT USING (get_user_role() = 'admin');

-- ============================================
-- DONATION RECORDS
-- ============================================
CREATE POLICY "donors_read_own_records" ON donation_records
    FOR SELECT USING (donor_id = get_donor_id());
CREATE POLICY "staff_read_facility_records" ON donation_records
    FOR SELECT USING (facility_id = get_staff_facility_id());
CREATE POLICY "admins_read_records" ON donation_records
    FOR SELECT USING (get_user_role() = 'admin');

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE POLICY "donors_read_own_notifications" ON notifications
    FOR SELECT USING (donor_id = get_donor_id());
CREATE POLICY "donors_update_own_notifications" ON notifications
    FOR UPDATE USING (donor_id = get_donor_id());

-- ============================================
-- SYSTEM PARAMETERS (everyone reads, admin writes)
-- ============================================
CREATE POLICY "all_read_params" ON system_parameters
    FOR SELECT USING (true);
CREATE POLICY "admins_update_params" ON system_parameters
    FOR UPDATE USING (get_user_role() = 'admin');

-- ============================================
-- AI OUTPUTS (staff reads their facility, admin reads all)
-- ============================================
CREATE POLICY "staff_read_ai_outputs" ON ai_outputs
    FOR SELECT USING (facility_id = get_staff_facility_id() OR get_user_role() = 'admin');
CREATE POLICY "staff_read_forecasts" ON forecast_results
    FOR SELECT USING (facility_id = get_staff_facility_id() OR get_user_role() = 'admin');
CREATE POLICY "staff_read_shortage" ON shortage_alerts
    FOR SELECT USING (facility_id = get_staff_facility_id() OR get_user_role() = 'admin');
CREATE POLICY "staff_read_recommendations" ON donor_recommendations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM blood_requests br
            WHERE br.id = donor_recommendations.request_id
            AND br.facility_id = get_staff_facility_id()
        )
        OR get_user_role() = 'admin'
    );

-- ============================================
-- ACTION LOGS (admin only)
-- ============================================
CREATE POLICY "admins_read_logs" ON action_logs
    FOR SELECT USING (get_user_role() = 'admin');
