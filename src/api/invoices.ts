
import { supabase } from '../config/supabase';
import { calculateDistance } from '../utils/location';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  driver_id: string | null;
  subtotal: number;
  service_fee: number;
  total: number;
  payment_status: 'Paid' | 'Pending';
  created_at: string;
}

export interface ErrandInvoice {
  id: string;
  errand_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  amount: number;
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
  items: {
    description: string;
    amount: number;
  }[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_name: string;
  quantity: number;
  price: number;
  distance_km: number | null;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
  customer: {
    name: string;
    email: string;
  } | null;
  driver: {
    name: string;
  } | null;
}

// TODO: Backend Integration - Create invoice generation endpoint
export async function createInvoiceFromOrder(orderId: string): Promise<Invoice> {
  try {
    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, name, email),
        driver:users!orders_driver_id_fkey(id, name),
        order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        customer_id: order.customer_id,
        driver_id: order.driver_id,
        subtotal: order.subtotal,
        service_fee: order.delivery_fee,
        total: order.total,
        payment_status: order.payment_status === 'completed' ? 'Paid' : 'Pending',
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items
    const invoiceItems = order.order_items.map((item: any) => ({
      invoice_id: invoice.id,
      service_name: item.product_name,
      quantity: item.quantity,
      price: item.product_price,
      distance_km: null,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) throw itemsError;

    return invoice;
  } catch (error) {
    console.error('Error creating invoice from order:', error);
    throw error;
  }
}

// Create invoice from errand and store in errand_invoices table
export async function createInvoiceFromErrand(errandId: string, adminUserId: string): Promise<ErrandInvoice> {
  try {
    console.log('Creating invoice for errand:', errandId);
    
    // Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminUserId)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      throw new Error('Only admins can generate invoices for errands');
    }

    // Fetch errand details
    const { data: errand, error: errandError } = await supabase
      .from('errands')
      .select(`
        *,
        customer:users!errands_customer_id_fkey(id, name, email, phone),
        runner:users!errands_runner_id_fkey(id, name),
        category:errand_categories(name),
        subcategory:errand_subcategories(name)
      `)
      .eq('id', errandId)
      .single();

    if (errandError) throw errandError;

    if (!errand.customer) {
      throw new Error('Customer information not found for this errand');
    }

    // Create invoice in errand_invoices table
    const invoiceNumber = `INV-${Date.now()}`;
    const serviceName = errand.subcategory?.name || errand.category?.name || 'Errand Service';
    
    const invoiceData = {
      errand_id: errandId,
      user_id: errand.customer_id, // Use user_id instead of customer_id
      customer_name: errand.customer.name,
      customer_email: errand.customer.email,
      customer_phone: errand.customer.phone,
      amount: errand.total_price,
      status: 'pending',
      items: [
        {
          description: serviceName,
          amount: errand.total_price,
        },
      ],
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from('errand_invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw invoiceError;
    }

    console.log('Invoice created successfully:', invoice.id);
    
    // Return with customer_id for consistency
    return {
      ...invoice,
      customer_id: invoice.user_id,
    };
  } catch (error) {
    console.error('Error creating invoice from errand:', error);
    throw error;
  }
}

// Mark invoice as paid (Admin only)
export async function markInvoiceAsPaid(invoiceId: string, adminUserId: string): Promise<void> {
  try {
    console.log('Marking invoice as paid:', invoiceId);
    
    // Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminUserId)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      throw new Error('Only admins can mark invoices as paid');
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from('errand_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      throw updateError;
    }

    console.log('Invoice marked as paid successfully');
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    throw error;
  }
}

// Send invoice via email using Supabase Edge Function
export async function sendInvoiceEmail(invoiceId: string, adminUserId: string): Promise<void> {
  try {
    console.log('Sending invoice email for invoice:', invoiceId);
    
    // Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminUserId)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      throw new Error('Only admins can send invoices');
    }

    // Fetch invoice with details
    const { data: invoice, error: invoiceError } = await supabase
      .from('errand_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    if (!invoice.customer_email) {
      throw new Error('Customer email not found');
    }

    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke('swift-task', {
      body: {
        action: 'send_invoice',
        invoice_id: invoiceId,
        customer_email: invoice.customer_email,
        customer_name: invoice.customer_name,
        amount: invoice.amount,
        items: invoice.items,
      },
    });

    if (error) {
      console.error('Error calling edge function:', error);
      throw new Error('Failed to send invoice email');
    }

    console.log('Invoice email sent successfully:', data);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

export async function getInvoiceById(invoiceId: string): Promise<InvoiceWithItems> {
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:users!invoices_customer_id_fkey(name, email),
        driver:users!invoices_driver_id_fkey(name)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (itemsError) throw itemsError;

    return {
      ...invoice,
      items: items || [],
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
}

// Get errand invoice by ID
export async function getErrandInvoiceById(invoiceId: string): Promise<ErrandInvoice> {
  try {
    const { data: invoice, error } = await supabase
      .from('errand_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) throw error;
    
    // Map user_id to customer_id for consistency
    return {
      ...invoice,
      customer_id: invoice.user_id || invoice.customer_id,
    };
  } catch (error) {
    console.error('Error fetching errand invoice:', error);
    throw error;
  }
}

export async function getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    throw error;
  }
}

// Get errand invoices by customer - Fixed to use user_id instead of customer_id
export async function getErrandInvoicesByCustomer(customerId: string): Promise<ErrandInvoice[]> {
  try {
    console.log('Fetching errand invoices for customer:', customerId);
    
    // Try to fetch using user_id (the actual column name in the database)
    const { data, error } = await supabase
      .from('errand_invoices')
      .select('*')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching errand invoices:', error);
      // If the column doesn't exist, return empty array instead of throwing
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Database schema issue: errand_invoices table missing expected column');
        return [];
      }
      throw error;
    }
    
    // Map user_id to customer_id for consistency with the interface
    const invoices = (data || []).map(invoice => ({
      ...invoice,
      customer_id: invoice.user_id || invoice.customer_id,
    }));
    
    console.log('Found errand invoices:', invoices.length);
    return invoices;
  } catch (error) {
    console.error('Error fetching customer errand invoices:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

export async function getAllInvoices(): Promise<Invoice[]> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    throw error;
  }
}

// Get all errand invoices (Admin only)
export async function getAllErrandInvoices(): Promise<ErrandInvoice[]> {
  try {
    const { data, error } = await supabase
      .from('errand_invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map user_id to customer_id for consistency
    return (data || []).map(invoice => ({
      ...invoice,
      customer_id: invoice.user_id || invoice.customer_id,
    }));
  } catch (error) {
    console.error('Error fetching all errand invoices:', error);
    throw error;
  }
}
