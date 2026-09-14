-- Each facility is an aggregate boundary. All child queries are facility-scoped.
CREATE TABLE IF NOT EXISTS facilities (id text PRIMARY KEY, name text NOT NULL);
CREATE TABLE IF NOT EXISTS caregivers (id text NOT NULL, facility_id text NOT NULL REFERENCES facilities(id), data jsonb NOT NULL, PRIMARY KEY (facility_id,id));
CREATE TABLE IF NOT EXISTS residents (id text NOT NULL, facility_id text NOT NULL REFERENCES facilities(id), data jsonb NOT NULL, PRIMARY KEY (facility_id,id));
CREATE TABLE IF NOT EXISTS recordings (id text NOT NULL, facility_id text NOT NULL REFERENCES facilities(id), resident_id text, data jsonb NOT NULL, PRIMARY KEY (facility_id,id), FOREIGN KEY (facility_id,resident_id) REFERENCES residents(facility_id,id));
CREATE TABLE IF NOT EXISTS information (id text NOT NULL, facility_id text NOT NULL REFERENCES facilities(id), resident_id text NOT NULL, recording_id text NOT NULL, data jsonb NOT NULL, PRIMARY KEY (facility_id,id), FOREIGN KEY (facility_id,resident_id) REFERENCES residents(facility_id,id), FOREIGN KEY (facility_id,recording_id) REFERENCES recordings(facility_id,id));
CREATE TABLE IF NOT EXISTS care_records (id text NOT NULL, facility_id text NOT NULL REFERENCES facilities(id), resident_id text NOT NULL, recording_id text NOT NULL, data jsonb NOT NULL, PRIMARY KEY (facility_id,id), UNIQUE(facility_id,recording_id), FOREIGN KEY (facility_id,resident_id) REFERENCES residents(facility_id,id), FOREIGN KEY (facility_id,recording_id) REFERENCES recordings(facility_id,id));
CREATE TABLE IF NOT EXISTS audit_logs (id text NOT NULL, facility_id text NOT NULL REFERENCES facilities(id), data jsonb NOT NULL, PRIMARY KEY (facility_id,id));
CREATE TABLE IF NOT EXISTS handoffs (id text NOT NULL, facility_id text NOT NULL REFERENCES facilities(id), data jsonb NOT NULL, PRIMARY KEY (facility_id,id));
CREATE INDEX IF NOT EXISTS information_resident ON information(facility_id,resident_id);
CREATE INDEX IF NOT EXISTS recordings_resident ON recordings(facility_id,resident_id);
