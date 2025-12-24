// Achievement Notification Component
// Displays a popup when achievements are unlocked

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Achievement, RARITY_COLORS } from '../constants/achievements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AchievementNotificationProps {
  achievements: Achievement[];
  onDismiss: () => void;
}

export function AchievementNotification({ achievements, onDismiss }: AchievementNotificationProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievements.length > 0) {
      // Slide in and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievements]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (achievements.length === 0) return null;

  // Show only the first achievement if multiple unlocked
  const achievement = achievements[0];
  const rarityColor = RARITY_COLORS[achievement.rarity];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.notification, { borderLeftColor: rarityColor }]}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{achievement.icon}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.unlockText}>Achievement Unlocked!</Text>
            {achievements.length > 1 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>+{achievements.length - 1}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{achievement.name}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
          <View style={styles.footer}>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
              <Text style={styles.rarityText}>
                {achievement.rarity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.points}>+{achievement.bonusPoints}pt</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  notification: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 50, 0.95)',
    borderRadius: 12,
    padding: 15,
    width: SCREEN_WIDTH - 40,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  unlockText: {
    color: '#ffd700',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: '#ff4757',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  points: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
