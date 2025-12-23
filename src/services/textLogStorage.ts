/**
 * Text Log Storage Service
 *
 * Stores all dialogue shown in the visual novel for replay.
 * Standard VN feature that allows players to review missed dialogue.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEXT_LOG_KEY = 'kaori_text_log';
const MAX_LOG_ENTRIES = 200; // Keep last 200 entries

export type LogEntryType = 'dialogue' | 'narration' | 'choice' | 'system';

export interface TextLogEntry {
  id: string;
  type: LogEntryType;
  speaker: string; // Empty string for narration/system
  text: string;
  expression?: string; // Character expression at the time
  timestamp: number;
  scene?: string; // Optional scene identifier (main, event, ending, etc.)
}

/**
 * Generate unique ID for log entry
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a new entry to the text log
 */
export async function addTextLogEntry(
  entry: Omit<TextLogEntry, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const existing = await loadTextLog();

    const newEntry: TextLogEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };

    // Add new entry and limit to MAX_LOG_ENTRIES
    const updated = [...existing, newEntry].slice(-MAX_LOG_ENTRIES);

    await AsyncStorage.setItem(TEXT_LOG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to add text log entry:', error);
  }
}

/**
 * Add dialogue entry (character speaking)
 */
export async function logDialogue(
  speaker: string,
  text: string,
  expression?: string,
  scene?: string
): Promise<void> {
  await addTextLogEntry({
    type: 'dialogue',
    speaker,
    text,
    expression,
    scene,
  });
}

/**
 * Add narration entry (no speaker)
 */
export async function logNarration(
  text: string,
  scene?: string
): Promise<void> {
  await addTextLogEntry({
    type: 'narration',
    speaker: '',
    text,
    scene,
  });
}

/**
 * Add choice entry (player's choice)
 */
export async function logChoice(
  choiceText: string,
  scene?: string
): Promise<void> {
  await addTextLogEntry({
    type: 'choice',
    speaker: 'あなた',
    text: choiceText,
    scene,
  });
}

/**
 * Add system message
 */
export async function logSystem(
  text: string,
  scene?: string
): Promise<void> {
  await addTextLogEntry({
    type: 'system',
    speaker: '',
    text,
    scene,
  });
}

/**
 * Load all text log entries
 */
export async function loadTextLog(): Promise<TextLogEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(TEXT_LOG_KEY);
    if (!stored) return [];

    const entries: TextLogEntry[] = JSON.parse(stored);
    return entries;
  } catch (error) {
    console.error('Failed to load text log:', error);
    return [];
  }
}

/**
 * Get recent entries (for display)
 */
export async function getRecentTextLog(count: number = 50): Promise<TextLogEntry[]> {
  const all = await loadTextLog();
  return all.slice(-count);
}

/**
 * Clear text log (on game reset)
 */
export async function clearTextLog(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TEXT_LOG_KEY);
  } catch (error) {
    console.error('Failed to clear text log:', error);
  }
}

/**
 * Get entries by scene
 */
export async function getTextLogByScene(scene: string): Promise<TextLogEntry[]> {
  const all = await loadTextLog();
  return all.filter(entry => entry.scene === scene);
}
