import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import { useGame } from '../src/contexts/GameContext';
import CharacterDisplay from '../src/components/CharacterDisplay';

export default function HomeScreen() {
  const {
    score,
    affection,
    stepsToday,
    checkInCount,
    chatCount,
    timeRemaining,
    addSteps,
  } = useGame();

  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<'neutral' | 'happy' | 'shy' | 'sad'>('neutral');

  // Pedometer setup
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setupPedometer = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(isAvailable);

        if (isAvailable) {
          subscription = Pedometer.watchStepCount((result) => {
            addSteps(result.steps);
          });
        }
      } catch (error) {
        console.log('Pedometer not available:', error);
      }
    };

    setupPedometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [addSteps]);

  // Check for game over
  useEffect(() => {
    if (timeRemaining <= 0) {
      router.replace('/ending');
    }
  }, [timeRemaining]);

  // Update expression based on affection
  useEffect(() => {
    if (affection >= 4) {
      setCurrentExpression('happy');
    } else if (affection >= 3) {
      setCurrentExpression('shy');
    } else if (affection <= 1) {
      setCurrentExpression('sad');
    } else {
      setCurrentExpression('neutral');
    }
  }, [affection]);

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

  const goToMap = () => {
    router.push('/map');
  };

  const goToChat = () => {
    router.push('/chat');
  };

  const goToAR = () => {
    Alert.alert('AR機能', 'AR機能は開発中です', [{ text: 'OK' }]);
  };

  const getKaoriDialogue = () => {
    if (timeRemaining < 3600000) {
      return '...もう少しで...時間...';
    }
    if (checkInCount === 0) {
      return '...今日はよろしくね';
    }
    if (checkInCount >= 3) {
      return '...たくさん回ったね...楽しい';
    }
    return '...どこ行く？';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>かおりと福岡クリスマス</Text>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.timeContainer}>
          <Ionicons name="time" size={20} color="#ff4757" />
          <Text style={styles.timeText}>残り {formatTimeRemaining(timeRemaining)}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>スコア: {score}pt</Text>
        </View>
      </View>

      {/* Character Area */}
      <View style={styles.characterArea}>
        <CharacterDisplay expression={currentExpression} />

        <View style={styles.dialogueBox}>
          <Text style={styles.dialogueText}>「{getKaoriDialogue()}」</Text>
        </View>

        <View style={styles.affectionArea}>
          <Text style={styles.affectionLabel}>好感度</Text>
          <View style={styles.starsContainer}>
            {renderStars(affection)}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="footsteps" size={24} color="#4caf50" />
          <Text style={styles.statLabel}>歩数</Text>
          <Text style={styles.statValue}>{stepsToday.toLocaleString()}歩</Text>
          {!isPedometerAvailable && Platform.OS !== 'web' && (
            <Text style={styles.statNote}>センサー利用不可</Text>
          )}
        </View>

        <View style={styles.statItem}>
          <Ionicons name="location" size={24} color="#2196f3" />
          <Text style={styles.statLabel}>チェックイン</Text>
          <Text style={styles.statValue}>{checkInCount}回</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={24} color="#ff9800" />
          <Text style={styles.statLabel}>会話回数</Text>
          <Text style={styles.statValue}>{chatCount}回</Text>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navButton} onPress={goToMap}>
          <Ionicons name="map" size={30} color="#fff" />
          <Text style={styles.navButtonText}>マップ</Text>
          <Text style={styles.navButtonSubtext}>スポットを探す</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={goToChat}>
          <Ionicons name="chatbubbles" size={30} color="#fff" />
          <Text style={styles.navButtonText}>チャット</Text>
          <Text style={styles.navButtonSubtext}>かおりと話す</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={goToAR}>
          <Ionicons name="camera" size={30} color="#fff" />
          <Text style={styles.navButtonText}>ARモード</Text>
          <Text style={styles.navButtonSubtext}>写真を撮る</Text>
        </TouchableOpacity>
      </View>

      {/* Current Mission */}
      <View style={styles.missionContainer}>
        <Text style={styles.missionTitle}>現在のミッション</Text>
        <Text style={styles.missionText}>福岡のデートスポットを巡ってかおりとの思い出を作ろう！</Text>
        <View style={styles.missionProgress}>
          <Text style={styles.missionProgressText}>
            目標: 600pt以上でGOOD END
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (score / 600) * 100)}%` }]} />
          </View>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 15,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4757',
    marginLeft: 5,
  },
  scoreContainer: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  characterArea: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dialogueBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    marginBottom: 15,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: '#ff4757',
  },
  dialogueText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  affectionArea: {
    alignItems: 'center',
  },
  affectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  statNote: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 15,
  },
  navButton: {
    backgroundColor: '#ff4757',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  navButtonSubtext: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
    marginTop: 2,
  },
  missionContainer: {
    backgroundColor: '#fff3cd',
    margin: 15,
    marginBottom: 30,
    borderRadius: 15,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  missionText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 10,
  },
  missionProgress: {
    marginTop: 5,
  },
  missionProgressText: {
    fontSize: 12,
    color: '#6c5700',
    marginBottom: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
});
