import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ImageBackground } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import { SPOT_DATA, KAORI_SPOT_REACTIONS } from '../src/constants/character';
import CharacterDisplay, { KaoriExpression } from '../src/components/CharacterDisplay';
import { logDialogue, logChoice } from '../src/services/textLogStorage';
import { useBGM } from '../src/contexts/BGMContext';
import { getSpotBackground, getCurrentTimeOfDay, FALLBACK_COLORS } from '../src/constants/backgrounds';

interface Choice {
  text: string;
  points: number;
  affection: number;
  response: string;
  expression: KaoriExpression;
}

type EventPhase = 'dialogue' | 'choices' | 'response' | 'result';

export default function EventScreen() {
  const { spotId } = useLocalSearchParams<{ spotId: string }>();
  const { checkIn } = useGame();
  const { fadeToTrack } = useBGM();

  const spot = SPOT_DATA.find(s => s.id === spotId);
  const reaction = KAORI_SPOT_REACTIONS[spotId || ''];

  // Get spot-specific background based on time of day
  const timeOfDay = getCurrentTimeOfDay();
  const spotBackground = getSpotBackground(spotId || null, timeOfDay);
  const fallbackColor = FALLBACK_COLORS[timeOfDay];

  // Play event BGM on mount
  useEffect(() => {
    fadeToTrack('event');
  }, [fadeToTrack]);

  const [phase, setPhase] = useState<EventPhase>('dialogue');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [responseDisplayedText, setResponseDisplayedText] = useState('');
  const [isResponseTyping, setIsResponseTyping] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<KaoriExpression>(
    reaction?.expression || 'neutral'
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Default event data if spot not found
  const eventScript = spot?.event_script || {
    title: 'イベント',
    dialogue: ['...'],
    choices: [
      { text: '続ける', points: 0, affection: 0, response: '...うん' },
    ],
  };

  const dialogues = eventScript.dialogue;
  const choices = eventScript.choices;

  // Typewriter effect for dialogue
  useEffect(() => {
    if (phase !== 'dialogue' || !dialogues[dialogueIndex]) return;

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
  }, [dialogueIndex, dialogues, phase]);

  // Typewriter effect for response
  useEffect(() => {
    if (phase !== 'response' || !selectedChoice) return;

    const fullText = selectedChoice.response;
    let currentIndex = 0;
    setResponseDisplayedText('');
    setIsResponseTyping(true);

    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setResponseDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsResponseTyping(false);
        clearInterval(typingInterval);
      }
    }, 50); // 50ms per character

    return () => clearInterval(typingInterval);
  }, [phase, selectedChoice]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Log dialogue to text log when dialogue index changes
  const lastLoggedDialogue = useRef(-1);
  useEffect(() => {
    if (phase === 'dialogue' && dialogueIndex !== lastLoggedDialogue.current && dialogues[dialogueIndex]) {
      lastLoggedDialogue.current = dialogueIndex;
      const scene = `event_${spotId}`;
      logDialogue('かおり', dialogues[dialogueIndex], currentExpression, scene);
    }
  }, [dialogueIndex, phase, dialogues, spotId, currentExpression]);

  // Log response when shown
  const hasLoggedResponse = useRef(false);
  useEffect(() => {
    if (phase === 'response' && selectedChoice && !hasLoggedResponse.current) {
      hasLoggedResponse.current = true;
      const scene = `event_${spotId}`;
      logDialogue('かおり', selectedChoice.response, selectedChoice.expression, scene);
    }
    if (phase !== 'response') {
      hasLoggedResponse.current = false;
    }
  }, [phase, selectedChoice, spotId]);

  const handleTextAreaTap = () => {
    if (phase === 'dialogue') {
      if (isTyping) {
        // Skip typing animation, show full text immediately
        setDisplayedText(dialogues[dialogueIndex]);
        setIsTyping(false);
      } else if (dialogueIndex < dialogues.length - 1) {
        // Move to next dialogue
        setDialogueIndex(dialogueIndex + 1);
      } else {
        // Show choices
        setPhase('choices');
      }
    } else if (phase === 'response') {
      if (isResponseTyping) {
        // Skip typing animation, show full response immediately
        setResponseDisplayedText(selectedChoice?.response || '');
        setIsResponseTyping(false);
      } else {
        // Move to result phase
        setPhase('result');
      }
    }
  };

  const handleChoiceSelect = async (choice: Choice) => {
    setSelectedChoice(choice);

    // Log the player's choice
    const scene = `event_${spotId}`;
    logChoice(choice.text, scene);

    // Update expression based on choice's explicit expression setting
    setCurrentExpression(choice.expression);

    // Move to response phase (show Kaori's reaction first)
    setPhase('response');

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

  const handleContinue = () => {
    router.replace('/main');
  };

  if (!spot) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>イベントデータが見つかりません</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/main')}>
            <Text style={styles.backButtonText}>ホームに戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render content with or without background image
  const renderContent = () => (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Title Area */}
      <View style={styles.titleArea}>
        <Text style={styles.eventTitle}>{eventScript.title}</Text>
        <Text style={styles.spotName}>{spot.name}</Text>
      </View>

      {/* Character Layer - Positioned absolutely, anchored above text area (matching main.tsx) */}
      <View style={styles.characterLayer}>
        <CharacterDisplay expression={currentExpression} />
      </View>

      {/* Spacer to push text area to bottom */}
      <View style={styles.spacer} />

      {/* Text Area */}
      <View style={styles.textArea}>
        {phase === 'result' ? (
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
                  {(spot.base_point + (selectedChoice?.points || 0)) >= 0 ? '+' : ''}{spot.base_point + (selectedChoice?.points || 0)}pt
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

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>続ける</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : phase === 'response' ? (
          // Response screen - Kaori's reaction after choice
          <TouchableOpacity
            style={styles.dialogueContainer}
            onPress={handleTextAreaTap}
            activeOpacity={0.9}
          >
            <Text style={styles.speakerName}>かおり</Text>
            <Text style={styles.dialogueText}>「{responseDisplayedText}」</Text>
            {!isResponseTyping && (
              <View style={styles.tapIndicator}>
                <Text style={styles.tapIndicatorText}>タップで結果を見る</Text>
                <Ionicons name="chevron-down" size={16} color="#999" />
              </View>
            )}
          </TouchableOpacity>
        ) : phase === 'choices' ? (
          // Choices screen
          <View style={styles.choicesContainer}>
            <Text style={styles.choicesPrompt}>どう返事する？</Text>
            {choices.map((choice, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.choiceButton,
                  choice.affection < 0 && styles.choiceButtonNegative
                ]}
                onPress={() => handleChoiceSelect(choice as Choice)}
              >
                <Text style={styles.choiceArrow}>▶</Text>
                <Text style={styles.choiceText}>{choice.text}</Text>
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
      {phase === 'dialogue' && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setPhase('choices')}
        >
          <Text style={styles.skipButtonText}>スキップ</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  // Render with ImageBackground if available, otherwise with fallback color
  if (spotBackground) {
    return (
      <ImageBackground
        source={spotBackground}
        style={styles.container}
        resizeMode="cover"
      >
        {renderContent()}
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: fallbackColor }]}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  // VN Standard Layout - Character as background layer (matching main.tsx)
  characterLayer: {
    position: 'absolute',
    bottom: 220, // Position above the text area (minHeight: 250)
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  spacer: {
    flex: 1,
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
  choiceButtonNegative: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffcdd2',
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
