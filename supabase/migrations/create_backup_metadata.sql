-- Backup Metadata Table
-- Stores metadata about user backups in Supabase Storage

CREATE TABLE IF NOT EXISTS backup_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  backup_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  size_bytes bigint NOT NULL DEFAULT 0,
  data_types text[] NOT NULL DEFAULT '{}',
  version text NOT NULL DEFAULT '1.0.0',
  UNIQUE(user_id, backup_name)
);

-- Enable RLS
ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own backups"
  ON backup_metadata
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backups"
  ON backup_metadata
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
  ON backup_metadata
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_backup_metadata_user_id
  ON backup_metadata(user_id);

CREATE INDEX IF NOT EXISTS idx_backup_metadata_created_at
  ON backup_metadata(created_at DESC);

-- Grant permissions
GRANT ALL ON backup_metadata TO authenticated;
GRANT ALL ON backup_metadata TO service_role;
