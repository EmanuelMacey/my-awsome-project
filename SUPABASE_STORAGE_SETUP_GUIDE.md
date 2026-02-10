
# Supabase Storage Setup Guide - Profile Pictures

This guide will help you set up Supabase Storage buckets for profile picture uploads.

## The Problem

When users try to upload profile pictures, they get the error:
```
"Storage bucket not found"
```

This happens because the storage buckets haven't been created in your Supabase project yet.

## Solution: Create Storage Buckets

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com
2. Sign in to your account
3. Select your project: **ErrandRunners** (or your project name)

### Step 2: Navigate to Storage

1. In the left sidebar, click on **Storage**
2. You'll see the Storage dashboard

### Step 3: Create the "avatars" Bucket

1. Click the **"New bucket"** button
2. Fill in the details:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Check this box** (so images are publicly accessible)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/jpg, image/webp`
3. Click **"Create bucket"**

### Step 4: Set Up Storage Policies (CRITICAL)

The bucket needs proper Row Level Security (RLS) policies so users can upload and view images.

#### Option A: Using Supabase Dashboard (Recommended)

1. Click on the **"avatars"** bucket you just created
2. Click on **"Policies"** tab
3. Click **"New Policy"**

**Policy 1: Allow Public Read Access**
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression:
  ```sql
  true
  ```
- Click **"Review"** then **"Save policy"**

**Policy 2: Allow Authenticated Users to Upload**
- Click **"New Policy"** again
- Policy name: `Authenticated users can upload`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- USING expression:
  ```sql
  true
  ```
- Click **"Review"** then **"Save policy"**

**Policy 3: Allow Users to Update Their Own Images**
- Click **"New Policy"** again
- Policy name: `Users can update own images`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **"Review"** then **"Save policy"**

**Policy 4: Allow Users to Delete Their Own Images**
- Click **"New Policy"** again
- Policy name: `Users can delete own images`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **"Review"** then **"Save policy"**

#### Option B: Using SQL Editor (Advanced)

1. Go to **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Paste this SQL:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for avatars bucket
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload to avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

4. Click **"Run"**
5. You should see: `Success. No rows returned`

### Step 5: Create Fallback "images" Bucket (Optional)

The app has a fallback mechanism that tries the "images" bucket if "avatars" fails.

1. Click **"New bucket"** again
2. Fill in:
   - **Name**: `images`
   - **Public bucket**: ✅ Check this
   - **File size limit**: 10 MB
3. Click **"Create bucket"**
4. Repeat the policy setup from Step 4 for the "images" bucket (replace `'avatars'` with `'images'` in the SQL)

### Step 6: Verify Setup

1. Go back to **Storage** → **avatars** bucket
2. You should see:
   - ✅ Bucket is public
   - ✅ Policies are enabled (4 policies)

### Step 7: Test in the App

1. Open your ErrandRunners app
2. Go to **Profile** screen
3. Tap on the profile picture
4. Select an image
5. You should see:
   - "Uploading..." indicator
   - "Success! Profile picture updated" message
   - Your new profile picture displayed

## Troubleshooting

### Error: "row-level security policy violation"

**Cause**: RLS policies are not set up correctly.

**Solution**: 
1. Go to Storage → avatars → Policies
2. Make sure you have all 4 policies (SELECT, INSERT, UPDATE, DELETE)
3. Check that the policies target the correct roles (`public` for SELECT, `authenticated` for others)

### Error: "new row violates row-level security policy"

**Cause**: The INSERT policy is missing or incorrect.

**Solution**:
```sql
-- Run this in SQL Editor:
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

### Error: "Failed to get public URL"

**Cause**: Bucket is not public.

**Solution**:
1. Go to Storage → avatars
2. Click the **settings icon** (gear)
3. Check **"Public bucket"**
4. Click **"Save"**

### Images Upload But Don't Display

**Cause**: Public read policy is missing.

**Solution**:
```sql
-- Run this in SQL Editor:
CREATE POLICY "Public read for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Error: "Bucket not found"

**Cause**: The bucket name is misspelled or doesn't exist.

**Solution**:
1. Go to Storage dashboard
2. Verify the bucket name is exactly `avatars` (lowercase, no spaces)
3. If it doesn't exist, create it following Step 3

## Security Best Practices

1. **File Size Limits**: Set appropriate limits (5-10 MB for profile pictures)
2. **MIME Type Restrictions**: Only allow image types
3. **User-Specific Folders**: Store images in folders named by user ID
4. **Regular Cleanup**: Set up a cron job to delete old/unused images
5. **CDN**: Consider using Supabase's CDN for faster image delivery

## Advanced: Automatic Image Optimization

To automatically optimize uploaded images:

1. Go to **Database** → **Functions**
2. Create a new function:

```sql
CREATE OR REPLACE FUNCTION optimize_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Add image optimization logic here
  -- This is a placeholder for future implementation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_avatar_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION optimize_avatar();
```

## Need More Help?

- **Supabase Docs**: https://supabase.com/docs/guides/storage
- **Storage Policies**: https://supabase.com/docs/guides/storage/security/access-control
- **Community**: https://github.com/supabase/supabase/discussions

---

**After completing these steps, profile picture uploads should work perfectly!** ✅
