// Achievement System for Christmas Date App

export type AchievementId =
  | 'first_step'      // 初めの一歩
  | 'walker_2k'       // 2000歩達成
  | 'walker_5k'       // 5000歩達成
  | 'walker_10k'      // 健脚（10000歩）
  | 'chatterbox'      // おしゃべり（会話30回）
  | 'explorer'        // 探検家（全6スポット訪問）
  | 'secret_finder'   // 秘密発見（シークレットスポット）
  | 'all_spots'       // 完全制覇（全9スポット）
  | 'heart_opener'    // 心を開いて（好感度MAX）
  | 'true_end'        // TRUE END到達
  | 'collector'       // 思い出コレクター（全13エンディング）
  | 'speed_runner'    // 時間厳守（残り1時間以上でクリア）
  | 'high_scorer';    // ハイスコアラー（2000pt以上）

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  bonusPoints: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  first_step: {
    id: 'first_step',
    name: '初めの一歩',
    description: '初めてスポットにチェックインした',
    icon: '🚶',
    bonusPoints: 50,
    rarity: 'common',
  },
  walker_2k: {
    id: 'walker_2k',
    name: 'お散歩日和',
    description: '2,000歩歩いた',
    icon: '👟',
    bonusPoints: 30,
    rarity: 'common',
  },
  walker_5k: {
    id: 'walker_5k',
    name: 'ウォーカー',
    description: '5,000歩歩いた',
    icon: '🏃',
    bonusPoints: 50,
    rarity: 'rare',
  },
  walker_10k: {
    id: 'walker_10k',
    name: '健脚',
    description: '10,000歩歩いた',
    icon: '🦵',
    bonusPoints: 100,
    rarity: 'epic',
  },
  chatterbox: {
    id: 'chatterbox',
    name: 'おしゃべり',
    description: 'かおりと30回会話した',
    icon: '💬',
    bonusPoints: 50,
    rarity: 'rare',
  },
  explorer: {
    id: 'explorer',
    name: '探検家',
    description: '通常スポット6箇所を全て訪問した',
    icon: '🗺️',
    bonusPoints: 200,
    rarity: 'rare',
  },
  secret_finder: {
    id: 'secret_finder',
    name: '秘密発見',
    description: 'シークレットスポットを発見した',
    icon: '🔓',
    bonusPoints: 100,
    rarity: 'rare',
  },
  all_spots: {
    id: 'all_spots',
    name: '完全制覇',
    description: '全9スポットを訪問した',
    icon: '🏆',
    bonusPoints: 300,
    rarity: 'epic',
  },
  heart_opener: {
    id: 'heart_opener',
    name: '心を開いて',
    description: 'かおりの好感度をMAXにした',
    icon: '❤️',
    bonusPoints: 150,
    rarity: 'epic',
  },
  true_end: {
    id: 'true_end',
    name: 'TRUE END',
    description: 'TRUE ENDに到達した',
    icon: '👑',
    bonusPoints: 500,
    rarity: 'legendary',
  },
  collector: {
    id: 'collector',
    name: '思い出コレクター',
    description: '全13種類のエンディングを解放した',
    icon: '📸',
    bonusPoints: 1000,
    rarity: 'legendary',
  },
  speed_runner: {
    id: 'speed_runner',
    name: '時間厳守',
    description: '残り1時間以上を残してクリアした',
    icon: '⏰',
    bonusPoints: 50,
    rarity: 'common',
  },
  high_scorer: {
    id: 'high_scorer',
    name: 'ハイスコアラー',
    description: '2,000ポイント以上獲得した',
    icon: '🎯',
    bonusPoints: 100,
    rarity: 'epic',
  },
};

// Get achievement by ID
export function getAchievement(id: AchievementId): Achievement {
  return ACHIEVEMENTS[id];
}

// Get all achievements as array
export function getAllAchievements(): Achievement[] {
  return Object.values(ACHIEVEMENTS);
}

// Get achievements by rarity
export function getAchievementsByRarity(rarity: Achievement['rarity']): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(a => a.rarity === rarity);
}

// Rarity colors for UI
export const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common: '#9e9e9e',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
};

// Rarity labels for UI
export const RARITY_LABELS: Record<Achievement['rarity'], string> = {
  common: 'コモン',
  rare: 'レア',
  epic: 'エピック',
  legendary: 'レジェンダリー',
};
