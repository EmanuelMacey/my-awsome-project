
# 📄 Invoice System Guide - ErrandRunners

## Overview
The invoice system in ErrandRunners allows admins to generate professional invoices for completed errands and orders. Invoices can be viewed, downloaded, and emailed to customers.

---

## How Invoices Work

### 1. **Automatic Invoice Generation**
Invoices are automatically created when:
- An errand is marked as "completed" or "delivered"
- An order is marked as "delivered"

### 2. **Manual Invoice Generation (Admin)**
Admins can manually generate invoices from the Admin Dashboard:

**Steps:**
1. Go to Admin Dashboard
2. Switch to the "Errands" tab
3. Find a completed errand
4. Click "📄 Generate Invoice" button
5. The system will:
   - Create an invoice with a unique invoice number
   - Calculate totals, taxes, and fees
   - Send the invoice via email to the customer
   - Store the invoice in the database

---

## Invoice Details

### What's Included in an Invoice:
- **Invoice Number**: Unique identifier (e.g., INV-1234567890)
- **Date Issued**: When the invoice was created
- **Customer Information**:
  - Name
  - Phone
  - Email
  - Delivery Address
- **Errand/Order Details**:
  - Errand/Order Number
  - Description
  - Pickup Address (for errands)
  - Dropoff Address (for errands)
  - Items (for orders)
- **Pricing Breakdown**:
  - Base Price / Subtotal
  - Distance Fee (for errands)
  - Complexity Fee (for errands)
  - Delivery Fee
  - Tax (10%)
  - **Total Amount**
- **Payment Information**:
  - Payment Method (Cash, Card, Mobile Money)
  - Payment Status (Pending, Completed, Failed)

---

## How to Make Invoices

### For Admins:

#### **Method 1: From Admin Dashboard**
1. Log in as Admin
2. Navigate to Admin Dashboard
3. Click on "Errands" tab
4. Find a completed errand
5. Click "📄 Generate Invoice"
6. Invoice is created and emailed automatically

#### **Method 2: From Invoice Management Screen**
1. Go to Admin Dashboard
2. Click "Invoices" button in header
3. View all invoices
4. Click "Create Invoice" to manually create one
5. Fill in the details:
   - Select errand or order
   - Verify customer information
   - Confirm pricing
6. Click "Generate Invoice"

### For Customers:

#### **Viewing Invoices**
1. Log in to customer account
2. Go to Profile
3. Click "My Invoices"
4. View list of all invoices
5. Click on any invoice to see details

#### **Downloading Invoices**
1. Open an invoice
2. Click "Download PDF" button
3. Invoice is saved to device

---

## Invoice Status

Invoices can have the following statuses:

- **Draft**: Invoice created but not finalized
- **Sent**: Invoice sent to customer
- **Paid**: Customer has paid the invoice
- **Overdue**: Payment deadline passed
- **Cancelled**: Invoice cancelled

---

## Email Notifications

When an invoice is generated:
1. Customer receives an email with:
   - Invoice number
   - Total amount
   - Payment instructions
   - Link to view invoice online
   - PDF attachment (optional)

---

## Database Structure

### Invoices Table:
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  invoice_number TEXT UNIQUE,
  errand_id UUID REFERENCES errands(id),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES users(id),
  issued_date TIMESTAMP,
  due_date TIMESTAMP,
  subtotal DECIMAL,
  tax DECIMAL,
  total DECIMAL,
  status TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## API Endpoints

### Generate Invoice from Errand:
```typescript
POST /api/invoices/from-errand
Body: {
  errandId: string,
  adminId: string
}
Response: {
  id: string,
  invoice_number: string,
  total: number,
  status: string
}
```

### Send Invoice Email:
```typescript
POST /api/invoices/send-email
Body: {
  invoiceId: string,
  userId: string
}
Response: {
  success: boolean,
  message: string
}
```

### Get All Invoices:
```typescript
GET /api/invoices
Response: [
  {
    id: string,
    invoice_number: string,
    customer: { name, email },
    total: number,
    status: string,
    issued_date: string
  }
]
```

---

## Best Practices

1. **Always generate invoices for completed errands/orders**
   - Helps with accounting and record-keeping
   - Provides customers with proof of service

2. **Send invoices promptly**
   - Generate within 24 hours of completion
   - Ensures timely payment

3. **Keep accurate records**
   - All invoices are stored in the database
   - Can be accessed anytime for reference

4. **Follow up on unpaid invoices**
   - Check invoice status regularly
   - Send reminders for overdue payments

---

## Troubleshooting

### Invoice not generating?
- Check that the errand/order is marked as "completed"
- Verify customer has valid email address
- Check admin permissions

### Email not sending?
- Verify email service is configured
- Check customer email address is correct
- Check spam folder

### Invoice details incorrect?
- Verify errand/order data is accurate
- Check pricing calculations
- Contact support if issue persists

---

## Future Enhancements

Planned features for the invoice system:
- [ ] Bulk invoice generation
- [ ] Custom invoice templates
- [ ] Multi-currency support
- [ ] Recurring invoices
- [ ] Payment gateway integration
- [ ] Invoice analytics and reports

---

## Support

For issues with invoices:
- Contact: support@errandrunners.com
- Admin Dashboard → Help → Invoice Issues
- Check logs in Admin Dashboard

---

**Last Updated**: January 2025
**Version**: 1.0
