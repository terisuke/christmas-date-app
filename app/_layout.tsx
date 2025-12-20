import { Stack } from 'expo-router';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { GameProvider } from '../src/contexts/GameContext';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables');
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
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
            <Stack.Screen name="map" />
            <Stack.Screen name="spot/[id]" />
            <Stack.Screen name="event" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="ar" />
            <Stack.Screen name="ending" />
            <Stack.Screen name="share" />
          </Stack>
        </GameProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
