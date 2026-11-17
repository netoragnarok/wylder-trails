import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Injeta token Firebase em toda requisição autenticada
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tipos
export interface Trail {
  id: string;
  name: string;
  description?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  difficulty: 'fácil' | 'moderada' | 'difícil';
  distance_km: number;
  terrain_type?: 'íngreme' | 'plano' | 'mesclado';
  estimated_duration_minutes?: number;
  has_parking: boolean;
  is_accessible_by_car: boolean;
  is_accessible_by_motorcycle: boolean;
  is_accessible_by_bicycle: boolean;
  is_accessible_on_foot: boolean;
  has_cell_signal: boolean;
  has_waterfall: boolean;
  has_camping: boolean;
  has_river_crossing: boolean;
  has_climbing: boolean;
  best_seasons: string[];
  fauna_flora_notes?: string;
  is_public: boolean;
  rating_avg: number;
  rating_count: number;
  route: RoutePoint[];
  waypoints: Waypoint[];
  danger_points: DangerPoint[];
  photos: string[];
  start_lat?: number;
  start_lng?: number;
  author_id?: string;
  author_name?: string;
  author_avatar?: string;
  created_at: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface Waypoint {
  lat: number;
  lng: number;
  type: 'entrada' | 'saída' | 'cachoeira' | 'acampamento' | 'perigo' | 'ponto de vista';
  label?: string;
}

export interface DangerPoint {
  lat: number;
  lng: number;
  type: 'deslizamento' | 'animais peçonhentos' | 'área alagada' | 'queda de pedras' | 'travessia perigosa';
  description?: string;
}

export interface Review {
  id: string;
  trail_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  level: string;
  trails_count: number;
  followers_count: number;
  following_count: number;
  bio?: string;
  location?: string;
}

// API calls
export const trailsApi = {
  list: (params?: Record<string, any>) => api.get('/api/trails', { params }),
  get: (id: string) => api.get<Trail>(`/api/trails/${id}`),
  create: (data: FormData) => api.post<Trail>('/api/trails', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: string, data: Partial<Trail>) => api.put<Trail>(`/api/trails/${id}`, data),
  delete: (id: string) => api.delete(`/api/trails/${id}`),
  search: (q: string) => api.get('/api/trails/search', { params: { q } }),
  saveOffline: (id: string) => api.post(`/api/trails/${id}/offline`),
};

export const reviewsApi = {
  list: (trailId: string, params?: Record<string, any>) =>
    api.get(`/api/reviews/${trailId}`, { params }),
  create: (trailId: string, data: { rating: number; comment?: string }) =>
    api.post<Review>(`/api/reviews/${trailId}`, data),
  update: (reviewId: string, data: { rating: number; comment?: string }) =>
    api.put<Review>(`/api/reviews/${reviewId}`, data),
};

export const usersApi = {
  me: () => api.get<User>('/api/users/me'),
  get: (id: string) => api.get<User>(`/api/users/${id}`),
  update: (data: Partial<User>) => api.put<User>('/api/users/me', data),
  trails: (id: string) => api.get(`/api/users/${id}/trails`),
  follow: (id: string) => api.post(`/api/users/${id}/follow`),
  unfollow: (id: string) => api.delete(`/api/users/${id}/follow`),
  offlineTrails: () => api.get('/api/users/me/offline-trails'),
};

export default api;
