import { KAORI_SYSTEM_PROMPT } from '../constants/character';
import { KaoriExpression } from '../components/CharacterDisplay';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model priority list (fallback order) - Updated Dec 2025
const MODELS = [
  'google/gemini-2.5-flash',      // Stable version
  'x-ai/grok-4-fast',             // Updated to Grok 4
  'openai/gpt-4.1-nano',          // Fallback
];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  message: string;
  expression: KaoriExpression;
}

// Emotion detection from response
const EMOTION_TAGS: Record<string, KaoriExpression> = {
  '[happy]': 'happy',
  '[shy]': 'shy',
  '[surprised]': 'surprised',
  '[sad]': 'sad',
  '[thinking]': 'thinking',
  '[neutral]': 'neutral',
};

const EMOTION_KEYWORDS: Record<string, KaoriExpression> = {
  '嬉しい': 'happy',
  'ありがと': 'happy',
  '楽しい': 'happy',
  '照れ': 'shy',
  '恥ずかし': 'shy',
  '...あっ': 'shy',
  'えっ': 'surprised',
  'びっくり': 'surprised',
  '!?': 'surprised',
  '残念': 'sad',
  '寂しい': 'sad',
  'ごめん': 'sad',
  'うーん': 'thinking',
  'どうしよう': 'thinking',
  '...かな': 'thinking',
};

function detectEmotion(text: string): KaoriExpression {
  // First check for explicit emotion tags
  for (const [tag, emotion] of Object.entries(EMOTION_TAGS)) {
    if (text.includes(tag)) {
      return emotion;
    }
  }

  // Fallback to keyword detection
  for (const [keyword, emotion] of Object.entries(EMOTION_KEYWORDS)) {
    if (text.includes(keyword)) {
      return emotion;
    }
  }

  return 'neutral';
}

function removeEmotionTags(text: string): string {
  let result = text;
  for (const tag of Object.keys(EMOTION_TAGS)) {
    result = result.replace(tag, '');
  }
  return result.trim();
}

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  apiKey?: string
): Promise<AIResponse> {
  // If no API key, return a default response
  if (!apiKey) {
    return getDefaultResponse(userMessage);
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: KAORI_SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  // Try each model in order
  for (const model of MODELS) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://christmas-date-app.local',
          'X-Title': 'Christmas Date App',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 150,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        console.warn(`Model ${model} failed with status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || '';

      if (assistantMessage) {
        const expression = detectEmotion(assistantMessage);
        const cleanMessage = removeEmotionTags(assistantMessage);
        return { message: cleanMessage, expression };
      }
    } catch (error) {
      console.warn(`Model ${model} error:`, error);
      continue;
    }
  }

  // If all models fail, return default response
  return getDefaultResponse(userMessage);
}

// Default responses when AI is unavailable
const DEFAULT_RESPONSES: { pattern: RegExp; responses: { message: string; expression: KaoriExpression }[] }[] = [
  {
    pattern: /おはよう|こんにちは|こんばんは|やあ|ハロー/,
    responses: [
      { message: '...おはよう', expression: 'neutral' },
      { message: '...うん、こんにちは', expression: 'shy' },
    ],
  },
  {
    pattern: /かわいい|きれい|素敵/,
    responses: [
      { message: '...えっ、そ、そんな...', expression: 'shy' },
      { message: '...ありがと...', expression: 'shy' },
    ],
  },
  {
    pattern: /好き|大好き/,
    responses: [
      { message: '...えっ...', expression: 'surprised' },
      { message: '...わたしも...その...', expression: 'shy' },
    ],
  },
  {
    pattern: /寒い|さむい/,
    responses: [
      { message: '...うん、ちょっと', expression: 'neutral' },
      { message: '...大丈夫...北海道より暖かいから', expression: 'neutral' },
    ],
  },
  {
    pattern: /楽しい|たのしい/,
    responses: [
      { message: '...うん、なまら楽しい...あっ', expression: 'happy' },
      { message: '...わたしも...', expression: 'happy' },
    ],
  },
  {
    pattern: /お腹|腹|ラーメン|ごはん|食べ/,
    responses: [
      { message: '...うん、ちょっとお腹すいた...かも', expression: 'neutral' },
      { message: '...ラーメン、食べたい', expression: 'happy' },
    ],
  },
  {
    pattern: /疲れ|つかれ/,
    responses: [
      { message: '...大丈夫？休む？', expression: 'thinking' },
      { message: '...無理しないで', expression: 'neutral' },
    ],
  },
  {
    pattern: /写真|しゃしん/,
    responses: [
      { message: '...いいよ、撮って', expression: 'shy' },
      { message: '...えっ、わたしも？', expression: 'surprised' },
    ],
  },
];

function getDefaultResponse(userMessage: string): AIResponse {
  // Find matching pattern
  for (const { pattern, responses } of DEFAULT_RESPONSES) {
    if (pattern.test(userMessage)) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return randomResponse;
    }
  }

  // Generic fallback responses
  const fallbacks: AIResponse[] = [
    { message: '...うん', expression: 'neutral' },
    { message: '...そうなんだ', expression: 'neutral' },
    { message: '...', expression: 'thinking' },
    { message: '...なるほど', expression: 'neutral' },
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export function getOpenRouterApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
}
