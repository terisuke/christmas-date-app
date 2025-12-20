import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../../src/contexts/GameContext';
import { SPOT_DATA, KAORI_SPOT_REACTIONS } from '../../src/constants/character';
import CharacterDisplay from '../../src/components/CharacterDisplay';

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { checkedInSpots } = useGame();

  const spot = SPOT_DATA.find(s => s.id === id);
  const reaction = KAORI_SPOT_REACTIONS[id || ''];
  const isAlreadyCheckedIn = checkedInSpots.includes(id || '');

  if (!spot) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>スポット詳細</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>スポットが見つかりません</Text>
          <TouchableOpacity style={styles.backHomeButton} onPress={() => router.back()}>
            <Text style={styles.backHomeButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCheckIn = () => {
    if (isAlreadyCheckedIn) {
      Alert.alert('チェックイン済み', `${spot.name}は既にチェックイン済みです`);
      return;
    }

    // Navigate to event screen with spot data
    router.push({
      pathname: '/event',
      params: { spotId: id },
    });
  };

  const goBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>スポット詳細</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Spot Info */}
        <View style={styles.spotInfoCard}>
          <View style={styles.spotHeader}>
            <Text style={styles.spotName}>
              {spot.is_secret ? ' ' : ''}{spot.name}
            </Text>
            <View style={[styles.pointBadge, spot.is_secret && styles.secretBadge]}>
              <Text style={styles.pointText}>{spot.base_point}pt</Text>
            </View>
          </View>
          <Text style={styles.spotDescription}>{spot.description}</Text>
        </View>

        {/* Character Preview */}
        <View style={styles.characterArea}>
          <CharacterDisplay
            expression={reaction?.expression || 'neutral'}
            size="large"
          />
          <View style={styles.previewDialogue}>
            <Text style={styles.previewText}>
              「{reaction?.greeting || '...ここは...どんなところ？'}」
            </Text>
          </View>
        </View>

        {/* Check-in Button */}
        {isAlreadyCheckedIn ? (
          <View style={styles.checkedInContainer}>
            <Ionicons name="checkmark-circle" size={40} color="#4caf50" />
            <Text style={styles.checkedInText}>チェックイン済み</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
            <Ionicons name="location" size={24} color="#fff" />
            <Text style={styles.checkInButtonText}>チェックインしてイベントを見る</Text>
          </TouchableOpacity>
        )}

        {/* Event Info */}
        <View style={styles.eventPreview}>
          <Text style={styles.eventPreviewTitle}>イベント: {spot.event_script.title}</Text>
          <Text style={styles.eventPreviewText}>
            チェックインすると、かおりとの特別なイベントが発生します。
            選択肢によってポイントと好感度が変動します。
          </Text>
        </View>
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
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backHomeButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backHomeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spotInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  spotName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  pointBadge: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  secretBadge: {
    backgroundColor: '#ff9800',
  },
  pointText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  spotDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  characterArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewDialogue: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4757',
    width: '100%',
  },
  previewText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  checkInButton: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  checkedInContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  checkedInText: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 10,
  },
  eventPreview: {
    backgroundColor: '#e8f5e9',
    borderRadius: 15,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  eventPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  eventPreviewText: {
    fontSize: 12,
    color: '#388e3c',
    lineHeight: 18,
  },
});
