import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export type KaoriExpression = 'neutral' | 'happy' | 'shy' | 'surprised' | 'sad' | 'thinking';

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

// 時間帯別背景色
const TIME_BG: Record<string, string> = {
  morning: '#E8F4FD',
  afternoon: '#FFF8E7',
  night: '#1a1a2e',
};

// フォールバック用の絵文字（画像がない場合）
const EXPRESSION_EMOJI: Record<KaoriExpression, string> = {
  neutral: '(._. )',
  happy: '(*^_^*)',
  shy: '(*/ω＼*)',
  surprised: '(°o°)',
  sad: '(；_;)',
  thinking: '(・_・?)',
};

// 表情別画像（assets/images/kaori/に配置）
// 画像がない場合は絵文字フォールバックを使用
const EXPRESSION_IMAGES: Record<KaoriExpression, any> = {
  neutral: null, // require('../../assets/images/kaori/neutral.png'),
  happy: null,   // require('../../assets/images/kaori/happy.png'),
  shy: null,     // require('../../assets/images/kaori/shy.png'),
  surprised: null, // require('../../assets/images/kaori/surprised.png'),
  sad: null,     // require('../../assets/images/kaori/sad.png'),
  thinking: null, // require('../../assets/images/kaori/thinking.png'),
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
  const imageSource = EXPRESSION_IMAGES[expression];

  return (
    <View style={styles.container}>
      <View style={[styles.characterContainer, { height, backgroundColor: bgColor }]}>
        {imageSource ? (
          // 2D画像がある場合
          <Image
            source={imageSource}
            style={styles.characterImage}
            resizeMode="contain"
          />
        ) : (
          // フォールバック（絵文字）
          <View style={styles.emojiContainer}>
            <Text style={[styles.expressionEmoji, isNight && styles.emojiNight]}>
              {EXPRESSION_EMOJI[expression]}
            </Text>
            <Text style={[styles.expressionLabel, isNight && styles.labelNight]}>
              {expression}
            </Text>
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
  characterImage: {
    width: '100%',
    height: '100%',
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
