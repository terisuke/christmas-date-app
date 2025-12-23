import AsyncStorage from '@react-native-async-storage/async-storage';
import { EndingType } from '../constants/endings';

const UNLOCKED_ENDINGS_KEY = '@kaori_fukuoka_unlocked_endings';

export interface UnlockedEndingData {
  unlockedAt: string;
  score: number;
  affection: number;
}

export type UnlockedEndingsMap = Partial<Record<EndingType, UnlockedEndingData>>;

/**
 * Get all unlocked endings from storage
 */
export async function getUnlockedEndings(): Promise<UnlockedEndingsMap> {
  try {
    const data = await AsyncStorage.getItem(UNLOCKED_ENDINGS_KEY);
    if (data) {
      return JSON.parse(data) as UnlockedEndingsMap;
    }
    return {};
  } catch (error) {
    console.error('Failed to get unlocked endings:', error);
    return {};
  }
}

/**
 * Save an unlocked ending to storage
 */
export async function saveUnlockedEnding(
  endingType: EndingType,
  score: number,
  affection: number
): Promise<void> {
  try {
    const current = await getUnlockedEndings();

    // Only save if not already unlocked (preserve first unlock data)
    if (!current[endingType]) {
      current[endingType] = {
        unlockedAt: new Date().toISOString(),
        score,
        affection,
      };
      await AsyncStorage.setItem(UNLOCKED_ENDINGS_KEY, JSON.stringify(current));
    }
  } catch (error) {
    console.error('Failed to save unlocked ending:', error);
  }
}

/**
 * Check if a specific ending is unlocked
 */
export async function isEndingUnlocked(endingType: EndingType): Promise<boolean> {
  const unlocked = await getUnlockedEndings();
  return !!unlocked[endingType];
}

/**
 * Get the count of unlocked endings
 */
export async function getUnlockedEndingsCount(): Promise<number> {
  const unlocked = await getUnlockedEndings();
  return Object.keys(unlocked).length;
}

/**
 * Clear all unlocked endings (for testing/reset)
 */
export async function clearUnlockedEndings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(UNLOCKED_ENDINGS_KEY);
  } catch (error) {
    console.error('Failed to clear unlocked endings:', error);
  }
}
