import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Trail } from '../services/api';
import { Colors, DifficultyColors } from '../constants/colors';

interface TrailCardProps {
  trail: Trail;
}

export function TrailCard({ trail }: TrailCardProps) {
  const router = useRouter();
  const diffColor = DifficultyColors[trail.difficulty] || Colors.textSecondary;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}min`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/trail/${trail.id}`)}
      activeOpacity={0.85}
    >
      <Image
        source={{
          uri: trail.photos?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400',
        }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Badge de dificuldade */}
      <View style={[styles.diffBadge, { backgroundColor: diffColor }]}>
        <Text style={styles.diffText}>{trail.difficulty}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{trail.name}</Text>
        <Text style={styles.location} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
          {' '}{trail.location_city}{trail.location_state ? `, ${trail.location_state}` : ''}
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="map-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.statText}>{trail.distance_km} km</Text>
          </View>
          {trail.estimated_duration_minutes && (
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.statText}>{formatDuration(trail.estimated_duration_minutes)}</Text>
            </View>
          )}
          <View style={styles.stat}>
            <Ionicons name="star" size={13} color={Colors.starFilled} />
            <Text style={styles.statText}>
              {trail.rating_avg > 0 ? trail.rating_avg.toFixed(1) : 'Nova'}
              {trail.rating_count > 0 ? ` (${trail.rating_count})` : ''}
            </Text>
          </View>
        </View>

        {/* Ícones de atributos */}
        <View style={styles.attrs}>
          {trail.has_parking && (
            <View style={styles.attrIcon}>
              <Ionicons name="car-outline" size={14} color={Colors.primary} />
            </View>
          )}
          {trail.has_waterfall && (
            <View style={styles.attrIcon}>
              <Ionicons name="water-outline" size={14} color={Colors.primary} />
            </View>
          )}
          {trail.has_camping && (
            <View style={styles.attrIcon}>
              <Ionicons name="bonfire-outline" size={14} color={Colors.primary} />
            </View>
          )}
          {trail.has_cell_signal === false && (
            <View style={[styles.attrIcon, { backgroundColor: Colors.dangerLight }]}>
              <Ionicons name="cellular-outline" size={14} color={Colors.danger} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.border,
  },
  diffBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  diffText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  info: {
    padding: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  stats: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  attrs: {
    flexDirection: 'row',
    gap: 6,
  },
  attrIcon: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 6,
    padding: 4,
  },
});
