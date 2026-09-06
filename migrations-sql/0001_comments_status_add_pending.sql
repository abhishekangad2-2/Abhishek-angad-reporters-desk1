-- Comments moved to moderation: reader comments land as 'pending' and are
-- approved to 'visible' in the CMS. The enum type must carry 'pending'.
-- Idempotent; ADD VALUE lives alone (Postgres cannot use a value added in the
-- same transaction — the SET DEFAULT that uses it is in 0002).
ALTER TYPE enum_comments_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'visible';
