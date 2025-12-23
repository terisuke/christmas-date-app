/**
 * Text Log Storage Tests
 *
 * Tests for the text log storage service (VN dialogue history feature).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addTextLogEntry,
  loadTextLog,
  clearTextLog,
  logDialogue,
  logNarration,
  logChoice,
  logSystem,
  getRecentTextLog,
  TextLogEntry,
} from '../../src/services/textLogStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Text Log Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('loadTextLog', () => {
    it('returns empty array when no log exists', async () => {
      const result = await loadTextLog();
      expect(result).toEqual([]);
    });

    it('returns parsed log entries when they exist', async () => {
      const mockEntries: TextLogEntry[] = [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'かおり',
          text: 'テスト',
          timestamp: 1000,
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockEntries));

      const result = await loadTextLog();
      expect(result).toEqual(mockEntries);
    });

    it('returns empty array on parse error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const result = await loadTextLog();
      expect(result).toEqual([]);
    });
  });

  describe('addTextLogEntry', () => {
    it('adds new entry to empty log', async () => {
      await addTextLogEntry({
        type: 'dialogue',
        speaker: 'かおり',
        text: 'こんにちは',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].type).toBe('dialogue');
      expect(savedData[0].speaker).toBe('かおり');
      expect(savedData[0].text).toBe('こんにちは');
      expect(savedData[0].id).toBeDefined();
      expect(savedData[0].timestamp).toBeDefined();
    });

    it('appends to existing log', async () => {
      const existingEntries = [
        { id: '1', type: 'dialogue', speaker: 'かおり', text: '最初', timestamp: 1000 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingEntries));

      await addTextLogEntry({
        type: 'narration',
        speaker: '',
        text: '2番目',
      });

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[1].text).toBe('2番目');
    });

    it('limits log to 200 entries', async () => {
      const existingEntries = Array.from({ length: 200 }, (_, i) => ({
        id: String(i),
        type: 'dialogue' as const,
        speaker: 'かおり',
        text: `Entry ${i}`,
        timestamp: i * 1000,
      }));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingEntries));

      await addTextLogEntry({
        type: 'dialogue',
        speaker: 'かおり',
        text: 'New entry',
      });

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(200);
      expect(savedData[199].text).toBe('New entry');
    });
  });

  describe('logDialogue', () => {
    it('logs dialogue with speaker and expression', async () => {
      await logDialogue('かおり', '...えへへ', 'happy', 'main');

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData[0].type).toBe('dialogue');
      expect(savedData[0].speaker).toBe('かおり');
      expect(savedData[0].text).toBe('...えへへ');
      expect(savedData[0].expression).toBe('happy');
      expect(savedData[0].scene).toBe('main');
    });
  });

  describe('logNarration', () => {
    it('logs narration without speaker', async () => {
      await logNarration('冬の朝。', 'opening');

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData[0].type).toBe('narration');
      expect(savedData[0].speaker).toBe('');
      expect(savedData[0].text).toBe('冬の朝。');
      expect(savedData[0].scene).toBe('opening');
    });
  });

  describe('logChoice', () => {
    it('logs player choice', async () => {
      await logChoice('一緒に行こう', 'event_A');

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData[0].type).toBe('choice');
      expect(savedData[0].speaker).toBe('あなた');
      expect(savedData[0].text).toBe('一緒に行こう');
      expect(savedData[0].scene).toBe('event_A');
    });
  });

  describe('logSystem', () => {
    it('logs system message', async () => {
      await logSystem('セーブしました');

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData[0].type).toBe('system');
      expect(savedData[0].speaker).toBe('');
      expect(savedData[0].text).toBe('セーブしました');
    });
  });

  describe('clearTextLog', () => {
    it('removes log from storage', async () => {
      await clearTextLog();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('kaori_text_log');
    });
  });

  describe('getRecentTextLog', () => {
    it('returns last N entries', async () => {
      const entries = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        type: 'dialogue' as const,
        speaker: 'かおり',
        text: `Entry ${i}`,
        timestamp: i * 1000,
      }));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(entries));

      const result = await getRecentTextLog(10);
      expect(result).toHaveLength(10);
      expect(result[0].text).toBe('Entry 90');
      expect(result[9].text).toBe('Entry 99');
    });

    it('returns all entries if less than requested', async () => {
      const entries = [
        { id: '1', type: 'dialogue', speaker: 'かおり', text: 'Only one', timestamp: 1000 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(entries));

      const result = await getRecentTextLog(50);
      expect(result).toHaveLength(1);
    });
  });
});
