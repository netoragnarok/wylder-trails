import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="trail/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerTransparent: true,
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="trail/create"
          options={{
            headerShown: true,
            headerTitle: 'Nova Trilha',
            headerTintColor: '#1A5C38',
          }}
        />
        <Stack.Screen
          name="trail/review/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Avaliar Trilha',
            headerTintColor: '#1A5C38',
            presentation: 'modal',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
