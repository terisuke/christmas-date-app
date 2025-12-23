import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllAchievements,
  Achievement,
  RARITY_COLORS,
  RARITY_LABELS,
  AchievementId,
} from '../src/constants/achievements';
import {
  loadUnlockedAchievements,
  getAchievementProgress,
} from '../src/services/achievementStorage';

export default function AchievementsScreen() {
  const [unlockedIds, setUnlockedIds] = useState<AchievementId[]>([]);
  const [progress, setProgress] = useState({ unlocked: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const unlocked = await loadUnlockedAchievements();
    const prog = await getAchievementProgress();
    setUnlockedIds(unlocked);
    setProgress(prog);
    setLoading(false);
  };

  const achievements = getAllAchievements();

  // Group by rarity
  const groupedAchievements = {
    legendary: achievements.filter(a => a.rarity === 'legendary'),
    epic: achievements.filter(a => a.rarity === 'epic'),
    rare: achievements.filter(a => a.rarity === 'rare'),
    common: achievements.filter(a => a.rarity === 'common'),
  };

  const isUnlocked = (id: AchievementId) => unlockedIds.includes(id);

  const renderAchievementCard = (achievement: Achievement) => {
    const unlocked = isUnlocked(achievement.id);

    return (
      <View
        key={achievement.id}
        style={[
          styles.achievementCard,
          !unlocked && styles.achievementCardLocked,
          { borderLeftColor: RARITY_COLORS[achievement.rarity] },
        ]}
      >
        <View style={styles.achievementIcon}>
          <Text style={[styles.iconText, !unlocked && styles.iconTextLocked]}>
            {unlocked ? achievement.icon : '🔒'}
          </Text>
        </View>

        <View style={styles.achievementInfo}>
          <View style={styles.achievementHeader}>
            <Text style={[styles.achievementName, !unlocked && styles.textLocked]}>
              {achievement.name}
            </Text>
            <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[achievement.rarity] }]}>
              <Text style={styles.rarityText}>{RARITY_LABELS[achievement.rarity]}</Text>
            </View>
          </View>

          <Text style={[styles.achievementDesc, !unlocked && styles.textLocked]}>
            {unlocked ? achievement.description : '???'}
          </Text>

          <Text style={[styles.bonusPoints, !unlocked && styles.textLocked]}>
            +{achievement.bonusPoints}pt
          </Text>
        </View>

        {unlocked && (
          <View style={styles.checkMark}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        )}
      </View>
    );
  };

  const renderSection = (title: string, items: Achievement[], rarity: Achievement['rarity']) => {
    if (items.length === 0) return null;

    const unlockedCount = items.filter(a => isUnlocked(a.id)).length;

    return (
      <View style={styles.section} key={rarity}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: RARITY_COLORS[rarity] }]} />
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>
            {unlockedCount}/{items.length}
          </Text>
        </View>
        {items.map(renderAchievementCard)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>アチーブメント</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>達成度</Text>
          <Text style={styles.progressText}>
            {progress.unlocked}/{progress.total} ({progress.percentage}%)
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: `${progress.percentage}%` },
            ]}
          />
        </View>
      </View>

      {/* Achievement List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : (
          <>
            {renderSection('レジェンダリー', groupedAchievements.legendary, 'legendary')}
            {renderSection('エピック', groupedAchievements.epic, 'epic')}
            {renderSection('レア', groupedAchievements.rare, 'rare')}
            {renderSection('コモン', groupedAchievements.common, 'common')}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#16213e',
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
  progressContainer: {
    backgroundColor: '#16213e',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 14,
  },
  progressText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffd700',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  sectionCount: {
    color: '#888',
    fontSize: 14,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  achievementCardLocked: {
    backgroundColor: '#1a1a1a',
    opacity: 0.7,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  iconTextLocked: {
    opacity: 0.5,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  achievementDesc: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  bonusPoints: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textLocked: {
    color: '#666',
  },
  checkMark: {
    marginLeft: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  bottomPadding: {
    height: 30,
  },
});
