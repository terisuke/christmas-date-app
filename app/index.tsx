import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useGame } from '../src/contexts/GameContext';
import { useBGM } from '../src/contexts/BGMContext';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { gameStartedAt, user } = useGame();
  const { playBGM } = useBGM();
  const [showSplash, setShowSplash] = useState(true);
  const [readyToNavigate, setReadyToNavigate] = useState(false);

  // Navigate to debug screen (only available in __DEV__ mode)
  const goToDebug = () => {
    router.push('/debug' as any);
  };

  // Manual navigation for dev mode
  const handleStart = () => {
    if (isLoaded) {
      if (isSignedIn) {
        if (gameStartedAt && user) {
          router.replace('/main');
        } else {
          router.replace('/opening');
        }
      } else {
        router.replace('/sign-in' as const);
      }
    }
  };

  // Play title BGM on mount
  useEffect(() => {
    playBGM('title');
  }, [playBGM]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      // In production, auto-navigate. In dev mode, wait for manual start.
      if (!__DEV__) {
        setReadyToNavigate(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (readyToNavigate && !showSplash && isLoaded) {
      if (isSignedIn) {
        // If game already started, go to main screen
        if (gameStartedAt && user) {
          router.replace('/main');
        } else {
          router.replace('/opening');
        }
      } else {
        router.replace('/sign-in' as const);
      }
    }
  }, [readyToNavigate, showSplash, isLoaded, isSignedIn, gameStartedAt, user]);

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        {/* Debug button - only visible in development mode */}
        {__DEV__ && (
          <TouchableOpacity style={styles.debugButton} onPress={goToDebug}>
            <Ionicons name="bug" size={20} color="#fff" />
            <Text style={styles.debugButtonText}>DEV</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.title}>雪の降らない聖夜に</Text>
        <Text style={styles.subtitle}>A Christmas Eve Without Snow</Text>

        <View style={styles.loadingContainer}>
          {/* In dev mode after splash, show START button instead of auto-navigate */}
          {__DEV__ && !showSplash && isLoaded ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>START</Text>
            </TouchableOpacity>
          ) : (
            <>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>
                {!isLoaded ? '読み込み中...' : '準備中...'}
              </Text>
            </>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>制限時間：9時間</Text>
          <Text style={styles.infoText}>目標：かおりとの好感度を上げよう!</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff4757', // Christmas red
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  debugButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 100,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  startButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  startButtonText: {
    color: '#ff4757',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  info: {
    alignItems: 'center',
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
