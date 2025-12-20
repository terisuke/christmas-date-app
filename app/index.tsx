import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useGame } from '../src/contexts/GameContext';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { gameStartedAt, user } = useGame();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && isLoaded) {
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
  }, [showSplash, isLoaded, isSignedIn, gameStartedAt, user]);

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1544042259-ea9a0dd2b891?w=400' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>かおりと福岡クリスマス</Text>
        <Text style={styles.subtitle}>Christmas Date in Fukuoka</Text>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            {!isLoaded ? '読み込み中...' : '準備中...'}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>制限時間：9時間</Text>
          <Text style={styles.infoText}>目標：かおりとの好感度を上げよう!</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
