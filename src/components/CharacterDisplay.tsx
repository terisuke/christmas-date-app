import React, { Suspense, lazy } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';

export type KaoriExpression = 'neutral' | 'happy' | 'shy' | 'surprised' | 'sad' | 'thinking';

interface CharacterDisplayProps {
  expression?: KaoriExpression;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'night';
}

const SIZE_HEIGHT: Record<string, number> = {
  small: 150,
  medium: 250,
  large: 350,
};

const TIME_BG: Record<string, string> = {
  morning: '#E8F4FD',
  afternoon: '#FFF8E7',
  night: '#1a1a2e',
};

const EXPRESSION_EMOJI: Record<KaoriExpression, string> = {
  neutral: '(._. )',
  happy: '(*^_^*)',
  shy: '(*/ω＼*)',
  surprised: '(°o°)',
  sad: '(；_;)',
  thinking: '(・_・?)',
};

// VRMは実機のみで動的ロード（シミュレータ/Webではnull）
const VRMCharacter = Platform.select({
  ios: lazy(() => import('./VRMCharacter')),
  android: lazy(() => import('./VRMCharacter')),
  default: null,
});

// 実機判定：Expo Go以外のネイティブビルド、または本番環境
const isPhysicalDevice = (): boolean => {
  // Web は常にfalse
  if (Platform.OS === 'web') return false;

  // Expo Go で動作している場合はfalse（シミュレータ/エミュレータの可能性が高い）
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) return false;

  // 本番ビルドまたはDevelopment Buildの場合はtrue
  return true;
};

export default function CharacterDisplay({
  expression = 'neutral',
  size = 'medium',
  showName = true,
  timeOfDay = 'afternoon',
}: CharacterDisplayProps) {
  const height = SIZE_HEIGHT[size];
  const bgColor = TIME_BG[timeOfDay];
  const isNight = timeOfDay === 'night';

  // VRMを使用するかどうか
  const useVRM = VRMCharacter && isPhysicalDevice();

  return (
    <View style={styles.container}>
      <View style={[styles.characterContainer, { height, backgroundColor: bgColor }]}>
        {useVRM ? (
          <Suspense fallback={<ActivityIndicator size="large" color="#ff4757" />}>
            <VRMCharacter
              expression={expression}
              timeOfDay={timeOfDay}
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
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
    width: '100%',
  },
  characterContainer: {
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  emojiContainer: {
    alignItems: 'center',
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
