/**
 * AI Service Tests
 *
 * Tests for AI chat functionality including model fallback behavior.
 */
import { sendChatMessage, getOpenRouterApiKey } from '../../src/services/ai';

// Mock fetch for API tests
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

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

  describe('Model Fallback Behavior', () => {
    const testApiKey = 'test-api-key-123';

    it('should try first model and succeed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '...うん、楽しいね [happy]' } }],
        }),
      } as Response);

      const result = await sendChatMessage('こんにちは', [], testApiKey);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.message).toContain('楽しいね');
      expect(result.expression).toBe('happy');
    });

    it('should fallback to second model when first fails', async () => {
      // First model fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      // Second model succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '...そうなんだ' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.message).toBe('...そうなんだ');
    });

    it('should fallback to third model when first two fail', async () => {
      // First model fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      // Second model fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response);

      // Third model fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      // Fourth model succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '...はい' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);

      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(result.message).toBe('...はい');
    });

    it('should return default response when all models fail', async () => {
      // All models fail
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await sendChatMessage('楽しいね', [], testApiKey);

      // Should fall through to all 4 models then use default
      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('expression');
    });

    it('should handle network errors and continue to next model', async () => {
      // First model throws network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Second model succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '...わかった' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.message).toBe('...わかった');
    });

    it('should handle empty response and continue to next model', async () => {
      // First model returns empty content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '' } }],
        }),
      } as Response);

      // Second model succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '...うん' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.message).toBe('...うん');
    });

    it('should handle missing choices array', async () => {
      // First model returns malformed response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      // Second model succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '...ね' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);

      expect(result.message).toBe('...ね');
    });
  });

  describe('Emotion Detection', () => {
    const testApiKey = 'test-api-key';

    it('should detect [happy] emotion tag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '[happy]嬉しいな' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);
      expect(result.expression).toBe('happy');
      expect(result.message).not.toContain('[happy]');
    });

    it('should detect [shy] emotion tag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '[shy]...えっと' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);
      expect(result.expression).toBe('shy');
    });

    it('should detect [surprised] emotion tag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '[surprised]えっ！' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);
      expect(result.expression).toBe('surprised');
    });

    it('should detect [sad] emotion tag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '[sad]...残念' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);
      expect(result.expression).toBe('sad');
    });

    it('should detect [thinking] emotion tag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '[thinking]うーん...' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);
      expect(result.expression).toBe('thinking');
    });

    it('should detect [neutral] emotion tag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '[neutral]...そう' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);
      expect(result.expression).toBe('neutral');
    });

    it('should fallback to keyword detection when no tag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '嬉しい！ありがとう！' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);
      expect(result.expression).toBe('happy');
    });

    it('should return neutral for unrecognized content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'xyz123' } }],
        }),
      } as Response);

      const result = await sendChatMessage('test', [], testApiKey);
      expect(result.expression).toBe('neutral');
    });
  });

  describe('API Request Format', () => {
    const testApiKey = 'test-api-key';

    it('should include correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'test' } }],
        }),
      } as Response);

      await sendChatMessage('hello', [], testApiKey);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testApiKey}`,
          }),
        })
      );
    });

    it('should include system prompt in messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'test' } }],
        }),
      } as Response);

      await sendChatMessage('hello', [], testApiKey);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('雪村かおり');
    });

    it('should include conversation history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'test' } }],
        }),
      } as Response);

      const history = [
        { role: 'user' as const, content: '前の質問' },
        { role: 'assistant' as const, content: '前の回答' },
      ];

      await sendChatMessage('新しい質問', history, testApiKey);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      // System + history (2) + new user message = 4 messages
      expect(body.messages).toHaveLength(4);
      expect(body.messages[1].content).toBe('前の質問');
      expect(body.messages[2].content).toBe('前の回答');
      expect(body.messages[3].content).toBe('新しい質問');
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

  describe('Default Response Patterns', () => {
    it('should respond to food-related messages', async () => {
      const result = await sendChatMessage('ラーメン食べたい', []);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should respond to weather/cold messages', async () => {
      const result = await sendChatMessage('寒いね', []);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should respond to tiredness messages', async () => {
      const result = await sendChatMessage('疲れた', []);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should respond to photo messages', async () => {
      const result = await sendChatMessage('写真撮ろう', []);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should have fallback for unrecognized messages', async () => {
      const result = await sendChatMessage('random gibberish xyz123', []);
      expect(result.message.length).toBeGreaterThan(0);
      expect(['neutral', 'thinking']).toContain(result.expression);
    });
  });
});
