import { ImageSourcePropType } from 'react-native';

export type TimeOfDay = 'day' | 'night';

export interface BackgroundConfig {
  day: ImageSourcePropType | null;
  night: ImageSourcePropType | null;
}

// Fallback colors when images aren't available
export const FALLBACK_COLORS = {
  day: '#E8F4FD',
  night: '#1a1a2e',
};

// Get current time of day based on JST 18:00 threshold
// Day: 6:00-17:59 JST, Night: 18:00-5:59 JST
export function getCurrentTimeOfDay(): TimeOfDay {
  const now = new Date();
  const jstOffset = 9 * 60; // JST is UTC+9
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utc + jstOffset * 60000);
  const hour = jst.getHours();

  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

// Get current JST hour (for display purposes)
export function getCurrentJSTHour(): number {
  const now = new Date();
  const jstOffset = 9 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utc + jstOffset * 60000);
  return jst.getHours();
}

// Default backgrounds - static require (Metro bundler requirement)
export const DEFAULT_BACKGROUNDS: BackgroundConfig = {
  day: require('../../assets/backgrounds/default_day.jpg'),
  night: require('../../assets/backgrounds/default_night.jpg'),
};

// Ending background (airport scene)
export const ENDING_BACKGROUND: ImageSourcePropType = require('../../assets/backgrounds/ending.jpg');

// Ending CG images by category
// These are shown at the climax of each ending
export type EndingCGCategory = 'BAD' | 'NORMAL' | 'GOOD' | 'TRUE';

export const ENDING_CG: Record<EndingCGCategory, ImageSourcePropType | null> = {
  BAD: require('../../assets/characters/ending_bad.jpeg'),
  NORMAL: require('../../assets/characters/ending_normal.jpeg'),
  GOOD: require('../../assets/characters/ending_good.jpeg'),
  TRUE: require('../../assets/characters/ending_true.jpeg'),
};

// Get ending CG by category
export function getEndingCG(category: EndingCGCategory): ImageSourcePropType | null {
  return ENDING_CG[category];
}

// Spot-specific backgrounds
// Keys match spot IDs from SPOT_DATA in character.ts
export const SPOT_BACKGROUNDS: Record<string, BackgroundConfig> = {
  // Normal spots
  A: {
    // 駅前クリスマスマーケット → 博多駅
    day: require('../../assets/backgrounds/hakatastation_day.jpg'),
    night: require('../../assets/backgrounds/hakatastation_night.jpg'),
  },
  B: {
    // 市役所前広場
    day: require('../../assets/backgrounds/cityhall_day.jpg'),
    night: require('../../assets/backgrounds/cityhall_night.jpg'),
  },
  C: {
    // 中央公園
    day: require('../../assets/backgrounds/centralpark_day.jpg'),
    night: require('../../assets/backgrounds/centralpark_night.jpg'),
  },
  D: {
    // 旧公会堂
    day: require('../../assets/backgrounds/guesthouse_day.jpg'),
    night: require('../../assets/backgrounds/guesthouse_night.jpg'),
  },
  E: {
    // ガーデンシティ → 大名エリア
    day: require('../../assets/backgrounds/daimyo_day.jpeg'),
    night: require('../../assets/backgrounds/daimyo_night.jpg'),
  },
  F: {
    // 展望タワー → 福岡タワー
    day: require('../../assets/backgrounds/fukuokatower_day.jpg'),
    night: require('../../assets/backgrounds/fukuokatower_night.jpeg'),
  },
  // Secret spots
  S1: {
    // 警固神社 (day only spot, use default for night)
    day: require('../../assets/backgrounds/kego_day.jpeg'),
    night: null, // day_only spot
  },
  S2: {
    // 恋愛成就の神社 → 櫛田神社
    day: require('../../assets/backgrounds/kushida_day.jpg'),
    night: require('../../assets/backgrounds/kushida_night.jpg'),
  },
  S3: {
    // 屋台街 (night only spot, use default for day)
    day: null, // night_only spot
    night: require('../../assets/backgrounds/yatai_night.jpg'),
  },
};

// Get background for a spot based on time of day
export function getSpotBackground(
  spotId: string | null,
  timeOfDay: TimeOfDay
): ImageSourcePropType | null {
  // Try spot-specific background first
  if (spotId && SPOT_BACKGROUNDS[spotId]) {
    const spotBg = SPOT_BACKGROUNDS[spotId][timeOfDay];
    if (spotBg) return spotBg;
  }

  // Fall back to default background
  return DEFAULT_BACKGROUNDS[timeOfDay];
}

// Get fallback color when no image is available
export function getFallbackColor(timeOfDay: TimeOfDay): string {
  return FALLBACK_COLORS[timeOfDay];
}
