import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333', 
  timeout: 10000,
});

// Interceptor de Request: Injeta o token se existir
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response: Trata o 401 Global (Token expirado ou inválido)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se der 401, removemos os dados de auth e jogamos o usuário pra tela de login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
