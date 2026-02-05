
# Fix Fireside Grill & Chill Store Image

## Issue
The "Fireside Grill and Chill" store has an invalid image URL in the database:
```
https://imgur.com/gallery/fast-food-places-qNSc2Lv#n4wQyjp
```

This URL is an Imgur gallery link, not a direct image URL, which causes the image to fail to load.

## Solution

### Option 1: Update via Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard
2. Navigate to the **Table Editor**
3. Open the **stores** table
4. Find the row for "Fireside Grill and Chill"
5. Update the `logo` column to one of these working URLs:
   - Direct Imgur link: `https://i.imgur.com/n4wQyjp.jpeg`
   - Or use a generic food image: `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop`

### Option 2: Update via SQL
Run this SQL query in your Supabase SQL Editor:

```sql
UPDATE stores 
SET logo = 'https://i.imgur.com/n4wQyjp.jpeg'
WHERE name ILIKE '%fireside%';
```

### Option 3: Update via Admin Panel
1. Log in to the app as an admin
2. Go to **Store Management**
3. Find "Fireside Grill and Chill"
4. Edit the store
5. Update the logo URL to: `https://i.imgur.com/n4wQyjp.jpeg`
6. Save changes

## Fallback Behavior
The app now includes automatic fallback handling:
- If an image fails to load, it will automatically show a generic food placeholder
- This prevents broken images from appearing in the UI
- The error is logged to the console for debugging

## Prevention
When adding new stores, always use **direct image URLs**:
- ✅ Good: `https://i.imgur.com/abc123.jpeg`
- ✅ Good: `https://example.com/image.png`
- ❌ Bad: `https://imgur.com/gallery/abc123` (gallery link)
- ❌ Bad: `https://imgur.com/abc123` (page link, not direct image)

To get a direct Imgur link:
1. Right-click on the image
2. Select "Copy image address" or "Open image in new tab"
3. Use the URL that ends with `.jpg`, `.jpeg`, `.png`, etc.
