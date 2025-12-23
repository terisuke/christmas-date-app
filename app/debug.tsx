/**
 * Debug Screen - Development Only
 *
 * Allows quick testing of all game features:
 * - Game state manipulation
 * - Direct ending access
 * - Spot event testing
 * - BGM playback
 * - Expression preview
 * - Screen navigation
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import { useBGM, BGMTrack } from '../src/contexts/BGMContext';
import { EndingType } from '../src/constants/endings';
import { SPOT_DATA } from '../src/constants/character';
import CharacterDisplay, { KaoriExpression } from '../src/components/CharacterDisplay';

// All ending types for testing
const ALL_ENDINGS: EndingType[] = [
  'BAD_A', 'BAD_B',
  'NORMAL_A', 'NORMAL_B', 'NORMAL_C', 'NORMAL_D', 'NORMAL_E',
  'GOOD_A', 'GOOD_B', 'GOOD_C', 'GOOD_D', 'GOOD_E',
  'TRUE',
];

// All BGM tracks
const ALL_BGM_TRACKS: BGMTrack[] = [
  'title', 'daily', 'event', 'romantic', 'sad',
  'ending_bad', 'ending_good', 'ending_true',
];

// All expressions
const ALL_EXPRESSIONS: KaoriExpression[] = [
  'neutral', 'happy', 'shy', 'surprised', 'sad', 'thinking',
];

// Preset game states for quick testing
const PRESETS = {
  bad: { score: 300, affection: 1, label: 'BAD END用' },
  normal: { score: 800, affection: 2, label: 'NORMAL END用' },
  good: { score: 1500, affection: 3, label: 'GOOD END用' },
  true: { score: 2000, affection: 5, label: 'TRUE END用' },
};

export default function DebugScreen() {
  const {
    score,
    affection,
    timeRemaining,
    checkInCount,
    chatCount,
    addScore,
    addAffection,
    resetGame,
  } = useGame();

  const { playBGM, stopBGM, currentTrack, isMuted } = useBGM();

  const [previewExpression, setPreviewExpression] = useState<KaoriExpression>('neutral');
  const [expandedSection, setExpandedSection] = useState<string | null>('state');

  // Format time remaining
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Apply preset game state
  const applyPreset = (preset: keyof typeof PRESETS) => {
    const { score: targetScore, affection: targetAffection } = PRESETS[preset];
    // Reset first, then set values
    const scoreDiff = targetScore - score;
    const affectionDiff = targetAffection - affection;
    if (scoreDiff !== 0) addScore(scoreDiff);
    if (affectionDiff !== 0) addAffection(affectionDiff);
    Alert.alert('適用完了', `${PRESETS[preset].label}の状態に設定しました`);
  };

  // Jump to ending with specific state
  const jumpToEnding = (endingType: EndingType) => {
    // Set appropriate state for the ending
    let targetScore = 0;
    let targetAffection = 1;

    // Determine required state for each ending
    if (endingType === 'TRUE') { targetScore = 2000; targetAffection = 5; }
    else if (endingType === 'GOOD_E') { targetScore = 1500; targetAffection = 5; }
    else if (endingType === 'GOOD_D') { targetScore = 2000; targetAffection = 4; }
    else if (endingType === 'GOOD_C') { targetScore = 1500; targetAffection = 4; }
    else if (endingType === 'GOOD_B') { targetScore = 1500; targetAffection = 3; }
    else if (endingType === 'GOOD_A') { targetScore = 1500; targetAffection = 2; }
    else if (endingType === 'NORMAL_E') { targetScore = 500; targetAffection = 5; }
    else if (endingType === 'NORMAL_D') { targetScore = 500; targetAffection = 4; }
    else if (endingType === 'NORMAL_C') { targetScore = 800; targetAffection = 3; }
    else if (endingType === 'NORMAL_B') { targetScore = 800; targetAffection = 2; }
    else if (endingType === 'NORMAL_A') { targetScore = 800; targetAffection = 1; }
    else if (endingType === 'BAD_B') { targetScore = 300; targetAffection = 2; }
    else if (endingType === 'BAD_A') { targetScore = 300; targetAffection = 1; }

    // Apply state changes
    const scoreDiff = targetScore - score;
    const affectionDiff = targetAffection - affection;
    if (scoreDiff !== 0) addScore(scoreDiff);
    if (affectionDiff !== 0) addAffection(affectionDiff);

    // Navigate to ending
    router.push('/ending');
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Section header component
  const SectionHeader = ({ title, section, icon }: { title: string; section: string; icon: string }) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionHeaderLeft}>
        <Ionicons name={icon as any} size={20} color="#ff4757" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Ionicons
        name={expandedSection === section ? 'chevron-up' : 'chevron-down'}
        size={20}
        color="#666"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debug Menu</Text>
        <View style={styles.devBadge}>
          <Text style={styles.devBadgeText}>DEV</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Current State Display */}
        <View style={styles.stateDisplay}>
          <View style={styles.stateItem}>
            <Text style={styles.stateLabel}>Score</Text>
            <Text style={styles.stateValue}>{score}</Text>
          </View>
          <View style={styles.stateItem}>
            <Text style={styles.stateLabel}>Affection</Text>
            <Text style={styles.stateValue}>{affection}/5</Text>
          </View>
          <View style={styles.stateItem}>
            <Text style={styles.stateLabel}>Time</Text>
            <Text style={styles.stateValue}>{formatTime(timeRemaining)}</Text>
          </View>
          <View style={styles.stateItem}>
            <Text style={styles.stateLabel}>Check-ins</Text>
            <Text style={styles.stateValue}>{checkInCount}</Text>
          </View>
        </View>

        {/* Game State Manipulation */}
        <SectionHeader title="ゲーム状態操作" section="state" icon="game-controller" />
        {expandedSection === 'state' && (
          <View style={styles.sectionContent}>
            {/* Quick Presets */}
            <Text style={styles.subsectionTitle}>プリセット</Text>
            <View style={styles.buttonGrid}>
              {Object.entries(PRESETS).map(([key, preset]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.presetButton,
                    key === 'bad' && styles.preset_bad,
                    key === 'normal' && styles.preset_normal,
                    key === 'good' && styles.preset_good,
                    key === 'true' && styles.preset_true,
                  ]}
                  onPress={() => applyPreset(key as keyof typeof PRESETS)}
                >
                  <Text style={styles.presetButtonText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Manual Adjustments */}
            <Text style={styles.subsectionTitle}>手動調整</Text>
            <View style={styles.adjustRow}>
              <Text style={styles.adjustLabel}>スコア:</Text>
              <TouchableOpacity style={styles.adjustButton} onPress={() => addScore(-100)}>
                <Text style={styles.adjustButtonText}>-100</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustButton} onPress={() => addScore(100)}>
                <Text style={styles.adjustButtonText}>+100</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustButton} onPress={() => addScore(500)}>
                <Text style={styles.adjustButtonText}>+500</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.adjustRow}>
              <Text style={styles.adjustLabel}>好感度:</Text>
              <TouchableOpacity style={styles.adjustButton} onPress={() => addAffection(-1)}>
                <Text style={styles.adjustButtonText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustButton} onPress={() => addAffection(1)}>
                <Text style={styles.adjustButtonText}>+1</Text>
              </TouchableOpacity>
            </View>

            {/* Reset */}
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => {
                Alert.alert('リセット確認', 'ゲームをリセットしますか？', [
                  { text: 'キャンセル', style: 'cancel' },
                  { text: 'リセット', style: 'destructive', onPress: resetGame },
                ]);
              }}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.dangerButtonText}>ゲームリセット</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ending Jump */}
        <SectionHeader title="エンディング直接再生" section="endings" icon="flag" />
        {expandedSection === 'endings' && (
          <View style={styles.sectionContent}>
            <Text style={styles.hintText}>
              ※選択するとゲーム状態を自動設定してエンディング画面へ遷移します
            </Text>
            {/* BAD */}
            <Text style={styles.endingCategory}>BAD END</Text>
            <View style={styles.buttonRow}>
              {ALL_ENDINGS.filter(e => e.startsWith('BAD')).map(ending => (
                <TouchableOpacity
                  key={ending}
                  style={[styles.endingButton, styles.endingBad]}
                  onPress={() => jumpToEnding(ending)}
                >
                  <Text style={styles.endingButtonText}>{ending}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* NORMAL */}
            <Text style={styles.endingCategory}>NORMAL END</Text>
            <View style={styles.buttonRow}>
              {ALL_ENDINGS.filter(e => e.startsWith('NORMAL')).map(ending => (
                <TouchableOpacity
                  key={ending}
                  style={[styles.endingButton, styles.endingNormal]}
                  onPress={() => jumpToEnding(ending)}
                >
                  <Text style={styles.endingButtonText}>{ending}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* GOOD */}
            <Text style={styles.endingCategory}>GOOD END</Text>
            <View style={styles.buttonRow}>
              {ALL_ENDINGS.filter(e => e.startsWith('GOOD')).map(ending => (
                <TouchableOpacity
                  key={ending}
                  style={[styles.endingButton, styles.endingGood]}
                  onPress={() => jumpToEnding(ending)}
                >
                  <Text style={styles.endingButtonText}>{ending}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* TRUE */}
            <Text style={styles.endingCategory}>TRUE END</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.endingButton, styles.endingTrue]}
                onPress={() => jumpToEnding('TRUE')}
              >
                <Text style={styles.endingButtonText}>TRUE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Spot Events */}
        <SectionHeader title="スポットイベント再生" section="spots" icon="location" />
        {expandedSection === 'spots' && (
          <View style={styles.sectionContent}>
            {SPOT_DATA.map(spot => (
              <TouchableOpacity
                key={spot.id}
                style={[styles.spotButton, spot.is_secret && styles.spotSecret]}
                onPress={() => router.push({ pathname: '/event', params: { spotId: spot.id } })}
              >
                <Text style={styles.spotId}>{spot.id}</Text>
                <Text style={styles.spotName}>{spot.name}</Text>
                {spot.is_secret && <Text style={styles.secretBadge}>秘密</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* BGM Test */}
        <SectionHeader title="BGMテスト" section="bgm" icon="musical-notes" />
        {expandedSection === 'bgm' && (
          <View style={styles.sectionContent}>
            <Text style={styles.currentBgm}>
              再生中: {currentTrack || 'なし'} {isMuted && '(ミュート中)'}
            </Text>
            <View style={styles.buttonGrid}>
              {ALL_BGM_TRACKS.map(track => (
                <TouchableOpacity
                  key={track}
                  style={[
                    styles.bgmButton,
                    currentTrack === track && styles.bgmButtonActive,
                  ]}
                  onPress={() => playBGM(track)}
                >
                  <Text style={[
                    styles.bgmButtonText,
                    currentTrack === track && styles.bgmButtonTextActive,
                  ]}>
                    {track}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={stopBGM}>
              <Ionicons name="stop" size={16} color="#fff" />
              <Text style={styles.stopButtonText}>停止</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Expression Preview */}
        <SectionHeader title="表情プレビュー" section="expressions" icon="happy" />
        {expandedSection === 'expressions' && (
          <View style={styles.sectionContent}>
            <View style={styles.expressionPreview}>
              <CharacterDisplay expression={previewExpression} />
            </View>
            <Text style={styles.currentExpression}>現在: {previewExpression}</Text>
            <View style={styles.buttonGrid}>
              {ALL_EXPRESSIONS.map(expr => (
                <TouchableOpacity
                  key={expr}
                  style={[
                    styles.expressionButton,
                    previewExpression === expr && styles.expressionButtonActive,
                  ]}
                  onPress={() => setPreviewExpression(expr)}
                >
                  <Text style={styles.expressionButtonText}>{expr}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Screen Navigation */}
        <SectionHeader title="画面遷移" section="screens" icon="navigate" />
        {expandedSection === 'screens' && (
          <View style={styles.sectionContent}>
            <View style={styles.buttonGrid}>
              {[
                { route: '/', label: 'タイトル' },
                { route: '/opening', label: 'オープニング' },
                { route: '/main', label: 'メイン' },
                { route: '/map', label: 'マップ' },
                { route: '/chat', label: 'チャット' },
                { route: '/status', label: 'ステータス' },
                { route: '/settings', label: '設定' },
                { route: '/gallery', label: 'ギャラリー' },
                { route: '/achievements', label: 'アチーブメント' },
                { route: '/credits', label: 'クレジット' },
              ].map(item => (
                <TouchableOpacity
                  key={item.route}
                  style={styles.navButton}
                  onPress={() => router.push(item.route as any)}
                >
                  <Text style={styles.navButtonText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  devBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  devBadgeText: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  stateDisplay: {
    flexDirection: 'row',
    backgroundColor: '#2d2d44',
    padding: 15,
    justifyContent: 'space-around',
  },
  stateItem: {
    alignItems: 'center',
  },
  stateLabel: {
    color: '#888',
    fontSize: 10,
    marginBottom: 4,
  },
  stateValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2d2d44',
    padding: 15,
    marginTop: 1,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  sectionContent: {
    backgroundColor: '#252538',
    padding: 15,
  },
  subsectionTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
    marginTop: 10,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  preset_bad: { backgroundColor: '#2c2c2c' },
  preset_normal: { backgroundColor: '#4a5568' },
  preset_good: { backgroundColor: '#48bb78' },
  preset_true: { backgroundColor: '#f56565' },
  presetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  adjustLabel: {
    color: '#fff',
    width: 70,
  },
  adjustButton: {
    backgroundColor: '#4a5568',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 8,
  },
  adjustButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  dangerButton: {
    backgroundColor: '#e53e3e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  hintText: {
    color: '#888',
    fontSize: 11,
    marginBottom: 15,
  },
  endingCategory: {
    color: '#ff4757',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
  },
  endingButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 70,
    alignItems: 'center',
  },
  endingBad: { backgroundColor: '#2c2c2c' },
  endingNormal: { backgroundColor: '#4a5568' },
  endingGood: { backgroundColor: '#48bb78' },
  endingTrue: { backgroundColor: '#f56565' },
  endingButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  spotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3d3d5c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  spotSecret: {
    backgroundColor: '#5c3d5c',
  },
  spotId: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: 'bold',
    width: 30,
  },
  spotName: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  secretBadge: {
    color: '#ffd700',
    fontSize: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBgm: {
    color: '#888',
    fontSize: 12,
    marginBottom: 15,
  },
  bgmButton: {
    backgroundColor: '#3d3d5c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  bgmButtonActive: {
    backgroundColor: '#ff4757',
  },
  bgmButtonText: {
    color: '#fff',
    fontSize: 11,
  },
  bgmButtonTextActive: {
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#e53e3e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  stopButtonText: {
    color: '#fff',
    marginLeft: 8,
  },
  expressionPreview: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  currentExpression: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
  },
  expressionButton: {
    backgroundColor: '#3d3d5c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  expressionButtonActive: {
    backgroundColor: '#ff4757',
  },
  expressionButtonText: {
    color: '#fff',
    fontSize: 11,
  },
  navButton: {
    backgroundColor: '#3d3d5c',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  bottomPadding: {
    height: 50,
  },
});
