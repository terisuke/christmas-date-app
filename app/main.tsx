import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { sendChatMessage, getOpenRouterApiKey } from '../src/services/ai';
import { useNearestSpot } from '../src/hooks/useNearestSpot';
import { getSpotBackground, getFallbackColor, TimeOfDay } from '../src/constants/backgrounds';

const { width } = Dimensions.get('window');

// Kaori dialogue based on state
const getKaoriDialogue = (
  timeRemaining: number,
  lastActiveMinutes: number,
  checkInCount: number,
  expression: KaoriExpression
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
  } = useGame();

  // GPS-based location tracking
  const { nearestSpot, timeOfDay: gpsTimeOfDay, locationEnabled } = useNearestSpot();

  const [menuOpen, setMenuOpen] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<KaoriExpression>('neutral');
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [slideAnim] = useState(new Animated.Value(-250));
  const [lastExpressionChange, setLastExpressionChange] = useState(Date.now());

  // Chat integration
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [messagesSinceExpressionChange, setMessagesSinceExpressionChange] = useState(0);
  const inputRef = useRef<TextInput>(null);

  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Minimum time between expression changes (30 seconds)
  const EXPRESSION_COOLDOWN = 30 * 1000;
  const CHAT_EXPRESSION_INTERVAL = 2; // Change expression every 2-3 messages

  // Map GPS timeOfDay (day/night) to CharacterDisplay format (morning/afternoon/night)
  const getCharacterTimeOfDay = (): 'morning' | 'afternoon' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
  };

  const characterTimeOfDay = getCharacterTimeOfDay();

  // Get background based on nearest spot and time of day
  const backgroundImage = getSpotBackground(nearestSpot?.id || null, gpsTimeOfDay);
  const fallbackColor = getFallbackColor(gpsTimeOfDay);

  // Calculate idle time
  const lastActiveMinutes = Math.floor((Date.now() - lastActiveTime) / (1000 * 60));

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

  // Update last active time on interaction
  useEffect(() => {
    setLastActiveTime(Date.now());
  }, [score, checkInCount, chatCount]);

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

  // Menu animation
  const toggleMenu = () => {
    const toValue = menuOpen ? -250 : 0;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
    setMenuOpen(!menuOpen);
  };

  // Chat handler
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add to conversation history
    const newHistory = [...conversationHistory, { role: 'user' as const, content: userMessage }];
    setConversationHistory(newHistory);

    try {
      const apiKey = getOpenRouterApiKey();
      const nickname = user?.nickname || 'お兄さん';
      const response = await sendChatMessage(
        userMessage,
        conversationHistory.slice(-10),
        apiKey,
        affection,
        nickname
      );

      // Update dialogue
      setCurrentDialogue(response.message);

      // Add response to history
      setConversationHistory([...newHistory, { role: 'assistant' as const, content: response.message }]);

      // Update expression with rate limiting (every 2-3 messages)
      const newMessageCount = messagesSinceExpressionChange + 1;
      const shouldChangeExpression = newMessageCount >= CHAT_EXPRESSION_INTERVAL + Math.floor(Math.random() * 2);

      if (shouldChangeExpression) {
        setCurrentExpression(response.expression);
        setLastExpressionChange(Date.now());
        setMessagesSinceExpressionChange(0);
      } else {
        setMessagesSinceExpressionChange(newMessageCount);
      }

      incrementChatCount();
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
    { icon: 'chatbubbles', label: 'チャット', route: '/chat' },
    { icon: 'book', label: 'プロローグ', route: '/opening?replay=true' },
    { icon: 'settings', label: '設定', route: '/settings' },
    { icon: 'document-text', label: 'クレジット', route: '/credits' },
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
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={14} color="#fff" />
          <Text style={styles.locationText}>{nearestSpot.name}</Text>
          <Text style={styles.distanceText}>{nearestSpot.distance}m</Text>
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
      </View>

      {/* Main Content Area - Flex layout for dedicated zones */}
      <View style={styles.mainContent}>
        {/* Character Zone - Shows bust-up (upper portion) with overflow hidden */}
        <View style={[styles.characterZone, keyboardVisible && styles.characterAreaFaded]}>
          <CharacterDisplay expression={currentExpression} />
        </View>

        {/* Dialogue Zone - Dedicated space for dialogue and input */}
        <View style={styles.dialogueZone}>
          {/* Dialogue Box */}
          {!keyboardVisible && (
            <View style={styles.dialogueBox}>
              <Text style={styles.speakerName}>かおり</Text>
              <Text style={styles.dialogueText}>
                「{currentDialogue || getKaoriDialogue(timeRemaining, lastActiveMinutes, checkInCount, currentExpression)}」
              </Text>
              {isLoading && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#ff4757" />
                  <Text style={styles.typingText}>入力中...</Text>
                </View>
              )}
            </View>
          )}

          {/* Chat Input - Inside dialogue zone */}
          <View style={[
            styles.chatInputContainer,
            keyboardVisible && { marginBottom: keyboardHeight }
          ]}>
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
              router.push(item.route as any);
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
  // Dedicated zones layout (Mystic Messenger pattern)
  mainContent: {
    flex: 1,
    marginTop: 50, // Space below badges
  },
  characterZone: {
    flex: 0.55,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start', // Start from top to show bust-up (clip legs at bottom)
  },
  characterAreaFaded: {
    opacity: 0.4,
  },
  dialogueZone: {
    flex: 0.45,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  dialogueBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
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
