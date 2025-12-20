import { sendChatMessage, getOpenRouterApiKey } from '../../src/services/ai';

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendChatMessage', () => {
    it('should return default response when no API key is provided', async () => {
      const result = await sendChatMessage('こんにちは', []);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('expression');
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should detect happy emotion from greeting keywords', async () => {
      const result = await sendChatMessage('おはよう', []);

      expect(result.expression).toMatch(/neutral|shy/);
    });

    it('should return shy expression for compliments', async () => {
      const result = await sendChatMessage('かわいいね', []);

      expect(result.expression).toBe('shy');
    });

    it('should return surprised expression for confession', async () => {
      const result = await sendChatMessage('好きだよ', []);

      expect(result.expression).toMatch(/surprised|shy/);
    });

    it('should return happy expression for fun topics', async () => {
      const result = await sendChatMessage('楽しいね', []);

      expect(result.expression).toBe('happy');
    });

    it('should return thinking expression for ambiguous input', async () => {
      const result = await sendChatMessage('うーん', []);

      expect(['neutral', 'thinking']).toContain(result.expression);
    });

    it('should handle conversation history', async () => {
      const history = [
        { role: 'user' as const, content: '福岡どう？' },
        { role: 'assistant' as const, content: '...いいところだね' },
      ];

      const result = await sendChatMessage('もっと教えて', history);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('expression');
    });
  });

  describe('getOpenRouterApiKey', () => {
    it('should return undefined when env var is not set', () => {
      const originalEnv = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      delete process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

      const result = getOpenRouterApiKey();

      expect(result).toBeUndefined();

      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY = originalEnv;
    });

    it('should return API key when env var is set', () => {
      const testKey = 'test-api-key';
      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY = testKey;

      const result = getOpenRouterApiKey();

      expect(result).toBe(testKey);

      delete process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    });
  });
});
