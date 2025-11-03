# Profile Photo Upload Feature

## Overview

Added profile photo upload functionality to allow users to upload, change, and remove their profile picture. Photos are stored in Supabase Storage with proper security policies.

## Features Implemented

### 1. Photo Upload Service (`src/services/profilePhotoService.ts`)
- **Pick from Gallery**: Select photos from device gallery with permissions handling
- **Take Photo**: Capture new photo using device camera
- **Upload to Storage**: Upload photos to Supabase Storage with validation
- **Delete Photo**: Remove existing profile photos
- **File Validation**:
  - Maximum file size: 5MB
  - Type checking: Only image files allowed
  - Automatic cleanup of old avatars

### 2. Database Schema Update
Created migration: `supabase/migrations/add_avatar_to_user_profiles.sql`

#### Changes:
- Added `avatar_url` column to `user_profiles` table
- Created `avatars` storage bucket (public read access)
- Implemented Row Level Security (RLS) policies:
  - Users can upload their own avatar
  - Users can update their own avatar
  - Users can delete their own avatar
  - Anyone can view avatars (public read)

### 3. UI Components Updated

#### EditProfileModal (`src/components/profile/EditProfileModal.tsx`)
- Added large circular avatar display (120x120)
- Shows user initials when no photo uploaded
- Camera button overlay for easy photo changes
- Platform-specific photo picker:
  - **iOS**: ActionSheet with options
  - **Android**: Alert dialog with options
- Options available:
  - Take Photo (camera)
  - Choose from Library (gallery)
  - Remove Photo (if photo exists)
- Loading indicator during upload
- Real-time photo preview after upload

#### ProfileHeader (`src/components/profile/ProfileHeader.tsx`)
- Displays user's uploaded photo when available
- Falls back to initials if no photo
- Matches existing circular design (72x72)

#### useProfile Hook (`src/hooks/useProfile.ts`)
- Updated to fetch `avatar_url` from `user_profiles` table
- Also fetches `full_name` for better display
- Caches profile data for 10 minutes

### 4. Dependencies
- Installed `expo-image-picker` for photo selection and camera access

## Database Migration Steps

### Apply Migration to Supabase

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Select your project

2. **Run SQL Migration**
   - Navigate to **SQL Editor**
   - Click **New Query**
   - Copy contents from `supabase/migrations/add_avatar_to_user_profiles.sql`
   - Paste into editor
   - Click **Run** (or press Ctrl/Cmd + Enter)

3. **Verify Migration**
   - Go to **Table Editor**
   - Check `user_profiles` table
   - Confirm `avatar_url` column exists (text type, nullable)
   - Go to **Storage**
   - Confirm `avatars` bucket exists with public access

## User Flow

### Uploading Profile Photo

1. User navigates to Profile screen
2. Taps "Edit" button next to profile header
3. Edit Profile Modal opens with current photo or initials
4. Taps on avatar or camera button
5. Selects option:
   - **Take Photo**: Opens camera, user takes photo
   - **Choose from Library**: Opens gallery, user selects photo
   - **Remove Photo**: Deletes current photo (if exists)
6. Photo is validated (size, type)
7. Photo uploads to Supabase Storage (bucket: `avatars/{user_id}/avatar_timestamp.jpg`)
8. Old photos are automatically deleted
9. `avatar_url` is saved to `user_profiles` table
10. Profile updates immediately with new photo
11. Success message displayed

### Viewing Profile Photo

- Profile photo appears on:
  - Profile screen header (72x72 circle)
  - Edit Profile modal (120x120 circle)
- Photos are cached by device for faster loading
- Falls back to initials if photo fails to load

## Security Features

### Permissions
- Requests camera permission before camera access
- Requests media library permission before gallery access
- Handles permission denials gracefully with user-friendly messages

### Storage Security (RLS)
- Users can only upload to their own folder (`avatars/{user_id}/`)
- Users can only update/delete their own photos
- Public read access allows photos to be displayed
- Files are organized by user ID for easy management

### File Validation
- **Size Limit**: 5MB maximum
- **Type Check**: Only image files accepted
- **Automatic Cleanup**: Old avatars deleted on new upload

## File Structure

```
src/
├── services/
│   └── profilePhotoService.ts       # Photo upload/delete service
├── components/
│   └── profile/
│       ├── EditProfileModal.tsx     # Updated with photo picker
│       └── ProfileHeader.tsx        # Updated to show photo
├── hooks/
│   └── useProfile.ts                # Updated to fetch avatar_url
└── screens/
    └── ProfileScreen.tsx            # Passes avatar_url to modal

supabase/
└── migrations/
    └── add_avatar_to_user_profiles.sql  # Database migration
```

## Testing Checklist

- [ ] Upload photo from gallery works
- [ ] Take photo with camera works
- [ ] Remove photo works
- [ ] Photo displays in profile header
- [ ] Photo displays in edit modal
- [ ] Photo persists after app reload
- [ ] Large files (>5MB) are rejected
- [ ] Non-image files are rejected
- [ ] Permissions handled gracefully
- [ ] Old photos are cleaned up
- [ ] Multiple users can't access each other's photos

## Troubleshooting

### Issue: Photo not uploading
- Check Supabase Storage is enabled
- Verify `avatars` bucket exists
- Check RLS policies are active
- Verify user is authenticated

### Issue: Permission denied
- Check device settings allow camera/photo access
- Reinstall app to reset permissions
- Check app.json has required permissions

### Issue: Photo not displaying
- Check `avatar_url` is saved in database
- Verify image URL is accessible
- Check network connection
- Try force refresh (pull to refresh on profile)

### Issue: Old photos not deleted
- Check user has delete permissions on Storage
- Verify RLS policies include DELETE
- Check Storage bucket settings

## Future Enhancements

- [ ] Image compression before upload
- [ ] Crop/rotate image editor
- [ ] Avatar templates/icons
- [ ] Progress indicator for upload
- [ ] Retry failed uploads
- [ ] Offline upload queue
- [ ] Image filters/effects
