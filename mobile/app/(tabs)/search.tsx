import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TrailCard } from '../../src/components/TrailCard';
import { trailsApi, Trail } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

const DIFFICULTY_FILTERS = ['Todas', 'Fácil', 'Moderada', 'Difícil'];
const SORT_OPTIONS = [
  { key: 'recent', label: 'Mais recentes' },
  { key: 'rating', label: 'Mais avaliadas' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('Todas');
  const [sort, setSort] = useState('recent');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() && difficulty === 'Todas') return;
    setLoading(true);
    setSearched(true);
    try {
      const params: Record<string, any> = { sort, limit: 50 };
      if (query.trim()) params.q = query.trim();
      if (difficulty !== 'Todas') params.difficulty = difficulty.toLowerCase();

      const endpoint = query.trim() ? trailsApi.search(query.trim()) : trailsApi.list(params);
      const { data } = await endpoint;
      setResults((data as any).data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Buscar Trilhas</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Nome, cidade, estado..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de dificuldade */}
      <View style={styles.filterRow}>
        {DIFFICULTY_FILTERS.map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.chip, difficulty === d && styles.chipActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.chipText, difficulty === d && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ordenação */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
            onPress={() => setSort(s.key)}
          >
            <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TrailCard trail={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searched ? (
              <View style={styles.empty}>
                <Ionicons name="search" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="trail-sign-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Digite para buscar trilhas</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 14 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  searchBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  sortRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  sortChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sortChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  sortText: { fontSize: 13, color: Colors.textSecondary },
  sortTextActive: { color: Colors.accent, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
