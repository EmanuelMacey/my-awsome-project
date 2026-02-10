
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { theme } from '../styles/theme';
import { createPaymentIntent, updateOrderPaymentStatus } from '../api/payment';
import { formatCurrency } from '../utils/currency';

interface StripePaymentSheetProps {
  orderId: string;
  customerId: string;
  amount: number;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StripePaymentSheet({
  orderId,
  customerId,
  amount,
  currency = 'usd',
  onSuccess,
  onCancel,
}: StripePaymentSheetProps) {
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    id: string;
  } | null>(null);

  const initializePayment = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Initializing payment for order:', orderId);

      const intent = await createPaymentIntent(
        orderId,
        amount,
        currency,
        customerId,
        `Order #${orderId}`
      );

      if (!intent.client_secret) {
        throw new Error('Failed to initialize payment');
      }

      setPaymentIntent({
        clientSecret: intent.client_secret,
        id: intent.id,
      });

      console.log('Payment initialized successfully');
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to initialize payment. Please try again.',
        [{ text: 'OK', onPress: onCancel }]
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, amount, currency, customerId, onCancel]);

  useEffect(() => {
    // Create payment intent when component mounts
    initializePayment();
  }, [initializePayment]);

  const handlePayment = async () => {
    if (!paymentIntent || !cardComplete) {
      Alert.alert('Error', 'Please complete your card details');
      return;
    }

    try {
      setLoading(true);
      console.log('Processing payment...');

      // Confirm the payment with Stripe
      const { error, paymentIntent: confirmedIntent } = await confirmPayment(
        paymentIntent.clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (error) {
        console.error('Payment confirmation error:', error);
        Alert.alert(
          'Payment Failed',
          error.message || 'Payment could not be processed. Please try again.'
        );
        await updateOrderPaymentStatus(orderId, 'failed', paymentIntent.id);
        return;
      }

      if (confirmedIntent) {
        console.log('Payment successful:', confirmedIntent.id);
        
        // Update order payment status
        await updateOrderPaymentStatus(orderId, 'completed', confirmedIntent.id);
        
        Alert.alert(
          'Payment Successful',
          'Your payment has been processed successfully!',
          [{ text: 'OK', onPress: onSuccess }]
        );
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'An error occurred while processing your payment.'
      );
      await updateOrderPaymentStatus(orderId, 'failed', paymentIntent.id);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !paymentIntent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Initializing payment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Card Payment</Text>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
      </View>

      <View style={styles.cardFieldContainer}>
        <Text style={styles.label}>Card Details</Text>
        <CardField
          postalCodeEnabled={false}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={{
            backgroundColor: theme.colors.surface,
            textColor: theme.colors.text,
            borderRadius: theme.borderRadius.md,
          }}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
        />
        <Text style={styles.testCardInfo}>
          Test Mode: Use card 4242 4242 4242 4242 with any future date and CVC
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.payButton,
            (!cardComplete || loading) && styles.buttonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!cardComplete || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              Pay {formatCurrency(amount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.secureInfo}>
        <Text style={styles.secureIcon}>🔒</Text>
        <Text style={styles.secureText}>
          Secure payment powered by Stripe
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  amount: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  cardFieldContainer: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: theme.spacing.md,
  },
  testCardInfo: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
  },
  payButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  secureIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  secureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
