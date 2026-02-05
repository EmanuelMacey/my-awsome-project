
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Message } from '../../types/database.types';
import { getMessages, sendMessage } from '../../api/messages';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { supabase } from '../../config/supabase';
import { theme } from '../../styles/theme';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function ChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      console.log('Fetching messages for order:', orderId);
      const data = await getMessages(orderId);
      console.log('Messages fetched successfully:', data.length);
      setMessages(data);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      console.error('No orderId provided');
      Alert.alert('Error', 'Invalid order ID');
      router.back();
      return;
    }

    fetchMessages();

    // Setup realtime subscription
    const setupRealtimeSubscription = async () => {
      try {
        // Clean up existing channel if any
        if (channelRef.current) {
          console.log('Removing existing channel');
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        console.log('Setting up realtime subscription for order:', orderId);
        const channel = supabase.channel(`order:${orderId}:messages`, {
          config: {
            broadcast: { self: true },
          },
        });

        channelRef.current = channel;

        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `order_id=eq.${orderId}`,
            },
            (payload) => {
              console.log('New message received via postgres_changes:', payload);
              // Refetch messages to get complete data with sender info
              fetchMessages();
            }
          )
          .on('broadcast', { event: 'message_created' }, (payload) => {
            console.log('New message received via broadcast:', payload);
            fetchMessages();
          })
          .subscribe((status, err) => {
            console.log('Subscription status:', status);
            if (err) {
              console.error('Subscription error:', err);
            }
            switch (status) {
              case 'SUBSCRIBED':
                console.log('Successfully subscribed to messages channel');
                break;
              case 'CHANNEL_ERROR':
                console.error('Channel error:', err);
                break;
              case 'TIMED_OUT':
                console.error('Subscription timed out');
                break;
              case 'CLOSED':
                console.log('Channel closed');
                break;
            }
          });
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up: Unsubscribing from messages channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [orderId, fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim()) {
      console.log('Empty message, not sending');
      return;
    }

    if (!user) {
      console.error('No user found');
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    if (!orderId) {
      console.error('No orderId found');
      Alert.alert('Error', 'Invalid order ID');
      return;
    }

    const messageText = newMessage.trim();
    console.log('Attempting to send message:', messageText);
    
    setSending(true);
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      console.log('Calling sendMessage API...');
      const sentMessage = await sendMessage(orderId, user.id, messageText);
      console.log('Message sent successfully:', sentMessage);
      
      // Optimistically add the message to the list
      setMessages(prev => [...prev, sentMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Restore message on error
      setNewMessage(messageText);
      
      // Show user-friendly error message
      Alert.alert(
        'Failed to Send',
        'Could not send your message. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading chat..." />;
  }

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === user?.id;
    const showAvatar = index === 0 || messages[index - 1]?.sender_id !== item.sender_id;
    const showTimestamp = index === messages.length - 1 || 
      messages[index + 1]?.sender_id !== item.sender_id ||
      (new Date(messages[index + 1]?.created_at).getTime() - new Date(item.created_at).getTime()) > 300000; // 5 minutes

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isMyMessage && showAvatar && (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.sender?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        {!isMyMessage && !showAvatar && <View style={styles.avatarSpacer} />}
        
        <View style={styles.messageContent}>
          {!isMyMessage && showAvatar && (
            <Text style={styles.senderName}>{item.sender?.name}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
          </View>
          {showTimestamp && (
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
              ]}
            >
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>💬</Text>
      <Text style={styles.emptyStateTitle}>No messages yet</Text>
      <Text style={styles.emptyStateText}>
        Start the conversation by sending a message
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Order Chat</Text>
          <Text style={styles.headerSubtitle}>Order #{orderId.slice(0, 8)}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.messagesListEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* Fixed input container */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: 28,
    color: theme.colors.primary,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  messagesList: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  avatarSpacer: {
    width: 36,
    marginRight: theme.spacing.sm,
  },
  messageContent: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  messageBubble: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  myMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: theme.fontSize.md,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  messageTime: {
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
  },
  myMessageTime: {
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: theme.colors.textSecondary,
    textAlign: 'left',
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingBottom: Platform.OS === 'android' ? theme.spacing.lg : theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    maxHeight: 100,
    paddingVertical: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.bold,
  },
});
