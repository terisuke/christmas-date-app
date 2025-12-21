import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import { KAORI_ENDINGS } from '../src/constants/character';
import CharacterDisplay from '../src/components/CharacterDisplay';

export default function EndingScreen() {
  const { score, affection, checkInCount, chatCount, getEndingType, resetGame } = useGame();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const endingType = getEndingType();
  const ending = KAORI_ENDINGS[endingType];

  const getBackgroundColor = () => {
    switch (endingType) {
      case 'BAD':
        return '#666666cc';
      case 'NORMAL':
        return '#4caf50cc';
      case 'GOOD':
        return '#ff4757cc';
      default:
        return '#666666cc';
    }
  };

  useEffect(() => {
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
  }, [fadeAnim, slideAnim]);

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < level ? 'star' : 'star-outline'}
        size={24}
        color="#ffb400"
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

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
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
          <Text style={styles.endingType}>{ending.title}</Text>
          <Text style={styles.endingMessage}>{ending.message}</Text>

          {/* Character Section */}
          <View style={styles.characterSection}>
            <CharacterDisplay expression={ending.expression} />
            <View style={styles.dialogueBox}>
              <Text style={styles.kaoriMessage}>「{ending.kaoriMessage}」</Text>
            </View>
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
              <View style={styles.starsContainer}>
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
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.shareButton} onPress={shareResults}>
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>結果をシェア</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playAgainButton} onPress={playAgain}>
              <Ionicons name="refresh" size={20} color="#333" />
              <Text style={styles.playAgainButtonText}>もう一度プレイ</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  endingMessage: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  characterSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  dialogueBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    minWidth: 200,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  kaoriMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 30,
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
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  shareButton: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  playAgainButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  playAgainButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
