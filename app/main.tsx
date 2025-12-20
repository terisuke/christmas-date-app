import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
  TextInput,
  Platform,
  ActivityIndicator,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import CharacterDisplay from '../src/components/CharacterDisplay';
import { KaoriExpression } from '../src/components/CharacterDisplay';
import { sendChatMessage, getOpenRouterApiKey } from '../src/services/ai';

const { width } = Dimensions.get('window');

// Time-based backgrounds
const TIME_BACKGROUNDS = {
  morning: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
  afternoon: 'https://images.unsplash.com/photo-1544042259-ea9a0dd2b891?w=800',
  night: 'https://images.unsplash.com/photo-1545580492-8859ba8323f9?w=800',
};

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
    score,
    affection,
    timeRemaining,
    checkInCount,
    chatCount,
    incrementChatCount,
  } = useGame();

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

  // Get time of day
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
  };

  const timeOfDay = getTimeOfDay();

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
      const response = await sendChatMessage(userMessage, conversationHistory.slice(-10), apiKey);

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

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: TIME_BACKGROUNDS[timeOfDay] }}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Overlay */}
        <View style={styles.overlay}>
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

          {/* Character Display Area - Faded when keyboard visible */}
          <View style={[styles.characterArea, keyboardVisible && styles.characterAreaFaded]}>
            <CharacterDisplay
              expression={currentExpression}
              size="large"
              showName={false}
              timeOfDay={timeOfDay}
            />
          </View>

          {/* Dialogue Box - Hidden when keyboard visible */}
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

          {/* Chat Input - Positioned absolutely above keyboard */}
          <View style={[
            styles.chatInputContainer,
            { bottom: keyboardVisible ? keyboardHeight + 10 : 30 }
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
      </ImageBackground>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  characterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  characterAreaFaded: {
    opacity: 0.4,
  },
  dialogueBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 100, // Space for chat input
    borderRadius: 15,
    padding: 20,
    minHeight: 100,
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
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
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
