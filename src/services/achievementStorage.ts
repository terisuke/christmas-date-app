// Achievement Storage Service
// Handles persistence of unlocked achievements using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AchievementId, ACHIEVEMENTS, Achievement } from '../constants/achievements';

const ACHIEVEMENTS_KEY = '@achievements_unlocked';
const ACHIEVEMENTS_TIMESTAMPS_KEY = '@achievements_timestamps';

export interface UnlockedAchievement {
  id: AchievementId;
  unlockedAt: number; // timestamp
}

// Load all unlocked achievements
export async function loadUnlockedAchievements(): Promise<AchievementId[]> {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (data) {
      return JSON.parse(data) as AchievementId[];
    }
    return [];
  } catch (error) {
    console.error('Failed to load achievements:', error);
    return [];
  }
}

// Load achievements with timestamps
export async function loadAchievementsWithTimestamps(): Promise<UnlockedAchievement[]> {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_TIMESTAMPS_KEY);
    if (data) {
      return JSON.parse(data) as UnlockedAchievement[];
    }
    return [];
  } catch (error) {
    console.error('Failed to load achievements with timestamps:', error);
    return [];
  }
}

// Save unlocked achievements
export async function saveUnlockedAchievements(achievements: AchievementId[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error('Failed to save achievements:', error);
  }
}

// Unlock a new achievement
export async function unlockAchievement(id: AchievementId): Promise<{
  isNew: boolean;
  achievement: Achievement;
}> {
  const unlocked = await loadUnlockedAchievements();
  const timestamps = await loadAchievementsWithTimestamps();

  if (unlocked.includes(id)) {
    return { isNew: false, achievement: ACHIEVEMENTS[id] };
  }

  // Add to unlocked list
  const newUnlocked = [...unlocked, id];
  await saveUnlockedAchievements(newUnlocked);

  // Add timestamp
  const newTimestamps = [...timestamps, { id, unlockedAt: Date.now() }];
  await AsyncStorage.setItem(ACHIEVEMENTS_TIMESTAMPS_KEY, JSON.stringify(newTimestamps));

  return { isNew: true, achievement: ACHIEVEMENTS[id] };
}

// Check if achievement is unlocked
export async function isAchievementUnlocked(id: AchievementId): Promise<boolean> {
  const unlocked = await loadUnlockedAchievements();
  return unlocked.includes(id);
}

// Get achievement progress (unlocked count / total count)
export async function getAchievementProgress(): Promise<{
  unlocked: number;
  total: number;
  percentage: number;
}> {
  const unlocked = await loadUnlockedAchievements();
  const total = Object.keys(ACHIEVEMENTS).length;
  return {
    unlocked: unlocked.length,
    total,
    percentage: Math.round((unlocked.length / total) * 100),
  };
}

// Clear all achievements (for testing/reset)
export async function clearAllAchievements(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([ACHIEVEMENTS_KEY, ACHIEVEMENTS_TIMESTAMPS_KEY]);
  } catch (error) {
    console.error('Failed to clear achievements:', error);
  }
}

// Check and unlock achievements based on game state
export async function checkAndUnlockAchievements(gameState: {
  checkInCount: number;
  checkedInSpots: string[];
  chatCount: number;
  steps: number;
  affection: number;
  score: number;
  timeRemaining: number;
  endingType?: string;
  unlockedEndings?: string[];
}): Promise<UnlockedAchievement[]> {
  const newlyUnlocked: UnlockedAchievement[] = [];

  // First step
  if (gameState.checkInCount >= 1) {
    const result = await unlockAchievement('first_step');
    if (result.isNew) newlyUnlocked.push({ id: 'first_step', unlockedAt: Date.now() });
  }

  // Walker achievements
  if (gameState.steps >= 2000) {
    const result = await unlockAchievement('walker_2k');
    if (result.isNew) newlyUnlocked.push({ id: 'walker_2k', unlockedAt: Date.now() });
  }
  if (gameState.steps >= 5000) {
    const result = await unlockAchievement('walker_5k');
    if (result.isNew) newlyUnlocked.push({ id: 'walker_5k', unlockedAt: Date.now() });
  }
  if (gameState.steps >= 10000) {
    const result = await unlockAchievement('walker_10k');
    if (result.isNew) newlyUnlocked.push({ id: 'walker_10k', unlockedAt: Date.now() });
  }

  // Chatterbox
  if (gameState.chatCount >= 30) {
    const result = await unlockAchievement('chatterbox');
    if (result.isNew) newlyUnlocked.push({ id: 'chatterbox', unlockedAt: Date.now() });
  }

  // Explorer (6 normal spots)
  const normalSpots = ['A', 'B', 'C', 'D', 'E', 'F'];
  const visitedNormal = normalSpots.filter(s => gameState.checkedInSpots.includes(s));
  if (visitedNormal.length >= 6) {
    const result = await unlockAchievement('explorer');
    if (result.isNew) newlyUnlocked.push({ id: 'explorer', unlockedAt: Date.now() });
  }

  // Secret finder
  const secretSpots = ['S1', 'S2', 'S3'];
  const hasSecret = secretSpots.some(s => gameState.checkedInSpots.includes(s));
  if (hasSecret) {
    const result = await unlockAchievement('secret_finder');
    if (result.isNew) newlyUnlocked.push({ id: 'secret_finder', unlockedAt: Date.now() });
  }

  // All spots
  if (gameState.checkedInSpots.length >= 9) {
    const result = await unlockAchievement('all_spots');
    if (result.isNew) newlyUnlocked.push({ id: 'all_spots', unlockedAt: Date.now() });
  }

  // Heart opener
  if (gameState.affection >= 5) {
    const result = await unlockAchievement('heart_opener');
    if (result.isNew) newlyUnlocked.push({ id: 'heart_opener', unlockedAt: Date.now() });
  }

  // High scorer
  if (gameState.score >= 2000) {
    const result = await unlockAchievement('high_scorer');
    if (result.isNew) newlyUnlocked.push({ id: 'high_scorer', unlockedAt: Date.now() });
  }

  // Speed runner (1 hour = 3600000ms remaining)
  if (gameState.timeRemaining >= 3600000 && gameState.endingType) {
    const result = await unlockAchievement('speed_runner');
    if (result.isNew) newlyUnlocked.push({ id: 'speed_runner', unlockedAt: Date.now() });
  }

  // TRUE END
  if (gameState.endingType === 'TRUE') {
    const result = await unlockAchievement('true_end');
    if (result.isNew) newlyUnlocked.push({ id: 'true_end', unlockedAt: Date.now() });
  }

  // Collector (all 13 endings)
  if (gameState.unlockedEndings && gameState.unlockedEndings.length >= 13) {
    const result = await unlockAchievement('collector');
    if (result.isNew) newlyUnlocked.push({ id: 'collector', unlockedAt: Date.now() });
  }

  return newlyUnlocked;
}
