import { Stack } from 'expo-router';
import { GameProvider } from '../src/contexts/GameContext';

export default function RootLayout() {
  return (
    <GameProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
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
  );
}
