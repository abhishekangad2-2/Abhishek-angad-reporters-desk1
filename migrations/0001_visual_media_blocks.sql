-- Migration: add 9 new visual media block tables
-- Apply to production BEFORE enabling NEW_VISUAL_MEDIA_BLOCKS in Stories.ts
-- All statements are CREATE TABLE IF NOT EXISTS (safe to re-run).

-- 1. FullBleedImage
CREATE TABLE IF NOT EXISTS stories_blocks_full_bleed_image (
  _order      integer           NOT NULL,
  _parent_id  integer           NOT NULL,
  _path       text              NOT NULL,
  id          character varying NOT NULL,
  image_id    integer           NOT NULL,
  overlay_text character varying,
  credit      character varying,
  block_name  character varying,
  CONSTRAINT stories_blocks_full_bleed_image_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_full_bleed_image_order_idx     ON stories_blocks_full_bleed_image (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_full_bleed_image_parent_id_idx ON stories_blocks_full_bleed_image (_parent_id);
CREATE INDEX IF NOT EXISTS stories_blocks_full_bleed_image_path_idx      ON stories_blocks_full_bleed_image (_path);
CREATE INDEX IF NOT EXISTS stories_blocks_full_bleed_image_image_idx     ON stories_blocks_full_bleed_image (image_id);
DO $$ BEGIN
  ALTER TABLE stories_blocks_full_bleed_image
    ADD CONSTRAINT stories_blocks_full_bleed_image_image_id_media_id_fk
    FOREIGN KEY (image_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE stories_blocks_full_bleed_image
    ADD CONSTRAINT stories_blocks_full_bleed_image_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. ImageComparison
CREATE TABLE IF NOT EXISTS stories_blocks_image_comparison (
  _order        integer           NOT NULL,
  _parent_id    integer           NOT NULL,
  _path         text              NOT NULL,
  id            character varying NOT NULL,
  before_image_id integer         NOT NULL,
  after_image_id  integer         NOT NULL,
  before_label  character varying,
  after_label   character varying,
  caption       character varying,
  block_name    character varying,
  CONSTRAINT stories_blocks_image_comparison_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_image_comparison_order_idx       ON stories_blocks_image_comparison (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_image_comparison_parent_id_idx   ON stories_blocks_image_comparison (_parent_id);
CREATE INDEX IF NOT EXISTS stories_blocks_image_comparison_path_idx        ON stories_blocks_image_comparison (_path);
CREATE INDEX IF NOT EXISTS stories_blocks_image_comparison_before_idx      ON stories_blocks_image_comparison (before_image_id);
CREATE INDEX IF NOT EXISTS stories_blocks_image_comparison_after_idx       ON stories_blocks_image_comparison (after_image_id);
DO $$ BEGIN
  ALTER TABLE stories_blocks_image_comparison
    ADD CONSTRAINT stories_blocks_image_comparison_before_image_id_media_id_fk
    FOREIGN KEY (before_image_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE stories_blocks_image_comparison
    ADD CONSTRAINT stories_blocks_image_comparison_after_image_id_media_id_fk
    FOREIGN KEY (after_image_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE stories_blocks_image_comparison
    ADD CONSTRAINT stories_blocks_image_comparison_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. PullQuote
CREATE TABLE IF NOT EXISTS stories_blocks_pull_quote (
  _order      integer           NOT NULL,
  _parent_id  integer           NOT NULL,
  _path       text              NOT NULL,
  id          character varying NOT NULL,
  quote       text              NOT NULL,
  attribution character varying,
  block_name  character varying,
  CONSTRAINT stories_blocks_pull_quote_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_pull_quote_order_idx     ON stories_blocks_pull_quote (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_pull_quote_parent_id_idx ON stories_blocks_pull_quote (_parent_id);
CREATE INDEX IF NOT EXISTS stories_blocks_pull_quote_path_idx      ON stories_blocks_pull_quote (_path);
DO $$ BEGIN
  ALTER TABLE stories_blocks_pull_quote
    ADD CONSTRAINT stories_blocks_pull_quote_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Diptych
CREATE TABLE IF NOT EXISTS stories_blocks_diptych (
  _order         integer           NOT NULL,
  _parent_id     integer           NOT NULL,
  _path          text              NOT NULL,
  id             character varying NOT NULL,
  left_image_id  integer           NOT NULL,
  left_caption   character varying,
  right_image_id integer           NOT NULL,
  right_caption  character varying,
  block_name     character varying,
  CONSTRAINT stories_blocks_diptych_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_diptych_order_idx      ON stories_blocks_diptych (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_diptych_parent_id_idx  ON stories_blocks_diptych (_parent_id);
CREATE INDEX IF NOT EXISTS stories_blocks_diptych_path_idx       ON stories_blocks_diptych (_path);
CREATE INDEX IF NOT EXISTS stories_blocks_diptych_left_idx       ON stories_blocks_diptych (left_image_id);
CREATE INDEX IF NOT EXISTS stories_blocks_diptych_right_idx      ON stories_blocks_diptych (right_image_id);
DO $$ BEGIN
  ALTER TABLE stories_blocks_diptych
    ADD CONSTRAINT stories_blocks_diptych_left_image_id_media_id_fk
    FOREIGN KEY (left_image_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE stories_blocks_diptych
    ADD CONSTRAINT stories_blocks_diptych_right_image_id_media_id_fk
    FOREIGN KEY (right_image_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE stories_blocks_diptych
    ADD CONSTRAINT stories_blocks_diptych_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. VideoEmbed
CREATE TABLE IF NOT EXISTS stories_blocks_video_embed (
  _order         integer           NOT NULL,
  _parent_id     integer           NOT NULL,
  _path          text              NOT NULL,
  id             character varying NOT NULL,
  video_file_id  integer,
  embed_url      character varying,
  caption        character varying,
  block_name     character varying,
  CONSTRAINT stories_blocks_video_embed_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_video_embed_order_idx       ON stories_blocks_video_embed (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_video_embed_parent_id_idx   ON stories_blocks_video_embed (_parent_id);
CREATE INDEX IF NOT EXISTS stories_blocks_video_embed_path_idx        ON stories_blocks_video_embed (_path);
CREATE INDEX IF NOT EXISTS stories_blocks_video_embed_video_file_idx  ON stories_blocks_video_embed (video_file_id);
DO $$ BEGIN
  ALTER TABLE stories_blocks_video_embed
    ADD CONSTRAINT stories_blocks_video_embed_video_file_id_media_id_fk
    FOREIGN KEY (video_file_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE stories_blocks_video_embed
    ADD CONSTRAINT stories_blocks_video_embed_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. AudioClip
CREATE TABLE IF NOT EXISTS stories_blocks_audio_clip (
  _order        integer           NOT NULL,
  _parent_id    integer           NOT NULL,
  _path         text              NOT NULL,
  id            character varying NOT NULL,
  audio_file_id integer           NOT NULL,
  title         character varying,
  caption       character varying,
  block_name    character varying,
  CONSTRAINT stories_blocks_audio_clip_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_audio_clip_order_idx        ON stories_blocks_audio_clip (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_audio_clip_parent_id_idx    ON stories_blocks_audio_clip (_parent_id);
CREATE INDEX IF NOT EXISTS stories_blocks_audio_clip_path_idx         ON stories_blocks_audio_clip (_path);
CREATE INDEX IF NOT EXISTS stories_blocks_audio_clip_audio_file_idx   ON stories_blocks_audio_clip (audio_file_id);
DO $$ BEGIN
  ALTER TABLE stories_blocks_audio_clip
    ADD CONSTRAINT stories_blocks_audio_clip_audio_file_id_media_id_fk
    FOREIGN KEY (audio_file_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE stories_blocks_audio_clip
    ADD CONSTRAINT stories_blocks_audio_clip_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. StatHighlight (parent + stats child array)
CREATE TABLE IF NOT EXISTS stories_blocks_stat_highlight (
  _order     integer           NOT NULL,
  _parent_id integer           NOT NULL,
  _path      text              NOT NULL,
  id         character varying NOT NULL,
  intro      character varying,
  block_name character varying,
  CONSTRAINT stories_blocks_stat_highlight_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_stat_highlight_order_idx     ON stories_blocks_stat_highlight (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_stat_highlight_parent_id_idx ON stories_blocks_stat_highlight (_parent_id);
CREATE INDEX IF NOT EXISTS stories_blocks_stat_highlight_path_idx      ON stories_blocks_stat_highlight (_path);
DO $$ BEGIN
  ALTER TABLE stories_blocks_stat_highlight
    ADD CONSTRAINT stories_blocks_stat_highlight_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS stories_blocks_stat_highlight_stats (
  _order     integer           NOT NULL,
  _parent_id character varying NOT NULL,
  id         character varying NOT NULL,
  value      character varying NOT NULL,
  label      character varying NOT NULL,
  CONSTRAINT stories_blocks_stat_highlight_stats_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_stat_highlight_stats_order_idx     ON stories_blocks_stat_highlight_stats (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_stat_highlight_stats_parent_id_idx ON stories_blocks_stat_highlight_stats (_parent_id);
DO $$ BEGIN
  ALTER TABLE stories_blocks_stat_highlight_stats
    ADD CONSTRAINT stories_blocks_stat_highlight_stats_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories_blocks_stat_highlight(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. RedactedDocument
CREATE TABLE IF NOT EXISTS stories_blocks_redacted_document (
  _order           integer           NOT NULL,
  _parent_id       integer           NOT NULL,
  _path            text              NOT NULL,
  id               character varying NOT NULL,
  document_image_id integer          NOT NULL,
  source_label     character varying,
  caption          character varying,
  block_name       character varying,
  CONSTRAINT stories_blocks_redacted_document_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_redacted_document_order_idx        ON stories_blocks_redacted_document (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_redacted_document_parent_id_idx    ON stories_blocks_redacted_document (_parent_id);
CREATE INDEX IF NOT EXISTS stories_blocks_redacted_document_path_idx         ON stories_blocks_redacted_document (_path);
CREATE INDEX IF NOT EXISTS stories_blocks_redacted_document_doc_image_idx    ON stories_blocks_redacted_document (document_image_id);
DO $$ BEGIN
  ALTER TABLE stories_blocks_redacted_document
    ADD CONSTRAINT stories_blocks_redacted_document_document_image_id_media_id_fk
    FOREIGN KEY (document_image_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE stories_blocks_redacted_document
    ADD CONSTRAINT stories_blocks_redacted_document_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. Timeline (parent + entries child array)
CREATE TABLE IF NOT EXISTS stories_blocks_timeline (
  _order     integer           NOT NULL,
  _parent_id integer           NOT NULL,
  _path      text              NOT NULL,
  id         character varying NOT NULL,
  block_name character varying,
  CONSTRAINT stories_blocks_timeline_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_timeline_order_idx     ON stories_blocks_timeline (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_timeline_parent_id_idx ON stories_blocks_timeline (_parent_id);
CREATE INDEX IF NOT EXISTS stories_blocks_timeline_path_idx      ON stories_blocks_timeline (_path);
DO $$ BEGIN
  ALTER TABLE stories_blocks_timeline
    ADD CONSTRAINT stories_blocks_timeline_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS stories_blocks_timeline_entries (
  _order     integer           NOT NULL,
  _parent_id character varying NOT NULL,
  id         character varying NOT NULL,
  date       character varying NOT NULL,
  title      character varying NOT NULL,
  detail     text,
  CONSTRAINT stories_blocks_timeline_entries_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS stories_blocks_timeline_entries_order_idx     ON stories_blocks_timeline_entries (_order);
CREATE INDEX IF NOT EXISTS stories_blocks_timeline_entries_parent_id_idx ON stories_blocks_timeline_entries (_parent_id);
DO $$ BEGIN
  ALTER TABLE stories_blocks_timeline_entries
    ADD CONSTRAINT stories_blocks_timeline_entries_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES stories_blocks_timeline(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
