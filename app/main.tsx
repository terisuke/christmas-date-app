import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
  Platform,
  ActivityIndicator,
  Keyboard,
  KeyboardEvent,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import CharacterDisplay from '../src/components/CharacterDisplay';
import { KaoriExpression } from '../src/components/CharacterDisplay';
import { AchievementNotification } from '../src/components/AchievementNotification';
import { TextLogModal } from '../src/components/TextLogModal';
import { sendChatMessage, getOpenRouterApiKey } from '../src/services/ai';
import { logDialogue, logChoice } from '../src/services/textLogStorage';
import { useBGM, BGMTrack } from '../src/contexts/BGMContext';
import {
  saveChatHistory,
  loadChatHistory,
  ChatMessage as StoredChatMessage,
  getRecentMessagesForAI,
} from '../src/services/chatStorage';
import { useNearestSpot } from '../src/hooks/useNearestSpot';
import { useActivityTracking } from '../src/hooks/useActivityTracking';
import { getSpotBackground, getFallbackColor, TimeOfDay } from '../src/constants/backgrounds';
import { CHARACTER_BOTTOM, Z_INDEX } from '../src/constants/vnLayout';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Debounce utility for chat history saving
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Kaori dialogue based on state
const getKaoriDialogue = (
  timeRemaining: number,
  lastActiveMinutes: number,
  checkInCount: number,
  expression: KaoriExpression,
  stepsToday: number = 0
): string => {
  const hoursLeft = timeRemaining / (1000 * 60 * 60);

  // Less than 1 hour remaining
  if (hoursLeft < 1) {
    return '...もうすぐ...帰らなきゃ...';
  }

  // Idle for 60+ minutes
  if (lastActiveMinutes >= 60) {
    return '...待ってたんだけど...';
  }

  // Step-based dialogue (priority if walked a lot)
  if (stepsToday >= 10000) {
    return '...すごい、なまら歩いたね...わたしも楽しい';
  }
  if (stepsToday >= 5000) {
    return '...けっこう歩いた...足、大丈夫？';
  }
  if (stepsToday >= 2000) {
    return '...いい感じに歩けてるね...';
  }

  // Expression-based dialogue
  switch (expression) {
    case 'happy':
      return '...えへへ...楽しいね';
    case 'shy':
      return '...そ、そんなこと言われると...';
    case 'thinking':
      return '...うーん...どうしよう';
    case 'sad':
      return '...ごめんね...';
    default:
      if (checkInCount === 0) {
        return '...今日はよろしくね';
      } else if (checkInCount >= 3) {
        return '...たくさん回ったね...楽しい';
      }
      return '...どこ行く？';
  }
};

export default function MainScreen() {
  const {
    user,
    score,
    affection,
    timeRemaining,
    checkInCount,
    chatCount,
    incrementChatCount,
    addScore,
    newlyUnlockedAchievements,
    dismissAchievementNotification,
    stepsToday,
  } = useGame();

  // GPS-based location tracking with approach detection
  const {
    nearestSpot,
    timeOfDay: gpsTimeOfDay,
    locationEnabled,
    isApproaching,
    isInCheckInRange,
    justEnteredApproachZone,
    justEnteredCheckInZone,
    clearApproachFlag,
    clearCheckInFlag,
  } = useNearestSpot();

  // BGM control
  const { fadeToTrack, currentTrack } = useBGM();

  // Activity tracking (steps, distance)
  const { metrics, isTracking, startTracking } = useActivityTracking();

  const [menuOpen, setMenuOpen] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<KaoriExpression>('neutral');
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [slideAnim] = useState(new Animated.Value(-250));
  const [lastExpressionChange, setLastExpressionChange] = useState(Date.now());

  // Chat integration
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<StoredChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Text log modal state
  const [textLogVisible, setTextLogVisible] = useState(false);
  const lastLoggedDialogue = useRef<string>('');

  // Step bonus animation state
  const [lastStepBonus, setLastStepBonus] = useState(0);
  const [showStepBonus, setShowStepBonus] = useState(false);
  const stepBonusAnim = useRef(new Animated.Value(0)).current;

  // Chat bonus animation state
  const [chatBonus, setChatBonus] = useState(0);
  const [showChatBonus, setShowChatBonus] = useState(false);
  const chatBonusAnim = useRef(new Animated.Value(0)).current;

  // Time-based bonus/penalty state
  const [timeBonus, setTimeBonus] = useState(0);
  const [showTimeBonus, setShowTimeBonus] = useState(false);
  const timeBonusAnim = useRef(new Animated.Value(0)).current;
  const lastTimeBonusRef = useRef(Date.now());

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const history = await loadChatHistory();
      if (history.length > 0) {
        setConversationHistory(history);
        // Restore last message as current dialogue
        const lastAssistantMsg = history.filter(m => m.role === 'assistant').pop();
        if (lastAssistantMsg) {
          setCurrentDialogue(lastAssistantMsg.content);
        }
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, []);

  // Start activity tracking on mount
  useEffect(() => {
    if (!isTracking) {
      startTracking();
    }
  }, [isTracking, startTracking]);

  // Step bonus animation (every 100 steps = +1pt)
  const prevStepsRef = useRef(0);
  useEffect(() => {
    const currentSteps = metrics.steps;
    const prevSteps = prevStepsRef.current;

    // Check if we crossed a 100-step milestone
    const prevMilestone = Math.floor(prevSteps / 100);
    const currentMilestone = Math.floor(currentSteps / 100);

    if (currentMilestone > prevMilestone && prevSteps > 0) {
      const bonusPoints = currentMilestone - prevMilestone;
      setLastStepBonus(bonusPoints);
      setShowStepBonus(true);

      // Animate the bonus popup
      stepBonusAnim.setValue(1);
      Animated.sequence([
        Animated.timing(stepBonusAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(stepBonusAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => setShowStepBonus(false));
    }

    prevStepsRef.current = currentSteps;
  }, [metrics.steps, stepBonusAnim]);

  // Chat bonus animation helper
  const triggerChatBonus = useCallback((points: number) => {
    setChatBonus(points);
    setShowChatBonus(true);
    addScore(points);

    chatBonusAnim.setValue(1);
    Animated.sequence([
      Animated.timing(chatBonusAnim, {
        toValue: 1.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(chatBonusAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => setShowChatBonus(false));
  }, [addScore, chatBonusAnim]);

  // Time bonus/penalty animation helper
  const triggerTimeBonus = useCallback((points: number, isBonus: boolean) => {
    setTimeBonus(points);
    setShowTimeBonus(true);
    addScore(points);

    if (isBonus) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    timeBonusAnim.setValue(1);
    Animated.sequence([
      Animated.timing(timeBonusAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(timeBonusAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => setShowTimeBonus(false));
  }, [addScore, timeBonusAnim]);

  // Time-based bonus (active) / penalty (idle)
  useEffect(() => {
    const TIME_BONUS_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const ACTIVE_BONUS_POINTS = 2;
    const IDLE_PENALTY_POINTS = -1;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastBonus = now - lastTimeBonusRef.current;
      // Calculate idle time inside interval to get current value
      const idleMinutes = Math.floor((now - lastActiveTime) / (1000 * 60));

      if (timeSinceLastBonus >= TIME_BONUS_INTERVAL) {
        if (idleMinutes >= 60) {
          // Idle penalty: -1pt every 5 minutes when sad/idle
          triggerTimeBonus(IDLE_PENALTY_POINTS, false);
        } else {
          // Active bonus: +2pt every 5 minutes when engaged
          triggerTimeBonus(ACTIVE_BONUS_POINTS, true);
        }
        lastTimeBonusRef.current = now;
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [lastActiveTime, triggerTimeBonus]);

  // Spot approach notifications
  useEffect(() => {
    // 200m以内に入った瞬間
    if (justEnteredApproachZone && nearestSpot) {
      setCurrentDialogue(`...あ、近くに何かある...？「${nearestSpot.name}」...かな`);
      setCurrentExpression('thinking');
      setLastExpressionChange(Date.now());
      // Light haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      clearApproachFlag();
    }
  }, [justEnteredApproachZone, nearestSpot, clearApproachFlag]);

  useEffect(() => {
    // 50m以内に入った瞬間（チェックイン可能）
    if (justEnteredCheckInZone && nearestSpot) {
      setCurrentDialogue(`...ここ、チェックインできそう...「${nearestSpot.name}」`);
      setCurrentExpression('happy');
      setLastExpressionChange(Date.now());
      // Medium haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      clearCheckInFlag();
    }
  }, [justEnteredCheckInZone, nearestSpot, clearCheckInFlag]);

  // Minimum time between automatic expression changes (30 seconds)
  // Note: This only applies to auto-state changes, NOT chat-triggered changes
  const EXPRESSION_COOLDOWN = 30 * 1000;

  // Map GPS timeOfDay (day/night) to CharacterDisplay format (morning/afternoon/night)
  const characterTimeOfDay = useMemo((): 'morning' | 'afternoon' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
  }, []);

  // Get background based on nearest spot and time of day (memoized)
  const backgroundImage = useMemo(
    () => getSpotBackground(nearestSpot?.id || null, gpsTimeOfDay),
    [nearestSpot?.id, gpsTimeOfDay]
  );
  const fallbackColor = useMemo(
    () => getFallbackColor(gpsTimeOfDay),
    [gpsTimeOfDay]
  );

  // Calculate idle time (with interval for updates)
  const [lastActiveMinutes, setLastActiveMinutes] = useState(0);
  useEffect(() => {
    const updateIdleTime = () => {
      setLastActiveMinutes(Math.floor((Date.now() - lastActiveTime) / (1000 * 60)));
    };
    updateIdleTime();
    const interval = setInterval(updateIdleTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [lastActiveTime]);

  // Memoize default dialogue to prevent recalculation on every render
  const defaultDialogue = useMemo(
    () => getKaoriDialogue(timeRemaining, lastActiveMinutes, checkInCount, currentExpression, metrics.steps),
    [timeRemaining, lastActiveMinutes, checkInCount, currentExpression, metrics.steps]
  );

  // BGM management based on game state
  useEffect(() => {
    const hoursLeft = timeRemaining / (1000 * 60 * 60);

    // Determine appropriate BGM track
    let targetTrack: BGMTrack = 'daily';

    // Sad BGM for urgent/negative states (priority)
    if (hoursLeft < 1 || lastActiveMinutes >= 60) {
      targetTrack = 'sad';
    }
    // Romantic BGM for high affection
    else if (affection >= 4) {
      targetTrack = 'romantic';
    }

    // Only change if different from current
    if (targetTrack !== currentTrack) {
      fadeToTrack(targetTrack);
    }
  }, [affection, timeRemaining, lastActiveMinutes, currentTrack, fadeToTrack]);

  // Update expression based on game state with rate limiting
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastChange = now - lastExpressionChange;

    // Determine target expression
    let targetExpression: KaoriExpression = 'neutral';

    // Idle for 60+ minutes -> sad (priority override, no cooldown)
    if (lastActiveMinutes >= 60) {
      targetExpression = 'sad';
    }
    // Less than 1 hour remaining -> sad (priority override, no cooldown)
    else if (timeRemaining < 1000 * 60 * 60) {
      targetExpression = 'sad';
    }
    // Affection-based expression (with cooldown)
    else if (affection >= 4) {
      targetExpression = 'happy';
    } else if (affection >= 3) {
      targetExpression = 'shy';
    }

    // Only update if expression is different and cooldown has passed
    // Or if it's a priority expression (sad for important events)
    const isPriorityChange = targetExpression === 'sad' && currentExpression !== 'sad';
    const shouldUpdate = targetExpression !== currentExpression &&
      (isPriorityChange || timeSinceLastChange >= EXPRESSION_COOLDOWN);

    if (shouldUpdate) {
      setCurrentExpression(targetExpression);
      setLastExpressionChange(now);
    }
  }, [affection, timeRemaining, lastActiveMinutes, currentExpression, lastExpressionChange]);

  // Auto-reset expression to neutral after 30 seconds (only for temporary expressions)
  // This should NOT reset affection-based expressions (happy when affection>=4, shy when affection>=3)
  useEffect(() => {
    // Don't reset if already neutral or in priority state
    if (currentExpression === 'neutral') return;
    if (lastActiveMinutes >= 60) return; // Keep sad expression when idle
    if (timeRemaining < 1000 * 60 * 60) return; // Keep sad when time is running out

    // Don't reset affection-based expressions
    // These should be maintained as long as the affection level supports them
    if (affection >= 4 && currentExpression === 'happy') return;
    if (affection >= 3 && currentExpression === 'shy') return;

    const resetTimer = setTimeout(() => {
      const now = Date.now();
      const timeSinceChange = now - lastExpressionChange;
      // Reset to neutral after 30 seconds (currentExpression is guaranteed non-neutral here due to early return above)
      if (timeSinceChange >= 30000) {
        setCurrentExpression('neutral');
        setLastExpressionChange(now);
      }
    }, 30000);

    return () => clearTimeout(resetTimer);
  }, [currentExpression, lastExpressionChange, lastActiveMinutes, timeRemaining, affection]);

  // Update last active time on interaction
  useEffect(() => {
    setLastActiveTime(Date.now());
  }, [score, checkInCount, chatCount]);

  // Clear chat dialogue when idle for 60+ minutes to show idle-specific dialogue
  useEffect(() => {
    if (lastActiveMinutes >= 60 && currentDialogue) {
      setCurrentDialogue('');
    }
  }, [lastActiveMinutes, currentDialogue]);

  // Log dialogue to text log when it changes
  useEffect(() => {
    const dialogueToLog = currentDialogue || defaultDialogue;

    // Only log if dialogue changed and is not empty
    if (dialogueToLog && dialogueToLog !== lastLoggedDialogue.current) {
      lastLoggedDialogue.current = dialogueToLog;
      logDialogue('かおり', dialogueToLog, currentExpression, 'main');
    }
  }, [currentDialogue, defaultDialogue, currentExpression]);

  // Keyboard listener
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Menu animation (memoized)
  const toggleMenu = useCallback(() => {
    const toValue = menuOpen ? -250 : 0;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
    setMenuOpen(!menuOpen);
  }, [menuOpen, slideAnim]);

  // Chat handler
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add to conversation history with timestamp
    const userMsg: StoredChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    const newHistory = [...conversationHistory, userMsg];
    setConversationHistory(newHistory);

    // Log user message to text log
    logChoice(userMessage, 'main');

    try {
      const apiKey = getOpenRouterApiKey();
      const nickname = user?.nickname || 'お兄さん';
      const response = await sendChatMessage(
        userMessage,
        getRecentMessagesForAI(conversationHistory, 10),
        apiKey,
        affection,
        nickname
      );

      // Update dialogue
      setCurrentDialogue(response.message);

      // Add response to history with timestamp
      const assistantMsg: StoredChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
      };
      const updatedHistory = [...newHistory, assistantMsg];
      setConversationHistory(updatedHistory);

      // Save to persistent storage
      await saveChatHistory(updatedHistory);

      // Update expression immediately on every chat message
      setCurrentExpression(response.expression);
      setLastExpressionChange(Date.now());

      incrementChatCount();

      // Chat bonus: 30% chance when Kaori responds with happy or shy expression
      const isGoodMood = response.expression === 'happy' || response.expression === 'shy';
      if (isGoodMood && Math.random() < 0.3) {
        const bonusPoints = 5 + Math.floor(Math.random() * 6); // 5-10 points
        triggerChatBonus(bonusPoints);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setCurrentDialogue('...ごめん、今ちょっと...うまく話せなくて...');
    } finally {
      setIsLoading(false);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTime = new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Check for game end
  useEffect(() => {
    if (timeRemaining <= 0) {
      router.replace('/ending');
    }
  }, [timeRemaining]);

  const menuItems = [
    { icon: 'stats-chart', label: 'ステータス', route: '/status' },
    { icon: 'map', label: 'マップ', route: '/map' },
    { icon: 'document-text', label: 'ログ', route: null, action: () => setTextLogVisible(true) },
    { icon: 'trophy', label: 'アチーブメント', route: '/achievements' },
    { icon: 'images', label: 'ギャラリー', route: '/gallery' },
    { icon: 'book', label: 'プロローグ', route: '/opening?replay=true' },
    { icon: 'information-circle', label: 'クレジット', route: '/credits' },
    { icon: 'settings', label: '設定', route: '/settings' },
  ];

  // Render content inside background
  const renderContent = () => (
    <View style={[styles.overlay, gpsTimeOfDay === 'night' && styles.nightOverlay]}>
      {/* Status Bar with Menu Button */}
      <View style={styles.statusBar}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Ionicons name={menuOpen ? 'close' : 'menu'} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.currentTime}>{currentTime}</Text>
        <Text style={styles.countdown}>
          かおりが帰るまで {formatTimeRemaining(timeRemaining)}
        </Text>
      </View>

      {/* Location Badge */}
      {nearestSpot && (
        <View style={[
          styles.locationBadge,
          isInCheckInRange && styles.locationBadgeActive
        ]}>
          <Ionicons name="location" size={14} color="#fff" />
          <Text style={styles.locationText}>{nearestSpot.name}</Text>
          <Text style={styles.distanceText}>{nearestSpot.distance}m</Text>
          {isInCheckInRange && (
            <TouchableOpacity
              style={styles.checkInButton}
              onPress={() => router.push(`/spot/${nearestSpot.id}` as any)}
            >
              <Text style={styles.checkInButtonText}>チェックイン</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Score Badge */}
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreText}>{score}pt</Text>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }, (_, i) => (
            <Ionicons
              key={i}
              name={i < affection ? 'heart' : 'heart-outline'}
              size={14}
              color={i < affection ? '#ff4757' : '#ccc'}
            />
          ))}
        </View>
        {/* Time Bonus/Penalty Animation */}
        {showTimeBonus && (
          <Animated.View
            style={[
              styles.timeBonusPopup,
              {
                opacity: timeBonusAnim,
                transform: [{ scale: timeBonusAnim }],
              }
            ]}
          >
            <Text style={[
              styles.timeBonusText,
              timeBonus < 0 && styles.timePenaltyText
            ]}>
              {timeBonus > 0 ? `⏰ +${timeBonus}pt` : `😢 ${timeBonus}pt`}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Steps Badge
       * Note: UI displays progress toward 1000 steps for visual engagement,
       * but actual bonus (+1pt) is awarded every 100 steps (see step bonus animation effect).
       * This is intentional UX design to encourage walking while providing frequent micro-rewards.
       */}
      <View style={styles.stepsBadge}>
        <View style={styles.stepsHeader}>
          <Ionicons name="footsteps" size={16} color="#4CAF50" />
          <Text style={styles.stepsText}>{metrics.steps.toLocaleString()}歩</Text>
        </View>
        <View style={styles.stepsProgressContainer}>
          <View
            style={[
              styles.stepsProgressBar,
              { width: `${Math.min(100, (metrics.steps % 1000) / 10)}%` }
            ]}
          />
        </View>
        <Text style={styles.stepsNextBonus}>
          次のボーナスまで {1000 - (metrics.steps % 1000)}歩
        </Text>
        {/* Step Bonus Animation */}
        {showStepBonus && (
          <Animated.View
            style={[
              styles.stepBonusPopup,
              {
                opacity: stepBonusAnim,
                transform: [{ scale: stepBonusAnim }],
              }
            ]}
          >
            <Text style={styles.stepBonusText}>+{lastStepBonus}pt!</Text>
          </Animated.View>
        )}
      </View>

      {/* Character Layer - Positioned absolutely, centered horizontally, anchored to bottom */}
      <View style={[styles.characterLayer, keyboardVisible && styles.characterLayerFaded]}>
        <CharacterDisplay expression={currentExpression} />
      </View>

      {/* Bottom UI - Dialogue box and chat input, fixed at bottom */}
      <View style={[
        styles.bottomUI,
        { paddingBottom: keyboardVisible ? keyboardHeight : 34 }
      ]}>
        {/* Dialogue Box */}
        {!keyboardVisible && (
          <View style={styles.dialogueBox}>
            <Text style={styles.speakerName}>かおり</Text>
            <Text style={styles.dialogueText} numberOfLines={4}>
              「{currentDialogue || defaultDialogue}」
            </Text>
            {isLoading && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#ff4757" />
                <Text style={styles.typingText}>入力中...</Text>
              </View>
            )}
            {/* Chat Bonus Animation */}
            {showChatBonus && (
              <Animated.View
                style={[
                  styles.chatBonusPopup,
                  {
                    opacity: chatBonusAnim,
                    transform: [{ scale: chatBonusAnim }],
                  }
                ]}
              >
                <Text style={styles.chatBonusText}>💕 +{chatBonus}pt!</Text>
              </Animated.View>
            )}
          </View>
        )}

        {/* Chat Input */}
        <View style={styles.chatInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="かおりに話しかける..."
            placeholderTextColor="#999"
            maxLength={100}
            editable={!isLoading}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Side Menu */}
      <Animated.View
        style={[
          styles.sideMenu,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>メニュー</Text>
        </View>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              if (item.action) {
                item.action();
              } else if (item.route) {
                router.push(item.route as any);
              }
            }}
          >
            <Ionicons name={item.icon as any} size={24} color="#333" />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Menu Overlay for closing */}
      {menuOpen && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          style={styles.background}
          resizeMode="cover"
        >
          {renderContent()}
        </ImageBackground>
      ) : (
        <View style={[styles.background, { backgroundColor: fallbackColor }]}>
          {renderContent()}
        </View>
      )}

      {/* Achievement Notification */}
      <AchievementNotification
        achievements={newlyUnlockedAchievements}
        onDismiss={dismissAchievementNotification}
      />

      {/* Text Log Modal */}
      <TextLogModal
        visible={textLogVisible}
        onClose={() => setTextLogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  nightOverlay: {
    backgroundColor: 'rgba(0, 0, 30, 0.4)',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingLeft: 70, // Space for menu button
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  currentTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  countdown: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  scoreBadge: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4757',
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  timeBonusPopup: {
    position: 'absolute',
    top: -25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  timeBonusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timePenaltyText: {
    color: '#ff4757',
  },
  locationBadge: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(255, 71, 87, 0.9)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  locationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  distanceText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginLeft: 6,
  },
  locationBadgeActive: {
    backgroundColor: '#4CAF50',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  checkInButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'center',
  },
  checkInButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Steps Badge Styles
  stepsBadge: {
    position: 'absolute',
    top: 175,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 10,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 4,
  },
  stepsProgressContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  stepsProgressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  stepsNextBonus: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  stepBonusPopup: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stepBonusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // VN Standard Layout - Character as background layer, UI overlays on top
  characterLayer: {
    position: 'absolute',
    bottom: CHARACTER_BOTTOM.main, // Position above the bottom UI area
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: Z_INDEX.character,
  },
  characterLayerFaded: {
    opacity: 0.3,
  },
  bottomUI: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: Z_INDEX.text,
  },
  dialogueBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  speakerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: 8,
  },
  dialogueText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  chatBonusPopup: {
    position: 'absolute',
    top: -30,
    right: 10,
    backgroundColor: 'rgba(255, 71, 87, 0.95)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  chatBonusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButton: {
    backgroundColor: '#ff4757',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  menuButton: {
    position: 'absolute',
    top: 45,
    left: 15,
    backgroundColor: 'rgba(255, 71, 87, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 50,
  },
  sideMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#fff',
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
  },
  menuHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 250,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 99,
  },
});
