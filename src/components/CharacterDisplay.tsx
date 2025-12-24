import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Character image aspect ratio (width:height = 1333:2000 = 0.6665)
const CHARACTER_ASPECT_RATIO = 1333 / 2000;
// Character width at 65% of screen width for proper VN display
const CHARACTER_WIDTH = SCREEN_WIDTH * 0.65;
// Height calculated from width to maintain aspect ratio
const CHARACTER_HEIGHT = CHARACTER_WIDTH / CHARACTER_ASPECT_RATIO;

export type KaoriExpression = 'neutral' | 'happy' | 'shy' | 'surprised' | 'sad' | 'thinking';

interface CharacterDisplayProps {
  expression?: KaoriExpression;
  style?: object;
  /** Avatar mode: Shows only the face portion for small icons */
  avatarMode?: boolean;
  /** Avatar size in pixels (default: 32) */
  avatarSize?: number;
}

// Static require - Metro bundler requires compile-time constants
const CHARACTER_SPRITES: Record<KaoriExpression, any> = {
  neutral: require('../../assets/characters/kaori_neutral.png'),
  happy: require('../../assets/characters/kaori_happy.png'),
  shy: require('../../assets/characters/kaori_shy.png'),
  surprised: require('../../assets/characters/kaori_surprised.png'),
  sad: require('../../assets/characters/kaori_sad.png'),
  thinking: require('../../assets/characters/kaori_thinking.png'),
};

// Emoji fallbacks when sprites fail to load
const EXPRESSION_EMOJI: Record<KaoriExpression, string> = {
  neutral: '(._. )',
  happy: '(*^_^*)',
  shy: '(*/ω＼*)',
  surprised: '(°o°)',
  sad: '(；_;)',
  thinking: '(・_・?)',
};

export default function CharacterDisplay({
  expression = 'neutral',
  style,
  avatarMode = false,
  avatarSize = 32,
}: CharacterDisplayProps) {
  const [imageError, setImageError] = useState(false);

  // Reset imageError when expression changes to allow retry
  useEffect(() => {
    setImageError(false);
  }, [expression]);

  const sprite = CHARACTER_SPRITES[expression];

  // Avatar mode: Show only the face portion
  if (avatarMode) {
    // Calculate scaled image size to show face
    // Face is roughly in top 15-20% of the full sprite
    // Scale image so face fills the avatar circle
    const imageWidth = avatarSize * 3;
    const imageHeight = imageWidth / CHARACTER_ASPECT_RATIO;

    if (imageError || !sprite) {
      // Simple emoji fallback for avatar
      return (
        <View style={[styles.avatarContainer, { width: avatarSize, height: avatarSize }, style]}>
          <Text style={[styles.avatarEmoji, { fontSize: avatarSize * 0.6 }]}>
            {EXPRESSION_EMOJI[expression]}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.avatarContainer, { width: avatarSize, height: avatarSize }, style]}>
        <Image
          source={sprite}
          style={{
            width: imageWidth,
            height: imageHeight,
            // Position to show face (top portion of sprite)
            marginTop: avatarSize * 0.2,
          }}
          resizeMode="contain"
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  // Fallback to emoji if image fails to load
  if (imageError || !sprite) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emojiContainer}>
          <Text style={styles.expressionEmoji}>{EXPRESSION_EMOJI[expression]}</Text>
          <Text style={styles.expressionLabel}>{expression}</Text>
          {Platform.OS === 'web' && (
            <Text style={styles.webNote}>※Web版はプレビューモード</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={sprite}
        style={styles.characterImage}
        resizeMode="contain"
        onError={() => setImageError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CHARACTER_WIDTH,
    height: CHARACTER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  characterImage: {
    width: CHARACTER_WIDTH,
    height: CHARACTER_HEIGHT,
  },
  avatarContainer: {
    borderRadius: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#fff0f1',
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  expressionEmoji: {
    fontSize: 64,
    color: '#555',
  },
  expressionLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textTransform: 'capitalize',
  },
  webNote: {
    marginTop: 12,
    fontSize: 10,
    color: '#999',
  },
});
