-- Default new comments to 'pending' so nothing can auto-publish by accident
-- (e.g. a row inserted without an explicit status). Runs after 0001 committed
-- 'pending', so using it here is safe.
ALTER TABLE comments ALTER COLUMN status SET DEFAULT 'pending';
