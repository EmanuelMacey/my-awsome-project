
import { supabase } from '../config/supabase';

/**
 * Payment API functions for ErrandRunners with Stripe integration
 */

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
}

/**
 * Create a payment intent for an order using Stripe
 * This calls the Supabase Edge Function which uses STRIPE_SECRET_KEY
 */
export async function createPaymentIntent(
  orderId: string,
  amount: number,
  currency: string = 'usd',
  customerId: string,
  description?: string
): Promise<PaymentIntent> {
  console.log('Creating payment intent:', { orderId, amount, currency, customerId });

  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    // Call the Edge Function to create a payment intent
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        orderId,
        customerId,
        description: description || `Order #${orderId}`,
      },
    });

    if (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(error.message || 'Failed to create payment intent');
    }

    if (!data || !data.clientSecret) {
      throw new Error('Invalid response from payment service');
    }

    console.log('Payment intent created successfully:', data.paymentIntentId);

    return {
      id: data.paymentIntentId,
      amount,
      currency,
      status: data.status,
      client_secret: data.clientSecret,
    };
  } catch (error: any) {
    console.error('Error in createPaymentIntent:', error);
    throw error;
  }
}

/**
 * Confirm a payment
 */
export async function confirmPayment(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('Confirming payment:', { paymentIntentId, paymentMethodId });

  // Payment confirmation is handled by Stripe SDK on the client side
  // This function is kept for compatibility
  
  return { success: true };
}

/**
 * Update order payment status
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  paymentIntentId?: string
): Promise<void> {
  console.log('Updating order payment status:', { orderId, status, paymentIntentId });

  const updateData: any = {
    payment_status: status,
  };

  if (paymentIntentId) {
    updateData.payment_intent_id = paymentIntentId;
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating payment status:', error);
    throw new Error(error.message);
  }

  console.log('Payment status updated successfully');
}

/**
 * Process MMG payment
 * This is a placeholder for MMG integration
 */
export async function processMMGPayment(
  orderId: string,
  phoneNumber: string,
  amount: number
): Promise<{ success: boolean; error?: string; transactionId?: string }> {
  console.log('Processing MMG payment:', { orderId, phoneNumber, amount });

  // TODO: Integrate with MMG API
  // This requires MMG merchant account and API credentials
  
  // For now, mark as pending and require manual confirmation
  await updateOrderPaymentStatus(orderId, 'pending');
  
  return {
    success: true,
    transactionId: `mmg_${Date.now()}`,
  };
}

/**
 * Process cash payment
 * Updates order to mark as cash payment
 */
export async function processCashPayment(orderId: string): Promise<void> {
  console.log('Processing cash payment for order:', orderId);

  await updateOrderPaymentStatus(orderId, 'pending');
  
  console.log('Cash payment marked as pending');
}

/**
 * Get payment status for an order
 */
export async function getPaymentStatus(orderId: string): Promise<{
  status: string;
  method: string;
  amount: number;
}> {
  console.log('Getting payment status for order:', orderId);

  const { data, error } = await supabase
    .from('orders')
    .select('payment_status, payment_method, total')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error getting payment status:', error);
    throw new Error(error.message);
  }

  return {
    status: data.payment_status || 'pending',
    method: data.payment_method || 'cash',
    amount: data.total || 0,
  };
}

/**
 * Refund a payment
 * This will be implemented once Stripe is set up
 */
export async function refundPayment(
  orderId: string,
  amount?: number,
  reason?: string
): Promise<{ success: boolean; error?: string; refundId?: string }> {
  console.log('Refunding payment:', { orderId, amount, reason });

  // TODO: Implement Stripe refund via Edge Function
  // This requires calling a new Edge Function with STRIPE_SECRET_KEY
  
  // For now, just update the status
  await updateOrderPaymentStatus(orderId, 'refunded');
  
  return {
    success: true,
    refundId: `re_mock_${Date.now()}`,
  };
}
