import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ImageBackground, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../src/contexts/GameContext';
import CharacterDisplay from '../src/components/CharacterDisplay';

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
      text: '12月24日、午前9時。\n博多駅の改札前。',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: '冬の朝の空気は、どこか甘い香りがする。\n街のあちこちで、クリスマスの飾りが揺れている。',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: '今日は、北海道から来る親戚を迎えに来た。\n小樽に住む叔母さんの娘...従姉妹の子、らしい。',
      expression: 'neutral' as const,
    },
    // Scene 2: Kaori appears
    {
      speaker: '',
      text: 'ふと、改札の向こうに\n白いマフラーを巻いた少女が見えた。',
      expression: 'neutral' as const,
    },
    {
      speaker: 'かおり',
      text: '...あ、あの...えっと...',
      expression: 'shy' as const,
    },
    {
      speaker: '',
      text: '彼女はきょろきょろと辺りを見回している。\n長い黒髪が、冬の風に揺れた。',
      expression: 'shy' as const,
    },
    // Scene 3: Introduction
    {
      speaker: 'かおり',
      text: '...おにいちゃん？\n...北海道から来た、雪村かおりです...',
      expression: 'shy' as const,
    },
    {
      speaker: 'かおり',
      text: '...ごめんね、朝早くから。\n新幹線、なまら長くて...',
      expression: 'shy' as const,
    },
    {
      speaker: 'かおり',
      text: '...あっ、今「なまら」って言った？\n...聞かなかったことにして...',
      expression: 'shy' as const,
    },
    // Scene 4: Kaori's background
    {
      speaker: '',
      text: '雪村かおり、17歳。高校2年生。\n小樽で生まれ育った、北国の少女。',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: 'おとなしくて人見知りだけど、\n綺麗なものを見ると目を輝かせる。',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: '今日は一人で福岡まで来たらしい。\n初めての九州、初めての一人旅。',
      expression: 'neutral' as const,
    },
    // Scene 5: Establishing connection
    {
      speaker: 'かおり',
      text: '...福岡って、暖かいね。\n小樽は今頃、雪だよ...',
      expression: 'neutral' as const,
    },
    {
      speaker: 'かおり',
      text: '...ね、おにいちゃん。\n福岡のクリスマスって、どんな感じ？',
      expression: 'thinking' as const,
    },
    {
      speaker: 'かおり',
      text: '...イルミネーション、見てみたい。\n...ラーメンも...食べてみたい...',
      expression: 'shy' as const,
    },
    // Scene 6: Game premise
    {
      speaker: '',
      text: '彼女の瞳には、期待と不安が入り混じっている。\n知らない街で、知らない人と過ごすクリスマス。',
      expression: 'neutral' as const,
    },
    {
      speaker: '',
      text: 'でも、その眼差しの奥には、\nどこか寂しげな影も見えた気がした。',
      expression: 'neutral' as const,
    },
    // Scene 7: The promise
    {
      speaker: 'かおり',
      text: '...あの、おにいちゃん。\n今日...一緒にいてくれる？',
      expression: 'shy' as const,
    },
    {
      speaker: '',
      text: 'かおりとの、9時間のクリスマスデートが始まる。\n福岡の街を巡って、最高の思い出を作ろう。',
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
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400' }}
        style={styles.container}
        resizeMode="cover"
      >
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
      </ImageBackground>
    );
  }

  const currentStory = storyTexts[storyStep];

  const isNarration = !currentStory.speaker;

  return (
    <View style={styles.storyContainer}>
      <View style={styles.characterArea}>
        {/* Only show character when Kaori is speaking */}
        {currentStory.speaker === 'かおり' && (
          <CharacterDisplay
            expression={currentStory.expression}
            size="large"
          />
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
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
