import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useGame } from '../src/contexts/GameContext';
import { getEndingData, getEndingCategory } from '../src/constants/endings';
import { getEndingCG, EndingCGCategory } from '../src/constants/backgrounds';

export default function ShareScreen() {
  const { score, affection, checkInCount, chatCount, getEndingType, resetGame } = useGame();
  const cardRef = useRef<View>(null);
  const cgRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCG, setIsSavingCG] = useState(false);

  const endingType = getEndingType();
  const ending = getEndingData(endingType);
  const endingCategory = getEndingCategory(endingType);
  const endingCG = getEndingCG(endingCategory as EndingCGCategory);

  // Get category color for card styling
  const getCategoryColor = () => {
    switch (endingCategory) {
      case 'TRUE': return '#ffd700';
      case 'GOOD': return '#ff4757';
      case 'NORMAL': return '#5f9ea0';
      case 'BAD': return '#696969';
      default: return '#ff4757';
    }
  };

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
    // Get last dialogue from Kaori for the share message
    const kaoriDialogues = ending.dialogues.filter(d => d.speaker === 'かおり');
    const lastKaoriLine = kaoriDialogues.length > 0
      ? kaoriDialogues[kaoriDialogues.length - 1].text
      : ending.finalMessage;

    return `【雪の降らない聖夜に】

${ending.title}: ${ending.subtitle}
「${lastKaoriLine}」

スコア: ${score}pt
好感度: ${stars}
チェックイン: ${checkInCount}回

#雪の降らない聖夜に #福岡 #クリスマスデート`;
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
        title: '雪の降らない聖夜に - 結果',
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

  // Capture card as image and share
  const shareWithImage = async () => {
    if (!cardRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '雪の降らない聖夜に - 結果をシェア',
        });
      } else {
        Alert.alert('エラー', 'このデバイスでは画像シェアができません');
      }
    } catch (error) {
      console.error('Share with image error:', error);
      Alert.alert('シェアエラー', '画像の作成に失敗しました');
    } finally {
      setIsCapturing(false);
    }
  };

  // Save card as image to device
  const saveToDevice = async () => {
    if (!cardRef.current || isSaving) return;

    setIsSaving(true);
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限エラー', '写真ライブラリへのアクセス権限が必要です');
        setIsSaving(false);
        return;
      }

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('保存完了', '画像を写真ライブラリに保存しました');
    } catch (error) {
      console.error('Save to device error:', error);
      Alert.alert('保存エラー', '画像の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // Save CG with results overlay to device
  const saveCGToDevice = async () => {
    if (!cgRef.current || isSavingCG) return;

    setIsSavingCG(true);
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限エラー', '写真ライブラリへのアクセス権限が必要です');
        setIsSavingCG(false);
        return;
      }

      const uri = await captureRef(cgRef, {
        format: 'png',
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('保存完了', 'エンディングCGを保存しました');
    } catch (error) {
      console.error('Save CG error:', error);
      Alert.alert('保存エラー', 'CGの保存に失敗しました');
    } finally {
      setIsSavingCG(false);
    }
  };

  // Share CG with results overlay
  const shareCGWithResults = async () => {
    if (!cgRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const uri = await captureRef(cgRef, {
        format: 'png',
        quality: 1,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '雪の降らない聖夜に - エンディングCGをシェア',
        });
      } else {
        Alert.alert('エラー', 'このデバイスでは画像シェアができません');
      }
    } catch (error) {
      console.error('Share CG error:', error);
      Alert.alert('シェアエラー', 'CGのシェアに失敗しました');
    } finally {
      setIsCapturing(false);
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* CG Card with overlay - Capturable for sharing */}
        {endingCG && (
          <View
            ref={cgRef}
            style={styles.cgCard}
            collapsable={false}
          >
            <Image source={endingCG} style={styles.cgImage} resizeMode="cover" />
            <View style={styles.cgOverlay}>
              <View style={[styles.cgBadge, { backgroundColor: getCategoryColor() }]}>
                <Text style={styles.cgBadgeText}>{endingCategory} END</Text>
              </View>
              <Text style={styles.cgTitle}>{ending.title}</Text>
              <Text style={styles.cgSubtitle}>{ending.subtitle}</Text>
              <View style={styles.cgStats}>
                <Text style={styles.cgStatText}>{score}pt | ★{affection} | {checkInCount}回</Text>
              </View>
              <Text style={styles.cgHashtag}>#雪の降らない聖夜に</Text>
            </View>
          </View>
        )}

        {/* CG Action Buttons */}
        {endingCG && (
          <View style={styles.cgButtonsContainer}>
            <TouchableOpacity
              style={[styles.cgButton, styles.cgSaveButton]}
              onPress={saveCGToDevice}
              disabled={isSavingCG}
            >
              {isSavingCG ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="download" size={20} color="#fff" />
              )}
              <Text style={styles.cgButtonText}>CG保存</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cgButton, styles.cgShareButton]}
              onPress={shareCGWithResults}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="share-social" size={20} color="#fff" />
              )}
              <Text style={styles.cgButtonText}>CGシェア</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Share Card - Capturable */}
        <View
          ref={cardRef}
          style={[styles.shareCard, { borderTopColor: getCategoryColor(), borderTopWidth: 4 }]}
          collapsable={false}
        >
          <Text style={styles.appTitle}>雪の降らない聖夜に</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}>
            <Text style={styles.categoryText}>{endingCategory} END</Text>
          </View>
          <Text style={styles.endingTitle}>{ending.title}</Text>
          <Text style={styles.endingSubtitle}>{ending.subtitle}</Text>
          <Text style={styles.kaoriMessage}>「{ending.finalMessage}」</Text>

          <View style={styles.resultsContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>最終スコア</Text>
              <Text style={[styles.resultValue, { color: getCategoryColor() }]}>{score}pt</Text>
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

          <Text style={styles.hashtag}>#雪の降らない聖夜に</Text>
        </View>

        {/* Share Buttons - Row 1: Image actions */}
        <View style={styles.shareButtonsContainer}>
          <TouchableOpacity
            style={[styles.shareButton, styles.imageShareButton]}
            onPress={shareWithImage}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="image" size={24} color="#fff" />
            )}
            <Text style={styles.shareButtonText}>画像シェア</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, styles.saveButton]}
            onPress={saveToDevice}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="download" size={24} color="#fff" />
            )}
            <Text style={styles.shareButtonText}>保存</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, styles.xButton]}
            onPress={shareToTwitter}
          >
            <Text style={styles.xIcon}>𝕏</Text>
            <Text style={styles.shareButtonText}>Xでポスト</Text>
          </TouchableOpacity>
        </View>

        {/* Share Buttons - Row 2: Text actions */}
        <View style={styles.shareButtonsContainer}>
          <TouchableOpacity
            style={[styles.shareButton, styles.generalButton]}
            onPress={shareGeneral}
          >
            <Ionicons name="share-social" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>テキスト</Text>
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
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // CG Card styles
  cgCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cgImage: {
    width: '100%',
    height: 300,
  },
  cgOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 15,
    alignItems: 'center',
  },
  cgBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  cgBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cgTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cgSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  cgStats: {
    marginTop: 5,
  },
  cgStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cgHashtag: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  cgButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  cgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  cgSaveButton: {
    backgroundColor: '#ff4757',
  },
  cgShareButton: {
    backgroundColor: '#9c27b0',
  },
  cgButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
    marginBottom: 5,
  },
  endingSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  imageShareButton: {
    backgroundColor: '#9c27b0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  xButton: {
    backgroundColor: '#000',
  },
  xIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  generalButton: {
    backgroundColor: '#ff4757',
  },
  copyButton: {
    backgroundColor: '#6c757d',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hashtag: {
    marginTop: 15,
    fontSize: 12,
    color: '#999',
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
