
import { supabase } from '../config/supabase';
import { Message } from '../types/database.types';

export async function getMessages(orderId: string): Promise<Message[]> {
  console.log('Fetching messages for order:', orderId);
  
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(*)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
    
    console.log('Messages fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.error('Exception in getMessages:', error);
    throw error;
  }
}

export async function sendMessage(
  orderId: string,
  senderId: string,
  content: string
): Promise<Message> {
  console.log('Sending message:', { orderId, senderId, contentLength: content.length });
  
  try {
    // Validate inputs
    if (!orderId || !senderId || !content.trim()) {
      throw new Error('Invalid message data: orderId, senderId, and content are required');
    }

    // Insert the message directly (no chats table needed)
    const { data, error } = await supabase
      .from('messages')
      .insert({
        order_id: orderId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select(`
        *,
        sender:users(*)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to send message: No data returned');
    }

    console.log('Message sent successfully:', data.id);

    // Broadcast the message to all subscribers
    try {
      const channel = supabase.channel(`order:${orderId}:messages`);
      await channel.send({
        type: 'broadcast',
        event: 'message_created',
        payload: data,
      });
      console.log('Message broadcast sent successfully');
    } catch (broadcastError) {
      console.error('Error broadcasting message:', broadcastError);
      // Don't throw here, message was saved successfully
    }

    return data;
  } catch (error: any) {
    console.error('Exception in sendMessage:', error);
    throw error;
  }
}
