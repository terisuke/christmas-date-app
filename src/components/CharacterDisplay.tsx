import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import VRMCharacter, { VRMExpression } from './VRMCharacter';

export type KaoriExpression = VRMExpression;

interface CharacterDisplayProps {
  expression?: KaoriExpression;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'night';
}

// サイズ別の高さ
const SIZE_HEIGHT: Record<string, number> = {
  small: 150,
  medium: 250,
  large: 350,
};

// フォールバック用の絵文字
const EXPRESSION_EMOJI: Record<KaoriExpression, string> = {
  neutral: '(._. )',
  happy: '(*^_^*)',
  shy: '(*/ω＼*)',
  surprised: '(°o°)',
  sad: '(；_;)',
  thinking: '(・_・?)',
};

// フォールバック用の背景色
const EXPRESSION_BG: Record<KaoriExpression, string> = {
  neutral: '#e3f2fd',
  happy: '#fff9c4',
  shy: '#fce4ec',
  surprised: '#e8f5e9',
  sad: '#e0e0e0',
  thinking: '#f3e5f5',
};

// 時間帯別背景色
const TIME_BG: Record<string, string> = {
  morning: '#E8F4FD',
  afternoon: '#FFF8E7',
  night: '#1a1a2e',
};

export default function CharacterDisplay({
  expression = 'neutral',
  size = 'medium',
  showName = true,
  timeOfDay = 'afternoon',
}: CharacterDisplayProps) {
  const height = SIZE_HEIGHT[size];

  // ネイティブではVRMを試行（フォールバック内蔵）
  const useVRM = Platform.OS !== 'web';

  if (useVRM) {
    return (
      <View style={styles.container}>
        <VRMCharacter
          expression={expression}
          timeOfDay={timeOfDay}
          style={{ height }}
        />
        {showName && (
          <View style={[
            styles.nameTag,
            timeOfDay === 'night' && styles.nameTagNight
          ]}>
            <Text style={styles.characterName}>雪村 かおり</Text>
            <Text style={styles.characterInfo}>17歳 / 小樽出身</Text>
          </View>
        )}
      </View>
    );
  }

  // Webフォールバック
  const bgColor = timeOfDay ? TIME_BG[timeOfDay] : EXPRESSION_BG[expression];
  const isNight = timeOfDay === 'night';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.fallbackContainer,
          { height, backgroundColor: bgColor },
        ]}
      >
        <Text style={[styles.expressionEmoji, isNight && styles.emojiNight]}>
          {EXPRESSION_EMOJI[expression]}
        </Text>
        {showName && (
          <View style={[styles.nameTagFallback, isNight && styles.nameTagNight]}>
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
    width: '100%',
  },
  fallbackContainer: {
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  expressionEmoji: {
    fontSize: 48,
    color: '#555',
  },
  emojiNight: {
    color: '#ccc',
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
  nameTagFallback: {
    position: 'absolute',
    bottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
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
