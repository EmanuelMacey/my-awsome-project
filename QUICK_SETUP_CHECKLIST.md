
# Quick Setup Checklist for ErrandRunners

## ⚡ Immediate Actions Required

### 1. Fix Profile Image Upload (5 minutes)

**Problem:** Getting "RLS policy violation" error when uploading profile pictures

**Solution:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste this script:

```sql
-- Enable RLS and create storage policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can read their own profile"
ON profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

4. Click **Run**
5. Done! ✅

---

### 2. Test All Fixes (10 minutes)

**Errand Pricing:**
- [ ] Open app
- [ ] Go to Errands section
- [ ] Create a new errand
- [ ] Verify price shows $2000 GYD (not variable)
- [ ] Complete the errand
- [ ] Check receipt shows $2000 GYD

**Cart Checkout:**
- [ ] Add items to cart from a store
- [ ] Go to cart
- [ ] Enter delivery address
- [ ] Click "Place Order"
- [ ] Verify no "No store selected" error
- [ ] Order should be created successfully

**Profile Image:**
- [ ] Go to Profile screen
- [ ] Tap on profile picture
- [ ] Select an image from gallery
- [ ] Wait for upload
- [ ] Verify image appears
- [ ] No RLS error should appear

**App Logo:**
- [ ] Close and reopen app
- [ ] Check splash screen shows ErrandRunners logo
- [ ] Check app icon on home screen
- [ ] Verify branding throughout app

---

## 🔮 Future Setup (When Ready)

### 3. Add Payment Methods (1-2 weeks)

**When you're ready to add Visa, Mastercard, and MMG:**

1. Read `PAYMENT_INTEGRATION_GUIDE.md`
2. Set up Stripe account
3. Contact MMG for API access
4. Implement backend endpoints
5. Update frontend components
6. Test thoroughly

**Don't rush this - payment processing is critical!**

---

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Errand Pricing | ✅ Fixed | $2000 flat rate |
| Cart Checkout | ✅ Fixed | Works for stores & errands |
| App Logo | ✅ Updated | ErrandRunners branding |
| Profile Upload | ⚠️ Needs RLS Fix | Run SQL script above |
| Visa/Mastercard | 📋 Planned | See payment guide |
| MMG Payment | 📋 Planned | See payment guide |

---

## 🚨 Critical Notes

### Errand Pricing
- **All errands are now $2000 GYD**
- No distance fees
- No complexity fees
- Make sure this is profitable for your business!

### Payment Methods
- Currently only Cash on Delivery works
- Card and MMG payments need backend setup
- Don't enable them in the app until backend is ready
- Test thoroughly before going live

### Profile Images
- **Must fix RLS policies first** (run SQL script above)
- Without this fix, users can't upload profile pictures
- Takes 5 minutes to fix
- Critical for user experience

---

## 🎯 Priority Order

1. **Fix RLS policies** (5 min) - Do this NOW
2. **Test all fixes** (10 min) - Verify everything works
3. **Plan payment integration** (1-2 weeks) - When ready for cards/MMG

---

## 📞 Quick Help

**RLS Error?**
→ Run the SQL script in Supabase (see section 1 above)

**Errand not $2000?**
→ Check `src/api/errands.ts` - `calculateErrandPrice()` function

**Cart error?**
→ Check `src/screens/customer/CartScreen.tsx` - store validation logic

**Logo not showing?**
→ Rebuild the app: `npx expo start --clear`

**Payment not working?**
→ Only Cash on Delivery works now. See `PAYMENT_INTEGRATION_GUIDE.md` for cards/MMG

---

## ✅ Done!

Once you've completed the checklist above, your app is ready to use with:

- ✅ Fixed $2000 errand pricing
- ✅ Working cart checkout
- ✅ Updated ErrandRunners branding
- ✅ Profile image upload (after RLS fix)
- 📋 Payment integration guide for future

**Test everything thoroughly before releasing to users!**

---

**Need more help?** Check these files:
- `FIXES_IMPLEMENTATION_SUMMARY.md` - Detailed summary of all changes
- `PAYMENT_INTEGRATION_GUIDE.md` - How to add Visa/Mastercard/MMG
- `SUPABASE_RLS_FIX_GUIDE.md` - Detailed RLS policy setup

---

**Last Updated:** $(date)
