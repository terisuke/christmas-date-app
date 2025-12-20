import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import { SPOT_DATA, KAORI_SPOT_REACTIONS } from '../src/constants/character';
import CharacterDisplay, { KaoriExpression } from '../src/components/CharacterDisplay';

interface Choice {
  text: string;
  points: number;
  affection: number;
}

export default function EventScreen() {
  const { spotId } = useLocalSearchParams<{ spotId: string }>();
  const { checkIn } = useGame();

  const spot = SPOT_DATA.find(s => s.id === spotId);
  const reaction = KAORI_SPOT_REACTIONS[spotId || ''];

  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showChoices, setShowChoices] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<KaoriExpression>(
    reaction?.expression || 'neutral'
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Default event data if spot not found
  const eventScript = spot?.event_script || {
    title: 'イベント',
    dialogue: ['...'],
    choices: [
      { text: '続ける', points: 0, affection: 0 },
    ],
  };

  const dialogues = eventScript.dialogue;
  const choices = eventScript.choices;

  // Typewriter effect
  useEffect(() => {
    if (!dialogues[dialogueIndex]) return;

    const fullText = dialogues[dialogueIndex];
    let currentIndex = 0;
    setDisplayedText('');
    setIsTyping(true);

    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 50); // 50ms per character

    return () => clearInterval(typingInterval);
  }, [dialogueIndex, dialogues]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleTextAreaTap = () => {
    if (isTyping) {
      // Skip typing animation, show full text immediately
      setDisplayedText(dialogues[dialogueIndex]);
      setIsTyping(false);
    } else if (dialogueIndex < dialogues.length - 1) {
      // Move to next dialogue
      setDialogueIndex(dialogueIndex + 1);
    } else {
      // Show choices
      setShowChoices(true);
    }
  };

  const handleChoiceSelect = async (choice: Choice) => {
    setSelectedChoice(choice);
    setShowChoices(false);
    setShowResult(true);

    // Update expression based on choice
    if (choice.affection >= 2) {
      setCurrentExpression('happy');
    } else if (choice.affection === 1) {
      setCurrentExpression('shy');
    } else if (choice.affection < 0) {
      setCurrentExpression('sad');
    }

    // Save check-in with the selected choice
    const basePoints = spot?.base_point || 100;
    const totalPoints = basePoints + choice.points;
    const choiceIndex = choices.findIndex(c => c.text === choice.text);

    try {
      await checkIn(spotId || '', totalPoints, choiceIndex, choice.affection);
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const getResultMessage = () => {
    if (!selectedChoice) return '';

    if (selectedChoice.affection >= 2) {
      return 'かおりはとても嬉しそう！';
    } else if (selectedChoice.affection === 1) {
      return 'かおりは少し照れている...';
    } else if (selectedChoice.affection === 0) {
      return 'かおりは普通に反応した';
    } else {
      return 'かおりは少し残念そう...';
    }
  };

  const getKaoriResponse = () => {
    if (!selectedChoice) return '...';

    if (selectedChoice.affection >= 2) {
      return '...うん、...嬉しい';
    } else if (selectedChoice.affection === 1) {
      return '...あ、...ありがと';
    } else if (selectedChoice.affection === 0) {
      return '...うん';
    } else {
      return '...そう...';
    }
  };

  const handleContinue = () => {
    router.replace('/home');
  };

  if (!spot) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>イベントデータが見つかりません</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/home')}>
            <Text style={styles.backButtonText}>ホームに戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background with title */}
      <View style={styles.titleArea}>
        <Text style={styles.eventTitle}>{eventScript.title}</Text>
        <Text style={styles.spotName}>{spot.name}</Text>
      </View>

      {/* Character Area */}
      <View style={styles.characterArea}>
        <CharacterDisplay expression={currentExpression} size="large" showName={false} />
      </View>

      {/* Text Area */}
      <View style={styles.textArea}>
        {showResult ? (
          // Result screen
          <View style={styles.resultContainer}>
            <Text style={styles.resultMessage}>{getResultMessage()}</Text>

            <View style={styles.resultStats}>
              <View style={styles.resultStatItem}>
                <Text style={styles.resultStatLabel}>獲得ポイント</Text>
                <Text style={[
                  styles.resultStatValue,
                  { color: (spot.base_point + (selectedChoice?.points || 0)) >= 0 ? '#4caf50' : '#f44336' }
                ]}>
                  +{spot.base_point + (selectedChoice?.points || 0)}pt
                </Text>
              </View>
              <View style={styles.resultStatItem}>
                <Text style={styles.resultStatLabel}>好感度変化</Text>
                <Text style={[
                  styles.resultStatValue,
                  { color: (selectedChoice?.affection || 0) >= 0 ? '#ff4757' : '#f44336' }
                ]}>
                  {(selectedChoice?.affection || 0) >= 0 ? '+' : ''}{selectedChoice?.affection || 0}
                </Text>
              </View>
            </View>

            <View style={styles.kaoriResponseBox}>
              <Text style={styles.speakerName}>かおり</Text>
              <Text style={styles.kaoriResponse}>「{getKaoriResponse()}」</Text>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>続ける</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : showChoices ? (
          // Choices screen
          <View style={styles.choicesContainer}>
            <Text style={styles.choicesPrompt}>どう返事する？</Text>
            {choices.map((choice, index) => (
              <TouchableOpacity
                key={index}
                style={styles.choiceButton}
                onPress={() => handleChoiceSelect(choice)}
              >
                <Text style={styles.choiceArrow}>▶</Text>
                <Text style={styles.choiceText}>{choice.text}</Text>
                <Text style={[
                  styles.choicePoints,
                  { color: choice.points >= 0 ? '#4caf50' : '#f44336' }
                ]}>
                  {choice.points >= 0 ? '+' : ''}{choice.points}pt
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Dialogue screen
          <TouchableOpacity
            style={styles.dialogueContainer}
            onPress={handleTextAreaTap}
            activeOpacity={0.9}
          >
            <Text style={styles.speakerName}>かおり</Text>
            <Text style={styles.dialogueText}>「{displayedText}」</Text>
            {!isTyping && (
              <View style={styles.tapIndicator}>
                <Text style={styles.tapIndicatorText}>
                  {dialogueIndex < dialogues.length - 1 ? 'タップで続ける' : 'タップして選択肢へ'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#999" />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Skip button (only during dialogue) */}
      {!showResult && !showChoices && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setShowChoices(true)}
        >
          <Text style={styles.skipButtonText}>スキップ</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  spotName: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
  },
  characterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    minHeight: 250,
  },
  dialogueContainer: {
    flex: 1,
  },
  speakerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: 10,
  },
  dialogueText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  tapIndicatorText: {
    fontSize: 12,
    color: '#999',
    marginRight: 5,
  },
  choicesContainer: {
    flex: 1,
  },
  choicesPrompt: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  choiceArrow: {
    fontSize: 12,
    color: '#ff4757',
    marginRight: 10,
  },
  choiceText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  choicePoints: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
  },
  resultMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  resultStatItem: {
    alignItems: 'center',
  },
  resultStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  resultStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  kaoriResponseBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4757',
  },
  kaoriResponse: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 12,
  },
});
