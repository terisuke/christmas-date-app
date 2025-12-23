import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { SPOT_DATA } from '../constants/character';
import { TimeOfDay } from '../constants/backgrounds';

interface SpotInfo {
  id: string;
  name: string;
  distance: number; // meters
  lat: number;
  lng: number;
  is_secret: boolean;
}

interface UseNearestSpotResult {
  nearestSpot: SpotInfo | null;
  timeOfDay: TimeOfDay;
  loading: boolean;
  error: string | null;
  locationEnabled: boolean;
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

// Get time of day (day or night based on JST)
function getTimeOfDay(): TimeOfDay {
  // Get JST time (UTC+9)
  const now = new Date();
  const jstOffset = 9 * 60; // JST is UTC+9
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utc + jstOffset * 60000);
  const hour = jst.getHours();

  // Day: 6:00-17:59, Night: 18:00-5:59
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

// Maximum distance to consider a spot "nearby" (500 meters)
const NEARBY_THRESHOLD_METERS = 500;

export function useNearestSpot(): UseNearestSpotResult {
  const [nearestSpot, setNearestSpot] = useState<SpotInfo | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

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
            distanceInterval: 50, // Update every 50 meters moved
          },
          (location) => {
            if (isMounted) {
              const spot = findNearestSpot(
                location.coords.latitude,
                location.coords.longitude
              );
              setNearestSpot(spot);
              setLoading(false);
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
        setTimeOfDay(getTimeOfDay());
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

  return {
    nearestSpot,
    timeOfDay,
    loading,
    error,
    locationEnabled,
  };
}

export default useNearestSpot;
