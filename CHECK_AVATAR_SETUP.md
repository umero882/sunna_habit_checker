# Check Avatar Setup - Quick Diagnosis

## Step 1: Verify Database Column Exists

Run this SQL query in Supabase SQL Editor:

```sql
-- Check if avatar_url column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name = 'avatar_url';
```

**Expected Result:**
- Should return 1 row
- `column_name`: avatar_url
- `data_type`: text
- `is_nullable`: YES

**If NO rows returned** → Column doesn't exist → Migration not applied!

---

## Step 2: Check Your Profile Row

```sql
-- Replace YOUR_USER_ID with your actual user ID
SELECT user_id, full_name, avatar_url
FROM user_profiles
WHERE user_id = '45a99c83-50b6-4aa7-a705-f87fed231173';
```

**What to check:**
- Is `avatar_url` NULL? → Update query failed
- Is `avatar_url` a URL? → Should start with `https://`
- Copy the URL and paste in browser → Does image load?

---

## Step 3: Manually Set Avatar URL (Test)

If the column exists but avatar_url is NULL, manually set it:

```sql
-- Use the URL from your storage (you said photo is in storage)
UPDATE user_profiles
SET avatar_url = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/avatars/45a99c83-50b6-4aa7-a705-f87fed231173/avatar_TIMESTAMP.jpg'
WHERE user_id = '45a99c83-50b6-4aa7-a705-f87fed231173';
```

Replace:
- `YOUR_PROJECT` with your Supabase project ID
- `TIMESTAMP` with actual timestamp from filename in storage

**Then reload your app** → If photo appears → Upload code isn't saving to database!

---

## Step 4: Check Storage Bucket

1. Go to Supabase **Storage**
2. Click **avatars** bucket
3. Find folder: `45a99c83-50b6-4aa7-a705-f87fed231173`
4. Click on the image file
5. Click **Copy URL** or **Get URL**
6. Copy the full URL

This is what should be in your `avatar_url` column!

---

## Step 5: Check Console Logs

When you upload, look for this specific log:

```
📝 Updating user_profiles table with URL: https://...
```

Then look for:
```
✅ Profile updated with new avatar URL: [...]
```

**If you see an error instead:**
```
❌ Error updating profile: {...}
```

Share that error message!

---

## Quick Fix Script

If migration wasn't applied properly, run this:

```sql
-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url text;
    END IF;
END $$;

-- Verify it worked
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'avatar_url';
```

---

## Then Test Upload Again

1. Go to Profile → Edit
2. Upload photo
3. Watch console for errors
4. Check database: `SELECT avatar_url FROM user_profiles WHERE user_id = '45a99c83-50b6-4aa7-a705-f87fed231173'`
5. Should have URL now

---

## Still Not Working?

Share these logs from console:
1. `📝 Updating user_profiles table with URL:` - What URL?
2. `✅ Profile updated` OR `❌ Error updating profile` - Which one?
3. `👤 Profile data fetched:` - What's the avatarUrl value?
4. Any error messages in red
