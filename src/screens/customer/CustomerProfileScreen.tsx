
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { theme, globalStyles } from '../../styles/theme';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../config/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { ConfirmModal } from '../../components/ConfirmModal';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  delivery_address: string | null;
}

export default function CustomerProfileScreen() {
  const { user, signOut } = useAuth();
  const { cart } = useCart();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
        setFullName(data.full_name || user.name || '');
        setEmail(user.email || '');
        setPhone(data.phone || user.phone || '');
        setDeliveryAddress(data.delivery_address || '');
        setAvatarUrl(data.avatar_url);
      } else {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: user.name,
            phone: user.phone,
          })
          .select()
          .single();

        if (!createError && newProfile) {
          setProfile(newProfile);
          setFullName(newProfile.full_name || '');
          setEmail(user.email || '');
          setPhone(newProfile.phone || '');
          setDeliveryAddress(newProfile.delivery_address || '');
        }
      }
    } catch (err) {
      console.error('Exception fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    try {
      console.log('User tapped profile image to upload');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload a profile picture.',
          [{ text: 'OK' }]
        );
        console.log('Permission denied for image picker');
        return;
      }

      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('Image selected, starting upload:', result.assets[0].uri);
        await uploadAvatar(result.assets[0].uri);
      } else {
        console.log('Image selection cancelled');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to open image picker. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const showStorageSetupGuide = () => {
    Alert.alert(
      'Storage Setup Required',
      'The storage bucket needs to be configured in Supabase. Would you like to view the setup guide?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Guide',
          onPress: () => {
            const guideText = `
SUPABASE STORAGE SETUP GUIDE

1. Go to https://supabase.com and sign in
2. Select your ErrandRunners project
3. Click "Storage" in the left sidebar
4. Click "New bucket"
5. Create bucket named "avatars"
6. Check "Public bucket"
7. Click "Create bucket"
8. Click on "avatars" bucket → "Policies" tab
9. Add these 4 policies:

Policy 1: Public Read
- Operation: SELECT
- Target: public
- Expression: true

Policy 2: Authenticated Upload
- Operation: INSERT
- Target: authenticated
- Expression: true

Policy 3: Update Own Images
- Operation: UPDATE
- Target: authenticated
- Expression: (storage.foldername(name))[1] = auth.uid()::text

Policy 4: Delete Own Images
- Operation: DELETE
- Target: authenticated
- Expression: (storage.foldername(name))[1] = auth.uid()::text

After setup, restart the app and try uploading again.

For detailed instructions, check SUPABASE_STORAGE_SETUP_GUIDE.md in your project folder.
            `.trim();
            
            Alert.alert('Setup Guide', guideText, [{ text: 'OK' }]);
          },
        },
      ]
    );
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload a profile picture.');
      return;
    }

    try {
      setUploading(true);
      console.log('Starting avatar upload for user:', user.id);
      console.log('Image URI:', uri);

      let blob: Blob;
      try {
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }
        blob = await response.blob();
        console.log('Blob created, size:', blob.size, 'type:', blob.type);
      } catch (fetchError) {
        console.error('Error creating blob:', fetchError);
        throw new Error('Failed to process image. Please try a different image.');
      }

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const fileName = `${user.id}_${timestamp}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Uploading to path:', filePath);
      console.log('File extension:', fileExt);

      let uploadData;
      let uploadError;
      let bucketName = 'avatars';
      let finalPath = filePath;

      console.log('Attempting upload to avatars bucket...');
      const avatarsUpload = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
          cacheControl: '3600',
        });

      if (avatarsUpload.error) {
        console.log('Avatars bucket failed:', avatarsUpload.error.message);
        
        // Check if it's a "bucket not found" error
        if (avatarsUpload.error.message?.toLowerCase().includes('not found') || 
            avatarsUpload.error.message?.toLowerCase().includes('does not exist')) {
          console.error('Storage bucket not configured');
          showStorageSetupGuide();
          throw new Error('BUCKET_NOT_FOUND');
        }
        
        console.log('Trying images bucket as fallback...');
        
        const imagesUpload = await supabase.storage
          .from('images')
          .upload(`avatars/${filePath}`, blob, {
            contentType: `image/${fileExt}`,
            upsert: true,
            cacheControl: '3600',
          });

        if (imagesUpload.error) {
          console.error('Both buckets failed. Avatars error:', avatarsUpload.error);
          console.error('Images bucket error:', imagesUpload.error);
          
          let errorMessage = 'Failed to upload profile picture. ';
          
          if (imagesUpload.error.message?.includes('row-level security') || 
              imagesUpload.error.message?.includes('RLS') ||
              imagesUpload.error.message?.includes('policy')) {
            errorMessage = 'Storage permissions need to be configured. Please contact support or check the setup guide.';
            showStorageSetupGuide();
          } else if (imagesUpload.error.message?.includes('not found') || 
                     imagesUpload.error.message?.includes('does not exist')) {
            errorMessage = 'Storage bucket not found. Please contact support or check the setup guide.';
            showStorageSetupGuide();
          } else {
            errorMessage += imagesUpload.error.message || 'Please try again.';
          }
          
          throw new Error(errorMessage);
        }

        uploadData = imagesUpload.data;
        uploadError = imagesUpload.error;
        bucketName = 'images';
        finalPath = `avatars/${filePath}`;
        console.log('Upload successful to images bucket');
      } else {
        uploadData = avatarsUpload.data;
        uploadError = avatarsUpload.error;
        console.log('Upload successful to avatars bucket');
      }

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful to bucket:', bucketName, 'path:', finalPath);

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(finalPath);

      console.log('Public URL generated:', publicUrl);

      console.log('Updating profile with new avatar URL...');
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          full_name: fullName || user.name,
          phone: phone || user.phone,
          delivery_address: deliveryAddress,
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        });

      if (updateError) {
        console.error('Profile update error:', updateError);
        Alert.alert(
          'Update Failed',
          'Image uploaded but failed to update profile. Please try again.',
          [{ text: 'OK' }]
        );
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      console.log('Profile picture updated successfully');
      
      Alert.alert(
        'Success',
        'Profile picture updated successfully!',
        [{ text: 'OK' }]
      );
      
      await fetchProfile();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      
      // Don't show alert if we already showed the setup guide
      if (error.message === 'BUCKET_NOT_FOUND') {
        return;
      }
      
      if (!error.message?.includes('Failed to upload')) {
        let errorMessage = 'Failed to upload profile picture. ';
        
        if (error.message?.includes('row-level security') || 
            error.message?.includes('RLS') ||
            error.message?.includes('policy')) {
          errorMessage = 'Storage permissions need to be configured. Please contact support or check the setup guide.';
        } else if (error.message?.includes('not found') || 
                   error.message?.includes('does not exist')) {
          errorMessage = 'Storage bucket not found. Please contact support or check the setup guide.';
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage += 'Please try again or contact support.';
        }
        
        Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name', [{ text: 'OK' }]);
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email', [{ text: 'OK' }]);
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number', [{ text: 'OK' }]);
      return;
    }

    try {
      setLoading(true);
      console.log('Saving profile for user:', user.id);

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          phone: phone,
          delivery_address: deliveryAddress,
          avatar_url: avatarUrl,
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      const { error: userError } = await supabase
        .from('users')
        .update({
          name: fullName,
          email: email,
          phone: phone,
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating user:', userError);
      }

      console.log('Profile updated successfully');
      Alert.alert('Success', 'Profile updated successfully!', [{ text: 'OK' }]);
      setEditingProfile(false);
      await fetchProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Error',
        'Failed to save profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('User tapped Logout button');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('User confirmed logout');
    setShowLogoutModal(false);
    try {
      await signOut();
      router.replace('/auth/landing');
    } catch (error: any) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    console.log('User confirmed account deletion');
    setShowDeleteAccountModal(false);
    
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🗑️ Calling Supabase RPC delete_user for user:', user.id);
      
      // Call the Supabase RPC function to delete the user account
      const { error } = await supabase.rpc('delete_user');
      
      if (!error) {
        console.log('✅ Account deletion successful');
        
        // Sign out locally
        await supabase.auth.signOut();
        
        // Show success message
        Alert.alert(
          'Account Deleted',
          'Your account has been permanently deleted.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Redirect to landing page
                router.replace('/auth/landing');
              }
            }
          ]
        );
      } else {
        console.error('❌ Error deleting account:', error.message);
        Alert.alert(
          'Error',
          `Failed to delete account: ${error.message}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Exception deleting account:', error);
      Alert.alert(
        'Error',
        'Failed to delete account. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please login to view your profile</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF8C42', '#FFB574', '#FFE8D6', '#FFFFFF']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <LinearGradient
        colors={['rgba(255, 140, 66, 0.15)', 'transparent', 'rgba(255, 181, 116, 0.08)']}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      <View style={styles.decorativeCircle4} />
      <View style={styles.decorativeCircle5} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handlePickImage} 
              disabled={uploading}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={styles.avatarImage}
                    onError={() => {
                      console.log('Image failed to load, resetting avatar URL');
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(fullName || user.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Text style={styles.cameraIconText}>📷</Text>
                </View>
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.uploadHint}>Tap to change profile picture</Text>
            <Text style={styles.name}>{fullName || user.name || 'User'}</Text>
            <Text style={styles.email}>{email || user.email}</Text>
          </View>

          {editingProfile ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Edit Profile</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Delivery Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder="Enter your delivery address"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditingProfile(false);
                    setFullName(profile?.full_name || user.name || '');
                    setEmail(user.email || '');
                    setPhone(profile?.phone || user.phone || '');
                    setDeliveryAddress(profile?.delivery_address || '');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveProfile}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => router.push('/customer/cart')}
              >
                <View style={styles.cardGradient}>
                  <View style={styles.cardIconContainer}>
                    <Text style={styles.cardIcon}>🛒</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitleWhite}>My Cart</Text>
                    <Text style={styles.cardSubtitleWhite}>
                      {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
                    </Text>
                  </View>
                  <Text style={styles.cardArrowWhite}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => setEditingProfile(true)}
              >
                <View style={styles.cardGradient}>
                  <View style={styles.cardIconContainer}>
                    <Text style={styles.cardIcon}>✏️</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitleWhite}>Edit Profile</Text>
                    <Text style={styles.cardSubtitleWhite}>Update your personal information</Text>
                  </View>
                  <Text style={styles.cardArrowWhite}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => router.push('/customer/orders')}
              >
                <View style={styles.cardGradient}>
                  <View style={styles.cardIconContainer}>
                    <Text style={styles.cardIcon}>📦</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitleWhite}>My Orders</Text>
                    <Text style={styles.cardSubtitleWhite}>Track your food orders</Text>
                  </View>
                  <Text style={styles.cardArrowWhite}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => router.push('/errands/my-errands')}
              >
                <View style={styles.cardGradient}>
                  <View style={styles.cardIconContainer}>
                    <Text style={styles.cardIcon}>🏃</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitleWhite}>My Errands</Text>
                    <Text style={styles.cardSubtitleWhite}>View your errand services</Text>
                  </View>
                  <Text style={styles.cardArrowWhite}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => router.push('/customer/invoices')}
              >
                <View style={styles.cardGradient}>
                  <View style={styles.cardIconContainer}>
                    <Text style={styles.cardIcon}>📄</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitleWhite}>My Invoices</Text>
                    <Text style={styles.cardSubtitleWhite}>View and manage your invoices</Text>
                  </View>
                  <Text style={styles.cardArrowWhite}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => {
                  console.log('🔔 Opening notification preferences');
                  router.push('/customer/notification-preferences');
                }}
              >
                <View style={styles.cardGradient}>
                  <View style={styles.cardIconContainer}>
                    <Text style={styles.cardIcon}>🔔</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitleWhite}>Notification Preferences</Text>
                    <Text style={styles.cardSubtitleWhite}>Manage your notification settings</Text>
                  </View>
                  <Text style={styles.cardArrowWhite}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteAccountButton}
                onPress={() => {
                  console.log('🗑️ User tapped Delete Account button');
                  setShowDeleteAccountModal(true);
                }}
              >
                <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <ConfirmModal
        visible={showDeleteAccountModal}
        title="⚠️ Delete Account"
        message="Are you sure you want to delete your account? This action is PERMANENT and CANNOT be undone. All your data including orders, errands, and messages will be permanently deleted."
        confirmText="Delete My Account"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteAccountModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 800,
    zIndex: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 800,
    zIndex: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 0,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 140, 66, 0.12)',
    zIndex: 0,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 320,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 181, 116, 0.15)',
    zIndex: 0,
  },
  decorativeCircle4: {
    position: 'absolute',
    top: 200,
    right: 40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 0,
  },
  decorativeCircle5: {
    position: 'absolute',
    top: 450,
    left: 30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 140, 66, 0.08)',
    zIndex: 0,
  },
  scrollContainer: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
    ...Platform.select({
      web: {
        alignItems: 'center',
      },
    }),
  },
  contentWrapper: {
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: 800,
      },
    }),
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 40,
  },
  avatarContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 140, 66, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF8C42',
  },
  cameraIconText: {
    fontSize: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
  },
  cardWrapper: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.12)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 66, 0.15)',
  },
  cardIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  cardTitleWhite: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  cardSubtitleWhite: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardArrow: {
    fontSize: 32,
    color: theme.colors.textSecondary,
    fontWeight: '300',
  },
  cardArrowWhite: {
    fontSize: 32,
    color: '#FF8C42',
    fontWeight: '300',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: theme.colors.danger,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deleteAccountButton: {
    backgroundColor: '#DC2626',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#991B1B',
    marginTop: 12,
  },
  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
