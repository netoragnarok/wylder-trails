import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapboxGL from '@rnmapbox/maps';
import { trailsApi, reviewsApi, Trail, Review } from '../../src/services/api';
import { StarRating } from '../../src/components/StarRating';
import { AttributeBadge } from '../../src/components/AttributeBadge';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, DifficultyColors } from '../../src/constants/colors';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

const { width } = Dimensions.get('window');

export default function TrailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [trail, setTrail] = useState<Trail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOffline, setSavingOffline] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  useEffect(() => {
    loadTrail();
  }, [id]);

  async function loadTrail() {
    try {
      const { data } = await trailsApi.get(id);
      setTrail(data);
      if ((data as any).recent_reviews) setReviews((data as any).recent_reviews);
    } catch {
      Alert.alert('Erro', 'Trilha não encontrada.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOffline() {
    if (!user) { router.push('/auth'); return; }
    setSavingOffline(true);
    try {
      await trailsApi.saveOffline(id);
      Alert.alert('Salvo!', 'Trilha salva para uso offline.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a trilha offline.');
    } finally {
      setSavingOffline(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!trail) return null;

  const diffColor = DifficultyColors[trail.difficulty];
  const routeCoords: [number, number][] = (trail.route || []).map(p => [p.lng, p.lat]);
  const hasRoute = routeCoords.length > 1;
  const center: [number, number] = hasRoute
    ? routeCoords[Math.floor(routeCoords.length / 2)]
    : trail.start_lng && trail.start_lat
    ? [trail.start_lng, trail.start_lat]
    : [-47.9292, -15.7801];

  const formatDuration = (mins?: number) => {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Fotos */}
      <View style={styles.photoContainer}>
        <Image
          source={{ uri: trail.photos?.[currentPhoto] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800' }}
          style={styles.photo}
          resizeMode="cover"
        />
        {trail.photos && trail.photos.length > 1 && (
          <View style={styles.photoDots}>
            {trail.photos.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setCurrentPhoto(i)}>
                <View style={[styles.dot, i === currentPhoto && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={[styles.diffOverlay, { backgroundColor: diffColor }]}>
          <Text style={styles.diffText}>{trail.difficulty}</Text>
        </View>
      </View>

      <SafeAreaView edges={['bottom']}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{trail.name}</Text>
              {(trail.location_city || trail.location_state) && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.location}>
                    {[trail.location_city, trail.location_state, trail.location_country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
            </View>
            {trail.rating_avg > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color={Colors.starFilled} />
                <Text style={styles.ratingText}>{trail.rating_avg.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({trail.rating_count})</Text>
              </View>
            )}
          </View>

          {/* Stats rápidos */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Ionicons name="map-outline" size={20} color={Colors.primary} />
              <Text style={styles.quickStatValue}>{trail.distance_km} km</Text>
              <Text style={styles.quickStatLabel}>Distância</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.quickStat}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.quickStatValue}>{formatDuration(trail.estimated_duration_minutes)}</Text>
              <Text style={styles.quickStatLabel}>Duração</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.quickStat}>
              <Ionicons name="trending-up-outline" size={20} color={Colors.primary} />
              <Text style={styles.quickStatValue}>{trail.terrain_type || '—'}</Text>
              <Text style={styles.quickStatLabel}>Terreno</Text>
            </View>
          </View>

          {/* Descrição */}
          {trail.description && (
            <Text style={styles.description}>{trail.description}</Text>
          )}

          {/* Atributos */}
          <Text style={styles.sectionTitle}>Características</Text>
          <View style={styles.badgesRow}>
            <AttributeBadge icon="car-outline" label="Estacionamento" active={trail.has_parking} />
            <AttributeBadge icon="water-outline" label="Cachoeira" active={trail.has_waterfall} />
            <AttributeBadge icon="bonfire-outline" label="Acampamento" active={trail.has_camping} />
            <AttributeBadge icon="cellular-outline" label="Sem sinal" active={!trail.has_cell_signal} danger />
            <AttributeBadge icon="git-merge-outline" label="Travessia" active={trail.has_river_crossing} />
            <AttributeBadge icon="trending-up-outline" label="Escalada" active={trail.has_climbing} />
            <AttributeBadge icon="car-sport-outline" label="Acesso de carro" active={trail.is_accessible_by_car} />
            <AttributeBadge icon="bicycle-outline" label="Bicicleta" active={trail.is_accessible_by_bicycle} />
          </View>

          {/* Melhores épocas */}
          {trail.best_seasons?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Melhores épocas</Text>
              <View style={styles.badgesRow}>
                {trail.best_seasons.map(s => (
                  <View key={s} style={styles.seasonBadge}>
                    <Text style={styles.seasonBadgeText}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Fauna e flora */}
          {trail.fauna_flora_notes && (
            <View style={styles.infoBox}>
              <Ionicons name="leaf-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoBoxText}>{trail.fauna_flora_notes}</Text>
            </View>
          )}

          {/* Mapa */}
          <Text style={styles.sectionTitle}>Mapa da Trilha</Text>
          <View style={styles.mapContainer}>
            <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Outdoors} scrollEnabled={false}>
              <MapboxGL.Camera centerCoordinate={center} zoomLevel={hasRoute ? 12 : 10} />

              {hasRoute && (
                <MapboxGL.ShapeSource id="route" shape={{ type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords }, properties: {} }}>
                  <MapboxGL.LineLayer id="routeLine" style={{ lineColor: Colors.primary, lineWidth: 4, lineOpacity: 0.9 }} />
                </MapboxGL.ShapeSource>
              )}

              {/* Waypoints */}
              {(trail.waypoints || []).map((wp, i) => (
                <MapboxGL.PointAnnotation key={`wp-${i}`} id={`wp-${i}`} coordinate={[wp.lng, wp.lat]}>
                  <View style={[styles.waypointMarker, wp.type === 'cachoeira' && { backgroundColor: '#3182CE' }]}>
                    <Ionicons name={wp.type === 'cachoeira' ? 'water' : 'location'} size={12} color="#fff" />
                  </View>
                </MapboxGL.PointAnnotation>
              ))}

              {/* Pontos de perigo */}
              {(trail.danger_points || []).map((dp, i) => (
                <MapboxGL.PointAnnotation key={`dp-${i}`} id={`dp-${i}`} coordinate={[dp.lng, dp.lat]}>
                  <View style={styles.dangerMarker}>
                    <Ionicons name="warning" size={12} color="#fff" />
                  </View>
                </MapboxGL.PointAnnotation>
              ))}
            </MapboxGL.MapView>

            {/* Legenda de perigos */}
            {(trail.danger_points || []).length > 0 && (
              <View style={styles.dangerLegend}>
                <Ionicons name="warning-outline" size={14} color={Colors.danger} />
                <Text style={styles.dangerLegendText}>
                  {trail.danger_points!.length} ponto(s) de perigo identificado(s)
                </Text>
              </View>
            )}
          </View>

          {/* Ações */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSaveOffline} disabled={savingOffline}>
              {savingOffline ? <ActivityIndicator size="small" color={Colors.primary} /> : (
                <>
                  <Ionicons name="download-outline" size={18} color={Colors.primary} />
                  <Text style={styles.actionBtnText}>Salvar offline</Text>
                </>
              )}
            </TouchableOpacity>
            {user && user.id !== trail.author_id && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={() => router.push(`/trail/review/${id}`)}
              >
                <Ionicons name="star-outline" size={18} color={Colors.white} />
                <Text style={[styles.actionBtnText, { color: Colors.white }]}>Avaliar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Avaliações */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Avaliações</Text>
            {trail.rating_avg > 0 && (
              <View style={styles.avgRating}>
                <Text style={styles.avgRatingValue}>{trail.rating_avg.toFixed(1)}</Text>
                <StarRating rating={trail.rating_avg} size={16} readonly />
                <Text style={styles.avgRatingCount}>{trail.rating_count} avaliação(ões)</Text>
              </View>
            )}
          </View>

          {reviews.length === 0 ? (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsText}>Nenhuma avaliação ainda. Seja o primeiro!</Text>
            </View>
          ) : (
            reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {(review.user_name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUser}>{review.user_name || 'Usuário'}</Text>
                    <StarRating rating={review.rating} size={13} readonly />
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
              </View>
            ))
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoContainer: { position: 'relative' },
  photo: { width, height: 280 },
  photoDots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: Colors.white, width: 18 },
  diffOverlay: { position: 'absolute', top: 20, right: 20, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  diffText: { color: Colors.white, fontWeight: '700', fontSize: 13, textTransform: 'capitalize' },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 13, color: Colors.textSecondary },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accentLight, padding: 8, borderRadius: 10 },
  ratingText: { fontSize: 16, fontWeight: '700', color: Colors.accent },
  ratingCount: { fontSize: 11, color: Colors.textSecondary },
  quickStats: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 20, justifyContent: 'space-evenly' },
  quickStat: { alignItems: 'center', gap: 4 },
  quickStatValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, textTransform: 'capitalize' },
  quickStatLabel: { fontSize: 11, color: Colors.textSecondary },
  divider: { width: 1, backgroundColor: Colors.border },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, marginTop: 4 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: Colors.primaryPale, borderRadius: 12, padding: 12, marginBottom: 20 },
  infoBoxText: { flex: 1, fontSize: 13, color: Colors.primary, lineHeight: 20 },
  mapContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  map: { height: 220 },
  waypointMarker: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.white },
  dangerMarker: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.white },
  dangerLegend: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: Colors.dangerLight },
  dangerLegendText: { fontSize: 12, color: Colors.danger },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, padding: 12 },
  actionBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  reviewsHeader: { marginBottom: 8 },
  avgRating: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  avgRatingValue: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  avgRatingCount: { fontSize: 13, color: Colors.textSecondary },
  noReviews: { padding: 20, alignItems: 'center' },
  noReviewsText: { color: Colors.textMuted, fontSize: 14 },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  reviewUser: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  reviewDate: { fontSize: 11, color: Colors.textMuted },
  reviewComment: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  seasonBadge: { backgroundColor: Colors.accentLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  seasonBadgeText: { color: Colors.accent, fontWeight: '600', fontSize: 13 },
});
