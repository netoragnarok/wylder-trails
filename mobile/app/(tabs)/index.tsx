import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { TrailCard } from '../../src/components/TrailCard';
import { trailsApi, Trail } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/constants/colors';

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'fácil', label: 'Fácil' },
  { key: 'moderada', label: 'Moderada' },
  { key: 'difícil', label: 'Difícil' },
  { key: 'parking', label: 'Estacionamento' },
  { key: 'waterfall', label: 'Cachoeiras' },
  { key: 'camping', label: 'Acampamento' },
];

export default function FeedScreen() {
  const { user } = useAuth();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const loadTrails = useCallback(async () => {
    try {
      const params: Record<string, any> = { sort: 'recent', limit: 30 };
      if (activeFilter === 'fácil' || activeFilter === 'moderada' || activeFilter === 'difícil') {
        params.difficulty = activeFilter;
      }
      if (activeFilter === 'parking') params.has_parking = 'true';
      if (activeFilter === 'waterfall') params.has_waterfall = 'true';
      if (activeFilter === 'camping') params.has_camping = 'true';
      if (location) {
        params.lat = location.lat;
        params.lng = location.lng;
        params.sort = 'proximity';
      }

      const { data } = await trailsApi.list(params);
      setTrails(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar trilhas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, location]);

  useEffect(() => { loadTrails(); }, [loadTrails]);

  const handleRefresh = () => { setRefreshing(true); loadTrails(); };

  const filteredTrails = search.trim()
    ? trails.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.location_city?.toLowerCase().includes(search.toLowerCase())
      )
    : trails;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}, {user?.name?.split(' ')[0] || 'Trilheiro'} 👋</Text>
          <Text style={styles.subtitle}>Trilhas perto de você</Text>
        </View>
        <Ionicons name="leaf" size={28} color={Colors.primary} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar trilhas, cidades..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros rápidos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTrails}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TrailCard trail={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trail-sign-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nenhuma trilha encontrada</Text>
              <Text style={styles.emptySubtext}>Tente outros filtros ou seja o primeiro a cadastrar!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filtersRow: { paddingLeft: 20, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.white },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
