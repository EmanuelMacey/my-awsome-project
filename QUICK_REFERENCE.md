
# ErrandRunners - Quick Reference Guide

## 🚀 Quick Start

### For Customers
1. **Login** → Browse Stores → Add to Cart → Checkout → Track Order

### For Drivers
1. **Login** → View Orders → Accept Order → Update Status → Complete Delivery

### For Admins
1. **Login** → Dashboard → Manage Everything

---

## 📱 Main Features

### 🛒 Shopping Flow
```
Browse Stores → Select Store → Add Items → View Cart → 
Enter Address → Choose Payment → Place Order → Track Delivery
```

### 🚗 Delivery Flow
```
Order Placed → Driver Accepts → Pickup → In Transit → 
Delivered → Payment Completed
```

### 💬 Communication
```
Order Details → Chat Button → Real-time Messaging
Order Details → Call Button → Phone Call
```

---

## 🎨 UI Components

### Store Card
- Store logo/icon
- Store name
- Category badge
- Rating (⭐)
- Delivery time
- Address

### Product Card
- Product image
- Product name
- Category
- Description
- Price (GY$)
- Add button (+)
- Out of stock indicator

### Order Card
- Order ID
- Store name
- Status badge (color-coded)
- Total amount
- Date/time
- View details button

### Driver Card
- Driver avatar
- Driver name
- Rating (⭐)
- Vehicle info
- License plate
- Phone number
- Call/Chat buttons

---

## 💳 Payment Methods

### Cash on Delivery
- No upfront payment
- Pay driver in cash
- Status: Pending until delivery

### Mobile Money Guyana (MMG)
- Enter MMG phone number
- Format: +592 XXX XXXX
- Instant processing

### Mastercard/Credit Card
- Enter card number
- 16-digit validation
- Secure processing

### Bank Transfer (Coming Soon)
- Requires Stripe setup
- Direct to your account
- See PAYMENT_INTEGRATION_GUIDE.md

---

## 📊 Order Status

| Status | Icon | Meaning |
|--------|------|---------|
| Pending | ⏳ | Waiting for driver |
| Accepted | ✅ | Driver accepted |
| In Transit | 🚗 | On the way |
| Delivered | 📦 | Completed |
| Cancelled | ❌ | Cancelled |

---

## 🗺️ Driver Tracking

### What You See
- Driver name and photo
- Vehicle type and plate
- Current location (coordinates)
- Speed and direction
- Last update time

### Actions Available
- 📞 Call driver
- 💬 Chat with driver
- 📍 View location
- 🔄 Refresh location

**Note**: Map view not available. Location shown as coordinates.

---

## 💰 Pricing Breakdown

### Order Total Calculation
```
Subtotal (items)
+ Delivery Fee (GY$500 + GY$100/km)
+ Tax (14% VAT)
= Total Amount
```

### Example
```
Subtotal:     GY$5,000
Delivery:     GY$1,000 (5km)
Tax (14%):    GY$700
Total:        GY$6,700
```

---

## 🔐 Security Features

- ✅ Secure authentication
- ✅ Row Level Security (RLS)
- ✅ Encrypted data
- ✅ Payment validation
- ✅ Privacy controls
- ✅ Secure logout

---

## 📞 Common Actions

### How to Logout
1. Tap profile icon (👤) in header
2. Scroll to bottom
3. Tap "Logout" button
4. Confirm in dialog

### How to Track Order
1. Go to "My Orders"
2. Tap on order
3. View status and driver info
4. See live location updates

### How to Contact Driver
1. Open order details
2. Tap "Call Driver" or "Chat"
3. Communicate directly

### How to Change Payment Method
1. In cart screen
2. Select payment method
3. Enter required details
4. Proceed to checkout

---

## 🎯 Tips & Tricks

### For Best Experience
- ✅ Keep app updated
- ✅ Enable notifications
- ✅ Add delivery notes
- ✅ Rate your experience
- ✅ Contact driver if needed

### For Faster Delivery
- ✅ Provide accurate address
- ✅ Add landmarks in notes
- ✅ Keep phone accessible
- ✅ Be ready to receive

### For Smooth Payments
- ✅ Verify payment details
- ✅ Check order total
- ✅ Keep payment method ready
- ✅ Save receipts

---

## 🐛 Troubleshooting

### Can't Login?
- Check email/password
- Verify email address
- Reset password if needed
- Contact support

### Order Not Showing?
- Pull to refresh
- Check internet connection
- Verify order was placed
- Check order history

### Driver Location Not Updating?
- Refresh the screen
- Check internet connection
- Wait for driver to move
- Contact driver if needed

### Payment Failed?
- Verify payment details
- Check account balance
- Try different method
- Contact support

---

## 📚 Documentation Files

1. **FEATURE_UPDATES.md** - What's new
2. **PAYMENT_INTEGRATION_GUIDE.md** - Payment setup
3. **IMPLEMENTATION_COMPLETE.md** - Full overview
4. **QUICK_REFERENCE.md** - This file
5. **SETUP_GUIDE.md** - Initial setup
6. **DEPLOYMENT_GUIDE.md** - Deployment

---

## 🆘 Need Help?

### Check Documentation
- Read relevant guide
- Follow step-by-step
- Check examples

### Common Issues
- Login problems → Verify email
- Payment issues → Check details
- Tracking issues → Refresh screen
- App crashes → Restart app

### Contact Support
- Email: support@errandrunners.gy
- Phone: +592 683 4060
- Address: 464 East Ruimveldt

---

## 🎊 Quick Stats

- **Stores**: 5+ markets
- **Products**: 80+ items
- **Payment Methods**: 4 options
- **Delivery Areas**: Georgetown & surrounding
- **Average Delivery**: 30-45 minutes
- **Delivery Fee**: GY$500 base
- **Tax Rate**: 14% VAT

---

## 🌟 App Highlights

✅ Modern, clean UI
✅ Real-time tracking
✅ Multiple payment options
✅ Live chat with drivers
✅ Secure & private
✅ Fast & reliable
✅ Easy to use
✅ Guyanese-focused

---

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Status**: Production Ready ✅

**Happy Shopping! 🛒🚗📦**
