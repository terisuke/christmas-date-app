import {
  getEndingTypeFromMatrix,
  getEndingData,
  getEndingCategory,
  getAllEndings,
  isEndingUnlocked,
  EndingType,
  ENDINGS,
} from '../../src/constants/endings';

describe('Ending System', () => {
  describe('getEndingTypeFromMatrix', () => {
    /**
     * DIFFICULTY BALANCE (v1.0.2):
     * Based on realistic point economy analysis:
     * - Max theoretical score: ~2,350 points
     *
     * Matrix:
     * | Affection | <800      | 800-1399  | 1400-1999 | >=2000   |
     * |-----------|-----------|-----------|-----------|----------|
     * | 1         | BAD_A     | NORMAL_A  | NORMAL_A  | NORMAL_A |
     * | 2         | BAD_B     | NORMAL_B  | GOOD_A    | GOOD_A   |
     * | 3         | BAD_B     | NORMAL_C  | GOOD_B    | GOOD_B   |
     * | 4         | NORMAL_D  | NORMAL_D  | GOOD_C    | GOOD_D   |
     * | 5         | NORMAL_E  | NORMAL_E  | GOOD_E    | TRUE     |
     */
    describe('TRUE END', () => {
      it('should return TRUE when affection=5 and score>=2000', () => {
        expect(getEndingTypeFromMatrix(2000, 5)).toBe('TRUE');
        expect(getEndingTypeFromMatrix(2200, 5)).toBe('TRUE');
        expect(getEndingTypeFromMatrix(5000, 5)).toBe('TRUE');
      });

      it('should NOT return TRUE when score<2000 even with max affection', () => {
        expect(getEndingTypeFromMatrix(1999, 5)).not.toBe('TRUE');
        expect(getEndingTypeFromMatrix(1400, 5)).not.toBe('TRUE');
      });
    });

    describe('GOOD ENDS', () => {
      it('should return GOOD_D when affection=4 and score>=2000', () => {
        expect(getEndingTypeFromMatrix(2000, 4)).toBe('GOOD_D');
        expect(getEndingTypeFromMatrix(2500, 4)).toBe('GOOD_D');
      });

      it('should return GOOD_E when affection=5 and score 1400-1999', () => {
        expect(getEndingTypeFromMatrix(1400, 5)).toBe('GOOD_E');
        expect(getEndingTypeFromMatrix(1700, 5)).toBe('GOOD_E');
        expect(getEndingTypeFromMatrix(1999, 5)).toBe('GOOD_E');
      });

      it('should return GOOD_C when affection=4 and score 1400-1999', () => {
        expect(getEndingTypeFromMatrix(1400, 4)).toBe('GOOD_C');
        expect(getEndingTypeFromMatrix(1700, 4)).toBe('GOOD_C');
        expect(getEndingTypeFromMatrix(1999, 4)).toBe('GOOD_C');
      });

      it('should return GOOD_B when affection=3 and score>=1400', () => {
        expect(getEndingTypeFromMatrix(1400, 3)).toBe('GOOD_B');
        expect(getEndingTypeFromMatrix(2000, 3)).toBe('GOOD_B');
      });

      it('should return GOOD_A when affection=2 and score>=1400', () => {
        expect(getEndingTypeFromMatrix(1400, 2)).toBe('GOOD_A');
        expect(getEndingTypeFromMatrix(2000, 2)).toBe('GOOD_A');
      });
    });

    describe('NORMAL ENDS', () => {
      it('should return NORMAL_E when affection=5 and score<1400', () => {
        expect(getEndingTypeFromMatrix(0, 5)).toBe('NORMAL_E');
        expect(getEndingTypeFromMatrix(800, 5)).toBe('NORMAL_E');
        expect(getEndingTypeFromMatrix(1399, 5)).toBe('NORMAL_E');
      });

      it('should return NORMAL_D when affection=4 and score<1400', () => {
        expect(getEndingTypeFromMatrix(0, 4)).toBe('NORMAL_D');
        expect(getEndingTypeFromMatrix(800, 4)).toBe('NORMAL_D');
        expect(getEndingTypeFromMatrix(1399, 4)).toBe('NORMAL_D');
      });

      it('should return NORMAL_C when affection=3 and score 800-1399', () => {
        expect(getEndingTypeFromMatrix(800, 3)).toBe('NORMAL_C');
        expect(getEndingTypeFromMatrix(1399, 3)).toBe('NORMAL_C');
      });

      it('should return NORMAL_B when affection=2 and score 800-1399', () => {
        expect(getEndingTypeFromMatrix(800, 2)).toBe('NORMAL_B');
        expect(getEndingTypeFromMatrix(1399, 2)).toBe('NORMAL_B');
      });

      it('should return NORMAL_A when affection=1 and score>=800', () => {
        expect(getEndingTypeFromMatrix(800, 1)).toBe('NORMAL_A');
        expect(getEndingTypeFromMatrix(1399, 1)).toBe('NORMAL_A');
        expect(getEndingTypeFromMatrix(2000, 1)).toBe('NORMAL_A');
      });
    });

    describe('BAD ENDS', () => {
      it('should return BAD_B when affection 2-3 and score<800', () => {
        expect(getEndingTypeFromMatrix(0, 2)).toBe('BAD_B');
        expect(getEndingTypeFromMatrix(799, 2)).toBe('BAD_B');
        expect(getEndingTypeFromMatrix(799, 3)).toBe('BAD_B');
      });

      it('should return BAD_A when affection=1 and score<800', () => {
        expect(getEndingTypeFromMatrix(0, 1)).toBe('BAD_A');
        expect(getEndingTypeFromMatrix(799, 1)).toBe('BAD_A');
      });

      it('should not return BAD for high affection (4-5)', () => {
        // High affection players should never get BAD end
        expect(getEndingTypeFromMatrix(0, 4)).not.toMatch(/^BAD/);
        expect(getEndingTypeFromMatrix(0, 5)).not.toMatch(/^BAD/);
        expect(getEndingTypeFromMatrix(799, 4)).not.toMatch(/^BAD/);
        expect(getEndingTypeFromMatrix(799, 5)).not.toMatch(/^BAD/);
      });
    });

    describe('Edge cases', () => {
      it('should handle exact boundary values', () => {
        // At exactly 800
        expect(getEndingTypeFromMatrix(800, 1)).toBe('NORMAL_A');
        // At exactly 1400
        expect(getEndingTypeFromMatrix(1400, 2)).toBe('GOOD_A');
        // At exactly 2000
        expect(getEndingTypeFromMatrix(2000, 5)).toBe('TRUE');
      });

      it('should handle very high scores', () => {
        expect(getEndingTypeFromMatrix(10000, 5)).toBe('TRUE');
        expect(getEndingTypeFromMatrix(10000, 4)).toBe('GOOD_D');
        expect(getEndingTypeFromMatrix(10000, 3)).toBe('GOOD_B');
      });

      it('should handle zero score', () => {
        expect(getEndingTypeFromMatrix(0, 1)).toBe('BAD_A');
        expect(getEndingTypeFromMatrix(0, 5)).toBe('NORMAL_E');
      });
    });
  });

  describe('getEndingData', () => {
    it('should return correct data for each ending type', () => {
      const endings: EndingType[] = [
        'BAD_A', 'BAD_B',
        'NORMAL_A', 'NORMAL_B', 'NORMAL_C', 'NORMAL_D', 'NORMAL_E',
        'GOOD_A', 'GOOD_B', 'GOOD_C', 'GOOD_D', 'GOOD_E',
        'TRUE'
      ];

      endings.forEach(type => {
        const data = getEndingData(type);
        expect(data).toBeDefined();
        expect(data.id).toBe(type);
        expect(data.title).toBeDefined();
        expect(data.subtitle).toBeDefined();
        expect(data.dialogues.length).toBeGreaterThan(0);
      });
    });

    it('should have unique titles for each ending', () => {
      const subtitles = Object.values(ENDINGS).map(e => e.subtitle);
      const uniqueSubtitles = new Set(subtitles);
      expect(uniqueSubtitles.size).toBe(subtitles.length);
    });
  });

  describe('getEndingCategory', () => {
    it('should return correct category', () => {
      expect(getEndingCategory('BAD_A')).toBe('BAD');
      expect(getEndingCategory('BAD_B')).toBe('BAD');
      expect(getEndingCategory('NORMAL_A')).toBe('NORMAL');
      expect(getEndingCategory('NORMAL_E')).toBe('NORMAL');
      expect(getEndingCategory('GOOD_A')).toBe('GOOD');
      expect(getEndingCategory('GOOD_E')).toBe('GOOD');
      expect(getEndingCategory('TRUE')).toBe('TRUE');
    });
  });

  describe('ENDINGS data integrity', () => {
    it('should have exactly 13 endings', () => {
      expect(Object.keys(ENDINGS).length).toBe(13);
    });

    it('should have valid expressions in dialogues', () => {
      const validExpressions = ['neutral', 'happy', 'shy', 'surprised', 'sad', 'thinking'];

      Object.values(ENDINGS).forEach(ending => {
        ending.dialogues.forEach(dialogue => {
          expect(validExpressions).toContain(dialogue.expression);
        });
      });
    });

    it('should have proper speaker values in dialogues', () => {
      Object.values(ENDINGS).forEach(ending => {
        ending.dialogues.forEach(dialogue => {
          expect(['', 'かおり']).toContain(dialogue.speaker);
        });
      });
    });

    it('should have bgColor for all endings', () => {
      Object.values(ENDINGS).forEach(ending => {
        expect(ending.bgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('getAllEndings', () => {
    it('should return all 13 endings as an array', () => {
      const endings = getAllEndings();
      expect(Array.isArray(endings)).toBe(true);
      expect(endings.length).toBe(13);
    });

    it('should return endings with required properties', () => {
      const endings = getAllEndings();
      endings.forEach(ending => {
        expect(ending).toHaveProperty('id');
        expect(ending).toHaveProperty('title');
        expect(ending).toHaveProperty('subtitle');
        expect(ending).toHaveProperty('dialogues');
        expect(ending).toHaveProperty('bgColor');
      });
    });

    it('should include all ending categories', () => {
      const endings = getAllEndings();
      const categories = endings.map(e => getEndingCategory(e.id as EndingType));

      expect(categories).toContain('BAD');
      expect(categories).toContain('NORMAL');
      expect(categories).toContain('GOOD');
      expect(categories).toContain('TRUE');
    });
  });

  describe('isEndingUnlocked', () => {
    it('should return true when ending is in unlocked list', () => {
      const unlockedEndings: EndingType[] = ['BAD_A', 'NORMAL_A', 'TRUE'];

      expect(isEndingUnlocked('BAD_A', unlockedEndings)).toBe(true);
      expect(isEndingUnlocked('NORMAL_A', unlockedEndings)).toBe(true);
      expect(isEndingUnlocked('TRUE', unlockedEndings)).toBe(true);
    });

    it('should return false when ending is not in unlocked list', () => {
      const unlockedEndings: EndingType[] = ['BAD_A', 'NORMAL_A'];

      expect(isEndingUnlocked('TRUE', unlockedEndings)).toBe(false);
      expect(isEndingUnlocked('GOOD_A', unlockedEndings)).toBe(false);
      expect(isEndingUnlocked('BAD_B', unlockedEndings)).toBe(false);
    });

    it('should return false for empty unlocked list', () => {
      const unlockedEndings: EndingType[] = [];

      expect(isEndingUnlocked('TRUE', unlockedEndings)).toBe(false);
      expect(isEndingUnlocked('BAD_A', unlockedEndings)).toBe(false);
    });

    it('should handle all ending types', () => {
      const allEndingTypes: EndingType[] = [
        'BAD_A', 'BAD_B',
        'NORMAL_A', 'NORMAL_B', 'NORMAL_C', 'NORMAL_D', 'NORMAL_E',
        'GOOD_A', 'GOOD_B', 'GOOD_C', 'GOOD_D', 'GOOD_E',
        'TRUE'
      ];

      // All should be unlocked when all are in list
      allEndingTypes.forEach(type => {
        expect(isEndingUnlocked(type, allEndingTypes)).toBe(true);
      });
    });
  });
});
