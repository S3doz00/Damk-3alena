-- SECURITY DEFINER RPC for staff/admin to purge expired booked appointments.
-- Mirrors delete_cancelled_appointments() pattern.
-- Applied to Supabase project fyushkwhotqyihzuekhr on 2026-04-18.

CREATE OR REPLACE FUNCTION delete_expired_booked_appointments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
    caller_role TEXT;
BEGIN
    SELECT role INTO caller_role FROM users WHERE auth_id = auth.uid();
    IF caller_role NOT IN ('staff', 'admin') THEN
        RAISE EXCEPTION 'Only staff or admin may purge expired appointments';
    END IF;

    WITH deleted AS (
        DELETE FROM appointments
        WHERE status = 'booked'
          AND appointment_date < CURRENT_DATE
        RETURNING 1
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_expired_booked_appointments() TO authenticated;
