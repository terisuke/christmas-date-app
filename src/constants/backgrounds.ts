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

// Default backgrounds - static require (Metro bundler requirement)
export const DEFAULT_BACKGROUNDS: BackgroundConfig = {
  day: require('../../assets/backgrounds/default_day.jpg'),
  night: require('../../assets/backgrounds/default_night.jpg'),
};

// Spot-specific backgrounds
// Keys match spot IDs from SPOT_DATA in character.ts
// Add images as they become available
export const SPOT_BACKGROUNDS: Record<string, BackgroundConfig> = {
  // Normal spots
  A: { day: null, night: null },
  B: { day: null, night: null },
  C: { day: null, night: null },
  D: { day: null, night: null },
  E: { day: null, night: null },
  F: { day: null, night: null },
  // Secret spots
  S1: { day: null, night: null },
  S2: { day: null, night: null },
  S3: { day: null, night: null },
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
