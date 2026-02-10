
# Troubleshooting Guide: Fixed Pricing & Admin Panel

## Common Issues and Solutions

---

## Fixed Pricing Issues

### Issue: Delivery fee showing wrong amount
**Symptoms**: Cart shows delivery fee other than $1500 GYD

**Solution**:
1. Check `src/screens/customer/CartScreen.tsx`
2. Verify line: `const deliveryFee = 1500;`
3. Clear app cache and restart
4. If persists, check for any overriding code

**Code to verify**:
```typescript
const deliveryFee = 1500; // Should be exactly 1500
```

---

### Issue: Errand price not showing $2000 GYD
**Symptoms**: Errand shows different price or dynamic calculation

**Solution**:
1. Check `src/screens/errands/CreateErrandScreen.tsx`
2. Verify pricing state is set to 2000
3. Check `src/api/errands.ts` for FIXED_ERRAND_PRICE constant
4. Restart app

**Code to verify**:
```typescript
const [pricing] = useState({
  basePrice: 2000,
  distanceFee: 0,
  complexityFee: 0,
  totalPrice: 2000,
});
```

---

### Issue: Tax still being calculated
**Symptoms**: Order summary shows 14% VAT or tax amount

**Solution**:
1. Check `src/screens/customer/CartScreen.tsx`
2. Verify tax is set to 0
3. Check order detail screen for tax display
4. Remove any tax calculation code

**Code to verify**:
```typescript
const tax = 0; // Should be 0, not calculated
const total = subtotal + deliveryFee; // No tax added
```

---

## Admin Panel Issues

### Issue: Cannot access admin dashboard
**Symptoms**: Login doesn't redirect to admin panel

**Possible Causes & Solutions**:

1. **Wrong Credentials**
   - Verify email: `admin@errandrunners.gy`
   - Verify password: `Admin1234`
   - Check for typos or extra spaces

2. **Not Logged Out**
   - Logout of any existing account
   - Clear app cache
   - Try logging in again

3. **Routing Issue**
   - Check `src/screens/auth/LoginScreen.tsx`
   - Verify redirect logic: `router.replace('/admin/dashboard')`
   - Check `app/admin/dashboard.tsx` exists

4. **Auth Context Issue**
   - Check `src/contexts/AuthContext.tsx`
   - Verify `isAdmin` flag is returned
   - Check admin detection logic

---

### Issue: Admin dashboard shows "Access Denied"
**Symptoms**: Redirected to customer home after login

**Solution**:
1. Verify you're using exact admin credentials
2. Check user role in database
3. Verify email check in AdminDashboardScreen:
```typescript
if (user && user.email !== 'admin@errandrunners.gy') {
  Alert.alert('Access Denied', 'You do not have permission to access this page');
  router.replace('/customer/home');
  return;
}
```

---

### Issue: Orders/Errands not loading
**Symptoms**: Empty list or loading spinner forever

**Possible Causes & Solutions**:

1. **Network Issue**
   - Check internet connection
   - Verify Supabase is accessible
   - Check console for errors

2. **Database Issue**
   - Verify tables exist: `orders`, `errands`
   - Check RLS policies allow reading
   - Test Supabase connection

3. **Query Error**
   - Check console for SQL errors
   - Verify foreign key relationships
   - Check data exists in tables

**Debug Code**:
```typescript
// Add to fetchOrders/fetchErrands
console.log('Fetching data...');
console.log('Data received:', data);
console.log('Error:', error);
```

---

### Issue: Accept/Reject buttons not working
**Symptoms**: Clicking buttons does nothing or shows error

**Possible Causes & Solutions**:

1. **Permission Issue**
   - Check RLS policies on orders/errands tables
   - Verify admin has update permissions
   - Check Supabase auth token

2. **Network Error**
   - Check internet connection
   - Verify Supabase endpoint
   - Check for CORS issues

3. **Database Error**
   - Check console for error messages
   - Verify status values are valid
   - Check foreign key constraints

**Debug Code**:
```typescript
// Add to handleOrderAction/handleErrandAction
console.log('Action:', action);
console.log('ID:', orderId);
console.log('Result:', { error });
```

---

### Issue: Emanuel Macey not being assigned
**Symptoms**: Errand accepted but no runner assigned

**Possible Causes & Solutions**:

1. **User Doesn't Exist**
   - Check if Emanuel Macey user exists in database
   - Verify user creation logic in handleErrandAction
   - Check console for creation errors

2. **Database Error**
   - Check foreign key constraints
   - Verify runner_id field accepts UUID
   - Check RLS policies

**Manual Fix**:
```sql
-- Create Emanuel Macey user manually
INSERT INTO users (name, email, phone, role)
VALUES ('Emanuel Macey', 'emanuel.macey@errandrunners.gy', '592-000-0000', 'driver');
```

---

### Issue: Status dropdown not updating
**Symptoms**: Selecting status doesn't change errand status

**Solution**:
1. Check `handleErrandStatusChange` function
2. Verify status values match database enum
3. Check for network errors
4. Verify RLS policies allow updates

**Valid Status Values**:
- `pending`
- `accepted`
- `at_pickup`
- `pickup_complete`
- `en_route`
- `completed`
- `cancelled`

---

## General Issues

### Issue: App crashes on admin login
**Symptoms**: App closes or shows error screen

**Solution**:
1. Check console for error messages
2. Verify all admin files are created
3. Check for TypeScript errors
4. Verify imports are correct
5. Clear app cache and rebuild

---

### Issue: Pricing shows old values after update
**Symptoms**: Still seeing old delivery fees or calculations

**Solution**:
1. Clear app cache
2. Restart development server
3. Rebuild app
4. Check for cached API responses
5. Verify code changes were saved

---

### Issue: Database shows different prices
**Symptoms**: Database has old price values

**Solution**:
This is expected! The app overrides database values with fixed pricing.

**Important**: 
- App code controls pricing, not database
- Database may show old calculated values
- App will always use fixed pricing
- No need to update existing orders

---

## Debugging Tools

### Console Logging
Add these logs to debug issues:

```typescript
// In CartScreen
console.log('Subtotal:', subtotal);
console.log('Delivery Fee:', deliveryFee);
console.log('Total:', total);

// In CreateErrandScreen
console.log('Pricing:', pricing);

// In AdminDashboardScreen
console.log('Orders:', orders);
console.log('Errands:', errands);
console.log('User:', user);
```

### Network Debugging
Check Supabase requests:

```typescript
// In any API call
const { data, error } = await supabase...
console.log('Request:', { data, error });
```

### React DevTools
Use React DevTools to inspect:
- Component state
- Props
- Context values
- Re-renders

---

## Emergency Fixes

### If Admin Panel Completely Broken:

1. **Revert to Customer View**:
```typescript
// In app/index.tsx, temporarily comment out admin check
// if (user?.email === 'admin@errandrunners.gy' || user?.role === 'admin') {
//   return <Redirect href="/admin/dashboard" />;
// }
```

2. **Access Database Directly**:
Use Supabase dashboard to manage orders/errands manually

3. **Restore from Backup**:
If you have git history, revert to last working commit

---

### If Pricing Completely Broken:

1. **Quick Fix in CartScreen**:
```typescript
// Force fixed pricing
const deliveryFee = 1500; // Hardcode this
const tax = 0; // Remove any calculation
const total = subtotal + 1500; // Direct calculation
```

2. **Quick Fix in CreateErrandScreen**:
```typescript
// Force fixed pricing
const pricing = {
  basePrice: 2000,
  distanceFee: 0,
  complexityFee: 0,
  totalPrice: 2000,
};
```

---

## Getting Help

### Before Asking for Help:

1. Check this troubleshooting guide
2. Review implementation documentation
3. Check console for errors
4. Try clearing cache and restarting
5. Verify your changes were saved

### When Asking for Help, Provide:

1. Exact error message
2. Steps to reproduce
3. Console logs
4. Screenshots if applicable
5. What you've already tried

### Resources:

- `ADMIN_PANEL_AND_FIXED_PRICING_IMPLEMENTATION.md` - Technical details
- `QUICK_ADMIN_REFERENCE.md` - Admin guide
- `PRICING_REFERENCE.md` - Pricing formulas
- `IMPLEMENTATION_SUMMARY.md` - Overview

---

## Prevention Tips

### To Avoid Issues:

1. **Always test after changes**
2. **Clear cache regularly**
3. **Check console for warnings**
4. **Verify credentials carefully**
5. **Keep documentation updated**
6. **Use version control (git)**
7. **Test on multiple devices**
8. **Monitor Supabase logs**

---

## Still Having Issues?

If none of these solutions work:

1. Review all implementation files
2. Check for typos in code
3. Verify all files were created
4. Check file paths are correct
5. Ensure all imports are valid
6. Try rebuilding the app
7. Check Supabase dashboard for errors
8. Review RLS policies
9. Check network connectivity
10. Contact development team

---

**Last Updated**: Today  
**Version**: 1.0
