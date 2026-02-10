
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { User } from '../types/database.types';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; isAdmin?: boolean }>;
  signUp: (email: string, password: string, name: string, phone: string, role: 'customer' | 'driver') => Promise<{ error?: string; needsVerification?: boolean }>;
  signInWithPhone: (phone: string) => Promise<{ error?: string }>;
  signUpWithPhone: (phone: string, name: string, role: 'customer' | 'driver') => Promise<{ error?: string }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error?: string }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string, authUser?: SupabaseUser) => {
    try {
      console.log('👤 Fetching user profile for:', userId);
      
      // Try to get cached profile first for faster loading
      const cachedProfile = await AsyncStorage.getItem(`user_profile_${userId}`);
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          console.log('⚡ Using cached user profile');
          setUser(parsed);
          setLoading(false);
          // Continue fetching fresh data in background
        } catch (e) {
          console.log('⚠️ Failed to parse cached profile, fetching fresh');
        }
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        
        // If user profile doesn't exist, try to create it from auth metadata
        if (error.code === 'PGRST116' && authUser) {
          console.log('📝 User profile not found, creating from auth metadata...');
          
          const metadata = authUser.user_metadata || {};
          
          const userName = metadata.name || metadata.full_name || authUser.email?.split('@')[0] || 'User';
          const userPhone = metadata.phone || authUser.phone || '';
          const userRole = (metadata.role || 'customer') as 'customer' | 'driver' | 'admin';
          
          const newUserData = {
            id: userId,
            email: authUser.email || '',
            name: userName,
            phone: userPhone,
            role: userRole,
            is_approved: userRole === 'customer' ? true : (metadata.is_approved || false),
          };

          console.log('📝 Creating user profile with data:', newUserData);

          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert(newUserData)
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating user profile:', createError);
            setUser(null);
          } else {
            console.log('✅ User profile created successfully:', createdUser);
            setUser(createdUser);
            // Cache the new profile
            await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(createdUser));
          }
        } else {
          setUser(null);
        }
      } else {
        console.log('✅ User profile fetched successfully:', data);
        setUser(data);
        // Cache the profile for faster subsequent loads
        await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(data));
      }
    } catch (error) {
      console.error('❌ Exception in fetchUserProfile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const registerPushNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔔 Registering for push notifications...');
      await registerForPushNotificationsAsync(user.id);
      console.log('✅ Push notifications registered');
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    console.log('🔐 AuthContext: Initializing...');
    
    let mounted = true;
    
    const initAuth = async () => {
      try {
        console.log('🔐 Getting initial session...');
        
        // Try to get cached session first for instant loading
        const cachedSessionStr = await AsyncStorage.getItem('supabase_session_cache');
        if (cachedSessionStr) {
          try {
            const cachedSession = JSON.parse(cachedSessionStr);
            console.log('⚡ Using cached session for instant load');
            if (mounted) {
              setSession(cachedSession);
              if (cachedSession?.user) {
                // Fetch profile with cache (will show cached data immediately)
                fetchUserProfile(cachedSession.user.id, cachedSession.user);
              }
            }
          } catch (e) {
            console.log('⚠️ Failed to parse cached session');
          }
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        console.log('📱 Fresh session:', session?.user?.id || 'No session');
        
        // Cache the fresh session
        if (session) {
          await AsyncStorage.setItem('supabase_session_cache', JSON.stringify(session));
        } else {
          await AsyncStorage.removeItem('supabase_session_cache');
        }
        
        if (mounted) {
          setSession(session);
          if (session?.user) {
            await fetchUserProfile(session.user.id, session.user);
          } else {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state changed:', _event, session?.user?.id || 'No session');
      
      // Cache session changes
      if (session) {
        await AsyncStorage.setItem('supabase_session_cache', JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem('supabase_session_cache');
      }
      
      if (mounted) {
        setSession(session);
        if (session?.user) {
          setLoading(true);
          await fetchUserProfile(session.user.id, session.user);
        } else {
          setUser(null);
          setLoading(false);
          // Clear cached profile on logout
          if (_event === 'SIGNED_OUT') {
            const keys = await AsyncStorage.getAllKeys();
            const profileKeys = keys.filter(key => key.startsWith('user_profile_'));
            await AsyncStorage.multiRemove(profileKeys);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  useEffect(() => {
    if (user) {
      registerPushNotifications();
    }
  }, [user, registerPushNotifications]);

  const signIn = async (email: string, password: string): Promise<{ error?: string; isAdmin?: boolean }> => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      
      if (email === 'admin@errandrunners.gy' && password === 'Admin1234') {
        console.log('👑 Admin login detected');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('❌ Admin sign in error:', error);
          return { error: error.message };
        }

        console.log('✅ Admin sign in successful, redirecting...');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        router.replace('/admin/dashboard');
        
        return { isAdmin: true };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.\n\nForgot your password? Use the "Forgot Password" option below.\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address. Check your inbox (and spam folder) for the verification link.\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769';
        }
        
        return { error: errorMessage };
      }

      console.log('✅ Sign in successful, user:', data.user?.id);
      
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('❌ Error fetching user data:', userError);
          return { error: 'Failed to load user profile. Please try again.\n\nIf the problem persists, contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769' };
        }

        console.log('👤 User data fetched:', userData);
        
        // Check if driver needs approval
        if (userData.role === 'driver' && !userData.is_approved) {
          // Auto-approve specific drivers
          const isAutoApprovedDriver = 
            userData.email === 'dinelmacey@gmail.com' || 
            userData.name === 'Dinel Macey' ||
            userData.email?.toLowerCase().includes('dinel');
          
          if (isAutoApprovedDriver) {
            console.log('🚗 Auto-approving driver:', userData.email);
            // Update the user to be approved
            const { error: updateError } = await supabase
              .from('users')
              .update({ is_approved: true })
              .eq('id', userData.id);
            
            if (updateError) {
              console.error('❌ Error auto-approving driver:', updateError);
            } else {
              console.log('✅ Driver auto-approved successfully');
              // Continue with login
              router.replace('/driver/dashboard');
              return {};
            }
          } else {
            await supabase.auth.signOut();
            return { error: 'Your driver account is pending approval. You\'ll receive a notification once approved.\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769' };
          }
        }
        
        if (userData.role === 'customer') {
          console.log('🛒 Customer login successful, redirecting...');
          router.replace('/customer/home');
        } else if (userData.role === 'driver') {
          console.log('🚗 Driver login successful, redirecting...');
          router.replace('/driver/dashboard');
        }
      }

      return {};
    } catch (error: any) {
      console.error('❌ Sign in exception:', error);
      return { error: error.message || 'Failed to sign in. Please check your internet connection and try again.\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    role: 'customer' | 'driver'
  ): Promise<{ error?: string; needsVerification?: boolean }> => {
    try {
      console.log('📝 Starting signup for:', email, 'with role:', role);
      
      if (!phone || phone.trim() === '') {
        return { error: 'Phone number is required.\n\nFormat: +5927219769\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769' };
      }
      
      if (!name || name.trim() === '') {
        return { error: 'Full name is required.\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769' };
      }
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        console.log('⚠️ User already exists:', email);
        return { error: 'This email is already registered. Please use the "Forgot Password" option on the login screen to reset your password, or try logging in.\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769' };
      }

      let isApproved = false;
      if (role === 'driver') {
        isApproved = email === 'dinelmacey@gmail.com' || name === 'Dinel Macey';
      } else {
        isApproved = true;
      }

      console.log('📝 Signing up with Supabase Auth...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
            phone,
            role,
            is_approved: isApproved,
          },
          emailRedirectTo: 'maceyrunners://email-confirmed',
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        
        let errorMessage = authError.message;
        if (authError.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please use the "Forgot Password" option on the login screen to reset your password, or try logging in.';
        } else if (authError.message.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address (e.g., yourname@example.com)';
        } else if (authError.message.includes('Password should be')) {
          errorMessage = 'Password must be at least 6 characters long for security.';
        }
        
        return { error: errorMessage + '\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769' };
      }

      console.log('✅ Auth signup successful:', authData);

      if (authData.user && authData.session) {
        console.log('✅ User has session, creating profile...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError && profileError.code === 'PGRST116') {
          console.log('📝 Trigger did not create profile, creating manually...');
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              name,
              phone,
              email,
              role,
              is_approved: isApproved,
            });
          
          if (insertError) {
            console.error('❌ Error creating user profile:', insertError);
          } else {
            console.log('✅ User profile created manually');
          }
        } else if (profileData) {
          console.log('✅ User profile exists:', profileData);
        }

        if (role === 'driver' && !isApproved) {
          const { error: approvalError } = await supabase
            .from('admin_approvals')
            .insert({
              user_id: authData.user.id,
              request_type: 'driver_approval',
              status: 'pending',
            });

          if (approvalError) {
            console.error('❌ Error creating approval request:', approvalError);
          }
        }
        
        if (role === 'customer') {
          console.log('🛒 Customer signup successful, redirecting...');
          router.replace('/customer/home');
        } else if (role === 'driver' && isApproved) {
          console.log('🚗 Driver signup successful, redirecting...');
          router.replace('/driver/dashboard');
        }
      }

      if (authData.user && !authData.session) {
        console.log('📧 User needs to verify email');
        return { needsVerification: true };
      }

      return {};
    } catch (error: any) {
      console.error('❌ Sign up exception:', error);
      return { error: (error.message || 'Failed to sign up. Please check your internet connection and try again.') + '\n\nNeed help? Contact us:\nEmail: errandrunners592@gmail.com\nPhone: 592-721-9769' };
    }
  };

  const signInWithPhone = async (phone: string): Promise<{ error?: string }> => {
    try {
      console.log('📱 Sending OTP to phone:', phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        console.error('❌ Phone sign in error:', error);
        return { error: error.message };
      }

      console.log('✅ OTP sent successfully');
      return {};
    } catch (error: any) {
      console.error('❌ Phone sign in exception:', error);
      return { error: error.message || 'Failed to send OTP' };
    }
  };

  const signUpWithPhone = async (
    phone: string,
    name: string,
    role: 'customer' | 'driver'
  ): Promise<{ error?: string }> => {
    try {
      console.log('📱 Starting phone signup for:', phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        console.error('❌ Phone signup error:', error);
        return { error: error.message };
      }

      console.log('✅ Phone signup OTP sent successfully');
      return {};
    } catch (error: any) {
      console.error('❌ Phone signup exception:', error);
      return { error: error.message || 'Failed to sign up with phone' };
    }
  };

  const verifyOTP = async (phone: string, token: string): Promise<{ error?: string }> => {
    try {
      console.log('🔐 Verifying OTP for phone:', phone);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        console.error('❌ OTP verification error:', error);
        return { error: error.message };
      }

      console.log('✅ OTP verified successfully');
      return {};
    } catch (error: any) {
      console.error('❌ OTP verification exception:', error);
      return { error: error.message || 'Failed to verify OTP' };
    }
  };

  const sendPasswordResetEmail = async (email: string): Promise<{ error?: string }> => {
    try {
      console.log('📧 Sending password reset email to:', email);
      
      const redirectUrl = 'maceyrunners://auth/reset-password';
      console.log('🔗 Password reset redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { error: error.message };
      }

      console.log('✅ Password reset email sent successfully');
      return {};
    } catch (error: any) {
      console.error('❌ Password reset exception:', error);
      return { error: error.message || 'Failed to send password reset email' };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      
      setSession(null);
      setUser(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
      }
      
      console.log('✅ Sign out successful, navigating to landing page...');
      
      router.replace('/auth/landing');
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      router.replace('/auth/landing');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signIn, 
      signUp, 
      signInWithPhone,
      signUpWithPhone,
      verifyOTP,
      sendPasswordResetEmail,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
