// src/components/VRMCharacter.tsx
// VRM is disabled for simulator/web development
// Enable for physical device testing only

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type VRMExpression = 'neutral' | 'happy' | 'shy' | 'surprised' | 'sad' | 'thinking';

interface VRMCharacterProps {
  expression?: VRMExpression;
  timeOfDay?: 'morning' | 'afternoon' | 'night';
  style?: object;
}

// Placeholder - VRM disabled for simulator/emulator
export default function VRMCharacter({ expression = 'neutral', style }: VRMCharacterProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>VRM: {expression}</Text>
      <Text style={styles.hint}>※実機でのみ3D表示</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
