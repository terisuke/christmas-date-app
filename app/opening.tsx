import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../src/contexts/GameContext';
import CharacterDisplay from '../src/components/CharacterDisplay';
import { logDialogue, logNarration } from '../src/services/textLogStorage';

export default function OpeningScreen() {
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const isReplay = replay === 'true';

  const { startGame, isLoading } = useGame();
  const [nickname, setNickname] = useState('');
  const [showStory, setShowStory] = useState(isReplay);
  const [storyStep, setStoryStep] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

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
      <View style={styles.characterArea}>
        {/* Only show character when Kaori is speaking */}
        {currentStory.speaker === 'かおり' && (
          <CharacterDisplay expression={currentStory.expression} />
        )}
      </View>

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
  storyContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  characterArea: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
    overflow: 'hidden',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    minHeight: 200,
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
