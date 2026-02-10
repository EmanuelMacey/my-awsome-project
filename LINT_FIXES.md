
# Lint Error Fixes

## 1. StripePaymentSheet.native.tsx (Line 37)
**Issue:** Missing dependency 'initializePayment'
**Fix:** Wrap initializePayment in useCallback or add to dependency array

## 2. CartScreen.tsx (Lines 286, 305, 324)
**Issues:** Missing dependencies: fadeAnims, fetchStoreLocation, fetchUserDeliveryAddress
**Fix:** Wrap functions in useCallback and add all dependencies

## 3. InvoiceDetailScreen.tsx (Line 27)
**Issue:** Missing dependency 'fetchInvoice'
**Fix:** Wrap fetchInvoice in useCallback

## 4. StoreDetailScreen.tsx (Line 86)
**Issue:** Parsing error - Expression expected
**Fix:** Check for syntax error (likely missing semicolon, bracket, or invalid JSX)

## 5. DriverOrderDetailScreen.tsx (Line 266)
**Issue:** Missing dependencies 'order' and 'user'
**Fix:** Add order and user to dependency array or use specific properties

## 6. pricing.ts (Line 132)
**Issue:** Array<T> should be T[]
**Fix:** Change `Array<ItemWithQuantity>` to `ItemWithQuantity[]`
