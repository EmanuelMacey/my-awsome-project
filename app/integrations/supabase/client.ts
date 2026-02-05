
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://sytixskkgfvjjjemmoav.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dGl4c2trZ2Z2ampqZW1tb2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjM5ODcsImV4cCI6MjA3OTA5OTk4N30.iKrDcIPF3oJUdmc_ZdInjxynYYxxRNbr96xdVgbhbQ4";

// Create a custom storage adapter that safely handles the absence of window
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Check if we're in a browser-like environment
      if (typeof window !== 'undefined') {
        return await AsyncStorage.getItem(key);
      }
      // Return null if window is not available (e.g., during SSR or build)
      return null;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Check if we're in a browser-like environment
      if (typeof window !== 'undefined') {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      // Check if we're in a browser-like environment
      if (typeof window !== 'undefined') {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
