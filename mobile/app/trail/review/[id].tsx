import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { reviewsApi } from '../../../src/services/api';
import { StarRating } from '../../../src/components/StarRating';
import { Colors } from '../../../src/constants/colors';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('Atenção', 'Selecione uma nota de 1 a 5 estrelas.'); return; }
    setLoading(true);
    try {
      await reviewsApi.create(id, { rating, comment: comment.trim() || undefined });
      Alert.alert('Avaliação publicada!', 'Obrigado pelo seu feedback.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Não foi possível publicar a avaliação.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Avaliar trilha</Text>
        <Text style={styles.subtitle}>Como foi sua experiência?</Text>

        <StarRating rating={rating} onRate={setRating} size={40} />
        <Text style={styles.ratingLabel}>
          {rating === 0 ? 'Toque para avaliar' : ['', 'Muito ruim', 'Ruim', 'Regular', 'Boa', 'Excelente!'][rating]}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Comentário (opcional)</Text>
          <TextInput
            style={styles.textarea}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
            placeholder="Descreva sua experiência na trilha..."
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, (loading || rating === 0) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading ? <ActivityIndicator color={Colors.white} /> : (
            <Text style={styles.btnText}>Publicar avaliação</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 32 },
  ratingLabel: { fontSize: 16, color: Colors.textSecondary, marginTop: 10, marginBottom: 32, fontWeight: '500' },
  field: { width: '100%', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  textarea: {
    backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, padding: 14, fontSize: 14,
    color: Colors.textPrimary, height: 110, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: Colors.textMuted, alignSelf: 'flex-end', marginTop: 4 },
  btn: {
    width: '100%', backgroundColor: Colors.primary, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
