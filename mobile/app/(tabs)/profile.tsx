import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { usersApi } from '../../src/services/api';
import { TrailCard } from '../../src/components/TrailCard';
import { Colors } from '../../src/constants/colors';

const LEVEL_ICONS: Record<string, string> = {
  iniciante: '🌱',
  explorador: '🧭',
  veterano: '🏔️',
};

export default function ProfileScreen() {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const [trails, setTrails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trails' | 'offline'>('trails');

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }
    loadTrails();
  }, [user, activeTab]);

  async function loadTrails() {
    setLoading(true);
    try {
      if (activeTab === 'trails') {
        const { data } = await usersApi.trails(user!.id);
        setTrails(data.data || []);
      } else {
        const { data } = await usersApi.offlineTrails();
        setTrails(data.data || []);
      }
    } catch {}
    setLoading(false);
  }

  if (!user) return null;

  const levelIcon = LEVEL_ICONS[user.level] || '🌱';

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={trails}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TrailCard trail={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Perfil */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {user.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userLevel}>
                  {levelIcon} {user.level.charAt(0).toUpperCase() + user.level.slice(1)}
                  {user.location ? ` · ${user.location}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={logOut} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user.trails_count}</Text>
                <Text style={styles.statLabel}>Trilhas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user.followers_count}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user.following_count}</Text>
                <Text style={styles.statLabel}>Seguindo</Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'trails' && styles.tabActive]}
                onPress={() => setActiveTab('trails')}
              >
                <Text style={[styles.tabText, activeTab === 'trails' && styles.tabTextActive]}>
                  Minhas trilhas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'offline' && styles.tabActive]}
                onPress={() => setActiveTab('offline')}
              >
                <Ionicons
                  name="download-outline"
                  size={14}
                  color={activeTab === 'offline' ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[styles.tabText, activeTab === 'offline' && styles.tabTextActive]}>
                  Offline
                </Text>
              </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="trail-sign-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                {activeTab === 'offline' ? 'Nenhuma trilha salva offline' : 'Você ainda não cadastrou trilhas'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14,
    backgroundColor: Colors.surface, marginBottom: 2,
  },
  avatarContainer: {},
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  userLevel: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  logoutBtn: { padding: 8 },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    paddingVertical: 16, marginBottom: 2, justifyContent: 'space-evenly',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 16,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});
