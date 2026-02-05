
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StripeProvider as StripeProviderNative } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

interface StripeContextType {
  isReady: boolean;
}

const StripeContext = createContext<StripeContextType>({
  isReady: false,
});

export const useStripe = () => useContext(StripeContext);

interface StripeProviderProps {
  children: React.ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const [isReady, setIsReady] = useState(false);
  
  // Get Stripe publishable key from environment
  const publishableKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
                         process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (publishableKey && publishableKey.startsWith('pk_')) {
      setIsReady(true);
      console.log('Stripe initialized with publishable key');
    } else {
      console.warn('Stripe publishable key not configured. Please add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env');
    }
  }, [publishableKey]);

  if (!publishableKey || !publishableKey.startsWith('pk_')) {
    // Return children without Stripe provider if key is not configured
    return <>{children}</>;
  }

  return (
    <StripeProviderNative
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.errandrunners.app"
      urlScheme="errandrunners"
    >
      <StripeContext.Provider value={{ isReady }}>
        {children}
      </StripeContext.Provider>
    </StripeProviderNative>
  );
}
