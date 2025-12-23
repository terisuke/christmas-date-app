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
}: CharacterDisplayProps) {
  const [imageError, setImageError] = useState(false);

  // Reset imageError when expression changes to allow retry
  useEffect(() => {
    setImageError(false);
  }, [expression]);

  const sprite = CHARACTER_SPRITES[expression];

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
