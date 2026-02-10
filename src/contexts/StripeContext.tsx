
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
  // Fallback for platforms that don't have a specific implementation
  console.log('Stripe provider fallback - not configured for this platform');
  
  return (
    <StripeContext.Provider value={{ isReady: false }}>
      {children}
    </StripeContext.Provider>
  );
}
