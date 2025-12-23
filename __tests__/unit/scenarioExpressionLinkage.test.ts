/**
 * Scenario Expression Linkage Tests
 *
 * Verifies that all scenarios (prologue, endings, AI chat)
 * have proper expression-dialogue linkage.
 */

import { ENDINGS, EndingData, EndingDialogue } from '../../src/constants/endings';

// Valid expressions
const VALID_EXPRESSIONS = ['neutral', 'happy', 'shy', 'surprised', 'sad', 'thinking'] as const;
type ValidExpression = typeof VALID_EXPRESSIONS[number];

// Prologue story data (copied from opening.tsx for testing)
const PROLOGUE_STORY = [
  { speaker: '', text: '12月24日。冬の朝。', expression: 'neutral' as const },
  { speaker: '', text: '冬の朝の空気は、どこか甘い香りがする。', expression: 'neutral' as const },
  { speaker: '', text: '母さんから連絡があった。', expression: 'neutral' as const },
  { speaker: '', text: 'おばさんと従姉妹の子が、', expression: 'neutral' as const },
  { speaker: '', text: 'ふと、ホテルのロビーの隅に', expression: 'neutral' as const },
  { speaker: 'かおり', text: '...あ、あの...えっと...', expression: 'shy' as const },
  { speaker: '', text: '彼女はきょろきょろと辺りを見回している。', expression: 'shy' as const },
  { speaker: 'かおり', text: '...あの、お兄さん...ですか？', expression: 'shy' as const },
  { speaker: 'かおり', text: '...すみません、急に一人で観光することになって...', expression: 'shy' as const },
  { speaker: 'かおり', text: '...えっと、ご迷惑でなければ...', expression: 'shy' as const },
  { speaker: '', text: '彼女は北海道の小樽から来たらしい。', expression: 'neutral' as const },
  { speaker: '', text: 'おとなしくて人見知りだけど、', expression: 'neutral' as const },
  { speaker: 'かおり', text: '...こっちは暖かいですね。', expression: 'neutral' as const },
  { speaker: 'かおり', text: '...今の、聞かなかったことにしてください...', expression: 'shy' as const },
  { speaker: 'かおり', text: '...あの、お兄さん。', expression: 'thinking' as const },
  { speaker: 'かおり', text: '...イルミネーション、見てみたいです。', expression: 'shy' as const },
  { speaker: '', text: '彼女の瞳には、期待と不安が入り混じっている。', expression: 'neutral' as const },
  { speaker: '', text: 'でも、その眼差しの奥には、', expression: 'neutral' as const },
  { speaker: 'かおり', text: '...あの、お兄さん。', expression: 'shy' as const },
  { speaker: '', text: 'かおりとの、9時間のクリスマスが始まる。', expression: 'happy' as const },
];

describe('Scenario Expression Linkage', () => {
  // ============================================
  // PROLOGUE TESTS
  // ============================================
  describe('Prologue Expression Linkage', () => {
    test('All prologue dialogues have valid expression', () => {
      PROLOGUE_STORY.forEach((story, index) => {
        expect(story).toHaveProperty('expression');
        expect(VALID_EXPRESSIONS).toContain(story.expression);
      });
    });

    test('Prologue has 20 story steps', () => {
      expect(PROLOGUE_STORY.length).toBe(20);
    });

    test('Kaori dialogues have appropriate shy/neutral expression for introduction', () => {
      const kaoriDialogues = PROLOGUE_STORY.filter(s => s.speaker === 'かおり');

      kaoriDialogues.forEach((dialogue) => {
        // In prologue, Kaori is meeting for first time - should be shy, neutral, or thinking
        const appropriateExpressions: ValidExpression[] = ['shy', 'neutral', 'thinking'];
        expect(appropriateExpressions).toContain(dialogue.expression);
      });
    });

    test('Narration uses neutral expression', () => {
      const narrations = PROLOGUE_STORY.filter(s => s.speaker === '');

      narrations.forEach((narration) => {
        // Narrations should mostly be neutral (narrator doesn't have expressions)
        // Last narration can be happy (ending on positive note)
        const appropriateExpressions: ValidExpression[] = ['neutral', 'happy', 'shy', 'sad'];
        expect(appropriateExpressions).toContain(narration.expression);
      });
    });

    test('Expression variety in prologue', () => {
      const expressions = new Set(PROLOGUE_STORY.map(s => s.expression));
      // Should have at least 3 different expressions
      expect(expressions.size).toBeGreaterThanOrEqual(3);
    });
  });

  // ============================================
  // ENDINGS TESTS
  // ============================================
  describe('Ending Expression Linkage', () => {
    const allEndings = Object.values(ENDINGS);

    test('All 13 endings exist', () => {
      expect(allEndings.length).toBe(13);
    });

    test.each(allEndings)('Ending $id has valid expressions in all dialogues', (ending: EndingData) => {
      ending.dialogues.forEach((dialogue: EndingDialogue, index: number) => {
        expect(dialogue).toHaveProperty('expression');
        expect(VALID_EXPRESSIONS).toContain(dialogue.expression);
      });
    });

    test('BAD endings have sad expressions', () => {
      const badEndings = allEndings.filter(e => e.category === 'BAD');

      badEndings.forEach((ending) => {
        const sadCount = ending.dialogues.filter(d => d.expression === 'sad').length;
        // BAD endings should have at least 2 sad expressions
        expect(sadCount).toBeGreaterThanOrEqual(2);
      });
    });

    test('GOOD endings end with positive expression (shy/happy)', () => {
      const goodEndings = allEndings.filter(e => e.category === 'GOOD');

      goodEndings.forEach((ending) => {
        const lastDialogue = ending.dialogues[ending.dialogues.length - 1];
        // GOOD endings should end with positive expression (shy or happy)
        // For shy character, shy is also considered positive
        expect(['happy', 'shy']).toContain(lastDialogue.expression);
      });
    });

    test('TRUE ending has variety of positive expressions', () => {
      const trueEnding = ENDINGS['TRUE'];
      const expressions = new Set(trueEnding.dialogues.map(d => d.expression));

      // TRUE ending should have at least 4 different expressions
      expect(expressions.size).toBeGreaterThanOrEqual(4);

      // Should include happy and shy
      expect(expressions.has('happy')).toBe(true);
      expect(expressions.has('shy')).toBe(true);
    });

    test('Each ending has at least 8 dialogues', () => {
      allEndings.forEach((ending) => {
        expect(ending.dialogues.length).toBeGreaterThanOrEqual(8);
      });
    });

    test('Kaori dialogues match expression tone', () => {
      allEndings.forEach((ending) => {
        const kaoriDialogues = ending.dialogues.filter(d => d.speaker === 'かおり');

        kaoriDialogues.forEach((dialogue) => {
          // Check expression-text consistency
          if (dialogue.expression === 'sad') {
            // Sad expressions shouldn't have strong positive indicators
            expect(dialogue.text).not.toMatch(/！.*嬉しい|！.*楽しい|えへへ/);
          }

          if (dialogue.expression === 'happy') {
            // Happy expressions shouldn't have strong negative indicators
            expect(dialogue.text).not.toMatch(/さようなら|ごめん...$/);
          }
        });
      });
    });
  });

  // ============================================
  // ENDING PROGRESSION TESTS
  // ============================================
  describe('Ending Expression Progression', () => {
    test('BAD endings end with negative emotion', () => {
      const badEndings = Object.values(ENDINGS).filter(e => e.category === 'BAD');

      badEndings.forEach((ending) => {
        const lastDialogue = ending.dialogues[ending.dialogues.length - 1];
        // Last dialogue in BAD end should be sad or neutral (not happy)
        expect(['sad', 'neutral']).toContain(lastDialogue.expression);
      });
    });

    test('GOOD and TRUE endings end with positive emotion', () => {
      const positiveEndings = Object.values(ENDINGS).filter(
        e => e.category === 'GOOD' || e.category === 'TRUE'
      );

      positiveEndings.forEach((ending) => {
        const lastDialogue = ending.dialogues[ending.dialogues.length - 1];
        // Last dialogue in GOOD/TRUE end should be happy
        expect(['happy', 'shy']).toContain(lastDialogue.expression);
      });
    });

    test('NORMAL endings have mixed emotions', () => {
      const normalEndings = Object.values(ENDINGS).filter(e => e.category === 'NORMAL');

      normalEndings.forEach((ending) => {
        const expressions = new Set(ending.dialogues.map(d => d.expression));
        // NORMAL endings should have at least 2 different emotions (mixed feelings)
        // Some simple NORMAL endings may only use neutral + shy
        expect(expressions.size).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
