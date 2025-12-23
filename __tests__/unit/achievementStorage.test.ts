// Achievement Storage Tests

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadUnlockedAchievements,
  saveUnlockedAchievements,
  unlockAchievement,
  isAchievementUnlocked,
  getAchievementProgress,
  clearAllAchievements,
  checkAndUnlockAchievements,
} from '../../src/services/achievementStorage';
import { AchievementId, ACHIEVEMENTS } from '../../src/constants/achievements';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('Achievement Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
  });

  describe('loadUnlockedAchievements', () => {
    it('should return empty array when no achievements saved', async () => {
      const result = await loadUnlockedAchievements();
      expect(result).toEqual([]);
    });

    it('should return saved achievements', async () => {
      const savedIds: AchievementId[] = ['first_step', 'walker_2k'];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedIds));

      const result = await loadUnlockedAchievements();
      expect(result).toEqual(savedIds);
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await loadUnlockedAchievements();
      expect(result).toEqual([]);
    });
  });

  describe('saveUnlockedAchievements', () => {
    it('should save achievements to AsyncStorage', async () => {
      const achievements: AchievementId[] = ['first_step', 'explorer'];

      await saveUnlockedAchievements(achievements);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@achievements_unlocked',
        JSON.stringify(achievements)
      );
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock a new achievement', async () => {
      const result = await unlockAchievement('first_step');

      expect(result.isNew).toBe(true);
      expect(result.achievement).toEqual(ACHIEVEMENTS.first_step);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should not re-unlock already unlocked achievement', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(['first_step']))
        .mockResolvedValueOnce(JSON.stringify([]));

      const result = await unlockAchievement('first_step');

      expect(result.isNew).toBe(false);
      expect(result.achievement).toEqual(ACHIEVEMENTS.first_step);
    });
  });

  describe('isAchievementUnlocked', () => {
    it('should return true for unlocked achievement', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['first_step']));

      const result = await isAchievementUnlocked('first_step');
      expect(result).toBe(true);
    });

    it('should return false for locked achievement', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

      const result = await isAchievementUnlocked('first_step');
      expect(result).toBe(false);
    });
  });

  describe('getAchievementProgress', () => {
    it('should calculate progress correctly', async () => {
      const unlockedIds: AchievementId[] = ['first_step', 'walker_2k', 'chatterbox'];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(unlockedIds));

      const result = await getAchievementProgress();

      expect(result.unlocked).toBe(3);
      expect(result.total).toBe(Object.keys(ACHIEVEMENTS).length);
      expect(result.percentage).toBe(Math.round((3 / Object.keys(ACHIEVEMENTS).length) * 100));
    });

    it('should return 0% when no achievements unlocked', async () => {
      const result = await getAchievementProgress();

      expect(result.unlocked).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('clearAllAchievements', () => {
    it('should remove all achievement data', async () => {
      await clearAllAchievements();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@achievements_unlocked',
        '@achievements_timestamps',
      ]);
    });
  });

  describe('checkAndUnlockAchievements', () => {
    it('should unlock first_step when checkInCount >= 1', async () => {
      const gameState = {
        checkInCount: 1,
        checkedInSpots: ['A'],
        chatCount: 0,
        steps: 0,
        affection: 1,
        score: 100,
        timeRemaining: 30000000,
      };

      const result = await checkAndUnlockAchievements(gameState);

      expect(result.some(a => a.id === 'first_step')).toBe(true);
    });

    it('should unlock walker achievements based on steps', async () => {
      const gameState = {
        checkInCount: 0,
        checkedInSpots: [],
        chatCount: 0,
        steps: 5000,
        affection: 1,
        score: 0,
        timeRemaining: 30000000,
      };

      const result = await checkAndUnlockAchievements(gameState);

      expect(result.some(a => a.id === 'walker_2k')).toBe(true);
      expect(result.some(a => a.id === 'walker_5k')).toBe(true);
    });

    it('should unlock chatterbox when chatCount >= 30', async () => {
      const gameState = {
        checkInCount: 0,
        checkedInSpots: [],
        chatCount: 30,
        steps: 0,
        affection: 1,
        score: 0,
        timeRemaining: 30000000,
      };

      const result = await checkAndUnlockAchievements(gameState);

      expect(result.some(a => a.id === 'chatterbox')).toBe(true);
    });

    it('should unlock explorer when all normal spots visited', async () => {
      const gameState = {
        checkInCount: 6,
        checkedInSpots: ['A', 'B', 'C', 'D', 'E', 'F'],
        chatCount: 0,
        steps: 0,
        affection: 1,
        score: 0,
        timeRemaining: 30000000,
      };

      const result = await checkAndUnlockAchievements(gameState);

      expect(result.some(a => a.id === 'explorer')).toBe(true);
    });

    it('should unlock secret_finder when visiting secret spot', async () => {
      const gameState = {
        checkInCount: 1,
        checkedInSpots: ['S1'],
        chatCount: 0,
        steps: 0,
        affection: 1,
        score: 0,
        timeRemaining: 30000000,
      };

      const result = await checkAndUnlockAchievements(gameState);

      expect(result.some(a => a.id === 'secret_finder')).toBe(true);
    });

    it('should unlock heart_opener when affection is 5', async () => {
      const gameState = {
        checkInCount: 0,
        checkedInSpots: [],
        chatCount: 0,
        steps: 0,
        affection: 5,
        score: 0,
        timeRemaining: 30000000,
      };

      const result = await checkAndUnlockAchievements(gameState);

      expect(result.some(a => a.id === 'heart_opener')).toBe(true);
    });

    it('should unlock high_scorer when score >= 2000', async () => {
      const gameState = {
        checkInCount: 0,
        checkedInSpots: [],
        chatCount: 0,
        steps: 0,
        affection: 1,
        score: 2000,
        timeRemaining: 30000000,
      };

      const result = await checkAndUnlockAchievements(gameState);

      expect(result.some(a => a.id === 'high_scorer')).toBe(true);
    });

    it('should unlock all_spots when all 9 spots visited', async () => {
      const gameState = {
        checkInCount: 9,
        checkedInSpots: ['A', 'B', 'C', 'D', 'E', 'F', 'S1', 'S2', 'S3'],
        chatCount: 0,
        steps: 0,
        affection: 1,
        score: 0,
        timeRemaining: 30000000,
      };

      const result = await checkAndUnlockAchievements(gameState);

      expect(result.some(a => a.id === 'all_spots')).toBe(true);
    });

    it('should not unlock achievements that are already unlocked', async () => {
      // First call - unlock first_step
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const gameState = {
        checkInCount: 1,
        checkedInSpots: ['A'],
        chatCount: 0,
        steps: 0,
        affection: 1,
        score: 100,
        timeRemaining: 30000000,
      };

      await checkAndUnlockAchievements(gameState);

      // Second call - first_step already unlocked
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(['first_step']))
        .mockResolvedValueOnce(JSON.stringify([{ id: 'first_step', unlockedAt: Date.now() }]));

      const result2 = await checkAndUnlockAchievements(gameState);

      // Should not re-unlock first_step
      expect(result2.filter(a => a.id === 'first_step').length).toBe(0);
    });
  });
});

describe('Achievement Constants', () => {
  it('should have 13 achievements defined', () => {
    expect(Object.keys(ACHIEVEMENTS).length).toBe(13);
  });

  it('should have all required fields for each achievement', () => {
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      expect(achievement).toHaveProperty('id');
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('icon');
      expect(achievement).toHaveProperty('bonusPoints');
      expect(achievement).toHaveProperty('rarity');
    });
  });

  it('should have valid rarity values', () => {
    const validRarities = ['common', 'rare', 'epic', 'legendary'];
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      expect(validRarities).toContain(achievement.rarity);
    });
  });
});
