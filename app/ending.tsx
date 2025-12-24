import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import { getEndingData, getEndingCategory, EndingCategory } from '../src/constants/endings';
import EndingScene from '../src/components/EndingScene';
import CharacterDisplay from '../src/components/CharacterDisplay';
import { saveUnlockedEnding } from '../src/services/endingStorage';
import { useBGM, BGMTrack } from '../src/contexts/BGMContext';

type ScreenState = 'scene' | 'results';

export default function EndingScreen() {
  const { score, affection, checkInCount, chatCount, user, getEndingType, resetGame } = useGame();
  const { fadeToTrack } = useBGM();

  const [screenState, setScreenState] = useState<ScreenState>('scene');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const endingType = getEndingType();
  const endingData = getEndingData(endingType);
  const endingCategory = getEndingCategory(endingType);

  // Save unlocked ending on mount
  useEffect(() => {
    saveUnlockedEnding(endingType, score, affection);
  }, [endingType, score, affection]);

  // Play ending BGM based on category
  useEffect(() => {
    let endingBGM: BGMTrack;
    switch (endingCategory) {
      case 'BAD':
        endingBGM = 'ending_bad';
        break;
      case 'TRUE':
        endingBGM = 'ending_true';
        break;
      default:
        endingBGM = 'ending_good';
    }
    fadeToTrack(endingBGM);
  }, [endingCategory, fadeToTrack]);

  // Animate results screen on mount
  useEffect(() => {
    if (screenState === 'results') {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [screenState, fadeAnim, slideAnim]);

  const handleSceneComplete = () => {
    setScreenState('results');
  };

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < level ? 'heart' : 'heart-outline'}
        size={24}
        color="#ff4757"
      />
    ));
  };

  const shareResults = () => {
    router.push('/share');
  };

  const playAgain = () => {
    resetGame();
    router.replace('/');
  };

  const replayOpening = () => {
    router.push('/opening?replay=true');
  };

  // Get background color based on ending category
  const getResultsBackgroundColor = (): string => {
    switch (endingCategory) {
      case 'BAD':
        return '#2c2c2c';
      case 'NORMAL':
        return '#4a5568';
      case 'GOOD':
        return '#48bb78';
      case 'TRUE':
        return '#f56565';
      default:
        return '#4a5568';
    }
  };

  // Get final expression for results screen
  const getFinalExpression = () => {
    switch (endingCategory) {
      case 'BAD':
        return 'sad' as const;
      case 'NORMAL':
        return 'neutral' as const;
      case 'GOOD':
        return 'happy' as const;
      case 'TRUE':
        return 'shy' as const;
      default:
        return 'neutral' as const;
    }
  };

  // Show ending scene first
  if (screenState === 'scene') {
    return (
      <EndingScene
        endingData={endingData}
        onComplete={handleSceneComplete}
        nickname={user?.nickname}
      />
    );
  }

  // Show results screen
  return (
    <View style={[styles.container, { backgroundColor: getResultsBackgroundColor() }]}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.endingContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Ending Title */}
          <Text style={styles.endingType}>{endingData.title}</Text>
          <Text style={styles.endingSubtitle}>{endingData.subtitle}</Text>

          {/* Character Section */}
          <View style={styles.characterSection}>
            <CharacterDisplay expression={getFinalExpression()} />
          </View>

          {/* Results */}
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>最終結果</Text>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>総合スコア</Text>
              <Text style={styles.statValue}>{score}pt</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>最終好感度</Text>
              <View style={styles.heartsContainer}>
                {renderStars(affection)}
              </View>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>チェックイン回数</Text>
              <Text style={styles.statValue}>{checkInCount}回</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>会話回数</Text>
              <Text style={styles.statValue}>{chatCount}回</Text>
            </View>

            {/* Ending ID hint */}
            <View style={styles.endingIdContainer}>
              <Text style={styles.endingIdLabel}>ENDING</Text>
              <Text style={styles.endingIdValue}>{endingType}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.shareButton} onPress={shareResults}>
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>シェア</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.replayButton} onPress={replayOpening}>
              <Ionicons name="play" size={20} color="#333" />
              <Text style={styles.replayButtonText}>復習</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playAgainButton} onPress={playAgain}>
              <Ionicons name="refresh" size={20} color="#333" />
              <Text style={styles.playAgainButtonText}>再挑戦</Text>
            </TouchableOpacity>
          </View>

          {/* Hint for other endings */}
          {endingCategory !== 'TRUE' && (
            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>
                {endingCategory === 'BAD' && 'もっとスポットを巡ってみよう'}
                {endingCategory === 'NORMAL' && '好感度を上げるとGOOD ENDに...'}
                {endingCategory === 'GOOD' && 'TRUE ENDは好感度MAX + 高スコアで解放'}
              </Text>
            </View>
          )}

          {/* TRUE END celebration */}
          {endingCategory === 'TRUE' && (
            <View style={styles.celebrationContainer}>
              <Text style={styles.celebrationText}>CONGRATULATIONS!</Text>
              <Text style={styles.celebrationSubtext}>TRUE END達成おめでとう！</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  endingContainer: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  endingType: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  endingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  characterSection: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
    height: 200,
    overflow: 'hidden',
  },
  resultsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  heartsContainer: {
    flexDirection: 'row',
  },
  endingIdContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  endingIdLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  endingIdValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4757',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  shareButton: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.3,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  replayButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.3,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  replayButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  playAgainButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.3,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  playAgainButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  hintContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    textAlign: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  celebrationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  celebrationSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
});
