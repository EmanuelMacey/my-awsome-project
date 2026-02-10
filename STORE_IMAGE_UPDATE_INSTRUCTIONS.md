
# Store Image Update Instructions

## Issue
The admin dashboard is experiencing network errors when trying to upload images to Supabase Storage. This is likely due to:
1. Storage bucket not being properly configured
2. CORS or permissions issues
3. Network connectivity problems

## Solution Options

### Option 1: Fix Supabase Storage (Recommended for Production)

1. **Go to your Supabase Dashboard**
   - Visit: https://sytixskkgfvjjjemmoav.supabase.co

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar

3. **Create/Configure the Images Bucket**
   - If "images" bucket doesn't exist, create it
   - Click "New bucket"
   - Name: `images`
   - Make it **Public** (toggle the public option)
   - Click "Create bucket"

4. **Set Bucket Policies**
   - Click on the "images" bucket
   - Go to "Policies" tab
   - Add these policies:

   **Policy 1: Allow public read access**
   ```sql
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'images' );
   ```

   **Policy 2: Allow authenticated users to upload**
   ```sql
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'images' 
     AND auth.role() = 'authenticated'
   );
   ```

   **Policy 3: Allow authenticated users to update**
   ```sql
   CREATE POLICY "Authenticated users can update"
   ON storage.objects FOR UPDATE
   USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );
   ```

5. **Test Upload**
   - Try uploading an image through the admin dashboard again

### Option 2: Use Direct Image URLs (Quick Fix)

Instead of uploading images, you can use direct URLs from the images already in your assets folder:

1. **Upload images to a CDN or image hosting service** (like Imgur, Cloudinary, or AWS S3)
2. **Or use the local asset paths** (temporary solution)

### Option 3: Manual Database Update (Immediate Fix)

Run these SQL commands in your Supabase SQL Editor to update the store logos directly:

```sql
-- Update Exclusive Eggball
UPDATE stores 
SET logo = 'https://your-cdn-url.com/exclusive-eggball.jpeg'
WHERE name = 'Exclusive Eggball';

-- Update Gangbao
UPDATE stores 
SET logo = 'https://your-cdn-url.com/gangbao.jpeg'
WHERE name = 'Gangbao';

-- Update Golden Pagoda
UPDATE stores 
SET logo = 'https://your-cdn-url.com/golden-pagoda.png'
WHERE name = 'Golden Pagoda';

-- Update KFC
UPDATE stores 
SET logo = 'https://your-cdn-url.com/kfc.jpeg'
WHERE name = 'KFC';

-- Update Fireside Grill & Chill
UPDATE stores 
SET logo = 'https://your-cdn-url.com/fireside-grill.jpeg'
WHERE name = 'Fireside Grill & Chill';
```

## Image Files Provided

The following images are already in your assets folder:

1. **Exclusive Eggball**: `assets/images/ef8b9968-446a-4152-af30-7f7953549bae.jpeg`
2. **Gangbao**: `assets/images/af0a50fd-d731-4f2a-a05b-f0ecb62c22b3.jpeg`
3. **Golden Pagoda**: `assets/images/9dec66dc-3a70-423c-8bc2-e0e009058c9a.png`
4. **KFC**: `assets/images/fd07bf72-13e7-42a7-99f2-dd135e854e52.jpeg`
5. **Fireside Grill & Chill**: `assets/images/3c02984f-dbea-4344-82ac-44160f61b176.jpeg`

## Using the Updated Admin Dashboard

The admin dashboard now has improved features:

### Features Added:
1. **Better Error Handling**: Shows detailed error messages
2. **Manual URL Input**: You can paste image URLs directly instead of uploading
3. **Image Preview**: See the image before saving
4. **Remove Image**: Clear the image and select a new one
5. **Detailed Logging**: Console logs help debug issues

### How to Use:

1. **Open Admin Dashboard**
   - Navigate to Store Management

2. **Edit a Store**
   - Click "Edit" on any store card

3. **Add Image - Three Ways**:
   
   **Method A: Upload from Device**
   - Tap the "📷 Tap to Upload Image" button
   - Select an image from your device
   - Wait for upload to complete

   **Method B: Paste Image URL**
   - In the text field below the upload button
   - Paste a direct image URL
   - The image will be used when you save

   **Method C: Use Hosted Images**
   - Upload your images to a service like:
     - Imgur (https://imgur.com)
     - Cloudinary (https://cloudinary.com)
     - AWS S3
     - Any CDN
   - Copy the public URL
   - Paste it in the URL field

4. **Save the Store**
   - Fill in all required fields (marked with *)
   - Click "💾 Save Store"

## Troubleshooting

### "Network Error" when uploading
- **Check internet connection**
- **Verify Supabase Storage is configured** (see Option 1 above)
- **Use Method B or C** (paste URL instead of uploading)

### Image doesn't display
- **Check if URL is publicly accessible**
- **Verify URL is correct** (copy-paste it in a browser)
- **Check image format** (JPEG, PNG, WebP are supported)

### "Storage bucket not found"
- **Follow Option 1** to create the storage bucket
- **Or use Method B/C** to bypass storage upload

## Quick Fix Summary

**Fastest solution right now:**
1. Upload the 5 images to Imgur or similar service
2. Get the public URLs
3. Open Admin Dashboard → Edit each store
4. Paste the URL in the image URL field
5. Save

**Long-term solution:**
1. Configure Supabase Storage properly (Option 1)
2. Upload images through the admin dashboard
3. Images will be stored in your Supabase project

## Need Help?

If you continue to experience issues:
1. Check the console logs in the app (they now show detailed error messages)
2. Verify your Supabase project is active and accessible
3. Test the storage bucket by manually uploading a file in the Supabase dashboard
4. Ensure your Supabase project has storage enabled (some plans may have limits)
