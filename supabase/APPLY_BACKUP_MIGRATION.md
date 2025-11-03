# Apply Backup Metadata Table Migration

This guide shows how to apply the `backup_metadata` table migration to fix the backup/restore feature.

## Error Being Fixed

```
"could not find the table 'public.backup_metadata' in the schema cache"
```

## Steps to Apply Migration

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard at [supabase.com](https://supabase.com)
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Open the file `supabase/migrations/create_backup_metadata.sql` from your project
5. Copy the entire contents of the file
6. Paste it into the Supabase SQL Editor
7. Click "Run" or press `Ctrl/Cmd + Enter`
8. You should see "Success. No rows returned" message

### Option 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

## Verify Migration

After applying the migration, verify it was created successfully:

1. Go to "Table Editor" in Supabase
2. Look for `backup_metadata` table
3. Check that it has these columns:
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key to auth.users)
   - `backup_name` (text)
   - `created_at` (timestamptz)
   - `size_bytes` (bigint)
   - `data_types` (text array)
   - `version` (text)

## Test Backup/Restore

After applying the migration:

1. Reload your app
2. Go to Profile → Settings
3. Try "Backup Data" - should work without errors
4. Try "Restore Data" - should list your backups

## What This Migration Does

The `backup_metadata` table stores information about user backups:

- **Purpose**: Track backup files stored in Supabase Storage
- **Security**: Row Level Security (RLS) enabled - users can only see their own backups
- **Features**: Stores backup name, size, creation date, data types included, and version

## Troubleshooting

If you still see errors after applying:

1. Make sure you're logged into the correct Supabase project
2. Check that the SQL query ran successfully (no error messages)
3. Refresh your Supabase dashboard
4. Clear your app cache and reload
5. Check Supabase logs for any permission issues
