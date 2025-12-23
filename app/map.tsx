import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useGame } from '../src/contexts/GameContext';
import { SPOT_DATA, isSpotAvailableNow, getSpotUnavailableReason } from '../src/constants/character';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// OpenStreetMap tile URL
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Fukuoka center coordinates
const FUKUOKA_REGION = {
  latitude: 33.5904,
  longitude: 130.4017,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

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

// Minimum normal spot check-ins required to unlock secret spots
const SECRET_UNLOCK_THRESHOLD = 4;

export default function MapScreen() {
  const { checkedInSpots } = useGame();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [spots, setSpots] = useState<SpotWithDistance[]>([]);
  const [nearbySpots, setNearbySpots] = useState<SpotWithDistance[]>([]);
  const [showMapView, setShowMapView] = useState(true);
  const mapRef = useRef<MapView>(null);

  // Count check-ins at normal (non-secret) spots
  const normalSpotCheckIns = checkedInSpots.filter(spotId => {
    const spot = SPOT_DATA.find(s => s.id === spotId);
    return spot && !spot.is_secret;
  }).length;

  // Secret spots are unlocked when 4+ normal spots checked in
  const secretSpotsUnlocked = normalSpotCheckIns >= SECRET_UNLOCK_THRESHOLD;

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
    setNearbySpots(spotsWithDistance.filter(spot => spot.distance! <= 0.1)); // Within 100m
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

    // Check time restriction for secret spots
    if (!isSpotAvailableNow(spot.id)) {
      const reason = getSpotUnavailableReason(spot.id);
      Alert.alert('時間外です', reason || 'このスポットは現在チェックインできません');
      return;
    }

    if (spot.distance && spot.distance <= 0.1) { // Within 100m
      // Can check in
      router.push(`/spot/${spot.id}`);
    } else {
      Alert.alert(
        'スポットが遠すぎます',
        `${spot.name}まで${formatDistance(spot.distance || 0)}です。100m以内に近づいてください。`,
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

  // Get marker color based on spot status
  const getMarkerColor = (spot: SpotWithDistance) => {
    if (isCheckedIn(spot.id)) return '#9e9e9e';
    if (spot.is_secret && !secretSpotsUnlocked) return '#999';
    // Time-restricted spots show as gray when unavailable
    if (spot.is_secret && !isSpotAvailableNow(spot.id)) return '#999';
    if (spot.is_secret) return '#ff9800';
    if (spot.distance && spot.distance <= 0.05) return '#4caf50';
    return '#ff4757';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>マップ</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowMapView(!showMapView)} style={styles.toggleButton}>
            <Ionicons name={showMapView ? 'list' : 'map'} size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshLocation} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View */}
      {showMapView && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              ...FUKUOKA_REGION,
              latitude: location?.coords.latitude || FUKUOKA_REGION.latitude,
              longitude: location?.coords.longitude || FUKUOKA_REGION.longitude,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          >
            {/* OpenStreetMap Tiles for Android */}
            {Platform.OS === 'android' && (
              <UrlTile
                urlTemplate={OSM_TILE_URL}
                maximumZ={19}
                flipY={false}
              />
            )}

            {/* Spot Markers */}
            {spots.filter(spot => !spot.is_secret || secretSpotsUnlocked).map(spot => (
              <Marker
                key={spot.id}
                coordinate={{ latitude: spot.lat, longitude: spot.lng }}
                title={spot.name}
                description={`${spot.base_point}pt - ${formatDistance(spot.distance || 0)}`}
                pinColor={getMarkerColor(spot)}
                onCalloutPress={() => handleSpotPress(spot)}
              />
            ))}
          </MapView>

          {/* Map Legend */}
          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} />
              <Text style={styles.legendText}>チェックイン可能</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ff4757' }]} />
              <Text style={styles.legendText}>通常スポット</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} />
              <Text style={styles.legendText}>シークレット</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={[styles.content, showMapView && styles.contentWithMap]}>
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

        {/* Nearby spots (checkable) - only show normal spots OR secret spots if unlocked */}
        {nearbySpots.filter(spot => !isCheckedIn(spot.id) && (!spot.is_secret || secretSpotsUnlocked)).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>チェックイン可能 (100m以内)</Text>
            {nearbySpots.filter(spot => !isCheckedIn(spot.id) && (!spot.is_secret || secretSpotsUnlocked)).map(spot => (
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

        {/* Normal spots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>クリスマスマーケット</Text>
          {spots.filter(spot => !isCheckedIn(spot.id) && !spot.is_secret).map(spot => (
            <TouchableOpacity
              key={spot.id}
              style={[
                styles.spotCard,
                spot.distance !== undefined && spot.distance <= 0.05 && styles.nearbySpotCard
              ]}
              onPress={() => handleSpotPress(spot)}
            >
              <View style={styles.spotHeader}>
                <Text style={styles.spotName}>{spot.name}</Text>
                <View style={styles.pointBadge}>
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

        {/* Secret spots section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            シークレットスポット（全3箇所）
          </Text>

          {!secretSpotsUnlocked ? (
            <View style={styles.lockedCard}>
              <Ionicons name="lock-closed" size={32} color="#999" />
              <Text style={styles.lockedText}>
                通常スポットを{SECRET_UNLOCK_THRESHOLD}箇所以上{'\n'}チェックインすると解放されます
              </Text>
              <Text style={styles.lockedProgress}>
                チェックイン: {normalSpotCheckIns}/{SECRET_UNLOCK_THRESHOLD}箇所
              </Text>
            </View>
          ) : (
            spots.filter(spot => !isCheckedIn(spot.id) && spot.is_secret).map(spot => {
              const isAvailable = isSpotAvailableNow(spot.id);
              const unavailableReason = getSpotUnavailableReason(spot.id);

              return (
                <TouchableOpacity
                  key={spot.id}
                  style={[
                    styles.spotCard,
                    styles.secretSpotCard,
                    spot.distance !== undefined && spot.distance <= 0.05 && isAvailable && styles.nearbySpotCard,
                    !isAvailable && styles.unavailableCard
                  ]}
                  onPress={() => handleSpotPress(spot)}
                >
                  <View style={styles.spotHeader}>
                    <Text style={[styles.spotName, styles.secretSpotName, !isAvailable && styles.unavailableText]}>
                      <Ionicons name="star" size={14} color={isAvailable ? '#ff9800' : '#999'} /> {spot.name}
                    </Text>
                    <View style={[styles.pointBadge, styles.secretPointBadge, !isAvailable && styles.unavailableBadge]}>
                      <Text style={styles.pointText}>{spot.base_point}pt</Text>
                    </View>
                  </View>
                  <Text style={styles.spotDescription}>{spot.description}</Text>
                  {!isAvailable && unavailableReason && (
                    <View style={styles.timeRestrictionBadge}>
                      <Ionicons name="time-outline" size={14} color="#ff9800" />
                      <Text style={styles.timeRestrictionText}>{unavailableReason}</Text>
                    </View>
                  )}
                  <View style={styles.spotFooter}>
                    <Text style={styles.distanceText}>
                      {formatDistance(spot.distance || 0)}
                    </Text>
                    {!isAvailable ? (
                      <Text style={styles.tooFarText}>時間外</Text>
                    ) : spot.distance && spot.distance <= 0.05 ? (
                      <Text style={styles.checkInText}>チェックイン可能</Text>
                    ) : (
                      <Text style={styles.tooFarText}>近づく必要があります</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    padding: 5,
    marginRight: 10,
  },
  refreshButton: {
    padding: 5,
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.35,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentWithMap: {
    maxHeight: SCREEN_HEIGHT * 0.45,
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
  lockedCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  lockedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  lockedProgress: {
    fontSize: 16,
    color: '#ff9800',
    fontWeight: 'bold',
    marginTop: 10,
  },
  unavailableCard: {
    opacity: 0.6,
    borderLeftColor: '#999',
  },
  unavailableText: {
    color: '#999',
  },
  unavailableBadge: {
    backgroundColor: '#999',
  },
  timeRestrictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  timeRestrictionText: {
    fontSize: 12,
    color: '#ff9800',
    marginLeft: 4,
  },
});
