import React from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType } from 'react-native';

export type KaoriExpression = 'neutral' | 'happy' | 'shy' | 'surprised' | 'sad' | 'thinking';

interface CharacterDisplayProps {
  expression?: KaoriExpression;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

// Placeholder colors for each expression (used when images are not available)
const expressionColors: Record<KaoriExpression, string> = {
  neutral: '#e3f2fd',
  happy: '#fff9c4',
  shy: '#fce4ec',
  surprised: '#e8f5e9',
  sad: '#e0e0e0',
  thinking: '#f3e5f5',
};

// Expression descriptions for placeholder
const expressionDescriptions: Record<KaoriExpression, string> = {
  neutral: '...',
  happy: '*smile*',
  shy: '*blush*',
  surprised: '!?',
  sad: '...',
  thinking: '...',
};

export default function CharacterDisplay({
  expression = 'neutral',
  size = 'medium',
  showName = true,
}: CharacterDisplayProps) {
  const sizeStyles = {
    small: { width: 100, height: 140 },
    medium: { width: 150, height: 200 },
    large: { width: 200, height: 280 },
  };

  const dimensions = sizeStyles[size];

  // TODO: Replace with actual images when available
  // const expressionImages: Record<KaoriExpression, ImageSourcePropType> = {
  //   neutral: require('../../assets/images/kaori/neutral.png'),
  //   happy: require('../../assets/images/kaori/happy.png'),
  //   shy: require('../../assets/images/kaori/shy.png'),
  //   sad: require('../../assets/images/kaori/sad.png'),
  // };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.characterPlaceholder,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: expressionColors[expression],
          }
        ]}
      >
        {/* Placeholder content - replace with Image when assets are available */}
        <View style={styles.placeholderContent}>
          <View style={styles.faceArea}>
            <Text style={styles.expressionEmoji}>
              {expression === 'happy' ? '(*^_^*)' :
               expression === 'shy' ? '(*/w\\*)' :
               expression === 'surprised' ? '(°o°)' :
               expression === 'sad' ? '(;_;)' :
               expression === 'thinking' ? '(._.)?' : '(._.)'}
            </Text>
          </View>
          <Text style={styles.expressionText}>{expressionDescriptions[expression]}</Text>
        </View>

        {showName && (
          <View style={styles.nameTag}>
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
  characterPlaceholder: {
    borderRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceArea: {
    marginBottom: 10,
  },
  expressionEmoji: {
    fontSize: 24,
    color: '#666',
  },
  expressionText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  nameTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    width: '100%',
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
