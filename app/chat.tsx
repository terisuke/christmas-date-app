import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import CharacterDisplay, { KaoriExpression } from '../src/components/CharacterDisplay';
import { sendChatMessage, getOpenRouterApiKey } from '../src/services/ai';
import { useTimeOfDay } from '../src/hooks/useTimeOfDay';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  expression?: KaoriExpression;
}

export default function ChatScreen() {
  const { incrementChatCount } = useGame();
  const scrollViewRef = useRef<ScrollView>(null);
  const timeOfDay = useTimeOfDay();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'あの...おにいちゃん？\n何か話したいことある...？',
      timestamp: new Date(),
      expression: 'neutral',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<KaoriExpression>('neutral');
  const [messagesSinceExpressionChange, setMessagesSinceExpressionChange] = useState(0);

  // Only update expression every 2-3 messages (randomly 2 or 3)
  const EXPRESSION_CHANGE_INTERVAL = 2;

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setCurrentExpression('thinking');

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Get API key and send message
      const apiKey = getOpenRouterApiKey();
      const response = await sendChatMessage(inputText, conversationHistory, apiKey);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        expression: response.expression,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Only update displayed expression every 2-3 messages
      const newMessageCount = messagesSinceExpressionChange + 1;
      const shouldChangeExpression = newMessageCount >= EXPRESSION_CHANGE_INTERVAL + Math.floor(Math.random() * 2);

      if (shouldChangeExpression) {
        setCurrentExpression(response.expression);
        setMessagesSinceExpressionChange(0);
      } else {
        setMessagesSinceExpressionChange(newMessageCount);
      }

      incrementChatCount();
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '...ごめん、今ちょっと...うまく話せなくて...',
        timestamp: new Date(),
        expression: 'sad',
      };
      setMessages(prev => [...prev, fallbackMessage]);
      setCurrentExpression('sad');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>雪村 かおり</Text>
          <Text style={styles.headerSubtitle}>
            {isLoading ? '入力中...' : 'オンライン'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Character Display */}
      <View style={[styles.characterContainer, timeOfDay === 'night' && styles.characterContainerNight]}>
        <CharacterDisplay
          expression={currentExpression}
          size="small"
          showName={false}
          timeOfDay={timeOfDay}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.messageWrapper, styles.assistantMessageWrapper]}>
              <View style={[styles.messageBubble, styles.assistantMessage, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#ff4757" />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="メッセージを入力..."
            placeholderTextColor="#999"
            multiline
            maxLength={200}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  headerRight: {
    width: 34,
  },
  characterContainer: {
    backgroundColor: '#FFF8E7',
    paddingVertical: 10,
    alignItems: 'center',
  },
  characterContainerNight: {
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 10,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  assistantMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
  },
  userMessage: {
    backgroundColor: '#ff4757',
    borderBottomRightRadius: 5,
  },
  assistantMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingBubble: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#ff4757',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
