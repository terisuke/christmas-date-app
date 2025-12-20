import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';

export default function StatusScreen() {
  const {
    score,
    affection,
    stepsToday,
    checkInCount,
    chatCount,
    checkedInSpots,
    totalSpots,
  } = useGame();

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < level ? 'heart' : 'heart-outline'}
        size={24}
        color={i < level ? '#ff4757' : '#ccc'}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ステータス</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>現在のスコア</Text>
          <Text style={styles.scoreValue}>{score}pt</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (score / 600) * 100)}%` }]} />
          </View>
          <Text style={styles.targetText}>目標: 600pt以上でGOOD END</Text>
        </View>

        {/* Affection Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>かおりの好感度</Text>
          <View style={styles.starsContainer}>{renderStars(affection)}</View>
          <Text style={styles.affectionHint}>
            {affection >= 4 ? 'とても仲良し!' :
             affection >= 3 ? '良い感じ' :
             affection >= 2 ? 'まあまあ' : 'もっと話そう!'}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="footsteps" size={32} color="#4caf50" />
            <Text style={styles.statValue}>{stepsToday.toLocaleString()}</Text>
            <Text style={styles.statLabel}>歩数</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="location" size={32} color="#2196f3" />
            <Text style={styles.statValue}>{checkInCount}</Text>
            <Text style={styles.statLabel}>チェックイン</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="chatbubbles" size={32} color="#ff9800" />
            <Text style={styles.statValue}>{chatCount}</Text>
            <Text style={styles.statLabel}>会話回数</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="map" size={32} color="#9c27b0" />
            <Text style={styles.statValue}>{checkedInSpots.length}/{totalSpots}</Text>
            <Text style={styles.statLabel}>スポット</Text>
          </View>
        </View>

        {/* Ending Preview */}
        <View style={styles.endingPreview}>
          <Text style={styles.endingTitle}>エンディング予測</Text>
          <Text style={styles.endingType}>
            {score >= 1800 ? 'TRUE END' :
             score >= 1200 ? 'GOOD END' :
             score >= 600 ? 'NORMAL END' : 'BAD END'}
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff4757',
    marginVertical: 10,
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 5,
  },
  targetText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  affectionHint: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  endingPreview: {
    backgroundColor: '#fff3cd',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: 20,
  },
  endingTitle: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  endingType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#856404',
  },
});
