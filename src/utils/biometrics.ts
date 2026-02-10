
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export interface BiometricCredentials {
  email: string;
  encryptedPassword: string;
}

/**
 * Check if biometrics are available on the device
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch (error) {
    console.error('Biometric check error:', error);
    return false;
  }
};

/**
 * Get biometric type (Face ID, Touch ID, Fingerprint, etc.)
 */
export const getBiometricType = async (): Promise<string> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Recognition';
    }
    
    return 'Biometric';
  } catch (error) {
    console.error('Error getting biometric type:', error);
    return 'Biometric';
  }
};

/**
 * Authenticate with biometrics
 */
export const authenticateWithBiometrics = async (): Promise<boolean> => {
  try {
    const biometricType = await getBiometricType();
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Authenticate with ${biometricType}`,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Passcode',
    });

    return result.success;
  } catch (error) {
    console.error('Biometric auth error:', error);
    return false;
  }
};

/**
 * Save credentials securely for biometric login
 */
export const saveBiometricCredentials = async (
  email: string,
  password: string
): Promise<boolean> => {
  try {
    const credentials: BiometricCredentials = {
      email,
      encryptedPassword: password, // In production, this should be encrypted
    };

    await SecureStore.setItemAsync(
      BIOMETRIC_CREDENTIALS_KEY,
      JSON.stringify(credentials),
      {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      }
    );

    return true;
  } catch (error) {
    console.error('Save credentials error:', error);
    return false;
  }
};

/**
 * Get saved biometric credentials
 */
export const getBiometricCredentials = async (): Promise<BiometricCredentials | null> => {
  try {
    const stored = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Get credentials error:', error);
    return null;
  }
};

/**
 * Remove saved biometric credentials
 */
export const removeBiometricCredentials = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  } catch (error) {
    console.error('Remove credentials error:', error);
  }
};

/**
 * Check if biometric login is enabled
 */
export const isBiometricLoginEnabled = async (): Promise<boolean> => {
  const credentials = await getBiometricCredentials();
  return credentials !== null;
};

/**
 * Enable biometric authentication for the user
 */
export const enableBiometricAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem('biometric_enabled', 'true');
  } catch (error) {
    console.error('Error enabling biometric auth:', error);
  }
};

/**
 * Disable biometric authentication for the user
 */
export const disableBiometricAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('biometric_enabled');
    await removeBiometricCredentials();
  } catch (error) {
    console.error('Error disabling biometric auth:', error);
  }
};

/**
 * Check if biometric authentication is enabled
 */
export const isBiometricAuthEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem('biometric_enabled');
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric auth status:', error);
    return false;
  }
};
