
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { theme, globalStyles } from '../styles/theme';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { ConfirmModal } from '../components/ConfirmModal';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  address: string | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  phone: string | null;
  city: string | null;
  country: string | null;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfile(newProfile);
          setFullName(newProfile.full_name || '');
          setEmail(user.email || '');
          setPhone(newProfile.phone || '');
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

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Permission denied for image picker');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;

    try {
      setUploading(true);

      const response = await fetch(uri);
      const blob = await response.blob();

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('Uploading avatar to:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Avatar uploaded successfully:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Avatar public URL:', publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          full_name: fullName || user.name,
          phone: phone || user.phone,
          delivery_address: deliveryAddress,
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      console.log('Profile picture updated successfully');
      
      await fetchProfile();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          phone: phone,
          delivery_address: deliveryAddress,
          avatar_url: avatarUrl,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      const { error: userError } = await supabase
        .from('users')
        .update({
          name: fullName,
          phone: phone,
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating user:', userError);
      }

      console.log('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
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
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={styles.avatarImage}
                    onError={(error) => {
                      console.error('Error loading avatar:', error);
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(fullName || user.name || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Text style={styles.cameraIconText}>📷</Text>
                </View>
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            {!editing ? (
              <React.Fragment>
                <Text style={styles.name}>{fullName || user.name || 'User'}</Text>
                <Text style={styles.email}>{email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                </View>
              </React.Fragment>
            ) : null}
          </View>

          {editing ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Edit Profile</Text>
              
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
                  editable={false}
                  placeholder="Email cannot be changed here"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <Text style={styles.inputHint}>
                  Email is managed by your account settings
                </Text>
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

              {user.role === 'customer' && (
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
                  />
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditing(false);
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
            <React.Fragment>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Account Information</Text>
                  <TouchableOpacity onPress={() => setEditing(true)}>
                    <Text style={styles.editButton}>✏️ Edit</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{fullName || user.name || 'Not set'}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{email || 'Not set'}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{phone || user.phone || 'Not set'}</Text>
                  </View>

                  {user.role === 'customer' && (
                    <React.Fragment>
                      <View style={styles.divider} />
                      
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Delivery Address</Text>
                        <Text style={styles.infoValue}>{deliveryAddress || 'Not set'}</Text>
                      </View>
                    </React.Fragment>
                  )}
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Role</Text>
                    <Text style={styles.infoValue}>{user.role}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Member Since</Text>
                    <Text style={styles.infoValue}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                
                {user.role === 'customer' && (
                  <React.Fragment>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push('/customer/orders')}
                    >
                      <Text style={styles.actionIcon}>📦</Text>
                      <Text style={styles.actionText}>My Orders</Text>
                      <Text style={styles.actionArrow}>›</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push('/customer/home')}
                    >
                      <Text style={styles.actionIcon}>🏪</Text>
                      <Text style={styles.actionText}>Browse Stores</Text>
                      <Text style={styles.actionArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push('/errands/my-errands')}
                    >
                      <Text style={styles.actionIcon}>🏃</Text>
                      <Text style={styles.actionText}>My Errands</Text>
                      <Text style={styles.actionArrow}>›</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                )}
                
                {user.role === 'driver' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/driver/dashboard')}
                  >
                    <Text style={styles.actionIcon}>🚗</Text>
                    <Text style={styles.actionText}>My Deliveries</Text>
                    <Text style={styles.actionArrow}>›</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                {/* Notification Test Button */}
                <TouchableOpacity
                  style={[styles.notificationTestButton]}
                  onPress={() => router.push('/notification-test')}
                >
                  <Text style={styles.notificationTestButtonText}>🔔 Test Notifications</Text>
                </TouchableOpacity>
              </View>
            </React.Fragment>
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
    paddingVertical: theme.spacing.lg,
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
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    marginTop: 20,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
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
    fontWeight: theme.fontWeight.bold,
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
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  name: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: '#111827',
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  email: {
    fontSize: theme.fontSize.md,
    color: '#6B7280',
    marginBottom: theme.spacing.md,
    fontWeight: '500',
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 140, 66, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  roleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: '#FF8C42',
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#111827',
  },
  editButton: {
    fontSize: theme.fontSize.md,
    color: '#FF8C42',
    fontWeight: theme.fontWeight.semibold,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  actionText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  actionArrow: {
    fontSize: 24,
    color: '#FF8C42',
  },
  logoutButton: {
    backgroundColor: theme.colors.danger,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  notificationTestButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationTestButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
