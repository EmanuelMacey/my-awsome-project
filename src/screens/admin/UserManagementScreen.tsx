
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
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../styles/theme';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'customer' | 'driver' | 'admin';
  is_approved: boolean;
  created_at: string;
}

interface AdminPermissions {
  is_owner: boolean;
  can_manage_admins: boolean;
  can_manage_drivers: boolean;
}

// Evaluate Platform.OS outside of component to avoid issues
const isWeb = Platform.OS === 'web';

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'customer' | 'driver' | 'admin'>('all');
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'driver' | 'admin'>('driver');
  const [addingUser, setAddingUser] = useState(false);
  const { user } = useAuth();

  const fetchPermissions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('is_owner, can_manage_admins, can_manage_drivers')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching permissions:', error);
        // If no permissions found, allow access for all admins
        setPermissions({
          is_owner: false,
          can_manage_admins: true,
          can_manage_drivers: true,
        });
        return;
      }

      setPermissions(data);
    } catch (error) {
      console.error('Error in fetchPermissions:', error);
      // Default to allowing access for admins
      setPermissions({
        is_owner: false,
        can_manage_admins: true,
        can_manage_drivers: true,
      });
    }
  }, [user]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users');
        return;
      }

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
    fetchUsers();
  }, [fetchPermissions, fetchUsers]);

  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, filterRole, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setAddingUser(true);
    try {
      console.log('Creating user with email:', newUserEmail, 'role:', newUserRole);
      
      // Generate a random temporary password
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

      // Use auth.signUp to create the user
      // This is the proper way to create users in Supabase
      console.log('Creating user via auth.signUp');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: tempPassword,
        options: {
          data: {
            name: newUserName,
            phone: newUserPhone,
            role: newUserRole,
          },
        },
      });

      if (authError) {
        console.error('Error creating user via auth.signUp:', authError);
        Alert.alert('Error', authError.message || 'Failed to create user. Please check if the email is already registered.');
        setAddingUser(false);
        return;
      }

      console.log('User created via auth.signUp:', authData.user?.id);

      // Update the user role and approval status in the users table
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            role: newUserRole,
            is_approved: true,
            name: newUserName,
            phone: newUserPhone || null,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error updating user role:', updateError);
        }

        // If adding an admin, create admin permissions
        if (newUserRole === 'admin') {
          const { error: permError } = await supabase
            .from('admin_permissions')
            .insert({
              user_id: authData.user.id,
              is_owner: false,
              can_manage_admins: false,
              can_manage_drivers: true,
            });

          if (permError) {
            console.error('Error creating admin permissions:', permError);
          }
        }
      }

      Alert.alert(
        'Success',
        `${newUserRole === 'admin' ? 'Admin' : 'Driver'} added successfully!\n\nEmail: ${newUserEmail}\nTemporary Password: ${tempPassword}\n\nPlease share these credentials with the user. They should change their password after first login.`
      );

      // Reset form
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPhone('');
      setNewUserRole('driver');
      setShowAddUserModal(false);

      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      console.error('Error in handleAddUser:', error);
      Alert.alert('Error', error.message || 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleUpdateRole = async (userId: string, currentRole: string, userName: string) => {
    const roles = ['customer', 'driver', 'admin'];
    const roleOptions = roles.map(role => ({
      text: role.charAt(0).toUpperCase() + role.slice(1),
      onPress: () => confirmRoleUpdate(userId, role, userName),
    }));

    Alert.alert(
      'Update Role',
      `Select new role for ${userName}:`,
      [
        ...roleOptions,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const confirmRoleUpdate = async (userId: string, newRole: string, userName: string) => {
    Alert.alert(
      'Confirm Role Update',
      `Are you sure you want to change ${userName}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('users')
                .update({ role: newRole, updated_at: new Date().toISOString() })
                .eq('id', userId);

              if (error) {
                console.error('Error updating role:', error);
                Alert.alert('Error', error.message || 'Failed to update user role');
                return;
              }

              // If promoting to admin, create admin permissions
              if (newRole === 'admin') {
                const { error: permError } = await supabase
                  .from('admin_permissions')
                  .upsert({
                    user_id: userId,
                    is_owner: false,
                    can_manage_admins: false,
                    can_manage_drivers: true,
                  });

                if (permError) {
                  console.error('Error creating admin permissions:', permError);
                }
              }

              Alert.alert('Success', `${userName}'s role has been updated to ${newRole}`);
              fetchUsers();
            } catch (error: any) {
              console.error('Error in confirmRoleUpdate:', error);
              Alert.alert('Error', error.message || 'Failed to update user role');
            }
          },
        },
      ]
    );
  };

  const handleApproveDriver = async (userId: string, userName: string) => {
    Alert.alert(
      'Approve Driver',
      `Approve ${userName} as a driver?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('users')
                .update({ is_approved: true, updated_at: new Date().toISOString() })
                .eq('id', userId);

              if (error) {
                console.error('Error approving driver:', error);
                Alert.alert('Error', 'Failed to approve driver');
                return;
              }

              Alert.alert('Success', `${userName} has been approved as a driver`);
              fetchUsers();
            } catch (error) {
              console.error('Error in handleApproveDriver:', error);
              Alert.alert('Error', 'Failed to approve driver');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from users table (auth cascade will handle auth.users)
              const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

              if (error) {
                console.error('Error deleting user:', error);
                Alert.alert('Error', 'Failed to delete user');
                return;
              }

              Alert.alert('Success', `${userName} has been deleted`);
              fetchUsers();
            } catch (error) {
              console.error('Error in handleDeleteUser:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#FF6B6B';
      case 'driver':
        return '#4ECDC4';
      case 'customer':
        return '#95E1D3';
      default:
        return theme.colors.textSecondary;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
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
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              onPress={() => router.push('/admin/store-management')}
            >
              <Text style={styles.sidebarMenuIcon}>🏪</Text>
              <Text style={styles.sidebarMenuText}>Stores</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarMenuItem} onPress={() => {}}>
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
            <TouchableOpacity style={styles.sidebarLogout} onPress={() => router.push('/admin/dashboard')}>
              <Text style={styles.sidebarLogoutText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content Area */}
      <View style={[styles.mainContent, isWeb && styles.mainContentWeb]}>
        {/* Mobile Header (Hidden on Web) */}
        {!isWeb && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleRow}>
              <Text style={styles.title}>User Management</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddUserModal(true)}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Manage admins and drivers</Text>
          </View>
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={styles.webHeader}>
            <View style={styles.webHeaderTop}>
              <Text style={styles.webHeaderTitle}>User Management</Text>
              <TouchableOpacity
                style={styles.webAddButton}
                onPress={() => setShowAddUserModal(true)}
              >
                <Text style={styles.webAddButtonText}>+ Add User</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.webHeaderSubtitle}>
              Manage admins and drivers
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

        {/* Role Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
        {['all', 'customer', 'driver', 'admin'].map(role => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterButton,
              filterRole === role && styles.filterButtonActive,
            ]}
            onPress={() => setFilterRole(role as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterRole === role && styles.filterButtonTextActive,
              ]}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

        {/* Users List */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map(userItem => (
            <View key={userItem.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userItem.name}</Text>
                <Text style={styles.userEmail}>{userItem.email}</Text>
                {userItem.phone && (
                  <Text style={styles.userPhone}>{userItem.phone}</Text>
                )}
                <View style={styles.userMeta}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getRoleColor(userItem.role) },
                    ]}
                  >
                    <Text style={styles.roleBadgeText}>
                      {userItem.role.toUpperCase()}
                    </Text>
                  </View>
                  {userItem.role === 'driver' && !userItem.is_approved && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>PENDING</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleUpdateRole(userItem.id, userItem.role, userItem.name)
                  }
                >
                  <Text style={styles.actionButtonText}>Change Role</Text>
                </TouchableOpacity>

                {userItem.role === 'driver' && !userItem.is_approved && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApproveDriver(userItem.id, userItem.name)}
                  >
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                )}

                {userItem.id !== user?.id && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteUser(userItem.id, userItem.name)}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        </ScrollView>
      </View>

      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>

            <Text style={styles.label}>Role</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleSelectorButton,
                  newUserRole === 'driver' && styles.roleSelectorButtonActive,
                ]}
                onPress={() => setNewUserRole('driver')}
              >
                <Text
                  style={[
                    styles.roleSelectorText,
                    newUserRole === 'driver' && styles.roleSelectorTextActive,
                  ]}
                >
                  Driver
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleSelectorButton,
                  newUserRole === 'admin' && styles.roleSelectorButtonActive,
                ]}
                onPress={() => setNewUserRole('admin')}
              >
                <Text
                  style={[
                    styles.roleSelectorText,
                    newUserRole === 'admin' && styles.roleSelectorTextActive,
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter full name"
              placeholderTextColor={theme.colors.textSecondary}
              value={newUserName}
              onChangeText={setNewUserName}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter email address"
              placeholderTextColor={theme.colors.textSecondary}
              value={newUserEmail}
              onChangeText={setNewUserEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter phone number"
              placeholderTextColor={theme.colors.textSecondary}
              value={newUserPhone}
              onChangeText={setNewUserPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddUserModal(false)}
                disabled={addingUser}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddUser}
                disabled={addingUser}
              >
                {addingUser ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    Add User
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  webHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  webHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  webHeaderSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  webAddButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  webAddButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginBottom: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  searchContainer: {
    padding: isWeb ? 32 : theme.spacing.md,
    paddingTop: isWeb ? 0 : theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: isWeb ? '#FFFFFF' : theme.colors.surface,
    ...(isWeb && {
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    }),
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterContainer: {
    backgroundColor: isWeb ? '#FFFFFF' : theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: isWeb ? '#E2E8F0' : theme.colors.border,
  },
  filterContent: {
    paddingHorizontal: isWeb ? 32 : theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: isWeb ? 32 : theme.spacing.md,
    backgroundColor: isWeb ? '#F8FAFC' : theme.colors.background,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userInfo: {
    marginBottom: theme.spacing.md,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  userPhone: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  userMeta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  roleBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pendingBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#FFA500',
  },
  pendingBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4ECDC4',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  roleSelectorButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  roleSelectorButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  roleSelectorText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  roleSelectorTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
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
  modalButtonCancel: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
