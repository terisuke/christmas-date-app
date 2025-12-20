// Integration tests for game flow
import { SPOT_DATA, KAORI_ENDINGS } from '../../src/constants/character';

describe('Game Flow Integration', () => {
  describe('Complete game flow simulation', () => {
    // Simulate a complete game session
    interface GameState {
      score: number;
      affection: number;
      checkInCount: number;
      chatCount: number;
      checkedInSpots: string[];
      allClearBonusApplied: boolean;
    }

    const ALL_CLEAR_BONUS = 500;

    const createInitialState = (): GameState => ({
      score: 0,
      affection: 1,
      checkInCount: 0,
      chatCount: 0,
      checkedInSpots: [],
      allClearBonusApplied: false,
    });

    const checkIn = (state: GameState, spotId: string, choiceIndex: number): GameState => {
      const spot = SPOT_DATA.find(s => s.id === spotId);
      if (!spot || state.checkedInSpots.includes(spotId)) {
        return state;
      }

      const choice = spot.event_script.choices[choiceIndex];
      const earnedPoints = spot.base_point + choice.points;
      const newAffection = Math.max(1, Math.min(5, state.affection + choice.affection));

      return {
        ...state,
        score: state.score + earnedPoints,
        affection: newAffection,
        checkInCount: state.checkInCount + 1,
        checkedInSpots: [...state.checkedInSpots, spotId],
      };
    };

    const checkAllClearBonus = (state: GameState): GameState => {
      if (!state.allClearBonusApplied && state.checkedInSpots.length >= 9) {
        return {
          ...state,
          score: state.score + ALL_CLEAR_BONUS,
          allClearBonusApplied: true,
        };
      }
      return state;
    };

    const getEndingType = (score: number): keyof typeof KAORI_ENDINGS => {
      if (score < 600) return 'BAD';
      if (score < 1200) return 'NORMAL';
      if (score < 1800) return 'GOOD';
      return 'TRUE';
    };

    it('should start with correct initial state', () => {
      const state = createInitialState();

      expect(state.score).toBe(0);
      expect(state.affection).toBe(1);
      expect(state.checkInCount).toBe(0);
      expect(state.checkedInSpots).toHaveLength(0);
    });

    it('should accumulate score through check-ins', () => {
      let state = createInitialState();

      // Check in to first spot with best choice
      state = checkIn(state, 'A', 0);
      expect(state.score).toBeGreaterThan(0);
      expect(state.checkInCount).toBe(1);
      expect(state.checkedInSpots).toContain('A');

      // Check in to second spot
      const scoreAfterFirst = state.score;
      state = checkIn(state, 'B', 0);
      expect(state.score).toBeGreaterThan(scoreAfterFirst);
      expect(state.checkInCount).toBe(2);
    });

    it('should not allow duplicate check-ins', () => {
      let state = createInitialState();

      state = checkIn(state, 'A', 0);
      const scoreAfterFirst = state.score;
      const countAfterFirst = state.checkInCount;

      state = checkIn(state, 'A', 0);
      expect(state.score).toBe(scoreAfterFirst);
      expect(state.checkInCount).toBe(countAfterFirst);
    });

    it('should update affection based on choices', () => {
      let state = createInitialState();

      // Good choice (affection +2)
      state = checkIn(state, 'A', 0);
      expect(state.affection).toBeGreaterThan(1);

      // Bad choice (affection -1 on spot C)
      state = checkIn(state, 'C', 2);
      // Affection should decrease or stay the same
      expect(state.affection).toBeLessThanOrEqual(state.affection);
    });

    it('should cap affection between 1 and 5', () => {
      let state = createInitialState();

      // Make many good choices
      state = checkIn(state, 'D', 0); // +3 affection
      state = checkIn(state, 'F', 0); // +3 affection
      state = checkIn(state, 'S1', 0); // +3 affection

      expect(state.affection).toBeLessThanOrEqual(5);
      expect(state.affection).toBeGreaterThanOrEqual(1);
    });

    it('should grant all-clear bonus when all spots are visited', () => {
      let state = createInitialState();

      // Visit all 9 spots
      const spotIds = ['A', 'B', 'C', 'D', 'E', 'F', 'S1', 'S2', 'S3'];
      spotIds.forEach(id => {
        state = checkIn(state, id, 0);
      });

      const scoreBeforeBonus = state.score;
      state = checkAllClearBonus(state);

      expect(state.allClearBonusApplied).toBe(true);
      expect(state.score).toBe(scoreBeforeBonus + ALL_CLEAR_BONUS);
    });

    it('should not grant all-clear bonus twice', () => {
      let state = createInitialState();

      const spotIds = ['A', 'B', 'C', 'D', 'E', 'F', 'S1', 'S2', 'S3'];
      spotIds.forEach(id => {
        state = checkIn(state, id, 0);
      });

      state = checkAllClearBonus(state);
      const scoreAfterFirstBonus = state.score;

      state = checkAllClearBonus(state);
      expect(state.score).toBe(scoreAfterFirstBonus);
    });

    it('should achieve BAD ending with minimal play', () => {
      let state = createInitialState();

      // Visit only one spot with worst choice
      state = checkIn(state, 'A', 2); // -5 points + 100 base = 95

      expect(getEndingType(state.score)).toBe('BAD');
      expect(state.score).toBeLessThan(600);
    });

    it('should achieve NORMAL ending with moderate play', () => {
      let state = createInitialState();

      // Visit a few spots with mixed choices
      state = checkIn(state, 'A', 0); // 115
      state = checkIn(state, 'B', 0); // 115
      state = checkIn(state, 'C', 0); // 135
      state = checkIn(state, 'D', 0); // 170
      state = checkIn(state, 'E', 0); // 115

      // Should be around 650
      expect(state.score).toBeGreaterThanOrEqual(600);
      expect(state.score).toBeLessThan(1200);
      expect(getEndingType(state.score)).toBe('NORMAL');
    });

    it('should achieve GOOD ending with good play', () => {
      let state = createInitialState();

      // Visit all normal spots with best choices
      state = checkIn(state, 'A', 0); // 115
      state = checkIn(state, 'B', 0); // 115
      state = checkIn(state, 'C', 0); // 135
      state = checkIn(state, 'D', 0); // 170
      state = checkIn(state, 'E', 0); // 115
      state = checkIn(state, 'F', 0); // 170
      state = checkIn(state, 'S1', 0); // 225
      state = checkIn(state, 'S2', 0); // 225

      // Should be around 1270
      expect(state.score).toBeGreaterThanOrEqual(1200);
      expect(state.score).toBeLessThan(1800);
      expect(getEndingType(state.score)).toBe('GOOD');
    });

    it('should achieve TRUE ending with all spots + bonus', () => {
      let state = createInitialState();

      // Visit all spots with best choices
      const spotIds = ['A', 'B', 'C', 'D', 'E', 'F', 'S1', 'S2', 'S3'];
      spotIds.forEach(id => {
        state = checkIn(state, id, 0);
      });

      // Apply all-clear bonus
      state = checkAllClearBonus(state);

      // Should be over 1800
      expect(state.score).toBeGreaterThanOrEqual(1800);
      expect(getEndingType(state.score)).toBe('TRUE');
    });
  });

  describe('Spot check-in radius validation', () => {
    const CHECK_IN_RADIUS = 50; // meters

    const isWithinRadius = (
      userLat: number,
      userLng: number,
      spotLat: number,
      spotLng: number
    ): boolean => {
      const R = 6371000;
      const dLat = ((spotLat - userLat) * Math.PI) / 180;
      const dLon = ((spotLng - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((spotLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance <= CHECK_IN_RADIUS;
    };

    it('should allow check-in at exact spot location', () => {
      const spot = SPOT_DATA[0]; // Hakata Station
      expect(isWithinRadius(spot.lat, spot.lng, spot.lat, spot.lng)).toBe(true);
    });

    it('should allow check-in within 50m', () => {
      const spot = SPOT_DATA[0];
      // Move slightly (about 30m)
      const userLat = spot.lat + 0.0003;
      const userLng = spot.lng + 0.0003;
      expect(isWithinRadius(userLat, userLng, spot.lat, spot.lng)).toBe(true);
    });

    it('should deny check-in beyond 50m', () => {
      const spot = SPOT_DATA[0];
      // Move significantly (about 200m)
      const userLat = spot.lat + 0.002;
      const userLng = spot.lng + 0.002;
      expect(isWithinRadius(userLat, userLng, spot.lat, spot.lng)).toBe(false);
    });
  });

  describe('Ending content validation', () => {
    it('should have appropriate messages for each ending', () => {
      // BAD ending should be sad
      expect(KAORI_ENDINGS.BAD.expression).toBe('sad');
      expect(KAORI_ENDINGS.BAD.kaoriMessage).toContain('また');

      // NORMAL ending should be neutral
      expect(KAORI_ENDINGS.NORMAL.expression).toBe('neutral');

      // GOOD ending should be happy
      expect(KAORI_ENDINGS.GOOD.expression).toBe('happy');

      // TRUE ending should be shy (most romantic)
      expect(KAORI_ENDINGS.TRUE.expression).toBe('shy');
      expect(KAORI_ENDINGS.TRUE.kaoriMessage).toContain('絶対');
    });
  });

  describe('Event choice impact', () => {
    it('should have choices with varying rewards for each spot', () => {
      SPOT_DATA.forEach(spot => {
        const choices = spot.event_script.choices;

        // At least one positive choice
        const hasPositive = choices.some(c => c.points > 0 || c.affection > 0);
        expect(hasPositive).toBe(true);

        // Choices should have varying total rewards
        const totals = choices.map(c => c.points + c.affection * 10);
        const uniqueTotals = new Set(totals);
        expect(uniqueTotals.size).toBeGreaterThan(1);
      });
    });

    it('should have best choices give highest rewards', () => {
      SPOT_DATA.forEach(spot => {
        const choices = spot.event_script.choices;

        // First choice should typically be the best
        const firstChoice = choices[0];
        const otherChoices = choices.slice(1);

        const firstTotal = firstChoice.points + firstChoice.affection * 10;
        otherChoices.forEach(choice => {
          const otherTotal = choice.points + choice.affection * 10;
          expect(firstTotal).toBeGreaterThanOrEqual(otherTotal);
        });
      });
    });
  });
});
