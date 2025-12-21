import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';

export type KaoriExpression = 'neutral' | 'happy' | 'shy' | 'surprised' | 'sad' | 'thinking';

interface CharacterDisplayProps {
  expression?: KaoriExpression;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean; // Deprecated - name/age/origin should be in monologue, not on character display
  timeOfDay?: 'morning' | 'afternoon' | 'night';
}

const SIZE_CONFIG: Record<string, { height: number; width: number }> = {
  small: { height: 150, width: 100 },
  medium: { height: 250, width: 170 },
  large: { height: 350, width: 240 },
};

// Emoji fallbacks when sprites aren't available
const EXPRESSION_EMOJI: Record<KaoriExpression, string> = {
  neutral: '(._. )',
  happy: '(*^_^*)',
  shy: '(*/ω＼*)',
  surprised: '(°o°)',
  sad: '(；_;)',
  thinking: '(・_・?)',
};

// Character sprite images - will fall back to emoji if images don't exist
const CHARACTER_SPRITES: Record<KaoriExpression, any> = {
  neutral: null, // Will be: require('../../assets/characters/kaori_neutral.png')
  happy: null,   // Will be: require('../../assets/characters/kaori_happy.png')
  shy: null,     // Will be: require('../../assets/characters/kaori_shy.png')
  surprised: null, // Will be: require('../../assets/characters/kaori_surprised.png')
  sad: null,     // Will be: require('../../assets/characters/kaori_sad.png')
  thinking: null, // Will be: require('../../assets/characters/kaori_thinking.png')
};

// Try to load sprites if they exist
try {
  CHARACTER_SPRITES.neutral = require('../../assets/characters/kaori_neutral.png');
  CHARACTER_SPRITES.happy = require('../../assets/characters/kaori_happy.png');
  CHARACTER_SPRITES.shy = require('../../assets/characters/kaori_shy.png');
  CHARACTER_SPRITES.surprised = require('../../assets/characters/kaori_surprised.png');
  CHARACTER_SPRITES.sad = require('../../assets/characters/kaori_sad.png');
  CHARACTER_SPRITES.thinking = require('../../assets/characters/kaori_thinking.png');
} catch {
  // Sprites not available yet, will use emoji fallback
}

export default function CharacterDisplay({
  expression = 'neutral',
  size = 'medium',
  showName = false,
  timeOfDay = 'afternoon',
}: CharacterDisplayProps) {
  const { height, width } = SIZE_CONFIG[size];
  const isNight = timeOfDay === 'night';
  const [spriteError, setSpriteError] = useState(false);

  const sprite = CHARACTER_SPRITES[expression];
  const hasSprite = sprite && !spriteError;

  return (
    <View style={styles.container}>
      <View style={[styles.characterContainer, { height, width }]}>
        {hasSprite ? (
          <Image
            source={sprite}
            style={styles.characterImage}
            resizeMode="contain"
            onError={() => setSpriteError(true)}
          />
        ) : (
          <View style={styles.emojiContainer}>
            <Text style={[styles.expressionEmoji, isNight && styles.emojiNight]}>
              {EXPRESSION_EMOJI[expression]}
            </Text>
            <Text style={[styles.expressionLabel, isNight && styles.labelNight]}>
              {expression}
            </Text>
            {Platform.OS === 'web' && (
              <Text style={styles.webNote}>※Web版はプレビューモード</Text>
            )}
          </View>
        )}

        {showName && (
          <View style={[styles.nameTag, isNight && styles.nameTagNight]}>
            <Text style={styles.characterName}>雪村 かおり</Text>
            <Text style={styles.characterInfo}>17歳 / 小樽出身</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  characterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  expressionEmoji: {
    fontSize: 48,
    color: '#555',
  },
  emojiNight: {
    color: '#ccc',
  },
  expressionLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  labelNight: {
    color: '#aaa',
  },
  webNote: {
    marginTop: 12,
    fontSize: 10,
    color: '#999',
  },
  nameTag: {
    position: 'absolute',
    bottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nameTagNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  characterName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  characterInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});
