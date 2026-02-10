
# ErrandRunners - Promo Codes Guide

## Active Promo Codes

### 1. WELCOME10
- **Type**: Percentage Discount
- **Discount**: 10% off
- **Minimum Order**: GYD 1,000
- **Maximum Discount**: GYD 500
- **Valid Until**: 30 days from creation
- **Usage Limit**: 100 uses
- **Best For**: First-time users or small orders

**Example:**
- Order: GYD 2,000
- Discount: GYD 200 (10%)
- Final: GYD 1,800 + delivery + tax

### 2. SAVE500
- **Type**: Fixed Discount
- **Discount**: GYD 500 off
- **Minimum Order**: GYD 2,000
- **Maximum Discount**: N/A
- **Valid Until**: 30 days from creation
- **Usage Limit**: 50 uses
- **Best For**: Medium to large orders

**Example:**
- Order: GYD 3,000
- Discount: GYD 500
- Final: GYD 2,500 + delivery + tax

### 3. FIRSTORDER
- **Type**: Percentage Discount
- **Discount**: 15% off
- **Minimum Order**: GYD 1,500
- **Maximum Discount**: GYD 1,000
- **Valid Until**: 30 days from creation
- **Usage Limit**: 200 uses
- **Best For**: First orders or large purchases

**Example:**
- Order: GYD 5,000
- Discount: GYD 750 (15%)
- Final: GYD 4,250 + delivery + tax

## How to Use Promo Codes

### For Customers:
1. Add items to your cart
2. Go to cart screen
3. Scroll to "Promo Code" section
4. Enter code (case-insensitive)
5. Tap "Apply"
6. Discount will be shown in order summary
7. Complete checkout

### For Admins:
To create new promo codes, run this SQL in Supabase:

```sql
INSERT INTO promo_codes (
  code,
  discount_type,
  discount_value,
  min_order_amount,
  max_discount,
  valid_until,
  usage_limit,
  active
) VALUES (
  'YOUR_CODE',
  'percentage', -- or 'fixed'
  10, -- percentage value or fixed amount
  1000, -- minimum order in GYD
  500, -- max discount (optional)
  NOW() + INTERVAL '30 days',
  100, -- usage limit
  true
);
```

## Promo Code Rules

### Validation Rules:
1. ✅ Code must be active
2. ✅ Current date must be between valid_from and valid_until
3. ✅ Usage count must be less than usage_limit
4. ✅ Order amount must meet minimum requirement
5. ✅ Only one promo code per order

### Discount Calculation:
- **Percentage**: `(subtotal × discount_value) / 100`
  - Capped at max_discount if specified
- **Fixed**: `discount_value`
  - Applied directly to order

### Order of Operations:
1. Calculate subtotal (items only)
2. Apply promo code discount
3. Add delivery fee
4. Calculate tax (14% VAT on subtotal + delivery)
5. Calculate final total

## Marketing Strategies

### Seasonal Campaigns:
- **New Year**: `NEWYEAR2025` - 20% off
- **Valentine's**: `LOVE15` - 15% off
- **Easter**: `EASTER10` - 10% off
- **Independence Day**: `GUYANA50` - 50% off first order
- **Christmas**: `XMAS25` - 25% off

### User Acquisition:
- **Referral**: `FRIEND20` - 20% off for both parties
- **First Order**: `FIRSTORDER` - 15% off
- **Student**: `STUDENT10` - 10% off with valid ID
- **Senior**: `SENIOR15` - 15% off for 60+

### Retention:
- **Loyalty**: `LOYAL5` - 5% off for 10+ orders
- **VIP**: `VIP20` - 20% off for top customers
- **Birthday**: `BDAY25` - 25% off during birthday month
- **Anniversary**: `YEAR1` - Special discount on app anniversary

### Flash Sales:
- **Weekend**: `WEEKEND10` - 10% off Sat-Sun
- **Lunch**: `LUNCH15` - 15% off 11am-2pm
- **Late Night**: `NIGHT20` - 20% off after 10pm
- **Early Bird**: `EARLY10` - 10% off before 9am

## Analytics & Tracking

### Key Metrics:
- Total promo code usage
- Revenue impact
- Customer acquisition cost
- Average order value with/without promo
- Most popular codes
- Conversion rate by code

### SQL Queries:

**Most Used Codes:**
```sql
SELECT code, usage_count, discount_type, discount_value
FROM promo_codes
ORDER BY usage_count DESC
LIMIT 10;
```

**Revenue Impact:**
```sql
SELECT 
  promo_code,
  COUNT(*) as order_count,
  SUM(discount_amount) as total_discount,
  AVG(total) as avg_order_value
FROM orders
WHERE promo_code IS NOT NULL
GROUP BY promo_code
ORDER BY total_discount DESC;
```

**Conversion Rate:**
```sql
SELECT 
  COUNT(CASE WHEN promo_code IS NOT NULL THEN 1 END) as with_promo,
  COUNT(CASE WHEN promo_code IS NULL THEN 1 END) as without_promo,
  ROUND(
    COUNT(CASE WHEN promo_code IS NOT NULL THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as promo_usage_rate
FROM orders;
```

## Best Practices

### For Customers:
1. ✅ Check for active promo codes before checkout
2. ✅ Subscribe to notifications for exclusive codes
3. ✅ Share codes with friends (if referral program active)
4. ✅ Use codes on larger orders for maximum savings
5. ✅ Check expiration dates

### For Business:
1. ✅ Set reasonable usage limits
2. ✅ Monitor discount impact on margins
3. ✅ A/B test different discount values
4. ✅ Create urgency with expiration dates
5. ✅ Segment codes by customer type
6. ✅ Track ROI for each campaign
7. ✅ Disable underperforming codes
8. ✅ Reward loyal customers
9. ✅ Use codes for customer acquisition
10. ✅ Analyze and optimize regularly

## Troubleshooting

### Common Issues:

**"Invalid promo code"**
- Code may be expired
- Code may have reached usage limit
- Code may be inactive
- Check spelling (case-insensitive)

**"Minimum order amount not met"**
- Add more items to cart
- Check minimum requirement for code
- Try a different code

**"This promo code has expired"**
- Code validity period has ended
- Check for newer codes
- Contact support for alternatives

**"Usage limit reached"**
- Code has been used maximum times
- Try a different code
- Check for new promotions

## Support

For promo code issues:
- Email: support@errandrunners.gy
- Phone: +592-XXX-XXXX
- In-app: Chat with support
- Hours: Mon-Sat 8am-8pm

---

**Last Updated**: 2025  
**Version**: 1.0.0
