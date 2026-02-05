
# Delivery Fees, Currency, and Location Pinning Update

## Summary of Changes

This document outlines the updates made to fix delivery fees, currency display, location pinning, and customer support contact information.

---

## 1. Delivery Fee Updates

### Fast Food Orders
- **Previous**: GYD$500
- **Updated**: GYD$1200
- **Location**: `src/screens/customer/CartScreen.tsx`

### Errand Orders
- **Previous**: Variable
- **Updated**: GYD$2000 (base price)
- **Locations**: 
  - `src/screens/errands/CreateErrandScreen.tsx`
  - `src/api/errands.ts`

### Implementation Details
```typescript
// Fast Food
const deliveryFee = isFastFood ? freezePrice(1200) : freezePrice(2000);

// Errands
const errandBasePrice = Math.max(basePrice, 2000);
```

---

## 2. Currency Symbol Update

### Change
- **Previous**: `GY$`
- **Updated**: `GYD$`
- **Location**: `src/utils/currency.ts`

### Implementation
```typescript
export const CURRENCY_SYMBOL = 'GYD$';
export const CURRENCY_CODE = 'GYD';
```

All currency displays throughout the app now show `GYD$` instead of `GY$`.

---

## 3. Location Pinning at Checkout

### New Feature
Customers can now pin their exact delivery location using GPS coordinates at checkout.

### Features
- **Use Current Location**: Button to automatically get GPS coordinates
- **Manual Address Entry**: Option to type address manually
- **Coordinate Display**: Shows latitude and longitude for accuracy
- **Validation**: Ensures location is pinned before order placement

### Implementation
- **Component**: `src/components/LocationPicker.tsx` (already existed)
- **Integration**: Added to checkout flow in `src/screens/customer/CartScreen.tsx`

### User Experience
1. Customer proceeds to checkout
2. Location picker appears at the top of checkout screen
3. Customer can:
   - Tap "Use Current Location" to pin exact GPS coordinates
   - Or manually enter delivery address
4. Coordinates are displayed for verification
5. Location is saved with the order

### Technical Details
```typescript
const handleLocationSelected = (address: string, latitude: number, longitude: number) => {
  setDeliveryAddress(address);
  setDeliveryLatitude(latitude);
  setDeliveryLongitude(longitude);
};
```

---

## 4. Customer Support Contact Section

### New Feature
Added a prominent contact section for customer inquiries and support.

### Contact Information
- **Phone**: 592-683-4060
- **Method**: WhatsApp (preferred)
- **Location**: Checkout screen and errand creation screen

### Features
- **WhatsApp Integration**: Direct link to open WhatsApp chat
- **Fallback**: Opens web WhatsApp if app not installed
- **Error Handling**: Shows phone number if WhatsApp unavailable

### Implementation
```typescript
const handleContactSupport = () => {
  const phoneNumber = '5926834060';
  const message = 'Hello, I need help with my order on ErrandRunners.';
  const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
  
  Linking.canOpenURL(whatsappUrl)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(whatsappUrl);
      } else {
        const webWhatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        return Linking.openURL(webWhatsappUrl);
      }
    })
    .catch((err) => {
      Alert.alert('Error', 'Could not open WhatsApp. Please contact us at 592-683-4060');
    });
};
```

### UI Design
- **Card Style**: Highlighted with primary color background
- **Icon**: WhatsApp emoji (💬)
- **Button**: Green WhatsApp-branded button
- **Text**: Clear instructions for customers

---

## 5. Files Modified

### Core Files
1. **src/utils/currency.ts**
   - Updated currency symbol from `GY$` to `GYD$`
   - Updated delivery fee calculation base to GYD$1200

2. **src/screens/customer/CartScreen.tsx**
   - Updated delivery fees (GYD$1200 for fast food, GYD$2000 for errands)
   - Integrated LocationPicker component
   - Added customer support contact section
   - Added location validation before order placement

3. **src/screens/errands/CreateErrandScreen.tsx**
   - Updated base price to GYD$2000
   - Added customer support contact section
   - Updated currency display to GYD$

4. **src/api/errands.ts**
   - Updated `calculateErrandPrice` to ensure minimum GYD$2000 base price
   - Updated distance fee calculation

---

## 6. Testing Checklist

### Delivery Fees
- [ ] Fast food orders show GYD$1200 delivery fee
- [ ] Errand orders show GYD$2000 base price
- [ ] Total calculations are correct
- [ ] Currency displays as GYD$ throughout

### Location Pinning
- [ ] "Use Current Location" button works
- [ ] GPS coordinates are captured correctly
- [ ] Manual address entry works
- [ ] Coordinates display properly
- [ ] Order cannot be placed without location
- [ ] Location data is saved with order

### Customer Support
- [ ] WhatsApp button appears on checkout
- [ ] WhatsApp button appears on errand creation
- [ ] Tapping button opens WhatsApp
- [ ] Pre-filled message is correct
- [ ] Fallback to web WhatsApp works
- [ ] Error handling shows phone number

### Currency Display
- [ ] All prices show GYD$ prefix
- [ ] Cart screen shows GYD$
- [ ] Order summary shows GYD$
- [ ] Errand pricing shows GYD$
- [ ] Order history shows GYD$

---

## 7. User Benefits

### Accurate Pricing
- Clear delivery fees displayed upfront
- No confusion about costs
- Consistent pricing across order types

### Better Delivery Accuracy
- GPS coordinates ensure exact location
- Reduces delivery errors
- Faster delivery times

### Easy Support Access
- One-tap WhatsApp contact
- Quick resolution of issues
- Better customer experience

### Clear Currency Display
- Proper GYD$ symbol
- Professional appearance
- Matches local expectations

---

## 8. Future Enhancements

### Potential Improvements
1. **Interactive Map**: Add visual map for location selection (when react-native-maps is supported)
2. **Saved Locations**: Allow customers to save multiple delivery addresses
3. **Distance-Based Pricing**: Calculate delivery fee based on actual distance
4. **Live Chat**: In-app customer support chat
5. **Delivery Zones**: Define specific delivery areas with different fees

---

## 9. Notes

- All price calculations use `freezePrice()` to prevent mutations
- Location coordinates are optional but recommended
- WhatsApp is the preferred contact method
- Currency symbol change is app-wide
- Delivery fees are frozen at checkout to prevent changes

---

## 10. Support

For any issues or questions:
- **WhatsApp**: 592-683-4060
- **Email**: Contact through app profile
- **In-App**: Use the "Need Help?" section at checkout

---

**Last Updated**: December 2024
**Version**: 1.0
**Status**: ✅ Implemented and Ready for Testing
