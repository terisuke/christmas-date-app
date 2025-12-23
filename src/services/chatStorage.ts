/**
 * Chat Storage Service
 *
 * Persists conversation history to AsyncStorage for continuity across sessions.
 * Limits stored messages to prevent excessive storage use.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_HISTORY_KEY = 'kaori_chat_history';
const MAX_STORED_MESSAGES = 50; // Keep last 50 messages for context

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

/**
 * Save conversation history to AsyncStorage
 */
export async function saveChatHistory(messages: ChatMessage[]): Promise<void> {
  try {
    // Add timestamps if not present
    const timestampedMessages = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp || Date.now(),
    }));

    // Limit to last MAX_STORED_MESSAGES
    const limitedMessages = timestampedMessages.slice(-MAX_STORED_MESSAGES);

    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(limitedMessages));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * Load conversation history from AsyncStorage
 */
export async function loadChatHistory(): Promise<ChatMessage[]> {
  try {
    const stored = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return [];

    const messages: ChatMessage[] = JSON.parse(stored);
    return messages;
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
}

/**
 * Clear conversation history
 */
export async function clearChatHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
}

/**
 * Get recent messages for AI context (without timestamps)
 */
export function getRecentMessagesForAI(
  messages: ChatMessage[],
  count: number = 10
): { role: 'user' | 'assistant'; content: string }[] {
  return messages.slice(-count).map(({ role, content }) => ({ role, content }));
}
