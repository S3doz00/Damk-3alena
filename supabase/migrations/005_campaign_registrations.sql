-- Campaign registrations: one row per donor-per-campaign.
-- Server-enforced: (1) uniqueness via UNIQUE(campaign_id, donor_id),
-- (2) ABO/Rh compatibility via BEFORE INSERT trigger,
-- (3) registered_donors counter maintained via trigger.
-- Applied to Supabase project fyushkwhotqyihzuekhr on 2026-04-18.

CREATE TABLE IF NOT EXISTS campaign_registrations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    donor_id      UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    blood_type    blood_type NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (campaign_id, donor_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_registrations_donor ON campaign_registrations(donor_id);
CREATE INDEX IF NOT EXISTS idx_campaign_registrations_campaign ON campaign_registrations(campaign_id);

CREATE OR REPLACE FUNCTION can_donate_to_any(donor blood_type, needed blood_type[])
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    compat blood_type[];
BEGIN
    compat := CASE donor
        WHEN 'O-'::blood_type  THEN ARRAY['O-','O+','A-','A+','B-','B+','AB-','AB+']::blood_type[]
        WHEN 'O+'::blood_type  THEN ARRAY['O+','A+','B+','AB+']::blood_type[]
        WHEN 'A-'::blood_type  THEN ARRAY['A-','A+','AB-','AB+']::blood_type[]
        WHEN 'A+'::blood_type  THEN ARRAY['A+','AB+']::blood_type[]
        WHEN 'B-'::blood_type  THEN ARRAY['B-','B+','AB-','AB+']::blood_type[]
        WHEN 'B+'::blood_type  THEN ARRAY['B+','AB+']::blood_type[]
        WHEN 'AB-'::blood_type THEN ARRAY['AB-','AB+']::blood_type[]
        WHEN 'AB+'::blood_type THEN ARRAY['AB+']::blood_type[]
    END;
    RETURN EXISTS (SELECT 1 FROM unnest(compat) c WHERE c = ANY(needed));
END;
$$;

CREATE OR REPLACE FUNCTION enforce_campaign_blood_compat()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    campaign_blood_types blood_type[];
BEGIN
    SELECT blood_types_needed INTO campaign_blood_types FROM campaigns WHERE id = NEW.campaign_id;
    IF campaign_blood_types IS NULL THEN
        RAISE EXCEPTION 'Campaign % not found', NEW.campaign_id;
    END IF;
    IF NOT can_donate_to_any(NEW.blood_type, campaign_blood_types) THEN
        RAISE EXCEPTION 'Blood type % is not compatible with this campaign', NEW.blood_type;
    END IF;
    UPDATE campaigns SET registered_donors = registered_donors + 1 WHERE id = NEW.campaign_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaign_registrations_insert ON campaign_registrations;
CREATE TRIGGER trg_campaign_registrations_insert
BEFORE INSERT ON campaign_registrations
FOR EACH ROW EXECUTE FUNCTION enforce_campaign_blood_compat();

CREATE OR REPLACE FUNCTION decrement_campaign_registered()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE campaigns SET registered_donors = GREATEST(0, registered_donors - 1) WHERE id = OLD.campaign_id;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaign_registrations_delete ON campaign_registrations;
CREATE TRIGGER trg_campaign_registrations_delete
AFTER DELETE ON campaign_registrations
FOR EACH ROW EXECUTE FUNCTION decrement_campaign_registered();

ALTER TABLE campaign_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donors_select_own_campaign_registrations" ON campaign_registrations;
CREATE POLICY "donors_select_own_campaign_registrations"
ON campaign_registrations FOR SELECT
USING (donor_id = get_donor_id());

DROP POLICY IF EXISTS "donors_insert_own_campaign_registrations" ON campaign_registrations;
CREATE POLICY "donors_insert_own_campaign_registrations"
ON campaign_registrations FOR INSERT
WITH CHECK (donor_id = get_donor_id());

DROP POLICY IF EXISTS "donors_delete_own_campaign_registrations" ON campaign_registrations;
CREATE POLICY "donors_delete_own_campaign_registrations"
ON campaign_registrations FOR DELETE
USING (donor_id = get_donor_id());

DROP POLICY IF EXISTS "staff_read_all_campaign_registrations" ON campaign_registrations;
CREATE POLICY "staff_read_all_campaign_registrations"
ON campaign_registrations FOR SELECT
USING (get_user_role() IN ('staff','admin'));
