import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { GameProvider } from '../src/contexts/GameContext';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Timeout for Clerk initialization (10 seconds)
const CLERK_TIMEOUT = 10000;

// Inner component that waits for Clerk with timeout
function ClerkLoadedWithTimeout({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.warn('Clerk initialization timed out, continuing without auth');
        setTimedOut(true);
      }
    }, CLERK_TIMEOUT);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Show loading screen while waiting for Clerk (with timeout)
  if (!isLoaded && !timedOut) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4757" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

// Main app content wrapped in GameProvider
function AppContent() {
  return (
    <GameProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="opening" />
        <Stack.Screen name="home" />
        <Stack.Screen name="main" />
        <Stack.Screen name="status" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="credits" />
        <Stack.Screen name="map" />
        <Stack.Screen name="spot/[id]" />
        <Stack.Screen name="event" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="ar" />
        <Stack.Screen name="ending" />
        <Stack.Screen name="share" />
      </Stack>
    </GameProvider>
  );
}

export default function RootLayout() {
  // If no publishable key, render without Clerk (guest mode only)
  if (!publishableKey) {
    console.warn('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, running in guest mode only');
    return <AppContent />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoadedWithTimeout>
        <AppContent />
      </ClerkLoadedWithTimeout>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
