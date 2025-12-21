import { ImageSourcePropType } from 'react-native';

export type TimeOfDay = 'day' | 'night';

export interface BackgroundConfig {
  day: ImageSourcePropType | null;
  night: ImageSourcePropType | null;
}

// Fallback colors when images aren't available
export const FALLBACK_COLORS = {
  day: '#E8F4FD', // Light blue morning/afternoon sky
  night: '#1a1a2e', // Dark night sky
};

// Default backgrounds when not near any spot
// Will use fallback colors until images are created
export const DEFAULT_BACKGROUNDS: BackgroundConfig = {
  day: null, // Will be: require('../../assets/backgrounds/default_day.png')
  night: null, // Will be: require('../../assets/backgrounds/default_night.png')
};

// Spot-specific backgrounds
// Keys match spot IDs from SPOT_DATA in character.ts
// All null until images are created
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

// Try to load background images if they exist
// This will be populated as images are added
try {
  DEFAULT_BACKGROUNDS.day = require('../../assets/backgrounds/default_day.png');
} catch { /* Image not yet created */ }

try {
  DEFAULT_BACKGROUNDS.night = require('../../assets/backgrounds/default_night.png');
} catch { /* Image not yet created */ }

// Spot backgrounds - uncomment as images are added
// try { SPOT_BACKGROUNDS.A.day = require('../../assets/backgrounds/spot_A_day.png'); } catch {}
// try { SPOT_BACKGROUNDS.A.night = require('../../assets/backgrounds/spot_A_night.png'); } catch {}
// ... etc

// Get background for a spot based on time of day
// Returns null if no image available (caller should use fallback color)
export function getSpotBackground(spotId: string | null, timeOfDay: TimeOfDay): ImageSourcePropType | null {
  if (spotId && SPOT_BACKGROUNDS[spotId]) {
    const bg = SPOT_BACKGROUNDS[spotId][timeOfDay];
    if (bg) return bg;
  }

  // Try default background
  const defaultBg = DEFAULT_BACKGROUNDS[timeOfDay];
  if (defaultBg) return defaultBg;

  return null;
}

// Get fallback color when no image is available
export function getFallbackColor(timeOfDay: TimeOfDay): string {
  return FALLBACK_COLORS[timeOfDay];
}
