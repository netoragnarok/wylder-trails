import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../src/services/firebase';
import { trailsApi } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/constants/colors';

type Difficulty = 'fácil' | 'moderada' | 'difícil';
type Terrain = 'íngreme' | 'plano' | 'mesclado';

export default function CreateTrailScreen() {
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [difficulty, setDifficulty] = useState<Difficulty>('moderada');
  const [terrain, setTerrain] = useState<Terrain>('mesclado');
  const [distanceKm, setDistanceKm] = useState(0);
  const [route, setRoute] = useState<{ lat: number; lng: number; elevation?: number }[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [faunaFlora, setFaunaFlora] = useState('');
  const [bestSeasons, setBestSeasons] = useState<string[]>([]);

  // Toggles
  const [hasParking, setHasParking] = useState(false);
  const [hasCellSignal, setHasCellSignal] = useState(false);
  const [hasWaterfall, setHasWaterfall] = useState(false);
  const [hasCamping, setHasCamping] = useState(false);
  const [hasRiverCrossing, setHasRiverCrossing] = useState(false);
  const [hasClimbing, setHasClimbing] = useState(false);
  const [byCar, setByCar] = useState(false);
  const [byMoto, setByMoto] = useState(false);
  const [byBike, setByBike] = useState(false);

  if (!firebaseUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.authText}>Faça login para cadastrar trilhas</Text>
          <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/auth')}>
            <Text style={styles.authBtnText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const startGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos de acesso à localização para gravar a rota.'); return; }

    setRecording(true);
    setRoute([]);
    setDistanceKm(0);
    setElapsed(0);

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 10 },
      (loc) => {
        const point = { lat: loc.coords.latitude, lng: loc.coords.longitude, elevation: loc.coords.altitude || undefined };
        setRoute(prev => {
          const newRoute = [...prev, point];
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const d = haversine(last.lat, last.lng, point.lat, point.lng);
            setDistanceKm(km => Math.round((km + d) * 100) / 100);
          }
          return newRoute;
        });
      }
    );
  };

  const stopGPS = () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchRef.current) watchRef.current.remove();
  };

  const pickPhoto = async () => {
    if (photos.length >= 20) { Alert.alert('Limite', 'Máximo de 20 fotos por trilha.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setPhotos(prev => [...prev, result.assets[0].uri]);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const uri of photos) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `trails/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Erro', 'O nome da trilha é obrigatório.'); return; }
    if (distanceKm <= 0) { Alert.alert('Erro', 'A distância deve ser maior que zero. Grave o GPS ou informe manualmente.'); return; }

    setLoading(true);
    try {
      const photoUrls = photos.length > 0 ? await uploadPhotos() : [];

      const payload = {
        name: name.trim(),
        description: description.trim(),
        location_city: city.trim(),
        location_state: state.trim(),
        location_country: country.trim() || 'Brasil',
        difficulty,
        distance_km: distanceKm,
        terrain_type: terrain,
        estimated_duration_minutes: recording ? undefined : elapsed > 0 ? Math.round(elapsed / 60) : undefined,
        has_parking: hasParking,
        is_accessible_by_car: byCar,
        is_accessible_by_motorcycle: byMoto,
        is_accessible_by_bicycle: byBike,
        is_accessible_on_foot: true,
        has_cell_signal: hasCellSignal,
        has_waterfall: hasWaterfall,
        has_camping: hasCamping,
        has_river_crossing: hasRiverCrossing,
        has_climbing: hasClimbing,
        best_seasons: bestSeasons,
        fauna_flora_notes: faunaFlora.trim(),
        is_public: true,
        route,
        waypoints: [],
        danger_points: [],
        photos: photoUrls,
      };

      await trailsApi.create(payload as any);
      Alert.alert('Trilha publicada!', 'Sua trilha foi cadastrada com sucesso.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível publicar a trilha.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeason = (s: string) => {
    setBestSeasons(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Nova Trilha</Text>
        <Text style={styles.pageSubtitle}>Registre um percurso que você já fez</Text>

        {/* Nome */}
        <View style={styles.field}>
          <Text style={styles.label}>Nome da trilha *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Trilha da Pedra do Baú" placeholderTextColor={Colors.textMuted} />
        </View>

        {/* Descrição */}
        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholder="Descreva a trilha, pontos de destaque..." placeholderTextColor={Colors.textMuted} />
        </View>

        {/* Localização */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Cidade" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={[styles.field, { width: 80 }]}>
            <Text style={styles.label}>Estado</Text>
            <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="SP" maxLength={2} autoCapitalize="characters" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>

        {/* GPS */}
        <View style={styles.field}>
          <Text style={styles.label}>Percurso — GPS</Text>
          <View style={styles.gpsBox}>
            <TouchableOpacity
              style={[styles.gpsBtn, recording && styles.gpsBtnStop]}
              onPress={recording ? stopGPS : startGPS}
            >
              <Ionicons name={recording ? 'stop-circle' : 'radio-button-on'} size={20} color={Colors.white} />
              <Text style={styles.gpsBtnText}>{recording ? 'Parar gravação' : 'Iniciar gravação GPS'}</Text>
            </TouchableOpacity>
            <View style={styles.gpsStats}>
              <View style={styles.gpsStat}>
                <Text style={styles.gpsStatValue}>{formatTime(elapsed)}</Text>
                <Text style={styles.gpsStatLabel}>Tempo</Text>
              </View>
              <View style={styles.gpsStat}>
                <Text style={styles.gpsStatValue}>{distanceKm.toFixed(1)} km</Text>
                <Text style={styles.gpsStatLabel}>Distância</Text>
              </View>
              <View style={styles.gpsStat}>
                <Text style={styles.gpsStatValue}>{route.length}</Text>
                <Text style={styles.gpsStatLabel}>Pontos</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Distância manual */}
        {distanceKm === 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Distância (km) *</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="Ex: 12.5"
              onChangeText={v => setDistanceKm(parseFloat(v) || 0)}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        )}

        {/* Dificuldade */}
        <View style={styles.field}>
          <Text style={styles.label}>Dificuldade *</Text>
          <View style={styles.segmented}>
            {(['fácil', 'moderada', 'difícil'] as Difficulty[]).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.segment, difficulty === d && { backgroundColor: Colors.DifficultyColors?.[d] || Colors.primary }]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.segmentText, difficulty === d && styles.segmentTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Terreno */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo de terreno</Text>
          <View style={styles.segmented}>
            {(['íngreme', 'plano', 'mesclado'] as Terrain[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.segment, terrain === t && styles.segmentActive]}
                onPress={() => setTerrain(t)}
              >
                <Text style={[styles.segmentText, terrain === t && styles.segmentTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fotos */}
        <View style={styles.field}>
          <Text style={styles.label}>Fotos da trilha ({photos.length}/20)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosRow}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}>
                    <Ionicons name="close-circle" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 20 && (
                <TouchableOpacity style={styles.addPhoto} onPress={pickPhoto}>
                  <Ionicons name="camera-outline" size={24} color={Colors.primary} />
                  <Text style={styles.addPhotoText}>Adicionar</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Toggles */}
        <View style={styles.field}>
          <Text style={styles.label}>Características</Text>
          {[
            { label: 'Estacionamento disponível', value: hasParking, setter: setHasParking },
            { label: 'Sinal de celular', value: hasCellSignal, setter: setHasCellSignal },
            { label: 'Possui cachoeira', value: hasWaterfall, setter: setHasWaterfall },
            { label: 'Área de acampamento', value: hasCamping, setter: setHasCamping },
            { label: 'Travessia de rios/riachos', value: hasRiverCrossing, setter: setHasRiverCrossing },
            { label: 'Requer escalada', value: hasClimbing, setter: setHasClimbing },
          ].map(({ label, value, setter }) => (
            <View key={label} style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{label}</Text>
              <Switch value={value} onValueChange={setter} trackColor={{ true: Colors.primary }} />
            </View>
          ))}
        </View>

        {/* Meios de acesso */}
        <View style={styles.field}>
          <Text style={styles.label}>Meios de acesso</Text>
          {[
            { label: 'Carro', value: byCar, setter: setByCar },
            { label: 'Moto', value: byMoto, setter: setByMoto },
            { label: 'Bicicleta', value: byBike, setter: setByBike },
          ].map(({ label, value, setter }) => (
            <View key={label} style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{label}</Text>
              <Switch value={value} onValueChange={setter} trackColor={{ true: Colors.primary }} />
            </View>
          ))}
        </View>

        {/* Melhores épocas */}
        <View style={styles.field}>
          <Text style={styles.label}>Melhores épocas do ano</Text>
          <View style={styles.seasonRow}>
            {['verão', 'outono', 'inverno', 'primavera'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.seasonChip, bestSeasons.includes(s) && styles.seasonChipActive]}
                onPress={() => toggleSeason(s)}
              >
                <Text style={[styles.seasonText, bestSeasons.includes(s) && styles.seasonTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fauna e flora */}
        <View style={styles.field}>
          <Text style={styles.label}>Fauna e flora notáveis</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={faunaFlora}
            onChangeText={setFaunaFlora}
            multiline
            numberOfLines={2}
            maxLength={300}
            placeholder="Ex: Araras, orquídeas, bromélia..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={Colors.white} /> : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
              <Text style={styles.submitBtnText}>Publicar trilha</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  pageSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  field: { marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary,
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  gpsBox: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12, padding: 12, marginBottom: 14,
  },
  gpsBtnStop: { backgroundColor: Colors.danger },
  gpsBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  gpsStats: { flexDirection: 'row', justifyContent: 'space-around' },
  gpsStat: { alignItems: 'center' },
  gpsStatValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  gpsStatLabel: { fontSize: 11, color: Colors.textSecondary },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  segmentActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  segmentText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', textTransform: 'capitalize' },
  segmentTextActive: { color: Colors.white, fontWeight: '700' },
  photosRow: { flexDirection: 'row', gap: 10 },
  photoThumb: { position: 'relative' },
  photoImg: { width: 90, height: 90, borderRadius: 10 },
  photoRemove: { position: 'absolute', top: -6, right: -6 },
  addPhoto: {
    width: 90, height: 90, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  addPhotoText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  toggleLabel: { fontSize: 14, color: Colors.textPrimary },
  seasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seasonChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  seasonChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  seasonText: { fontSize: 13, color: Colors.textSecondary },
  seasonTextActive: { color: Colors.accent, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16, marginTop: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  authText: { fontSize: 16, color: Colors.textSecondary },
  authBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  authBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
