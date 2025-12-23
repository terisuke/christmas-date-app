/**
 * Chat Storage Service Tests
 */
import {
  getRecentMessagesForAI,
  ChatMessage,
} from '../../src/services/chatStorage';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  getItem: jest.fn((key: string) => {
    return Promise.resolve(mockStorage[key] || null);
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  }),
}));

// Import after mock is set up
import {
  saveChatHistory,
  loadChatHistory,
  clearChatHistory,
} from '../../src/services/chatStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Chat Storage Service', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    jest.clearAllMocks();
  });

  describe('saveChatHistory', () => {
    it('should save messages to AsyncStorage', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'こんにちは' },
        { role: 'assistant', content: '...うん、こんにちは' },
      ];

      await saveChatHistory(messages);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const stored = mockStorage['kaori_chat_history'];
      expect(stored).not.toBeUndefined();
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].content).toBe('こんにちは');
    });

    it('should add timestamps to messages without them', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'test' },
      ];

      await saveChatHistory(messages);

      const stored = mockStorage['kaori_chat_history'];
      const parsed = JSON.parse(stored);
      expect(parsed[0].timestamp).toBeDefined();
      expect(typeof parsed[0].timestamp).toBe('number');
    });

    it('should limit stored messages to MAX_STORED_MESSAGES', async () => {
      // Create 60 messages (more than MAX_STORED_MESSAGES = 50)
      const messages: ChatMessage[] = Array.from({ length: 60 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `message ${i}`,
      }));

      await saveChatHistory(messages);

      const stored = mockStorage['kaori_chat_history'];
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(50);
      // Should keep the most recent 50 messages
      expect(parsed[0].content).toBe('message 10');
      expect(parsed[49].content).toBe('message 59');
    });
  });

  describe('loadChatHistory', () => {
    it('should return empty array when no history exists', async () => {
      const result = await loadChatHistory();
      expect(result).toEqual([]);
    });

    it('should load saved messages', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'test message', timestamp: 1234567890 },
      ];
      mockStorage['kaori_chat_history'] = JSON.stringify(messages);

      const result = await loadChatHistory();

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('test message');
      expect(result[0].timestamp).toBe(1234567890);
    });

    it('should return empty array on parse error', async () => {
      mockStorage['kaori_chat_history'] = 'invalid json';

      const result = await loadChatHistory();

      expect(result).toEqual([]);
    });
  });

  describe('clearChatHistory', () => {
    it('should remove chat history from storage', async () => {
      mockStorage['kaori_chat_history'] = JSON.stringify([{ role: 'user', content: 'test' }]);

      await clearChatHistory();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('kaori_chat_history');
    });
  });

  describe('getRecentMessagesForAI', () => {
    it('should return last N messages without timestamps', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'msg1', timestamp: 1 },
        { role: 'assistant', content: 'msg2', timestamp: 2 },
        { role: 'user', content: 'msg3', timestamp: 3 },
        { role: 'assistant', content: 'msg4', timestamp: 4 },
        { role: 'user', content: 'msg5', timestamp: 5 },
      ];

      const result = getRecentMessagesForAI(messages, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ role: 'user', content: 'msg3' });
      expect(result[1]).toEqual({ role: 'assistant', content: 'msg4' });
      expect(result[2]).toEqual({ role: 'user', content: 'msg5' });
      // Should not have timestamp property
      expect((result[0] as any).timestamp).toBeUndefined();
    });

    it('should return all messages if count exceeds length', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'msg1' },
        { role: 'assistant', content: 'msg2' },
      ];

      const result = getRecentMessagesForAI(messages, 10);

      expect(result).toHaveLength(2);
    });

    it('should default to 10 messages', () => {
      const messages: ChatMessage[] = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `msg${i}`,
      }));

      const result = getRecentMessagesForAI(messages);

      expect(result).toHaveLength(10);
    });
  });
});
