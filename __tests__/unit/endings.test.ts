import {
  getEndingTypeFromMatrix,
  getEndingData,
  getEndingCategory,
  EndingType,
  ENDINGS,
} from '../../src/constants/endings';

describe('Ending System', () => {
  describe('getEndingTypeFromMatrix', () => {
    describe('TRUE END', () => {
      it('should return TRUE when affection=5 and score>=1800', () => {
        expect(getEndingTypeFromMatrix(1800, 5)).toBe('TRUE');
        expect(getEndingTypeFromMatrix(2000, 5)).toBe('TRUE');
        expect(getEndingTypeFromMatrix(5000, 5)).toBe('TRUE');
      });
    });

    describe('GOOD ENDS', () => {
      it('should return GOOD_D when affection=4 and score>=1800', () => {
        expect(getEndingTypeFromMatrix(1800, 4)).toBe('GOOD_D');
        expect(getEndingTypeFromMatrix(2500, 4)).toBe('GOOD_D');
      });

      it('should return GOOD_E when affection=5 and score 1200-1799', () => {
        expect(getEndingTypeFromMatrix(1200, 5)).toBe('GOOD_E');
        expect(getEndingTypeFromMatrix(1500, 5)).toBe('GOOD_E');
        expect(getEndingTypeFromMatrix(1799, 5)).toBe('GOOD_E');
      });

      it('should return GOOD_C when affection=4 and score 1200-1799', () => {
        expect(getEndingTypeFromMatrix(1200, 4)).toBe('GOOD_C');
        expect(getEndingTypeFromMatrix(1500, 4)).toBe('GOOD_C');
        expect(getEndingTypeFromMatrix(1799, 4)).toBe('GOOD_C');
      });

      it('should return GOOD_B when affection=3 and score>=1200', () => {
        expect(getEndingTypeFromMatrix(1200, 3)).toBe('GOOD_B');
        expect(getEndingTypeFromMatrix(2000, 3)).toBe('GOOD_B');
      });

      it('should return GOOD_A when affection=2 and score>=1200', () => {
        expect(getEndingTypeFromMatrix(1200, 2)).toBe('GOOD_A');
        expect(getEndingTypeFromMatrix(2000, 2)).toBe('GOOD_A');
      });
    });

    describe('NORMAL ENDS', () => {
      it('should return NORMAL_E when affection=5 and score 600-1199', () => {
        expect(getEndingTypeFromMatrix(600, 5)).toBe('NORMAL_E');
        expect(getEndingTypeFromMatrix(900, 5)).toBe('NORMAL_E');
        expect(getEndingTypeFromMatrix(1199, 5)).toBe('NORMAL_E');
      });

      it('should return NORMAL_D when affection=4 and score 600-1199', () => {
        expect(getEndingTypeFromMatrix(600, 4)).toBe('NORMAL_D');
        expect(getEndingTypeFromMatrix(1199, 4)).toBe('NORMAL_D');
      });

      it('should return NORMAL_C when affection=3 and score 600-1199', () => {
        expect(getEndingTypeFromMatrix(600, 3)).toBe('NORMAL_C');
        expect(getEndingTypeFromMatrix(1199, 3)).toBe('NORMAL_C');
      });

      it('should return NORMAL_B when affection=2 and score 600-1199', () => {
        expect(getEndingTypeFromMatrix(600, 2)).toBe('NORMAL_B');
        expect(getEndingTypeFromMatrix(1199, 2)).toBe('NORMAL_B');
      });

      it('should return NORMAL_A when affection=1 and score 600-1199', () => {
        expect(getEndingTypeFromMatrix(600, 1)).toBe('NORMAL_A');
        expect(getEndingTypeFromMatrix(1199, 1)).toBe('NORMAL_A');
      });
    });

    describe('BAD ENDS', () => {
      it('should return BAD_B when affection>=2 and score<600', () => {
        expect(getEndingTypeFromMatrix(0, 2)).toBe('BAD_B');
        expect(getEndingTypeFromMatrix(599, 2)).toBe('BAD_B');
        expect(getEndingTypeFromMatrix(599, 3)).toBe('BAD_B');
      });

      it('should return BAD_A when affection=1 and score<600', () => {
        expect(getEndingTypeFromMatrix(0, 1)).toBe('BAD_A');
        expect(getEndingTypeFromMatrix(599, 1)).toBe('BAD_A');
      });

      it('should not return BAD for high affection (4-5)', () => {
        // High affection players should never get BAD end
        expect(getEndingTypeFromMatrix(0, 4)).not.toMatch(/^BAD/);
        expect(getEndingTypeFromMatrix(0, 5)).not.toMatch(/^BAD/);
      });
    });

    describe('Edge cases', () => {
      it('should handle exact boundary values', () => {
        // At exactly 600
        expect(getEndingTypeFromMatrix(600, 1)).toBe('NORMAL_A');
        // At exactly 1200
        expect(getEndingTypeFromMatrix(1200, 2)).toBe('GOOD_A');
        // At exactly 1800
        expect(getEndingTypeFromMatrix(1800, 5)).toBe('TRUE');
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
});
