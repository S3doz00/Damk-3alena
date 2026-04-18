-- Allow donors to delete their own expired booked appointments.
-- Scope: must be the donor on the row, status must be 'booked', date strictly before today.
-- Rationale: client-side cleanup of no-show/expired bookings keeps the "upcoming" list honest.

CREATE POLICY "donors_delete_own_expired_appointments" ON appointments
  FOR DELETE
  USING (
    donor_id IN (SELECT id FROM donors WHERE user_id = auth.uid())
    AND status = 'booked'
    AND appointment_date < CURRENT_DATE
  );
