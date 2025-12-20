import { useState, useEffect, useCallback, useRef } from 'react';
import { Pedometer } from 'expo-sensors';
import * as Location from 'expo-location';

interface ActivityMetrics {
  steps: number;
  distance: number; // in meters
  activeMinutes: number;
}

interface ActivityScore {
  stepsScore: number;
  distanceScore: number;
  timeScore: number;
  totalScore: number;
}

interface UseActivityTrackingResult {
  metrics: ActivityMetrics;
  score: ActivityScore;
  isTracking: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

// Maximum values for scoring
const MAX_STEPS = 10000;
const MAX_DISTANCE = 8000; // 8km in meters
const MAX_ACTIVE_MINUTES = 300; // 5 hours

// Score weights
const STEPS_WEIGHT = 0.4;
const DISTANCE_WEIGHT = 0.35;
const TIME_WEIGHT = 0.25;

// Haversine distance calculation
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateScore(metrics: ActivityMetrics): ActivityScore {
  // Normalize each metric to 0-100 scale
  const stepsScore = Math.min(100, (metrics.steps / MAX_STEPS) * 100);
  const distanceScore = Math.min(100, (metrics.distance / MAX_DISTANCE) * 100);
  const timeScore = Math.min(100, (metrics.activeMinutes / MAX_ACTIVE_MINUTES) * 100);

  // Calculate weighted total
  const totalScore = Math.round(
    stepsScore * STEPS_WEIGHT +
    distanceScore * DISTANCE_WEIGHT +
    timeScore * TIME_WEIGHT
  );

  return {
    stepsScore: Math.round(stepsScore),
    distanceScore: Math.round(distanceScore),
    timeScore: Math.round(timeScore),
    totalScore,
  };
}

export function useActivityTracking(): UseActivityTrackingResult {
  const [metrics, setMetrics] = useState<ActivityMetrics>({
    steps: 0,
    distance: 0,
    activeMinutes: 0,
  });
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pedometerSubscription = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastLocation = useRef<{ latitude: number; longitude: number } | null>(null);
  const startTime = useRef<number | null>(null);
  const activeTimeInterval = useRef<NodeJS.Timeout | null>(null);

  const updateActiveMinutes = useCallback(() => {
    if (startTime.current) {
      const elapsed = (Date.now() - startTime.current) / 1000 / 60; // in minutes
      setMetrics(prev => ({
        ...prev,
        activeMinutes: Math.floor(elapsed),
      }));
    }
  }, []);

  const startTracking = useCallback(async () => {
    try {
      setError(null);

      // Request location permissions
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        setError('位置情報の権限が必要です');
        return;
      }

      // Check pedometer availability
      const isPedometerAvailable = await Pedometer.isAvailableAsync();

      // Start pedometer tracking
      if (isPedometerAvailable) {
        pedometerSubscription.current = Pedometer.watchStepCount(result => {
          setMetrics(prev => ({
            ...prev,
            steps: prev.steps + result.steps,
          }));
        });
      }

      // Start location tracking
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Or every 5 seconds
        },
        location => {
          const { latitude, longitude } = location.coords;

          if (lastLocation.current) {
            const distance = calculateDistance(
              lastLocation.current.latitude,
              lastLocation.current.longitude,
              latitude,
              longitude
            );

            // Only add distance if it's reasonable (< 100m per update to filter GPS jumps)
            if (distance < 100) {
              setMetrics(prev => ({
                ...prev,
                distance: prev.distance + distance,
              }));
            }
          }

          lastLocation.current = { latitude, longitude };
        }
      );

      // Start time tracking
      startTime.current = Date.now();
      activeTimeInterval.current = setInterval(updateActiveMinutes, 60000); // Update every minute

      setIsTracking(true);
    } catch (err) {
      console.error('Activity tracking error:', err);
      setError('アクティビティ追跡の開始に失敗しました');
    }
  }, [updateActiveMinutes]);

  const stopTracking = useCallback(() => {
    if (pedometerSubscription.current) {
      pedometerSubscription.current.remove();
      pedometerSubscription.current = null;
    }

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (activeTimeInterval.current) {
      clearInterval(activeTimeInterval.current);
      activeTimeInterval.current = null;
    }

    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  const score = calculateScore(metrics);

  return {
    metrics,
    score,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
}

export default useActivityTracking;
