import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { SPOT_DATA, isSpotAvailableNow, getSpotUnavailableReason } from '../constants/character';
import { TimeOfDay, getCurrentTimeOfDay } from '../constants/backgrounds';

interface SpotInfo {
  id: string;
  name: string;
  distance: number; // meters
  lat: number;
  lng: number;
  is_secret: boolean;
  isAvailableNow: boolean; // Time-based availability
  unavailableReason: string | null; // Reason if not available
}

// Approach proximity thresholds
const APPROACH_THRESHOLD_METERS = 200; // Show "approaching" notification
const CHECKIN_THRESHOLD_METERS = 100;  // Can check in at this distance

interface UseNearestSpotResult {
  nearestSpot: SpotInfo | null;
  timeOfDay: TimeOfDay;
  loading: boolean;
  error: string | null;
  locationEnabled: boolean;
  // Approach notifications
  isApproaching: boolean;      // Within 200m of a spot
  isInCheckInRange: boolean;   // Within 100m (can check in)
  justEnteredApproachZone: boolean; // Just crossed 200m threshold
  justEnteredCheckInZone: boolean;  // Just crossed 100m threshold
  clearApproachFlag: () => void;    // Clear "just entered approach zone" flag
  clearCheckInFlag: () => void;     // Clear "just entered check-in zone" flag
}

// Haversine formula to calculate distance between two coordinates (in meters)
function getDistanceFromLatLng(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Re-export time of day function from backgrounds.ts for consistency
// Day: 6:00-17:59 JST, Night: 18:00-5:59 JST (threshold at 18:00)

// Maximum distance to consider a spot "nearby" (500 meters)
const NEARBY_THRESHOLD_METERS = 500;

export function useNearestSpot(): UseNearestSpotResult {
  const [nearestSpot, setNearestSpot] = useState<SpotInfo | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getCurrentTimeOfDay);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Approach state
  const [isApproaching, setIsApproaching] = useState(false);
  const [isInCheckInRange, setIsInCheckInRange] = useState(false);
  const [justEnteredApproachZone, setJustEnteredApproachZone] = useState(false);
  const [justEnteredCheckInZone, setJustEnteredCheckInZone] = useState(false);

  // Track previous zone states to detect transitions
  const prevApproachingRef = useRef(false);
  const prevCheckInRangeRef = useRef(false);
  const prevSpotIdRef = useRef<string | null>(null);

  // Find nearest spot from current location
  const findNearestSpot = useCallback(
    (latitude: number, longitude: number): SpotInfo | null => {
      let nearest: SpotInfo | null = null;
      let minDistance = Infinity;

      for (const spot of SPOT_DATA) {
        const distance = getDistanceFromLatLng(
          latitude,
          longitude,
          spot.lat,
          spot.lng
        );

        if (distance < minDistance && distance <= NEARBY_THRESHOLD_METERS) {
          minDistance = distance;
          nearest = {
            id: spot.id,
            name: spot.name,
            distance: Math.round(distance),
            lat: spot.lat,
            lng: spot.lng,
            is_secret: spot.is_secret,
            isAvailableNow: isSpotAvailableNow(spot.id),
            unavailableReason: getSpotUnavailableReason(spot.id),
          };
        }
      }

      return nearest;
    },
    []
  );

  // Initialize location tracking
  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (isMounted) {
            setError('Location permission denied');
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setLocationEnabled(true);
        }

        // Start watching position
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 20, // Update every 20 meters for better approach detection
          },
          (location) => {
            if (isMounted) {
              const spot = findNearestSpot(
                location.coords.latitude,
                location.coords.longitude
              );
              setNearestSpot(spot);
              setLoading(false);

              // Update approach states
              const currentlyApproaching = spot !== null && spot.distance <= APPROACH_THRESHOLD_METERS;
              const currentlyInCheckInRange = spot !== null && spot.distance <= CHECKIN_THRESHOLD_METERS;

              // Detect zone transitions (entering for the first time or different spot)
              const isNewSpot = spot?.id !== prevSpotIdRef.current;
              const justEnteredApproach = currentlyApproaching && (!prevApproachingRef.current || isNewSpot);
              const justEnteredCheckIn = currentlyInCheckInRange && (!prevCheckInRangeRef.current || isNewSpot);

              setIsApproaching(currentlyApproaching);
              setIsInCheckInRange(currentlyInCheckInRange);

              // Set "just entered" flags - these will be reset by the consumer
              if (justEnteredApproach) {
                setJustEnteredApproachZone(true);
              }
              if (justEnteredCheckIn) {
                setJustEnteredCheckInZone(true);
              }

              // Update refs for next comparison
              prevApproachingRef.current = currentlyApproaching;
              prevCheckInRangeRef.current = currentlyInCheckInRange;
              prevSpotIdRef.current = spot?.id || null;
            }
          }
        );
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Location error');
          setLoading(false);
        }
      }
    };

    startLocationTracking();

    // Update time of day every minute
    const timeInterval = setInterval(() => {
      if (isMounted) {
        setTimeOfDay(getCurrentTimeOfDay());
      }
    }, 60000);

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      clearInterval(timeInterval);
    };
  }, [findNearestSpot]);

  // Function to clear "just entered" flags after consumer has processed them
  const clearApproachFlag = useCallback(() => {
    setJustEnteredApproachZone(false);
  }, []);

  const clearCheckInFlag = useCallback(() => {
    setJustEnteredCheckInZone(false);
  }, []);

  return {
    nearestSpot,
    timeOfDay,
    loading,
    error,
    locationEnabled,
    // Approach notifications
    isApproaching,
    isInCheckInRange,
    justEnteredApproachZone,
    justEnteredCheckInZone,
    clearApproachFlag,
    clearCheckInFlag,
  };
}

export default useNearestSpot;
