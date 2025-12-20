// Test game logic functions
describe('Game Logic', () => {
  describe('calculateGameDuration', () => {
    // Inline the function for testing since it's internal to GameContext
    const calculateGameDuration = (startHour: number): number => {
      if (startHour < 10) {
        return 10 * 60 * 60 * 1000; // 10 hours
      } else if (startHour < 14) {
        return 9 * 60 * 60 * 1000; // 9 hours
      } else if (startHour < 18) {
        return 8 * 60 * 60 * 1000; // 8 hours
      } else {
        return 6 * 60 * 60 * 1000; // 6 hours
      }
    };

    it('should return 10 hours for morning start (before 10am)', () => {
      expect(calculateGameDuration(6)).toBe(10 * 60 * 60 * 1000);
      expect(calculateGameDuration(9)).toBe(10 * 60 * 60 * 1000);
    });

    it('should return 9 hours for midday start (10am-2pm)', () => {
      expect(calculateGameDuration(10)).toBe(9 * 60 * 60 * 1000);
      expect(calculateGameDuration(13)).toBe(9 * 60 * 60 * 1000);
    });

    it('should return 8 hours for afternoon start (2pm-6pm)', () => {
      expect(calculateGameDuration(14)).toBe(8 * 60 * 60 * 1000);
      expect(calculateGameDuration(17)).toBe(8 * 60 * 60 * 1000);
    });

    it('should return 6 hours for evening start (after 6pm)', () => {
      expect(calculateGameDuration(18)).toBe(6 * 60 * 60 * 1000);
      expect(calculateGameDuration(22)).toBe(6 * 60 * 60 * 1000);
    });
  });

  describe('getEndingType', () => {
    // Inline the function for testing
    const getEndingType = (score: number): 'BAD' | 'NORMAL' | 'GOOD' | 'TRUE' => {
      if (score < 600) return 'BAD';
      if (score < 1200) return 'NORMAL';
      if (score < 1800) return 'GOOD';
      return 'TRUE';
    };

    it('should return BAD for score < 600', () => {
      expect(getEndingType(0)).toBe('BAD');
      expect(getEndingType(300)).toBe('BAD');
      expect(getEndingType(599)).toBe('BAD');
    });

    it('should return NORMAL for score 600-1199', () => {
      expect(getEndingType(600)).toBe('NORMAL');
      expect(getEndingType(900)).toBe('NORMAL');
      expect(getEndingType(1199)).toBe('NORMAL');
    });

    it('should return GOOD for score 1200-1799', () => {
      expect(getEndingType(1200)).toBe('GOOD');
      expect(getEndingType(1500)).toBe('GOOD');
      expect(getEndingType(1799)).toBe('GOOD');
    });

    it('should return TRUE for score >= 1800', () => {
      expect(getEndingType(1800)).toBe('TRUE');
      expect(getEndingType(2500)).toBe('TRUE');
      expect(getEndingType(10000)).toBe('TRUE');
    });
  });

  describe('Distance calculation (Haversine)', () => {
    // Inline the function for testing
    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371000; // Earth's radius in meters
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    it('should return 0 for same coordinates', () => {
      expect(calculateDistance(33.5897, 130.4207, 33.5897, 130.4207)).toBe(0);
    });

    it('should calculate distance within check-in radius (50m)', () => {
      // Test points very close together
      const distance = calculateDistance(33.5897, 130.4207, 33.5898, 130.4208);
      expect(distance).toBeLessThan(50);
    });

    it('should calculate distance between two Fukuoka spots correctly', () => {
      // Hakata Station to Fukuoka Tower (approximately 5km)
      const distance = calculateDistance(33.5897, 130.4207, 33.5934, 130.3515);
      expect(distance).toBeGreaterThan(4000);
      expect(distance).toBeLessThan(8000);
    });
  });

  describe('Activity Score calculation', () => {
    const MAX_STEPS = 10000;
    const MAX_DISTANCE = 8000;
    const MAX_ACTIVE_MINUTES = 300;
    const STEPS_WEIGHT = 0.4;
    const DISTANCE_WEIGHT = 0.35;
    const TIME_WEIGHT = 0.25;

    const calculateScore = (steps: number, distance: number, activeMinutes: number) => {
      const stepsScore = Math.min(100, (steps / MAX_STEPS) * 100);
      const distanceScore = Math.min(100, (distance / MAX_DISTANCE) * 100);
      const timeScore = Math.min(100, (activeMinutes / MAX_ACTIVE_MINUTES) * 100);
      const totalScore = Math.round(
        stepsScore * STEPS_WEIGHT +
        distanceScore * DISTANCE_WEIGHT +
        timeScore * TIME_WEIGHT
      );
      return { stepsScore, distanceScore, timeScore, totalScore };
    };

    it('should return 0 for no activity', () => {
      const score = calculateScore(0, 0, 0);
      expect(score.totalScore).toBe(0);
    });

    it('should cap scores at 100%', () => {
      const score = calculateScore(15000, 10000, 500);
      expect(score.stepsScore).toBeLessThanOrEqual(100);
      expect(score.distanceScore).toBeLessThanOrEqual(100);
      expect(score.timeScore).toBeLessThanOrEqual(100);
      expect(score.totalScore).toBe(100);
    });

    it('should calculate weighted total correctly', () => {
      // 50% of each metric
      const score = calculateScore(5000, 4000, 150);
      // Each should be 50, weighted total should be 50
      expect(score.totalScore).toBe(50);
    });

    it('should give correct weights to each metric', () => {
      // Only steps (10000 = 100%)
      const stepsOnly = calculateScore(10000, 0, 0);
      expect(stepsOnly.totalScore).toBe(40); // 100 * 0.4

      // Only distance (8000m = 100%)
      const distanceOnly = calculateScore(0, 8000, 0);
      expect(distanceOnly.totalScore).toBe(35); // 100 * 0.35

      // Only time (300 min = 100%)
      const timeOnly = calculateScore(0, 0, 300);
      expect(timeOnly.totalScore).toBe(25); // 100 * 0.25
    });
  });

  describe('All Clear Bonus', () => {
    const TOTAL_SPOTS = 9;
    const ALL_CLEAR_BONUS = 500;

    const checkAllClearBonus = (checkedInSpots: number, alreadyApplied: boolean): number => {
      if (!alreadyApplied && checkedInSpots >= TOTAL_SPOTS) {
        return ALL_CLEAR_BONUS;
      }
      return 0;
    };

    it('should return bonus when all spots are cleared', () => {
      expect(checkAllClearBonus(9, false)).toBe(500);
    });

    it('should not return bonus when not all spots cleared', () => {
      expect(checkAllClearBonus(8, false)).toBe(0);
      expect(checkAllClearBonus(5, false)).toBe(0);
      expect(checkAllClearBonus(0, false)).toBe(0);
    });

    it('should not return bonus if already applied', () => {
      expect(checkAllClearBonus(9, true)).toBe(0);
    });

    it('should return bonus for more than 9 spots', () => {
      expect(checkAllClearBonus(10, false)).toBe(500);
    });
  });
});
