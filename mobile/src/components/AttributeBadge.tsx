import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface AttributeBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  danger?: boolean;
}

export function AttributeBadge({ icon, label, active = true, danger = false }: AttributeBadgeProps) {
  if (!active) return null;

  return (
    <View style={[styles.badge, danger ? styles.dangerBadge : styles.normalBadge]}>
      <Ionicons
        name={icon}
        size={14}
        color={danger ? Colors.danger : Colors.primary}
      />
      <Text style={[styles.label, danger ? styles.dangerLabel : styles.normalLabel]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  normalBadge: {
    backgroundColor: Colors.primaryPale,
  },
  dangerBadge: {
    backgroundColor: Colors.dangerLight,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  normalLabel: {
    color: Colors.primary,
  },
  dangerLabel: {
    color: Colors.danger,
  },
});
