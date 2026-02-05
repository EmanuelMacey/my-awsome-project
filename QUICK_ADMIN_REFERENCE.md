
# Quick Admin Reference Guide

## Admin Login Credentials
```
Email: admin@errandrunners.gy
Password: Admin1234
```

## Fixed Pricing Summary
- **Store/Restaurant Delivery**: $1500 GYD (fixed)
- **Errand Services**: $2000 GYD (fixed)
- **No additional fees**: No tax, no distance fees, no complexity fees

## Admin Dashboard Access
1. Go to login screen
2. Enter admin credentials
3. Automatically redirected to admin dashboard

## Managing Food Orders

### Order Information Displayed:
- Order Number (e.g., ER1234567890)
- Customer Name
- Delivery Address
- Payment Method (Cash, Card, MMG+, Bank Transfer)
- Total Amount

### Available Actions:
- **Accept**: Confirms the order (status → confirmed)
- **Reject**: Cancels the order (status → cancelled)
- **Complete**: Marks order as delivered (status → delivered)

### Order Status Flow:
```
Pending → Confirmed → Preparing → In Transit → Delivered
         ↓
      Cancelled
```

## Managing Errands

### Errand Information Displayed:
- Errand Number (e.g., ERR1234567890)
- Customer Name
- Category (e.g., GRA, NIS, Post Office)
- Pickup Address
- Drop-off Address
- Fixed Price: $2000 GYD

### Available Actions:
- **Accept**: Assigns Emanuel Macey as runner (status → accepted)
- **Reject**: Cancels the errand (status → cancelled)
- **Completed**: Marks errand as done (status → completed)

### Status Dropdown Options:
- Pending
- Accepted
- At Pickup
- En Route
- Completed

### Errand Status Flow:
```
Pending → Accepted → At Pickup → En Route → Completed
         ↓
      Cancelled
```

### Runner Assignment:
- When you click "Accept" on an errand, it automatically assigns:
  - **Runner Name**: Emanuel Macey
  - **Runner ID**: Automatically created/found in database
  - Badge displays: "👤 Runner: Emanuel Macey"

## Dashboard Features

### Tabs:
1. **Food Orders**: View and manage all restaurant/store orders
2. **Errands**: View and manage all errand requests

### Refresh:
- Pull down to refresh the list
- Automatically fetches latest data from database

### Logout:
- Click "Logout" button in top-right corner
- Confirms before logging out
- Redirects to landing page

## Quick Actions Cheat Sheet

| Action | Food Orders | Errands |
|--------|-------------|---------|
| Accept | Status → Confirmed | Status → Accepted + Assign Runner |
| Reject | Status → Cancelled | Status → Cancelled |
| Complete | Status → Delivered | Status → Completed |
| Status Change | N/A | Use dropdown to change status |

## Important Notes

1. **Access Control**: Only accessible with admin credentials
2. **Real-time Updates**: Dashboard shows latest data
3. **No Undo**: Actions cannot be undone (be careful!)
4. **Fixed Pricing**: All prices are hardcoded and cannot be changed
5. **Single Runner**: All errands are assigned to Emanuel Macey
6. **Order Count**: Shows total count in tab headers

## Troubleshooting

### Can't Access Admin Dashboard?
- Verify you're using correct credentials
- Check that you're logged out of any other account first
- Try clearing app cache and logging in again

### Orders/Errands Not Showing?
- Pull down to refresh
- Check your internet connection
- Verify Supabase connection is active

### Actions Not Working?
- Check internet connection
- Verify you have proper permissions
- Try refreshing the page

## Support

For technical issues or questions:
- Check the main implementation document: `ADMIN_PANEL_AND_FIXED_PRICING_IMPLEMENTATION.md`
- Review the code in: `src/screens/admin/AdminDashboardScreen.tsx`
- Contact development team for assistance
