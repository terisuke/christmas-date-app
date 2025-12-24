import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ENDINGS,
  EndingType,
  getEndingCategory,
  EndingDialogue,
} from '../src/constants/endings';
import { getUnlockedEndings } from '../src/services/endingStorage';
import CharacterDisplay from '../src/components/CharacterDisplay';

export default function GalleryDetailScreen() {
  const { ending } = useLocalSearchParams<{ ending: string }>();
  const endingType = ending as EndingType;

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUnlocked();
  }, [endingType]);

  const checkUnlocked = async () => {
    const unlocked = await getUnlockedEndings();
    setIsUnlocked(!!unlocked[endingType]);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>読み込み中...</Text>
          <View style={styles.placeholder} />
        </View>
      </View>
    );
  }

  if (!endingType || !ENDINGS[endingType]) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>エラー</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>エンディングが見つかりません</Text>
        </View>
      </View>
    );
  }

  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>未解放</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={64} color="#9ca3af" />
          <Text style={styles.errorText}>このエンディングはまだ解放されていません</Text>
          <TouchableOpacity
            style={styles.backToGalleryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToGalleryText}>ギャラリーに戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const endingData = ENDINGS[endingType];
  const category = getEndingCategory(endingType);

  const getCategoryColor = (): string => {
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

  const renderDialogue = (dialogue: EndingDialogue, index: number) => {
    const isNarration = !dialogue.speaker;

    return (
      <View
        key={index}
        style={[
          styles.dialogueItem,
          isNarration && styles.narrationItem,
        ]}
      >
        {!isNarration && (
          <View style={styles.dialogueHeader}>
            <View style={styles.expressionBadge}>
              <CharacterDisplay
                expression={dialogue.expression}
                avatarMode
                avatarSize={28}
              />
            </View>
            <Text style={styles.speakerName}>{dialogue.speaker}</Text>
          </View>
        )}
        <Text
          style={[
            styles.dialogueText,
            isNarration && styles.narrationText,
          ]}
        >
          {isNarration ? dialogue.text : `「${dialogue.text}」`}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCategoryColor() }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category} END</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Ending Info Card */}
        <View style={[styles.infoCard, { borderLeftColor: getCategoryColor() }]}>
          <Text style={[styles.endingTitle, { color: getCategoryColor() }]}>
            {endingData.title}
          </Text>
          <Text style={styles.endingSubtitle}>{endingData.subtitle}</Text>
          <View style={styles.endingIdRow}>
            <Text style={styles.endingIdLabel}>ENDING ID:</Text>
            <Text style={styles.endingIdValue}>{endingType}</Text>
          </View>
        </View>

        {/* Dialogues */}
        <View style={styles.dialoguesContainer}>
          <Text style={styles.dialoguesTitle}>シナリオ</Text>
          {endingData.dialogues.map(renderDialogue)}
        </View>

        {/* Final Message */}
        <View style={styles.finalMessageCard}>
          <Text style={styles.finalMessageLabel}>エンディングメッセージ</Text>
          <Text style={styles.finalMessageText}>「{endingData.finalMessage}」</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  backToGalleryButton: {
    marginTop: 20,
    backgroundColor: '#ff4757',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backToGalleryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  endingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  endingSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  endingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  endingIdLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  endingIdValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff4757',
  },
  dialoguesContainer: {
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
  dialoguesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dialogueItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  narrationItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  dialogueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expressionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  speakerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4757',
  },
  dialogueText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  narrationText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  finalMessageCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  finalMessageLabel: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 8,
  },
  finalMessageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#856404',
    fontStyle: 'italic',
  },
});
