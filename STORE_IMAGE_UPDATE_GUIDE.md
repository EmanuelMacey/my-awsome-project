
# Store Image Update Guide

## 📸 How to Update Store Images

### Method 1: Via Admin Panel (Recommended)

1. **Login as Admin:**
   - Email: admin@errandrunners.com
   - Password: Admin123!

2. **Navigate to Store Management:**
   - From the admin dashboard, tap **"Store Management"**

3. **Select Store to Update:**
   - Find the store you want to update
   - Tap the **"Edit"** button

4. **Upload New Image:**
   - Tap **"Pick Image"**
   - Select the new logo from your device
   - The image will automatically upload to Supabase Storage

5. **Save Changes:**
   - Tap **"Save Store"**
   - The new logo will be visible immediately

### Method 2: Via Database (Advanced)

If you need to update multiple stores at once or have direct database access:

1. **Upload images to Supabase Storage:**
   - Go to Supabase Dashboard → Storage
   - Navigate to `store-images` bucket
   - Upload your images

2. **Update the database:**
   ```sql
   UPDATE stores 
   SET logo = 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/store-images/your-image.jpg'
   WHERE name = 'Store Name';
   ```

---

## ✅ Recently Updated Stores

The following stores have been updated with new logos:

| Store Name | Image File | Status |
|------------|-----------|--------|
| Gangbao | e7c288f6-92ef-4c8a-b705-3a104bb8e190.jpeg | ✅ Updated |
| Popeyes (Louisiana Kitchen) | 3a14717e-9277-4b8b-93bf-d5d3e8dbf4f0.jpeg | ✅ Updated |
| Golden Pagoda | 8c0d290d-1897-4f3c-bc51-dcf1c920b295.png | ✅ Updated |
| KFC | bc5490f8-6c6a-46c2-ac1e-3d3f83a45bd6.jpeg | ✅ Updated |
| Fireside Grill and Chill | 9cd06907-197e-4354-963e-320e61a97dde.jpeg | ✅ Updated |

---

## 📋 Image Requirements

### Recommended Specifications

- **Format:** JPG, PNG, or WebP
- **Size:** 500 x 500 px minimum (square)
- **File Size:** Under 2 MB
- **Background:** Transparent PNG preferred for logos
- **Quality:** High resolution for clarity

### Best Practices

1. **Use official brand logos** when available
2. **Maintain aspect ratio** - square images work best
3. **Remove backgrounds** for a cleaner look
4. **Optimize file size** without losing quality
5. **Test on both light and dark themes**

---

## 🔍 Verifying Image Updates

After updating a store image:

1. **Clear app cache:**
   - Close and reopen the app
   - Or force refresh the home screen

2. **Check multiple screens:**
   - Home screen store list
   - Store detail page
   - Cart screen
   - Order history

3. **Test on different devices:**
   - iOS and Android
   - Different screen sizes
   - Light and dark mode

---

## 🆘 Troubleshooting

### Image Not Showing

**Problem:** New image doesn't appear after update

**Solutions:**
1. Check the image URL is correct and accessible
2. Verify the image was uploaded to Supabase Storage
3. Clear app cache and restart
4. Check image permissions in Supabase Storage (should be public)

### Image Quality Issues

**Problem:** Image appears blurry or pixelated

**Solutions:**
1. Upload a higher resolution image (at least 500 x 500 px)
2. Use PNG format for better quality
3. Avoid over-compression

### Upload Fails

**Problem:** Image upload fails in admin panel

**Solutions:**
1. Check file size (must be under 5 MB)
2. Verify file format (JPG, PNG, WebP only)
3. Check internet connection
4. Try a different image

---

## 📞 Support

If you need help updating store images:

- **Email:** support@errandrunners.com
- **Phone:** 592-7219769
- **Admin Dashboard:** Available 24/7

---

## 🎨 Future Enhancements

Planned improvements for store image management:

- [ ] Bulk image upload
- [ ] Image cropping tool
- [ ] Background removal
- [ ] Image optimization
- [ ] Multiple images per store (gallery)
- [ ] Store banner images
