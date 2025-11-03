# Profile Photo Not Showing - Troubleshooting Guide

## Issue: Only Placeholder/Initials Showing

If you're seeing only initials instead of your uploaded photo, follow these steps:

---

## ✅ Step 1: Check Database Migration (CRITICAL!)

The `avatar_url` column must exist in the database. **This is the most common issue!**

### Apply the Migration:

1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Open file: `supabase/migrations/add_avatar_to_user_profiles.sql`
5. Copy ALL the SQL code
6. Paste into Supabase SQL Editor
7. Click **Run** (or Ctrl/Cmd + Enter)
8. You should see: "Success. No rows returned"

### Verify Migration Applied:

1. Go to **Table Editor** in Supabase
2. Find `user_profiles` table
3. Check if `avatar_url` column exists (should be type: text, nullable)
4. Go to **Storage**
5. Check if `avatars` bucket exists

**If migration not applied, photo uploads will fail silently!**

---

## ✅ Step 2: Check Console Logs

Reload your app and watch the console for these messages:

### Expected Logs After Photo Upload:
```
INFO  [profilePhotoService] 📤 Starting profile photo upload for user {user_id}
INFO  [profilePhotoService] Image validated: {size}KB
INFO  [profilePhotoService] 📁 Uploading to: avatars/{user_id}/avatar_{timestamp}.jpg
INFO  [profilePhotoService] ✅ Upload successful: {path}
INFO  [profilePhotoService] ✅ Profile updated with new avatar URL
```

### Profile Fetch Logs:
```
👤 Profile data fetched: {
  userId: "...",
  hasProfile: true,
  avatarUrl: "https://..." or "none",
  fullName: "Your Name" or "none"
}
```

### If You See Errors:
```
⚠️ Error fetching profile data: {...}
❌ Upload error: {...}
❌ Error updating profile: {...}
```

Copy the error message - it will tell you exactly what's wrong!

---

## ✅ Step 3: Test Photo Upload

1. Go to **Profile** tab
2. Tap **Edit** button (pencil icon)
3. Tap on the avatar circle or camera icon
4. Choose photo from gallery or take new photo
5. Watch console for upload logs
6. Should see "Success" alert

### If Upload Fails:

**Check Error Message:**
- "Not authenticated" → Sign in again
- "Bucket does not exist" → Migration not applied
- "Permission denied" → RLS policies not set up
- "Failed to read image" → Photo file issue

---

## ✅ Step 4: Check Database Directly

### Verify avatar_url was saved:

1. Go to Supabase **Table Editor**
2. Open `user_profiles` table
3. Find your user row (match user_id)
4. Check `avatar_url` column
5. Should contain: `https://{project}.supabase.co/storage/v1/object/public/avatars/{user_id}/avatar_{timestamp}.jpg`

### If avatar_url is NULL:
- Photo upload failed
- Check console logs for errors
- Re-upload photo

### If avatar_url has a value but photo not showing:
- Copy the URL
- Paste in browser
- If image loads → App caching issue (reload app)
- If 404 error → File not in storage (re-upload)
- If 403 error → RLS policies issue

---

## ✅ Step 5: Check Storage

1. Go to Supabase **Storage**
2. Click `avatars` bucket
3. You should see folder: `{your-user-id}`
4. Inside should be: `avatar_{timestamp}.jpg`
5. Click file → **Get URL** → Should be publicly accessible

### If bucket doesn't exist:
- Migration not applied correctly
- Re-run migration SQL

### If folder is empty:
- Upload didn't complete
- Check upload logs
- Try uploading again

---

## ✅ Step 6: Force Refresh

### Clear App Cache:
1. **iOS**: Delete app and reinstall
2. **Android**: Settings → Apps → Sunnah Habit Checker → Clear Data
3. **Expo Go**: Close and reopen app

### Clear React Query Cache:
The app caches profile data for 10 minutes. To force refresh:
1. Pull down on any screen to refresh
2. Or wait 10 minutes
3. Or restart the app

---

## ✅ Step 7: Check Network

### Test Internet Connection:
- Open browser on device
- Try accessing: `https://{your-project}.supabase.co`
- Should load Supabase page

### Check Supabase Status:
- Go to [status.supabase.com](https://status.supabase.com)
- Verify all services operational

---

## 🔍 Common Issues & Solutions

### Issue: "Cannot read property 'avatar_url' of undefined"
**Cause**: Profile data not loaded yet
**Solution**: Component shows loading state, wait for data to load

### Issue: Initials show instead of photo
**Cause 1**: No photo uploaded yet
**Solution**: Upload a photo in Profile → Edit

**Cause 2**: avatar_url is null in database
**Solution**: Re-upload photo, check upload logs

**Cause 3**: Migration not applied
**Solution**: Run the SQL migration

### Issue: Photo shows on Profile but not Home/Prayer pages
**Cause**: Components not fetching same data
**Solution**: All use useProfile() hook - force refresh app

### Issue: Upload succeeds but photo not in database
**Cause**: Update query failed
**Solution**: Check console for "Error updating profile"

### Issue: Old photo still showing after upload
**Cause**: React Query cache
**Solution**: Pull to refresh or restart app

---

## 📋 Quick Checklist

Before troubleshooting further, verify:

- [ ] Database migration applied in Supabase
- [ ] `avatar_url` column exists in `user_profiles` table
- [ ] `avatars` bucket exists in Storage
- [ ] Storage bucket is public
- [ ] RLS policies created for storage
- [ ] User is signed in
- [ ] Photo was uploaded (check console logs)
- [ ] avatar_url saved in database (check table editor)
- [ ] File exists in storage (check storage browser)
- [ ] No console errors
- [ ] App reloaded after upload

---

## 🛠️ Manual Fix

If nothing works, manually test:

### 1. Check if Column Exists:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'avatar_url';
```

Should return one row with type "text"

### 2. Check Your Profile:
```sql
SELECT user_id, full_name, avatar_url
FROM user_profiles
WHERE user_id = 'YOUR_USER_ID_HERE';
```

Should show your row with avatar_url value or NULL

### 3. Manually Set Avatar URL (TESTING ONLY):
```sql
UPDATE user_profiles
SET avatar_url = 'https://example.com/test-image.jpg'
WHERE user_id = 'YOUR_USER_ID_HERE';
```

If this makes photo appear → Upload process is broken
If this doesn't make photo appear → Display logic is broken

---

## 📞 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Check console logs** - Copy any error messages
2. **Check Supabase logs** - Go to Supabase → Logs
3. **Verify migration** - Re-run the SQL migration
4. **Test with different photo** - Try a smaller image
5. **Check permissions** - Camera/gallery access granted?

### Debug Mode:

The app now logs profile fetch attempts. Look for:
```
👤 Profile data fetched: { ... }
```

This will show exactly what data is being loaded!

---

## ✅ Expected Behavior

When working correctly:

1. Upload photo → See "Success" alert
2. Modal closes → Photo updates immediately
3. Navigate to Home → Photo in top-right
4. Navigate to Prayer → Photo in top-right
5. Back to Profile → Large photo displays
6. Reload app → Photo persists
7. Change photo → Old one deleted, new one appears

If any of these steps fail, there's an issue!
