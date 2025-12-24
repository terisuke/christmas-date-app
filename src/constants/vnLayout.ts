/**
 * VN (Visual Novel) Layout Constants
 *
 * These constants define the standard layout for visual novel screens
 * to ensure consistent character and text positioning across the app.
 *
 * Layout structure (from bottom to top):
 * - Bottom safe area / input (34px on iPhone with home indicator)
 * - Text area (dialogue box, choices, results)
 * - Character layer (positioned above text area)
 * - Content area (badges, title, etc.)
 */

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Safe area bottom (for devices with home indicator)
export const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 0;

// Text area heights for different screen types
export const TEXT_AREA_HEIGHTS = {
  /** Main screen: Dialogue box (~100px) + Chat input (~60px) + padding */
  main: 200,
  /** Event screen: Dialogue/choices/result area */
  event: 240,
  /** Opening screen: Story text area */
  opening: 220,
  /** Ending scene: Dialogue + result area */
  ending: 200,
};

// Character positioning - bottom edge distance from screen bottom
// Character should be positioned so their feet align with top of text area
export const CHARACTER_BOTTOM = {
  /** Main screen - above dialogue + chat input */
  main: TEXT_AREA_HEIGHTS.main + 20,
  /** Event screen - above choices/result area */
  event: TEXT_AREA_HEIGHTS.event + 30,
  /** Opening screen - above story text */
  opening: TEXT_AREA_HEIGHTS.opening + 20,
  /** Ending scene - above dialogue */
  ending: TEXT_AREA_HEIGHTS.ending + 10,
};

// Character sizing
export const CHARACTER_SIZE = {
  /** Character width as percentage of screen width */
  widthPercent: 0.65,
  /** Character aspect ratio (height / width) based on sprite dimensions */
  aspectRatio: 2000 / 1333, // ~1.5
};

// Calculate actual character dimensions
export const getCharacterDimensions = () => {
  const width = SCREEN_WIDTH * CHARACTER_SIZE.widthPercent;
  const height = width * CHARACTER_SIZE.aspectRatio;
  return { width, height };
};

// Z-index layers
export const Z_INDEX = {
  /** Background layer */
  background: 0,
  /** Character sprite layer */
  character: 1,
  /** UI overlay layer (badges, buttons) */
  ui: 5,
  /** Text/dialogue layer */
  text: 10,
  /** Menu/modal layer */
  menu: 100,
};
