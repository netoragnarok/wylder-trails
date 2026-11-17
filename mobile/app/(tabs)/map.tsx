import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trailsApi, Trail } from '../../src/services/api';
import { Colors, DifficultyColors } from '../../src/constants/colors';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

type MapStyle = 'outdoors' | 'satellite' | 'standard';

const MAP_STYLES: Record<MapStyle, string> = {
  outdoors: MapboxGL.StyleURL.Outdoors,
  satellite: MapboxGL.StyleURL.SatelliteStreets,
  standard: MapboxGL.StyleURL.Street,
};

export default function MapScreen() {
  const router = useRouter();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>('outdoors');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation([loc.coords.longitude, loc.coords.latitude]);
      }
      try {
        const { data } = await trailsApi.list({ limit: 100 });
        setTrails(data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cycleStyle = () => {
    const styles: MapStyle[] = ['outdoors', 'satellite', 'standard'];
    const idx = styles.indexOf(mapStyle);
    setMapStyle(styles[(idx + 1) % styles.length]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Carregando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MAP_STYLES[mapStyle]}
        compassEnabled
        logoEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={userLocation ? 10 : 4}
          centerCoordinate={userLocation || [-47.9292, -15.7801]}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* Localização do usuário */}
        <MapboxGL.UserLocation visible />

        {/* Marcadores das trilhas */}
        {trails.filter(t => t.start_lat && t.start_lng).map(trail => (
          <MapboxGL.PointAnnotation
            key={trail.id}
            id={trail.id}
            coordinate={[trail.start_lng!, trail.start_lat!]}
            onSelected={() => setSelectedTrail(trail)}
          >
            <View style={[styles.marker, { backgroundColor: DifficultyColors[trail.difficulty] }]}>
              <Ionicons name="trail-sign" size={16} color={Colors.white} />
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* Botão de camadas */}
      <TouchableOpacity style={styles.layerBtn} onPress={cycleStyle}>
        <Ionicons name="layers-outline" size={22} color={Colors.primary} />
      </TouchableOpacity>

      {/* Botão de localização */}
      {userLocation && (
        <TouchableOpacity
          style={[styles.layerBtn, { bottom: 100 }]}
          onPress={() => cameraRef.current?.flyTo(userLocation, 1000)}
        >
          <Ionicons name="locate-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Preview da trilha selecionada */}
      {selectedTrail && (
        <View style={styles.preview}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTrail(null)}>
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.previewName}>{selectedTrail.name}</Text>
          <Text style={styles.previewSub}>
            {selectedTrail.location_city} · {selectedTrail.distance_km} km · {selectedTrail.difficulty}
          </Text>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => { setSelectedTrail(null); router.push(`/trail/${selectedTrail.id}`); }}
          >
            <Text style={styles.previewBtnText}>Ver trilha</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Legenda */}
      <View style={styles.legend}>
        {[{ c: Colors.easy, l: 'Fácil' }, { c: Colors.moderate, l: 'Moderada' }, { c: Colors.hard, l: 'Difícil' }].map(item => (
          <View key={item.l} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.c }]} />
            <Text style={styles.legendText}>{item.l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  marker: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, elevation: 4,
  },
  layerBtn: {
    position: 'absolute', right: 16, bottom: 160,
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, elevation: 4,
  },
  preview: {
    position: 'absolute', bottom: 80, left: 16, right: 16,
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, elevation: 10,
  },
  closeBtn: { position: 'absolute', top: 12, right: 12 },
  previewName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  previewSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12, textTransform: 'capitalize' },
  previewBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  previewBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  legend: {
    position: 'absolute', top: 60, left: 16,
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 10, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: Colors.textSecondary },
});
