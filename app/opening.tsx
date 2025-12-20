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
    {
      speaker: 'かおり',
      text: '...え、えっと...おにいちゃん？\n北海道から来た、かおりです...',
      expression: 'shy' as const,
    },
    {
      speaker: 'かおり',
      text: 'あの...福岡のこと、全然わからないから...\nよろしくお願いします...',
      expression: 'neutral' as const,
    },
    {
      speaker: '説明',
      text: 'あなたは北海道の小樽から来た17歳のいとこ「雪村かおり」を\n福岡のクリスマスマーケットに案内することになった。',
      expression: 'neutral' as const,
    },
    {
      speaker: '説明',
      text: '制限時間は24時間。\n福岡の素敵なスポットを巡って、かおりとの思い出を作ろう！',
      expression: 'happy' as const,
    }
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

  return (
    <View style={styles.storyContainer}>
      <View style={styles.characterArea}>
        <CharacterDisplay
          expression={currentStory.expression}
          size="large"
        />
      </View>

      <View style={styles.textArea}>
        <Text style={styles.speaker}>{currentStory.speaker}</Text>
        <Text style={styles.storyText}>{currentStory.text}</Text>

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
