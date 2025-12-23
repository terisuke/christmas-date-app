import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ENDINGS,
  EndingType,
  getEndingCategory,
  EndingCategory,
} from '../src/constants/endings';
import {
  getUnlockedEndings,
  UnlockedEndingsMap,
  clearUnlockedEndings,
} from '../src/services/endingStorage';

const ALL_ENDING_TYPES: EndingType[] = [
  'BAD_A',
  'BAD_B',
  'NORMAL_A',
  'NORMAL_B',
  'NORMAL_C',
  'NORMAL_D',
  'NORMAL_E',
  'GOOD_A',
  'GOOD_B',
  'GOOD_C',
  'GOOD_D',
  'GOOD_E',
  'TRUE',
];

const TOTAL_ENDINGS = 13;

export default function GalleryScreen() {
  const [unlockedEndings, setUnlockedEndings] = useState<UnlockedEndingsMap>({});
  const [loading, setLoading] = useState(true);

  // Reload unlocked endings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUnlockedEndings();
    }, [])
  );

  const loadUnlockedEndings = async () => {
    setLoading(true);
    const data = await getUnlockedEndings();
    setUnlockedEndings(data);
    setLoading(false);
  };

  const unlockedCount = Object.keys(unlockedEndings).length;
  const completionPercent = Math.round((unlockedCount / TOTAL_ENDINGS) * 100);

  const getCategoryColor = (category: EndingCategory): string => {
    switch (category) {
      case 'BAD':
        return '#6b7280';
      case 'NORMAL':
        return '#3b82f6';
      case 'GOOD':
        return '#22c55e';
      case 'TRUE':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getCategoryBgColor = (category: EndingCategory): string => {
    switch (category) {
      case 'BAD':
        return '#f3f4f6';
      case 'NORMAL':
        return '#eff6ff';
      case 'GOOD':
        return '#f0fdf4';
      case 'TRUE':
        return '#fffbeb';
      default:
        return '#f3f4f6';
    }
  };

  const handleEndingPress = (endingType: EndingType, isUnlocked: boolean) => {
    if (!isUnlocked) {
      const category = getEndingCategory(endingType);
      let hint = '';
      switch (category) {
        case 'BAD':
          hint = 'スコアが低い時に到達できます';
          break;
        case 'NORMAL':
          hint = 'スコア600以上で到達できます';
          break;
        case 'GOOD':
          hint = '好感度とスコアを上げると到達できます';
          break;
        case 'TRUE':
          hint = '好感度MAX + 最高スコアで解放されます';
          break;
      }
      Alert.alert('未解放', `このエンディングはまだ解放されていません。\n\nヒント: ${hint}`);
      return;
    }

    // Navigate to view ending details or replay
    Alert.alert(
      ENDINGS[endingType].title,
      `${ENDINGS[endingType].subtitle}\n\n「${ENDINGS[endingType].finalMessage}」`,
      [
        { text: '閉じる', style: 'cancel' },
        {
          text: 'シナリオを見る',
          onPress: () => router.push(`/gallery-detail?ending=${endingType}` as any),
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'データ削除',
      '全てのエンディング解放データを削除しますか？\n\nこの操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await clearUnlockedEndings();
            await loadUnlockedEndings();
            Alert.alert('完了', 'エンディングデータを削除しました');
          },
        },
      ]
    );
  };

  const renderEndingCard = (endingType: EndingType) => {
    const isUnlocked = !!unlockedEndings[endingType];
    const ending = ENDINGS[endingType];
    const category = getEndingCategory(endingType);
    const categoryColor = getCategoryColor(category);
    const categoryBgColor = getCategoryBgColor(category);

    return (
      <TouchableOpacity
        key={endingType}
        style={[
          styles.endingCard,
          { backgroundColor: isUnlocked ? categoryBgColor : '#e5e7eb' },
        ]}
        onPress={() => handleEndingPress(endingType, isUnlocked)}
        activeOpacity={0.7}
      >
        {isUnlocked ? (
          <>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
            <Text style={[styles.endingTitle, { color: categoryColor }]}>
              {ending.title}
            </Text>
            <Text style={styles.endingSubtitle} numberOfLines={2}>
              {ending.subtitle}
            </Text>
            <View style={styles.unlockedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.unlockedText}>解放済み</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.lockedIcon}>
              <Ionicons name="lock-closed" size={32} color="#9ca3af" />
            </View>
            <Text style={styles.lockedText}>{category} END</Text>
            <Text style={styles.lockedHint}>???</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (
    title: string,
    endings: EndingType[],
    category: EndingCategory
  ) => {
    const sectionUnlocked = endings.filter((e) => unlockedEndings[e]).length;
    const categoryColor = getCategoryColor(category);

    return (
      <View style={styles.section} key={title}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: categoryColor }]}>{title}</Text>
          <Text style={styles.sectionCount}>
            {sectionUnlocked}/{endings.length}
          </Text>
        </View>
        <View style={styles.endingsGrid}>
          {endings.map(renderEndingCard)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>エンディングギャラリー</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>エンディングギャラリー</Text>
        <TouchableOpacity onPress={handleClearData} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>コンプリート率</Text>
            <Text style={styles.progressPercent}>{completionPercent}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${completionPercent}%` }]} />
          </View>
          <Text style={styles.progressCount}>
            {unlockedCount} / {TOTAL_ENDINGS} エンディング解放
          </Text>
          {completionPercent === 100 && (
            <View style={styles.completeMessage}>
              <Ionicons name="trophy" size={20} color="#f59e0b" />
              <Text style={styles.completeText}>全エンディングコンプリート!</Text>
            </View>
          )}
        </View>

        {/* Ending Sections */}
        {renderSection('TRUE END', ['TRUE'], 'TRUE')}
        {renderSection(
          'GOOD END',
          ['GOOD_A', 'GOOD_B', 'GOOD_C', 'GOOD_D', 'GOOD_E'],
          'GOOD'
        )}
        {renderSection(
          'NORMAL END',
          ['NORMAL_A', 'NORMAL_B', 'NORMAL_C', 'NORMAL_D', 'NORMAL_E'],
          'NORMAL'
        )}
        {renderSection('BAD END', ['BAD_A', 'BAD_B'], 'BAD')}

        {/* Hints */}
        <View style={styles.hintsCard}>
          <Text style={styles.hintsTitle}>エンディング解放条件</Text>
          <View style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.hintText}>TRUE: 好感度MAX + スコア1800以上</Text>
          </View>
          <View style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.hintText}>GOOD: 高好感度 + スコア1200以上</Text>
          </View>
          <View style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.hintText}>NORMAL: スコア600以上</Text>
          </View>
          <View style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: '#6b7280' }]} />
            <Text style={styles.hintText}>BAD: 低好感度 + スコア600未満</Text>
          </View>
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
  clearButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4757',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff4757',
    borderRadius: 5,
  },
  progressCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  completeMessage: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  completeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
  },
  endingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  endingCard: {
    width: '48%',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  endingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  endingSubtitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  unlockedText: {
    fontSize: 11,
    color: '#22c55e',
    marginLeft: 4,
  },
  lockedIcon: {
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9ca3af',
    textAlign: 'center',
  },
  lockedHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  hintsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hintsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  hintText: {
    fontSize: 13,
    color: '#666',
  },
});
