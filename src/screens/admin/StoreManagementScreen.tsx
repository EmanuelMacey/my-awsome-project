
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { theme } from '../../styles/theme';
import * as ImagePicker from 'expo-image-picker';
import { Store } from '../../types/database.types';

// Predefined store images mapping
const STORE_IMAGES = {
  'Exclusive Eggball': require('../../../assets/images/ef8b9968-446a-4152-af30-7f7953549bae.jpeg'),
  'Gangbao': require('../../../assets/images/af0a50fd-d731-4f2a-a05b-f0ecb62c22b3.jpeg'),
  'Golden Pagoda': require('../../../assets/images/9dec66dc-3a70-423c-8bc2-e0e009058c9a.png'),
  'KFC': require('../../../assets/images/fd07bf72-13e7-42a7-99f2-dd135e854e52.jpeg'),
  'Fireside Grill & Chill': require('../../../assets/images/3c02984f-dbea-4344-82ac-44160f61b176.jpeg'),
};

// Evaluate Platform.OS outside of component to avoid issues
const isWeb = Platform.OS === 'web';

export default function StoreManagementScreen() {
  const { user, signOut } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    logo: '',
  });

  const fetchStores = useCallback(async () => {
    try {
      console.log('📥 Fetching stores...');
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching stores:', error);
        throw error;
      }
      
      console.log('✅ Stores fetched:', data?.length || 0);
      setStores(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching stores:', error);
      Alert.alert('Error', 'Failed to fetch stores: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStores();
  };

  const handlePickImage = async () => {
    try {
      console.log('📸 Requesting image picker permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
        return;
      }

      console.log('📸 Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('✅ Image selected:', result.assets[0].uri);
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      console.log('📤 Starting image upload...');
      console.log('📍 Image URI:', uri);

      // Convert URI to blob for web, or use fetch for native
      let blob: Blob;
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        blob = await response.blob();
      } else {
        // For native platforms, we need to read the file
        const response = await fetch(uri);
        blob = await response.blob();
      }

      console.log('✅ Blob created, size:', blob.size);

      // Generate unique filename
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `store-${Date.now()}.${fileExt}`;
      const filePath = `store-logos/${fileName}`;

      console.log('📤 Uploading to Supabase Storage...');
      console.log('📁 File path:', filePath);

      // Check if storage bucket exists and is accessible
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Error listing buckets:', bucketsError);
        throw new Error('Storage not accessible: ' + bucketsError.message);
      }

      console.log('📦 Available buckets:', buckets?.map(b => b.name).join(', '));

      // Try to upload to 'images' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: false,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        
        // If bucket doesn't exist, try to create it
        if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
          Alert.alert(
            'Storage Setup Required',
            'The storage bucket needs to be created in Supabase. Please:\n\n' +
            '1. Go to your Supabase dashboard\n' +
            '2. Navigate to Storage\n' +
            '3. Create a public bucket named "images"\n' +
            '4. Set it to public access\n\n' +
            'For now, you can use a direct image URL instead.'
          );
          
          // Allow user to enter URL manually
          Alert.prompt(
            'Enter Image URL',
            'You can paste an image URL directly:',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Use URL',
                onPress: (url) => {
                  if (url) {
                    setFormData({ ...formData, logo: url });
                    Alert.alert('Success', 'Image URL set successfully');
                  }
                },
              },
            ],
            'plain-text'
          );
          
          return;
        }
        
        throw uploadError;
      }

      console.log('✅ Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('✅ Public URL:', publicUrl);

      setFormData({ ...formData, logo: publicUrl });
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload image: ' + error.message + '\n\nYou can try:\n' +
        '1. Check your internet connection\n' +
        '2. Use a smaller image\n' +
        '3. Enter an image URL directly'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUseLocalImage = (storeName: string) => {
    // Check if we have a predefined image for this store
    const imageKey = Object.keys(STORE_IMAGES).find(
      key => key.toLowerCase() === storeName.toLowerCase()
    );

    if (imageKey) {
      // For local images, we'll use the asset path
      // In production, these should be uploaded to Supabase Storage
      const localImagePath = `../../../assets/images/${
        storeName === 'Exclusive Eggball' ? 'ef8b9968-446a-4152-af30-7f7953549bae.jpeg' :
        storeName === 'Gangbao' ? 'af0a50fd-d731-4f2a-a05b-f0ecb62c22b3.jpeg' :
        storeName === 'Golden Pagoda' ? '9dec66dc-3a70-423c-8bc2-e0e009058c9a.png' :
        storeName === 'KFC' ? 'fd07bf72-13e7-42a7-99f2-dd135e854e52.jpeg' :
        storeName === 'Fireside Grill & Chill' ? '3c02984f-dbea-4344-82ac-44160f61b176.jpeg' :
        ''
      }`;
      
      Alert.alert(
        'Use Predefined Image',
        `Would you like to use the predefined image for ${storeName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => {
              setFormData({ ...formData, logo: localImagePath });
              Alert.alert('Success', 'Predefined image selected!');
            },
          },
        ]
      );
    }
  };

  const handleOpenModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        description: store.description || '',
        category: store.category,
        address: store.address,
        phone: store.phone || '',
        email: store.email || '',
        logo: store.logo || '',
      });
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        address: '',
        phone: '',
        email: '',
        logo: '',
      });
    }
    setModalVisible(true);
  };

  const handleSaveStore = async () => {
    try {
      if (!formData.name || !formData.category || !formData.address) {
        Alert.alert('Error', 'Please fill in all required fields (Name, Category, Address)');
        return;
      }

      console.log('💾 Saving store...', formData);

      if (editingStore) {
        // Update existing store
        const { error } = await supabase
          .from('stores')
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            logo: formData.logo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingStore.id);

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        
        console.log('✅ Store updated successfully');
        Alert.alert('Success', 'Store updated successfully!');
      } else {
        // Create new store
        const { error } = await supabase
          .from('stores')
          .insert({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            logo: formData.logo,
          });

        if (error) {
          console.error('❌ Insert error:', error);
          throw error;
        }
        
        console.log('✅ Store created successfully');
        Alert.alert('Success', 'Store created successfully!');
      }

      setModalVisible(false);
      fetchStores();
    } catch (error: any) {
      console.error('❌ Error saving store:', error);
      Alert.alert('Error', 'Failed to save store: ' + error.message);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    Alert.alert(
      'Delete Store',
      'Are you sure you want to delete this store? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting store:', storeId);
              
              const { error } = await supabase
                .from('stores')
                .delete()
                .eq('id', storeId);

              if (error) {
                console.error('❌ Delete error:', error);
                throw error;
              }
              
              console.log('✅ Store deleted successfully');
              Alert.alert('Success', 'Store deleted successfully');
              fetchStores();
            } catch (error: any) {
              console.error('❌ Error deleting store:', error);
              Alert.alert('Error', 'Failed to delete store: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/landing');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading stores..." />;
  }

  const getFirstName = (fullName: string) => {
    if (!fullName) return 'Admin';
    return fullName.split(' ')[0];
  };

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation (Web Only) */}
      {isWeb && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarLogo}>🚚</Text>
            <Text style={styles.sidebarTitle}>ErrandRunners</Text>
            <Text style={styles.sidebarSubtitle}>Admin Panel</Text>
          </View>

          <View style={styles.sidebarMenu}>
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              onPress={() => router.push('/admin/dashboard')}
            >
              <Text style={styles.sidebarMenuIcon}>📊</Text>
              <Text style={styles.sidebarMenuText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarMenuItem} onPress={() => {}}>
              <Text style={styles.sidebarMenuIcon}>🏪</Text>
              <Text style={styles.sidebarMenuText}>Stores</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              onPress={() => router.push('/admin/user-management')}
            >
              <Text style={styles.sidebarMenuIcon}>👥</Text>
              <Text style={styles.sidebarMenuText}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              onPress={() => router.push('/admin/invoices')}
            >
              <Text style={styles.sidebarMenuIcon}>📄</Text>
              <Text style={styles.sidebarMenuText}>Invoices</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.sidebarUser}>
              <Text style={styles.sidebarUserIcon}>👤</Text>
              <View>
                <Text style={styles.sidebarUserName}>
                  {user ? getFirstName(user.name) : 'Admin'}
                </Text>
                <Text style={styles.sidebarUserRole}>Administrator</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout}>
              <Text style={styles.sidebarLogoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content Area */}
      <View style={[styles.mainContent, isWeb && styles.mainContentWeb]}>
        {/* Mobile Header (Hidden on Web) */}
        {!isWeb && (
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Store Management</Text>
              <Text style={styles.headerSubtitle}>Manage store images and details</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={styles.webHeader}>
            <Text style={styles.webHeaderTitle}>Store Management</Text>
            <Text style={styles.webHeaderSubtitle}>
              Manage store images and details
            </Text>
          </View>
        )}

        {/* Info Banner */}
        <View style={styles.infoBanner}>
        <Text style={styles.infoBannerIcon}>📸</Text>
        <View style={styles.infoBannerContent}>
          <Text style={styles.infoBannerTitle}>Upload Store Images Here</Text>
          <Text style={styles.infoBannerText}>
            Click on any store to edit and upload/update its logo image. You can upload from your device or enter an image URL.
          </Text>
        </View>
      </View>

        {/* Add Store Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <Text style={styles.addButtonText}>+ Add New Store</Text>
        </TouchableOpacity>

        {/* Stores List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {stores.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🏪</Text>
            <Text style={styles.emptyStateText}>No stores yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first store to get started</Text>
          </View>
        ) : (
          stores.map((store) => (
            <View key={store.id} style={styles.storeCard}>
              <View style={styles.storeHeader}>
                {store.logo ? (
                  <Image 
                    source={{ uri: store.logo }} 
                    style={styles.storeLogo}
                    onError={(e) => {
                      console.log('❌ Image load error for store:', store.name, e.nativeEvent.error);
                    }}
                  />
                ) : (
                  <View style={styles.storeLogoPlaceholder}>
                    <Text style={styles.storeLogoPlaceholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeCategory}>{store.category}</Text>
                  <Text style={styles.storeAddress} numberOfLines={2}>{store.address}</Text>
                </View>
              </View>

              <View style={styles.storeActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleOpenModal(store)}
                >
                  <Text style={styles.actionButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteStore(store.id)}
                >
                  <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Edit/Add Store Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingStore ? 'Edit Store' : 'Add New Store'}
              </Text>

              {/* Logo Upload */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Store Logo</Text>
                
                {/* Image Preview */}
                {formData.logo ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: formData.logo }} 
                      style={styles.imagePreview}
                      onError={(e) => {
                        console.log('❌ Preview image error:', e.nativeEvent.error);
                        Alert.alert('Error', 'Failed to load image preview');
                      }}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setFormData({ ...formData, logo: '' })}
                    >
                      <Text style={styles.removeImageText}>✕ Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={handlePickImage}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.uploadingText}>Uploading...</Text>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Text style={styles.uploadPlaceholderIcon}>📷</Text>
                        <Text style={styles.uploadPlaceholderText}>Tap to Upload Image</Text>
                        <Text style={styles.uploadPlaceholderSubtext}>or enter URL below</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {/* Manual URL Input */}
                <TextInput
                  style={[styles.input, styles.urlInput]}
                  value={formData.logo}
                  onChangeText={(text) => setFormData({ ...formData, logo: text })}
                  placeholder="Or paste image URL here"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Store Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter store name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                  placeholder="e.g., Fast Food, Restaurant, Cafe"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter store description"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Address */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter store address"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email address"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveStore}
                >
                  <Text style={styles.saveButtonText}>💾 Save Store</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(isWeb && {
      flexDirection: 'row',
      width: '100%',
    }),
  },
  sidebar: {
    width: 260,
    backgroundColor: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#334155',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sidebarLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  sidebarMenu: {
    flex: 1,
    paddingVertical: 16,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  sidebarMenuIcon: {
    fontSize: 20,
  },
  sidebarMenuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sidebarUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sidebarUserIcon: {
    fontSize: 24,
  },
  sidebarUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sidebarUserRole: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sidebarLogout: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sidebarLogoutText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  mainContentWeb: {
    backgroundColor: '#F8FAFC',
  },
  webHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  webHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  webHeaderSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#9C27B0',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: isWeb ? 20 : theme.spacing.md,
    margin: isWeb ? 32 : theme.spacing.md,
    marginTop: isWeb ? 0 : theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoBannerIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#1976D2',
    marginBottom: theme.spacing.xs,
  },
  infoBannerText: {
    fontSize: theme.fontSize.sm,
    color: '#1565C0',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: isWeb ? 32 : theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  content: {
    flex: 1,
    backgroundColor: isWeb ? '#F8FAFC' : theme.colors.background,
  },
  contentContainer: {
    padding: isWeb ? 32 : theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyStateText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  storeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  storeHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  storeLogo: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.border,
  },
  storeLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  storeLogoPlaceholderText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  storeCategory: {
    fontSize: theme.fontSize.sm,
    color: '#FF9800',
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  storeAddress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  storeActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '90%',
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  urlInput: {
    marginTop: theme.spacing.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  imageUploadButton: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    backgroundColor: theme.colors.background,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholderIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  uploadPlaceholderText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  uploadPlaceholderSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  uploadingContainer: {
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  removeImageButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.border,
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
    fontWeight: theme.fontWeight.semibold,
  },
});
