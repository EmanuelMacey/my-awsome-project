
import React, { createContext, useContext } from 'react';

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
  // On web, Stripe is not available
  // Return a mock context that indicates Stripe is not ready
  console.log('Stripe is not available on web platform');
  
  return (
    <StripeContext.Provider value={{ isReady: false }}>
      {children}
    </StripeContext.Provider>
  );
}
