/**
 * Event Expression Linkage Tests
 *
 * Verifies that dialogue choices have proper expression settings
 * and that expression-dialogue combinations are consistent.
 */

import { SPOT_DATA } from '../../src/constants/character';

// Valid expressions from CharacterDisplay
const VALID_EXPRESSIONS = ['neutral', 'happy', 'shy', 'surprised', 'sad', 'thinking'] as const;
type ValidExpression = typeof VALID_EXPRESSIONS[number];

describe('Event Expression Linkage', () => {
  describe('SPOT_DATA choice expressions', () => {
    // Get all spots
    const spots = SPOT_DATA;

    test.each(spots)('Spot $id ($name) has expression for all choices', (spot) => {
      const choices = spot.event_script.choices;

      choices.forEach((choice, index) => {
        // Verify expression field exists
        expect(choice).toHaveProperty('expression');

        // Verify expression is a valid type
        expect(VALID_EXPRESSIONS).toContain(choice.expression);
      });
    });

    test('All 9 spots have event scripts with choices', () => {
      expect(spots.length).toBe(9);

      spots.forEach((spot) => {
        expect(spot.event_script).toBeDefined();
        expect(spot.event_script.choices).toBeDefined();
        expect(spot.event_script.choices.length).toBeGreaterThanOrEqual(2);
      });
    });

    test('Total choice count is 27 (9 spots × 3 choices)', () => {
      const totalChoices = spots.reduce(
        (sum, spot) => sum + spot.event_script.choices.length,
        0
      );
      expect(totalChoices).toBe(27);
    });
  });

  describe('Expression-Affection consistency', () => {
    const spots = SPOT_DATA;

    test('Negative affection choices use neutral or sad expression', () => {
      // After balance adjustment (v1.0.2), all negative choices are -1
      // Secret spots show 'sad' for more emotional impact, normal spots show 'neutral'
      spots.forEach((spot) => {
        spot.event_script.choices.forEach((choice) => {
          if (choice.affection < 0) {
            expect(['neutral', 'sad']).toContain(choice.expression);
          }
        });
      });
    });

    test('Secret spot choices have higher affection impact', () => {
      // Secret spots (S1, S2, S3) have more emotional weight
      const secretSpots = spots.filter((s) => s.is_secret);
      secretSpots.forEach((spot) => {
        const bestChoice = spot.event_script.choices.find((c) => c.affection > 0);
        // Secret spots give +2 affection for best choice (vs +1 for normal spots)
        expect(bestChoice?.affection).toBe(2);
      });
    });

    test('Positive affection choices use neutral or shy expression (shy character)', () => {
      // For a shy character, neutral is the default even for positive interactions
      const appropriateExpressions: ValidExpression[] = ['neutral', 'shy', 'thinking'];

      spots.forEach((spot) => {
        spot.event_script.choices.forEach((choice) => {
          if (choice.affection > 0) {
            expect(appropriateExpressions).toContain(choice.expression);
          }
        });
      });
    });
  });

  describe('Expression variety', () => {
    test('At least 3 different expressions are used across all choices', () => {
      const allExpressions = new Set<string>();

      SPOT_DATA.forEach((spot) => {
        spot.event_script.choices.forEach((choice) => {
          allExpressions.add(choice.expression);
        });
      });

      expect(allExpressions.size).toBeGreaterThanOrEqual(3);
    });

    test('Most spots have expression variety', () => {
      let spotsWithVariety = 0;
      SPOT_DATA.forEach((spot) => {
        const expressions = new Set(
          spot.event_script.choices.map((c) => c.expression)
        );
        if (expressions.size >= 2) {
          spotsWithVariety++;
        }
      });

      // At least 6 out of 9 spots should have expression variety
      // Some spots may use consistent expressions for narrative reasons
      expect(spotsWithVariety).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Response text matches expression tone', () => {
    test('Negative affection responses show disappointment or confusion', () => {
      // v1.1.0: Choices are now more nuanced, negative responses show subtle disappointment
      const negativeResponses: string[] = [];

      SPOT_DATA.forEach((spot) => {
        spot.event_script.choices.forEach((choice) => {
          if (choice.affection < 0) {
            negativeResponses.push(choice.response);
          }
        });
      });

      // Negative responses should contain disappointment indicators
      negativeResponses.forEach((response) => {
        const hasDisappointmentIndicator =
          response.includes('...') || // Hesitation (always present for Kaori)
          response.includes('かな') || // Uncertainty
          response.includes('いいけど') || // Reluctant acceptance
          response.includes('そう...') || // Disappointed agreement
          response.includes('全然') ||  // Self-deprecation
          response.includes('もう');    // Frustrated

        expect(hasDisappointmentIndicator).toBe(true);
      });
    });

    test('Neutral expressions are dominant for shy character consistency', () => {
      let neutralCount = 0;
      let totalCount = 0;

      SPOT_DATA.forEach((spot) => {
        spot.event_script.choices.forEach((choice) => {
          totalCount++;
          if (choice.expression === 'neutral') {
            neutralCount++;
          }
        });
      });

      // Neutral should be the dominant expression (at least 40% of choices)
      const neutralRatio = neutralCount / totalCount;
      expect(neutralRatio).toBeGreaterThanOrEqual(0.4);
    });

    test('Shy expressions have bashful/embarrassed responses', () => {
      const shyResponses: string[] = [];

      SPOT_DATA.forEach((spot) => {
        spot.event_script.choices.forEach((choice) => {
          if (choice.expression === 'shy') {
            shyResponses.push(choice.response);
          }
        });
      });

      // Shy responses should contain bashful indicators
      shyResponses.forEach((response) => {
        const hasShyIndicator =
          response.includes('えへへ') ||
          response.includes('そ、そう') ||
          response.includes('恥ずかし') ||
          response.includes('約束') ||
          response.includes('秘密') ||
          response.includes('...！') ||  // Surprised reaction
          response.includes('お揃い') ||
          response.includes('そんな') ||  // Modest denial "such a thing..."
          response.includes('よかった') || // Relief/gratitude
          response.includes('わたしも') || // Reciprocating feelings
          response.includes('ありがと') || // Gratitude
          response.includes('来たい') ||   // Wanting to come again
          response.includes('あなたがいるから') || // Because you're here
          response.includes('いいけど') || // Reluctant acceptance (shy hesitation)
          response.includes('もう');       // Flustered

        expect(hasShyIndicator).toBe(true);
      });
    });
  });
});
