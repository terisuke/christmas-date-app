import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../src/contexts/GameContext';
import CharacterDisplay from '../src/components/CharacterDisplay';
import { logDialogue, logNarration } from '../src/services/textLogStorage';
import { CHARACTER_BOTTOM, TEXT_AREA_HEIGHTS, Z_INDEX } from '../src/constants/vnLayout';

// Check if current time is within allowed game start window (JST 7:00-10:00)
function isWithinGameStartWindow(): boolean {
  // In development mode, always allow game start
  if (__DEV__) return true;

  const now = new Date();
  // Convert to JST (UTC+9)
  const jstOffset = 9 * 60; // JST is UTC+9
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const jstMinutes = (utcMinutes + jstOffset) % (24 * 60);
  const jstHour = Math.floor(jstMinutes / 60);

  // Allow start between 7:00 and 10:00 JST
  return jstHour >= 7 && jstHour < 10;
}

// Get current JST time as formatted string
function getJSTTimeString(): string {
  const now = new Date();
  const jstOffset = 9 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const jstMinutes = (utcMinutes + jstOffset) % (24 * 60);
  const jstHour = Math.floor(jstMinutes / 60);
  const jstMin = jstMinutes % 60;
  return `${jstHour.toString().padStart(2, '0')}:${jstMin.toString().padStart(2, '0')}`;
}

export default function OpeningScreen() {
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const isReplay = replay === 'true';

  const { startGame, isLoading } = useGame();
  const [nickname, setNickname] = useState('');
  const [showStory, setShowStory] = useState(isReplay);
  const [storyStep, setStoryStep] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [canStartGame, setCanStartGame] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  // Check time restriction on mount and every minute
  useEffect(() => {
    // Skip time check for replay mode
    if (isReplay) return;

    const checkTime = () => {
      setCanStartGame(isWithinGameStartWindow());
      setCurrentTime(getJSTTimeString());
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isReplay]);

  const storyTexts = [
    // Scene 1: Prologue introduction
    {
      speaker: '',
      text: '12月24日。冬の朝。\n街はクリスマスの飾りで彩られている。',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: '冬の朝の空気は、どこか甘い香りがする。\nどこかでホットワインを温めているのかもしれない。',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: '母さんから連絡があった。\n「おばさんに急な用事ができたから、\n　かおりちゃんを案内してあげて」',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: 'おばさんと従姉妹の子が、\n3泊4日で遊びに来ていたのは知っていた。\nでも、今日が最終日で、まさか自分が...',
      expression: 'neutral' as const,
    },
    // Scene 2: Kaori appears
    {
      speaker: '',
      text: 'ふと、ホテルのロビーの隅に\n黄色いニット帽をかぶった少女が見えた。',
      expression: 'neutral' as const,
    },
    {
      speaker: 'かおり',
      text: '...あ、あの...えっと...',
      expression: 'shy' as const,
    },
    {
      speaker: '',
      text: '彼女はきょろきょろと辺りを見回している。\n長い黒髪が、冬の光に揺れた。',
      expression: 'shy' as const,
    },
    // Scene 3: Introduction (formal)
    {
      speaker: 'かおり',
      text: '...あの、お兄さん...ですか？\n...北海道から来た、雪村かおりです...',
      expression: 'shy' as const,
    },
    {
      speaker: 'かおり',
      text: '...すみません、急に一人で観光することになって...\nおばさん、どうしても外せない用事ができたみたいで...',
      expression: 'shy' as const,
    },
    {
      speaker: 'かおり',
      text: '...えっと、ご迷惑でなければ...\n今日、一緒に回っていただけますか...',
      expression: 'shy' as const,
    },
    // Scene 4: Kaori's background (through narration)
    {
      speaker: '',
      text: '彼女は北海道の小樽から来たらしい。\n初めての九州旅行の最終日。',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: 'おとなしくて人見知りだけど、\n綺麗なものを見ると目を輝かせる。\n...そんな子だと、母さんから聞いていた。',
      expression: 'neutral' as const,
    },
    // Scene 5: Establishing connection
    {
      speaker: 'かおり',
      text: '...こっちは暖かいですね。\n小樽は今頃、雪がなまら...あっ',
      expression: 'neutral' as const,
    },
    {
      speaker: 'かおり',
      text: '...今の、聞かなかったことにしてください...',
      expression: 'shy' as const,
    },
    {
      speaker: 'かおり',
      text: '...あの、お兄さん。\nクリスマスって、どんな感じですか...ここは',
      expression: 'thinking' as const,
    },
    {
      speaker: 'かおり',
      text: '...イルミネーション、見てみたいです。\n...あと、ラーメンも...食べてみたい...',
      expression: 'shy' as const,
    },
    // Scene 6: Game premise
    {
      speaker: '',
      text: '彼女の瞳には、期待と不安が入り混じっている。\n知らない街で、初めて会う従兄弟と過ごすクリスマス。',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: 'でも、その眼差しの奥には、\nどこか楽しみにしているような光も見えた。',
      expression: 'neutral' as const,
    },
    // Scene 7: The promise
    {
      speaker: 'かおり',
      text: '...あの、お兄さん。\n今日...よろしくお願いします。',
      expression: 'shy' as const,
    },
    {
      speaker: '',
      text: 'かおりとの、9時間のクリスマスが始まる。\n街を巡って、最高の思い出を作ろう。',
      expression: 'happy' as const,
    },
  ];

  const handleNicknameSubmit = async () => {
    if (nickname.trim()) {
      setIsStarting(true);
      try {
        await startGame(nickname.trim());
        setShowStory(true);
      } catch (error) {
        console.error('Start game error:', error);
        // Still proceed with local-only mode
        setShowStory(true);
      } finally {
        setIsStarting(false);
      }
    }
  };

  // Log story text to text log
  const lastLoggedStep = useRef(-1);
  useEffect(() => {
    if (showStory && storyStep !== lastLoggedStep.current) {
      lastLoggedStep.current = storyStep;
      const currentStory = storyTexts[storyStep];

      if (currentStory.speaker) {
        logDialogue(currentStory.speaker, currentStory.text, currentStory.expression, 'opening');
      } else {
        logNarration(currentStory.text, 'opening');
      }
    }
  }, [showStory, storyStep]);

  const nextStory = () => {
    if (storyStep < storyTexts.length - 1) {
      setStoryStep(storyStep + 1);
    } else {
      // Start game - navigate to main visual novel screen
      router.replace('/main');
    }
  };

  if (!showStory) {
    // Show time restriction message if outside allowed window
    if (!canStartGame) {
      return (
        <View style={styles.container}>
          <View style={styles.overlay}>
            <Text style={styles.timeRestrictionIcon}>🌙</Text>
            <Text style={styles.title}>ゲームを始められません</Text>
            <Text style={styles.timeRestrictionText}>
              このゲームは12月24日の朝を体験するゲームです。{'\n'}
              リアルタイムで進行するため、{'\n'}
              ゲームを開始できるのは{'\n\n'}
              <Text style={styles.timeHighlight}>午前7時〜10時（日本時間）</Text>
              {'\n\n'}の間のみとなっています。
            </Text>
            <Text style={styles.currentTimeText}>
              現在の時刻: {currentTime} (JST)
            </Text>
            <Text style={styles.comeBackText}>
              明日の朝、また来てください
            </Text>
            <TouchableOpacity
              style={styles.backToTitleButton}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.buttonText}>タイトルに戻る</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.overlay}>
            <Text style={styles.title}>ニックネーム入力</Text>
            <Text style={styles.subtitle}>かおりからどう呼ばれたい？</Text>

            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="ニックネームを入力"
              placeholderTextColor="#999"
              maxLength={10}
              autoCapitalize="none"
              editable={!isStarting}
            />

            <TouchableOpacity
              style={[styles.button, (!nickname.trim() || isStarting) && styles.buttonDisabled]}
              onPress={handleNicknameSubmit}
              disabled={!nickname.trim() || isStarting}
            >
              {isStarting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>決定</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  const currentStory = storyTexts[storyStep];

  const isNarration = !currentStory.speaker;

  return (
    <View style={styles.storyContainer}>
      {/* Back Button - only show in replay mode */}
      {isReplay && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
      )}

      {/* Character Layer - absolute positioned above text area */}
      {currentStory.speaker === 'かおり' && (
        <View style={styles.characterLayer}>
          <CharacterDisplay expression={currentStory.expression} />
        </View>
      )}

      {/* Spacer to push text area to bottom */}
      <View style={styles.spacer} />

      {/* Text Area - anchored to bottom */}
      <View style={[styles.textArea, isNarration && styles.narrationArea]}>
        {currentStory.speaker ? (
          <Text style={styles.speaker}>{currentStory.speaker}</Text>
        ) : null}
        <Text style={[styles.storyText, isNarration && styles.narrationText]}>
          {currentStory.text}
        </Text>

        <TouchableOpacity style={styles.nextButton} onPress={nextStory}>
          <Text style={styles.nextButtonText}>
            {storyStep < storyTexts.length - 1 ? '次へ' : 'ゲーム開始！'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FD', // Morning sky
  },
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    width: '80%',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Time restriction styles
  timeRestrictionIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  timeRestrictionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  timeHighlight: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: 18,
  },
  currentTimeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  comeBackText: {
    fontSize: 18,
    color: '#ff4757',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  backToTitleButton: {
    backgroundColor: '#4a5568',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  storyContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // VN Standard Layout - Character as background layer
  characterLayer: {
    position: 'absolute',
    bottom: CHARACTER_BOTTOM.opening,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: Z_INDEX.character,
  },
  spacer: {
    flex: 1,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    minHeight: TEXT_AREA_HEIGHTS.opening,
    zIndex: Z_INDEX.text,
  },
  narrationArea: {
    backgroundColor: 'rgba(30, 30, 50, 0.9)',
  },
  speaker: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: 10,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    marginBottom: 20,
  },
  narrationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  nextButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff4757',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
