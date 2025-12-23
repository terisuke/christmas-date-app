import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EndingData } from '../constants/endings';
import CharacterDisplay from './CharacterDisplay';
import { ENDING_BACKGROUND, getEndingCG } from '../constants/backgrounds';
import { logDialogue, logNarration } from '../services/textLogStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PlayMode = 'normal' | 'auto' | 'skip';
type ScenePhase = 'dialogue' | 'cg' | 'result';

interface EndingSceneProps {
  endingData: EndingData;
  onComplete: () => void;
  nickname?: string;
}

export default function EndingScene({ endingData, onComplete, nickname = '' }: EndingSceneProps) {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [scenePhase, setScenePhase] = useState<ScenePhase>('dialogue');
  const [playMode, setPlayMode] = useState<PlayMode>('normal');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cgFadeAnim = useRef(new Animated.Value(0)).current;
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dialogues = endingData.dialogues;
  const currentDialogue = dialogues[dialogueIndex];
  const endingCG = getEndingCG(endingData.category);

  // Replace {nickname} placeholder in text
  const processText = useCallback((text: string): string => {
    return text.replace(/{nickname}/g, nickname || 'お兄ちゃん');
  }, [nickname]);

  // Fade in animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Log dialogue to text log when dialogue index changes
  useEffect(() => {
    if (!currentDialogue) return;

    const text = processText(currentDialogue.text);
    const scene = `ending_${endingData.id}`;

    if (currentDialogue.speaker) {
      logDialogue(currentDialogue.speaker, text, currentDialogue.expression, scene);
    } else {
      logNarration(text, scene);
    }
  }, [dialogueIndex, currentDialogue, processText, endingData.id]);

  // Typewriter effect
  useEffect(() => {
    if (!currentDialogue) return;

    const fullText = processText(currentDialogue.text);
    let currentIndex = 0;
    setDisplayedText('');
    setIsTyping(true);

    // Skip mode: show text immediately
    if (playMode === 'skip') {
      setDisplayedText(fullText);
      setIsTyping(false);
      return;
    }

    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 40); // 40ms per character for smooth reading

    return () => clearInterval(typingInterval);
  }, [dialogueIndex, currentDialogue, processText, playMode]);

  // Animate CG fade in
  const showCGWithAnimation = useCallback(() => {
    setScenePhase('cg');
    setPlayMode('normal'); // Reset mode when entering CG phase
    Animated.timing(cgFadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [cgFadeAnim]);

  // Advance to next dialogue or complete scene
  const advanceDialogue = useCallback(() => {
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      // Dialogue complete - show CG if available, otherwise go to result
      if (endingCG) {
        showCGWithAnimation();
      } else {
        setScenePhase('result');
        setPlayMode('normal');
      }
    }
  }, [dialogueIndex, dialogues.length, endingCG, showCGWithAnimation]);

  // Auto mode: advance after text is complete
  useEffect(() => {
    if (playMode === 'auto' && !isTyping && scenePhase === 'dialogue') {
      autoTimerRef.current = setTimeout(() => {
        advanceDialogue();
      }, 2000); // 2 seconds delay
    }

    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
      }
    };
  }, [playMode, isTyping, scenePhase, dialogueIndex, advanceDialogue]);

  // Skip mode: rapid advance
  useEffect(() => {
    if (playMode === 'skip' && scenePhase === 'dialogue') {
      skipTimerRef.current = setInterval(() => {
        advanceDialogue();
      }, 200); // 200ms per dialogue in skip mode
    }

    return () => {
      if (skipTimerRef.current) {
        clearInterval(skipTimerRef.current);
      }
    };
  }, [playMode, scenePhase, advanceDialogue]);

  // Toggle play mode
  const toggleMode = (mode: PlayMode) => {
    if (playMode === mode) {
      setPlayMode('normal');
    } else {
      setPlayMode(mode);
    }
  };

  // Handle tap on text area
  const handleTextAreaTap = () => {
    // Disable tap during skip mode
    if (playMode === 'skip') return;

    if (isTyping) {
      // Skip typing, show full text immediately
      setDisplayedText(processText(currentDialogue.text));
      setIsTyping(false);
    } else {
      advanceDialogue();
    }
  };

  // Handle CG tap to advance to result
  const handleCGTap = () => {
    setScenePhase('result');
  };

  // Handle continue button
  const handleContinue = () => {
    onComplete();
  };

  const isNarration = currentDialogue?.speaker === '';
  const isDialoguePhase = scenePhase === 'dialogue';
  const isCGPhase = scenePhase === 'cg';
  const isResultPhase = scenePhase === 'result';

  // CG Phase - Full screen CG display
  if (isCGPhase && endingCG) {
    return (
      <TouchableOpacity
        style={styles.cgContainer}
        onPress={handleCGTap}
        activeOpacity={1}
      >
        <Animated.View style={[styles.cgWrapper, { opacity: cgFadeAnim }]}>
          <Image
            source={endingCG}
            style={styles.cgImage}
            resizeMode="cover"
          />
          {/* Ending title overlay on CG */}
          <View style={styles.cgTitleOverlay}>
            <Text style={styles.cgTitle}>{endingData.title}</Text>
            <Text style={styles.cgSubtitle}>{endingData.subtitle}</Text>
          </View>
          {/* Tap indicator */}
          <View style={styles.cgTapIndicator}>
            <Text style={styles.cgTapText}>タップで続ける</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <ImageBackground
      source={ENDING_BACKGROUND}
      style={styles.container}
      resizeMode="cover"
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
      {/* Title Area */}
      <View style={styles.titleArea}>
        <Animated.Text
          style={[
            styles.endingTitle,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {endingData.title}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.endingSubtitle,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {endingData.subtitle}
        </Animated.Text>
      </View>

      {/* Character Area - only show when Kaori is speaking */}
      <View style={styles.characterArea}>
        {currentDialogue?.speaker === 'かおり' && isDialoguePhase && (
          <CharacterDisplay expression={currentDialogue.expression} />
        )}
      </View>

      {/* Text/Result Area */}
      <View style={styles.bottomArea}>
        {isResultPhase ? (
          // Final result screen
          <View style={styles.resultContainer}>
            <Text style={styles.finalMessage}>{endingData.finalMessage}</Text>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>結果を見る</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Dialogue screen
          <TouchableOpacity
            style={[styles.textArea, isNarration && styles.narrationArea]}
            onPress={handleTextAreaTap}
            activeOpacity={0.9}
          >
            {currentDialogue?.speaker && (
              <Text style={styles.speakerName}>{currentDialogue.speaker}</Text>
            )}
            <Text style={[styles.dialogueText, isNarration && styles.narrationText]}>
              {isNarration ? displayedText : `「${displayedText}」`}
            </Text>

            {!isTyping && (
              <View style={styles.tapIndicator}>
                <Text style={styles.tapIndicatorText}>
                  {dialogueIndex < dialogues.length - 1 ? 'タップで続ける' : 'タップで終了'}
                </Text>
                <Text style={styles.tapIndicatorArrow}>▼</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Progress indicator */}
      {isDialoguePhase && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((dialogueIndex + 1) / dialogues.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {dialogueIndex + 1} / {dialogues.length}
          </Text>
        </View>
      )}

      {/* Mode Control Buttons */}
      {isDialoguePhase && (
        <View style={styles.modeControlContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              playMode === 'auto' && styles.modeButtonActive,
            ]}
            onPress={() => toggleMode('auto')}
          >
            <Ionicons
              name="play-forward"
              size={16}
              color={playMode === 'auto' ? '#fff' : 'rgba(255,255,255,0.7)'}
            />
            <Text
              style={[
                styles.modeButtonText,
                playMode === 'auto' && styles.modeButtonTextActive,
              ]}
            >
              AUTO
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              playMode === 'skip' && styles.modeButtonActive,
            ]}
            onPress={() => toggleMode('skip')}
          >
            <Ionicons
              name="play-skip-forward"
              size={16}
              color={playMode === 'skip' ? '#fff' : 'rgba(255,255,255,0.7)'}
            />
            <Text
              style={[
                styles.modeButtonText,
                playMode === 'skip' && styles.modeButtonTextActive,
              ]}
            >
              SKIP
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  // CG Phase styles
  cgContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cgWrapper: {
    flex: 1,
  },
  cgImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  cgTitleOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cgTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  cgSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  cgTapIndicator: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cgTapText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  titleArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  endingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  endingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  characterArea: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  bottomArea: {
    minHeight: 220,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    minHeight: 200,
  },
  narrationArea: {
    backgroundColor: 'rgba(30, 30, 50, 0.9)',
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
  narrationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
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
  tapIndicatorArrow: {
    fontSize: 10,
    color: '#999',
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 30,
    alignItems: 'center',
    minHeight: 200,
  },
  finalMessage: {
    fontSize: 18,
    lineHeight: 30,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 40,
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
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    alignItems: 'flex-end',
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  modeControlContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    gap: 4,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 71, 87, 0.8)',
  },
  modeButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
});
