
# ErrandRunners Pricing Reference

## Fixed Pricing Policy

**Effective Date**: Current Implementation  
**Last Updated**: Today

---

## Overview

All delivery and errand services in the ErrandRunners app now use **fixed pricing**. There are no dynamic calculations based on distance, time, complexity, or any other factors.

---

## Store & Restaurant Delivery

### Pricing Structure
```
Subtotal (Items Total)     = Sum of all item prices × quantities
Delivery Fee (FIXED)        = $1500 GYD
Tax                         = $0 GYD (removed)
─────────────────────────────────────────────────
TOTAL                       = Subtotal + $1500 GYD
```

### Example Calculation
```
Cart Items:
- 2pc Chicken Meal × 1      = $1800 GYD
- Fries × 2                 = $1200 GYD
- Cola × 1                  = $300 GYD
                              ─────────
Subtotal                    = $3300 GYD
Delivery Fee                = $1500 GYD
                              ─────────
TOTAL                       = $4800 GYD
```

### Applies To:
- All supermarkets (Survival, Bounty, Massy, etc.)
- All Chinese supermarkets (Andrew's, N&S)
- All pharmacies (Health 2000, Medicine Express)
- All fast food restaurants (KFC, Church's, Royal Castle, Pizza Hut, Starbucks)
- Any store or restaurant in the system

---

## Errand Services

### Pricing Structure
```
Fixed Errand Fee            = $2000 GYD
Base Price                  = $2000 GYD
Distance Fee                = $0 GYD (removed)
Complexity Fee              = $0 GYD (removed)
─────────────────────────────────────────────────
TOTAL                       = $2000 GYD
```

### Example Calculation
```
Errand Type: GRA License Pickup
Pickup: GRA Camp Street
Drop-off: 464 East Ruimveldt
Distance: ~8 km
Complexity: Medium
                              ─────────
TOTAL                       = $2000 GYD
```

### Applies To:
All errand categories:
- Government Errands (GRA, NIS, GRO, Police)
- Business Errands (Invoice payments, document delivery)
- Financial Transactions (Bill payments, MMG, bank errands)
- Mail/Post Office (DHL, FedEx, package pickup)
- Medical Errands (Prescription pickup, lab results)
- Shopping Errands (Custom purchases, grocery pickup)
- Custom Errands (Any user-defined task)

---

## Code Implementation

### Cart Screen
```typescript
const subtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
const deliveryFee = 1500; // FIXED: GYD 1500 flat delivery fee
const tax = 0; // No tax calculation
const total = subtotal + deliveryFee;
```

### Create Errand Screen
```typescript
const [pricing] = useState({
  basePrice: 2000,
  distanceFee: 0,
  complexityFee: 0,
  totalPrice: 2000,
});
```

### Orders API
```typescript
const FIXED_DELIVERY_FEE = 1500;
const calculatedSubtotal = subtotal || (total - FIXED_DELIVERY_FEE);
const calculatedTotal = calculatedSubtotal + FIXED_DELIVERY_FEE;
```

### Errands API
```typescript
const FIXED_ERRAND_PRICE = 2000;

// In createErrand function
base_price: FIXED_ERRAND_PRICE,
distance_fee: 0,
complexity_fee: 0,
total_price: FIXED_ERRAND_PRICE,
```

---

## Comparison: Old vs New Pricing

### Store Delivery (Old System)
```
Subtotal                    = $3300 GYD
Delivery Fee (variable)     = $500 - $1500 GYD (based on distance)
Tax (14% VAT)              = $532 - $672 GYD
─────────────────────────────────────────────────
TOTAL                       = $4332 - $5472 GYD
```

### Store Delivery (New System)
```
Subtotal                    = $3300 GYD
Delivery Fee (FIXED)        = $1500 GYD
Tax                         = $0 GYD
─────────────────────────────────────────────────
TOTAL                       = $4800 GYD
```

### Errands (Old System)
```
Base Price                  = $1000 - $1500 GYD
Distance Fee                = $200/km × distance
Complexity Fee              = $0 - $1000 GYD
─────────────────────────────────────────────────
TOTAL                       = $1200 - $4500 GYD (variable)
```

### Errands (New System)
```
Fixed Errand Fee            = $2000 GYD
─────────────────────────────────────────────────
TOTAL                       = $2000 GYD (always)
```

---

## Benefits of Fixed Pricing

### For Customers:
1. **Predictable Costs**: Know exactly what you'll pay before ordering
2. **No Surprises**: No hidden fees or unexpected charges
3. **Simple Math**: Easy to calculate total cost
4. **Fair Pricing**: Same price for everyone, regardless of location

### For Business:
1. **Simplified Accounting**: Easier to track revenue
2. **Reduced Disputes**: Clear pricing eliminates confusion
3. **Faster Checkout**: No complex calculations needed
4. **Better Planning**: Predictable revenue per order

### For Drivers/Runners:
1. **Fair Compensation**: Consistent earnings per delivery
2. **No Distance Penalty**: Same pay regardless of distance
3. **Simplified Tracking**: Easy to calculate daily earnings

---

## Payment Methods Accepted

All orders and errands accept the following payment methods:
- 💵 Cash on Delivery
- 💳 Credit/Debit Card
- 📱 MMG+ (Mobile Money Guyana)
- 🏦 Bank Transfer

---

## Important Notes

1. **No Exceptions**: Fixed pricing applies to ALL orders and errands
2. **No Discounts**: Prices cannot be negotiated or reduced
3. **No Surge Pricing**: Prices remain the same during peak hours
4. **No Minimum Order**: No minimum order value required
5. **No Maximum Distance**: Same price regardless of delivery distance

---

## Admin Override

Only admin users can modify pricing in the database directly. However, the app is hardcoded to use fixed pricing, so any database changes will be overridden by the app logic.

To change pricing permanently, you must:
1. Update the code in the relevant files (listed above)
2. Redeploy the application
3. Update this documentation

---

## Questions?

For pricing inquiries or to request changes, contact:
- Development Team
- Business Management
- Customer Support

**Remember**: These prices are hardcoded and cannot be changed without updating the application code.
