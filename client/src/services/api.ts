import axios from 'axios';
import type { AuthResponse, User, Room, RoomCreateRequest } from '../types';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await api.post<AuthResponse>('/auth/refresh');
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (username: string, displayName: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      username,
      displayName,
      password,
    });
    localStorage.setItem('accessToken', data.accessToken);
    return data;
  },

  login: async (username: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      username,
      password,
    });
    localStorage.setItem('accessToken', data.accessToken);
    return data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },

  getCurrentUser: async () => {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },
};

export const roomAPI = {
  createRoom: async (roomData: RoomCreateRequest) => {
    const { data } = await api.post<{ room: Room }>('/rooms/create', roomData);
    return data.room;
  },

  getMyRooms: async () => {
    const { data } = await api.get<{ rooms: Room[] }>('/rooms/my-rooms');
    return data.rooms;
  },

  getRoomInfo: async (phraseCode: string) => {
    const { data } = await api.get<{ room: Room }>(`/rooms/${phraseCode}`);
    return data.room;
  },

  verifyPassword: async (phraseCode: string, password: string) => {
    const { data } = await api.post<{ valid: boolean }>(
      `/rooms/${phraseCode}/verify`,
      { password }
    );
    return data.valid;
  },

  deleteRoom: async (phraseCode: string) => {
    await api.delete(`/rooms/${phraseCode}`);
  },
};

export default api;
