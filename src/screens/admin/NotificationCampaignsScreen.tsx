
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { theme } from '../../styles/theme';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface NotificationCampaign {
  id: string;
  title: string;
  message: string;
  target_audience: 'all' | 'inactive_users' | 'frequent_buyers' | 'new_users';
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_at: string | null;
  recurrence_pattern: 'daily' | 'every_3_days' | 'weekly' | null;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  sent_count: number;
  created_at: string;
}

export default function NotificationCampaignsScreen() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_audience: 'all' as const,
    schedule_type: 'immediate' as const,
    scheduled_at: '',
    recurrence_pattern: null as 'daily' | 'every_3_days' | 'weekly' | null,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      console.log('📡 Fetching notification campaigns...');
      
      const { data, error } = await supabase
        .from('notification_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching campaigns:', error);
        throw error;
      }

      console.log('✅ Campaigns fetched:', data?.length || 0);
      setCampaigns(data || []);
    } catch (error) {
      console.error('❌ Error in fetchCampaigns:', error);
      Alert.alert('Error', 'Failed to load notification campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 Refreshing campaigns');
    setRefreshing(true);
    fetchCampaigns();
  }, []);

  const handleOpenModal = () => {
    console.log('➕ Opening create campaign modal');
    setFormData({
      title: '',
      message: '',
      target_audience: 'all',
      schedule_type: 'immediate',
      scheduled_at: '',
      recurrence_pattern: null,
    });
    setModalVisible(true);
  };

  const handleCreateCampaign = async () => {
    console.log('💾 Creating notification campaign:', formData);

    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a campaign title');
      return;
    }

    if (!formData.message.trim()) {
      Alert.alert('Validation Error', 'Please enter a notification message');
      return;
    }

    if (formData.schedule_type === 'scheduled' && !formData.scheduled_at) {
      Alert.alert('Validation Error', 'Please select a scheduled date and time');
      return;
    }

    setSaving(true);
    try {
      const campaignData = {
        title: formData.title,
        message: formData.message,
        target_audience: formData.target_audience,
        schedule_type: formData.schedule_type,
        scheduled_at: formData.schedule_type === 'scheduled' ? formData.scheduled_at : null,
        recurrence_pattern: formData.schedule_type === 'recurring' ? formData.recurrence_pattern : null,
        status: formData.schedule_type === 'immediate' ? 'sent' : 'scheduled',
        sent_count: 0,
      };

      console.log('📤 Sending campaign data:', campaignData);

      const { error } = await supabase
        .from('notification_campaigns')
        .insert(campaignData);

      if (error) {
        console.error('❌ Error creating campaign:', error);
        throw error;
      }

      console.log('✅ Campaign created successfully');
      Alert.alert('Success', 'Notification campaign created successfully');
      setModalVisible(false);
      fetchCampaigns();
    } catch (error) {
      console.error('❌ Error in handleCreateCampaign:', error);
      Alert.alert('Error', 'Failed to create notification campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCampaign = async (campaignId: string) => {
    Alert.alert(
      'Cancel Campaign',
      'Are you sure you want to cancel this campaign?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚫 Cancelling campaign:', campaignId);
              
              const { error } = await supabase
                .from('notification_campaigns')
                .update({ status: 'cancelled' })
                .eq('id', campaignId);

              if (error) throw error;

              console.log('✅ Campaign cancelled');
              fetchCampaigns();
            } catch (error) {
              console.error('❌ Error cancelling campaign:', error);
              Alert.alert('Error', 'Failed to cancel campaign');
            }
          },
        },
      ]
    );
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  if (loading) {
    return <LoadingSpinner message="Loading campaigns..." />;
  }

  const userName = user?.name || 'Admin';
  const firstName = getFirstName(userName);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notification Campaigns</Text>
          <Text style={styles.headerSubtitle}>Engage customers with timely reminders</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleOpenModal}>
          <Text style={styles.createButtonText}>+ New Campaign</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {campaigns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>No campaigns yet</Text>
            <Text style={styles.emptySubtext}>Create your first notification campaign</Text>
          </View>
        ) : (
          campaigns.map((campaign) => {
            const statusColor = 
              campaign.status === 'sent' ? '#10B981' :
              campaign.status === 'scheduled' ? '#3B82F6' :
              campaign.status === 'cancelled' ? '#EF4444' : '#6B7280';

            const audienceLabel =
              campaign.target_audience === 'all' ? 'All Users' :
              campaign.target_audience === 'inactive_users' ? 'Inactive Users' :
              campaign.target_audience === 'frequent_buyers' ? 'Frequent Buyers' : 'New Users';

            const scheduleLabel =
              campaign.schedule_type === 'immediate' ? 'Sent Immediately' :
              campaign.schedule_type === 'scheduled' ? `Scheduled: ${new Date(campaign.scheduled_at!).toLocaleString()}` :
              `Recurring: ${campaign.recurrence_pattern}`;

            return (
              <View key={campaign.id} style={styles.campaignCard}>
                <View style={styles.campaignHeader}>
                  <Text style={styles.campaignTitle}>{campaign.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{campaign.status}</Text>
                  </View>
                </View>

                <Text style={styles.campaignMessage}>{campaign.message}</Text>

                <View style={styles.campaignMeta}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>👥</Text>
                    <Text style={styles.metaText}>{audienceLabel}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>📅</Text>
                    <Text style={styles.metaText}>{scheduleLabel}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>📊</Text>
                    <Text style={styles.metaText}>Sent to {campaign.sent_count} users</Text>
                  </View>
                </View>

                {campaign.status === 'scheduled' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelCampaign(campaign.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Campaign</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Campaign Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Campaign</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Campaign Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Weekend Special Reminder"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <Text style={styles.inputLabel}>Notification Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Don't miss our weekend specials! Order now and save."
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Target Audience</Text>
              <View style={styles.optionsGrid}>
                {(['all', 'inactive_users', 'frequent_buyers', 'new_users'] as const).map((audience) => {
                  const isSelected = formData.target_audience === audience;
                  const label =
                    audience === 'all' ? 'All Users' :
                    audience === 'inactive_users' ? 'Inactive Users' :
                    audience === 'frequent_buyers' ? 'Frequent Buyers' : 'New Users';

                  return (
                    <TouchableOpacity
                      key={audience}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, target_audience: audience })}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        isSelected && styles.optionButtonTextSelected,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Schedule Type</Text>
              <View style={styles.optionsGrid}>
                {(['immediate', 'scheduled', 'recurring'] as const).map((type) => {
                  const isSelected = formData.schedule_type === type;
                  const label =
                    type === 'immediate' ? 'Send Now' :
                    type === 'scheduled' ? 'Schedule' : 'Recurring';

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, schedule_type: type })}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        isSelected && styles.optionButtonTextSelected,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {formData.schedule_type === 'recurring' && (
                <>
                  <Text style={styles.inputLabel}>Recurrence Pattern</Text>
                  <View style={styles.optionsGrid}>
                    {(['daily', 'every_3_days', 'weekly'] as const).map((pattern) => {
                      const isSelected = formData.recurrence_pattern === pattern;
                      const label =
                        pattern === 'daily' ? 'Daily' :
                        pattern === 'every_3_days' ? 'Every 3 Days' : 'Weekly';

                      return (
                        <TouchableOpacity
                          key={pattern}
                          style={[
                            styles.optionButton,
                            isSelected && styles.optionButtonSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, recurrence_pattern: pattern })}
                        >
                          <Text style={[
                            styles.optionButtonText,
                            isSelected && styles.optionButtonTextSelected,
                          ]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>💡</Text>
                <Text style={styles.infoText}>
                  {formData.schedule_type === 'immediate' && 'Notification will be sent immediately to all eligible users.'}
                  {formData.schedule_type === 'scheduled' && 'Schedule a one-time notification for a specific date and time.'}
                  {formData.schedule_type === 'recurring' && 'Set up automatic recurring reminders to keep customers engaged.'}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createCampaignButton, saving && styles.createCampaignButtonDisabled]}
                onPress={handleCreateCampaign}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.createCampaignButtonText}>Create Campaign</Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  campaignMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 20,
  },
  campaignMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...Platform.select({
      web: {
        maxHeight: '80%',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primaryLight + '20',
    borderColor: theme.colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionButtonTextSelected: {
    color: theme.colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelModalButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  createCampaignButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCampaignButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  createCampaignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
