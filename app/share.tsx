import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import { KAORI_ENDINGS } from '../src/constants/character';

export default function ShareScreen() {
  const { score, affection, checkInCount, chatCount, getEndingType, resetGame } = useGame();

  const endingType = getEndingType();
  const ending = KAORI_ENDINGS[endingType];

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < level ? 'star' : 'star-outline'}
        size={20}
        color="#ffb400"
      />
    ));
  };

  const getShareText = () => {
    const stars = '★'.repeat(affection) + '☆'.repeat(5 - affection);

    return `【かおりと福岡クリスマス】

${ending.title}
「${ending.kaoriMessage}」

スコア: ${score}pt
好感度: ${stars}
チェックイン: ${checkInCount}回

#かおりと福岡クリスマス #福岡 #クリスマスデート`;
  };

  const shareToTwitter = async () => {
    const text = encodeURIComponent(getShareText());
    const url = `https://twitter.com/intent/tweet?text=${text}`;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      try {
        await Share.share({
          message: getShareText(),
        });
      } catch (error) {
        Alert.alert('シェアエラー', 'シェアに失敗しました');
      }
    }
  };

  const shareGeneral = async () => {
    try {
      const result = await Share.share({
        message: getShareText(),
        title: 'かおりと福岡クリスマス - 結果',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      }
    } catch (error) {
      Alert.alert('シェアエラー', 'シェアに失敗しました');
    }
  };

  const copyToClipboard = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(getShareText());
        Alert.alert('コピー完了', 'クリップボードにコピーしました');
      } else {
        // For React Native, we use Share API
        await Share.share({
          message: getShareText(),
        });
      }
    } catch (error) {
      Alert.alert('コピーエラー', 'コピーに失敗しました');
    }
  };

  const goHome = () => {
    resetGame();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>結果をシェア</Text>
      </View>

      <View style={styles.content}>
        {/* Share Card */}
        <View style={styles.shareCard}>
          <Text style={styles.appTitle}>かおりと福岡クリスマス</Text>
          <Text style={styles.endingTitle}>{ending.title}</Text>
          <Text style={styles.kaoriMessage}>「{ending.kaoriMessage}」</Text>

          <View style={styles.resultsContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>最終スコア</Text>
              <Text style={styles.resultValue}>{score}pt</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>好感度</Text>
              <View style={styles.starsContainer}>
                {renderStars(affection)}
              </View>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>チェックイン</Text>
              <Text style={styles.resultValue}>{checkInCount}回</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>会話</Text>
              <Text style={styles.resultValue}>{chatCount}回</Text>
            </View>
          </View>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareButtonsContainer}>
          <TouchableOpacity
            style={[styles.shareButton, styles.twitterButton]}
            onPress={shareToTwitter}
          >
            <Ionicons name="logo-twitter" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Twitter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, styles.generalButton]}
            onPress={shareGeneral}
          >
            <Ionicons name="share-social" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>シェア</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, styles.copyButton]}
            onPress={copyToClipboard}
          >
            <Ionicons name="copy" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>コピー</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={goHome}>
          <Ionicons name="home" size={20} color="#fff" />
          <Text style={styles.homeButtonText}>タイトルに戻る</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ff4757',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  shareCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 30,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  endingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: 10,
  },
  kaoriMessage: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultsContainer: {
    width: '100%',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  shareButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  twitterButton: {
    backgroundColor: '#1da1f2',
  },
  generalButton: {
    backgroundColor: '#ff4757',
  },
  copyButton: {
    backgroundColor: '#6c757d',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  homeButton: {
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
