import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useGame } from '../src/contexts/GameContext';
import { SPOT_DATA } from '../src/constants/character';

interface SpotWithDistance {
  id: string;
  name: string;
  lat: number;
  lng: number;
  base_point: number;
  is_secret: boolean;
  description: string;
  distance?: number;
}

export default function MapScreen() {
  const { checkedInSpots } = useGame();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [spots, setSpots] = useState<SpotWithDistance[]>([]);
  const [nearbySpots, setNearbySpots] = useState<SpotWithDistance[]>([]);

  useEffect(() => {
    getLocationPermission();
  }, []);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('位置情報が必要です', '位置情報を有効にしてください');
        // Use default location for development
        const defaultLocation = {
          coords: {
            latitude: 33.5904,
            longitude: 130.4017,
          },
        } as Location.LocationObject;
        setLocation(defaultLocation);
        calculateDistances(defaultLocation);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      calculateDistances(currentLocation);
    } catch (error) {
      console.error('Location error:', error);
      // Fallback to default Fukuoka location
      const defaultLocation = {
        coords: {
          latitude: 33.5904,
          longitude: 130.4017,
        },
      } as Location.LocationObject;

      setLocation(defaultLocation);
      calculateDistances(defaultLocation);
    }
  };

  const calculateDistances = (currentLocation: Location.LocationObject) => {
    const spotsWithDistance: SpotWithDistance[] = SPOT_DATA.map(spot => {
      const distance = getDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        spot.lat,
        spot.lng
      );
      return {
        id: spot.id,
        name: spot.name,
        lat: spot.lat,
        lng: spot.lng,
        base_point: spot.base_point,
        is_secret: spot.is_secret,
        description: spot.description,
        distance,
      };
    });

    spotsWithDistance.sort((a, b) => a.distance! - b.distance!);
    setSpots(spotsWithDistance);
    setNearbySpots(spotsWithDistance.filter(spot => spot.distance! <= 0.05)); // Within 50m
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number) => {
    return value * Math.PI / 180;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const isCheckedIn = (spotId: string) => {
    return checkedInSpots.includes(spotId);
  };

  const handleSpotPress = (spot: SpotWithDistance) => {
    if (isCheckedIn(spot.id)) {
      Alert.alert('チェックイン済み', `${spot.name}は既にチェックイン済みです`);
      return;
    }

    if (spot.distance && spot.distance <= 0.05) { // Within 50m
      // Can check in
      router.push(`/spot/${spot.id}`);
    } else {
      Alert.alert(
        'スポットが遠すぎます',
        `${spot.name}まで${formatDistance(spot.distance || 0)}です。50m以内に近づいてください。`,
        [{ text: 'OK' }]
      );
    }
  };

  const refreshLocation = async () => {
    await getLocationPermission();
  };

  const goBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>マップ</Text>
        <TouchableOpacity onPress={refreshLocation} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Checked-in spots */}
        {checkedInSpots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>チェックイン済み ({checkedInSpots.length})</Text>
            {spots.filter(spot => isCheckedIn(spot.id)).map(spot => (
              <View key={spot.id} style={[styles.spotCard, styles.checkedInCard]}>
                <View style={styles.spotHeader}>
                  <Text style={styles.spotName}>
                    <Ionicons name="checkmark-circle" size={16} color="#4caf50" /> {spot.name}
                  </Text>
                  <View style={[styles.pointBadge, styles.checkedInBadge]}>
                    <Text style={styles.pointText}>{spot.base_point}pt</Text>
                  </View>
                </View>
                <Text style={styles.spotDescription}>{spot.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Nearby spots (checkable) */}
        {nearbySpots.filter(spot => !isCheckedIn(spot.id)).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>チェックイン可能 (50m以内)</Text>
            {nearbySpots.filter(spot => !isCheckedIn(spot.id)).map(spot => (
              <TouchableOpacity
                key={spot.id}
                style={[styles.spotCard, styles.nearbySpotCard]}
                onPress={() => handleSpotPress(spot)}
              >
                <View style={styles.spotHeader}>
                  <Text style={styles.spotName}>
                    {spot.is_secret ? '  ' : ''}{spot.name}
                  </Text>
                  <View style={[styles.pointBadge, spot.is_secret && styles.secretPointBadge]}>
                    <Text style={styles.pointText}>{spot.base_point}pt</Text>
                  </View>
                </View>
                <Text style={styles.spotDescription}>{spot.description}</Text>
                <View style={styles.spotFooter}>
                  <Text style={styles.distanceText}>
                    {formatDistance(spot.distance || 0)}
                  </Text>
                  <Text style={styles.checkInText}>タップしてチェックイン</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* All spots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>全てのスポット</Text>
          {spots.filter(spot => !isCheckedIn(spot.id)).map(spot => (
            <TouchableOpacity
              key={spot.id}
              style={[
                styles.spotCard,
                spot.is_secret && styles.secretSpotCard,
                spot.distance && spot.distance <= 0.05 && styles.nearbySpotCard
              ]}
              onPress={() => handleSpotPress(spot)}
            >
              <View style={styles.spotHeader}>
                <Text style={[styles.spotName, spot.is_secret && styles.secretSpotName]}>
                  {spot.is_secret ? ' ' : ''}{spot.name}
                </Text>
                <View style={[styles.pointBadge, spot.is_secret && styles.secretPointBadge]}>
                  <Text style={styles.pointText}>{spot.base_point}pt</Text>
                </View>
              </View>
              <Text style={styles.spotDescription}>{spot.description}</Text>
              <View style={styles.spotFooter}>
                <Text style={styles.distanceText}>
                  {formatDistance(spot.distance || 0)}
                </Text>
                {spot.distance && spot.distance <= 0.05 ? (
                  <Text style={styles.checkInText}>チェックイン可能</Text>
                ) : (
                  <Text style={styles.tooFarText}>近づく必要があります</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  spotCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nearbySpotCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  secretSpotCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  checkedInCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9e9e9e',
    opacity: 0.7,
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  spotName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  secretSpotName: {
    color: '#ff9800',
  },
  pointBadge: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  secretPointBadge: {
    backgroundColor: '#ff9800',
  },
  checkedInBadge: {
    backgroundColor: '#9e9e9e',
  },
  pointText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  spotDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  spotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#999',
  },
  checkInText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  tooFarText: {
    fontSize: 12,
    color: '#999',
  },
});
