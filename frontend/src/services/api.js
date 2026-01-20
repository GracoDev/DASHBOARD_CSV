import axios from 'axios';

const BACKEND1_URL = process.env.REACT_APP_BACKEND1_URL || 'http://localhost:5000';
const BACKEND2_URL = process.env.REACT_APP_BACKEND2_URL || 'http://localhost:8080';

// API do Backend 1 (Auth & Trigger)
export const backend1API = {
  login: async (username, password) => {
    const response = await axios.post(`${BACKEND1_URL}/login`, {
      username,
      password,
    });
    return response.data;
  },

  sync: async (token) => {
    const response = await axios.post(
      `${BACKEND1_URL}/sync`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};

// API do Backend 2 (Query API)
// Nota: Backend 2 não valida JWT, mas enviamos o token conforme requisito
export const backend2API = {
  getMetrics: async (token, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.paymentMethod) params.append('payment_method', filters.paymentMethod);

    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(
      `${BACKEND2_URL}/api/metrics?${params.toString()}`,
      { headers }
    );
    return response.data;
  },

  getTimeSeries: async (token, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.paymentMethod) params.append('payment_method', filters.paymentMethod);

    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(
      `${BACKEND2_URL}/api/metrics/time-series?${params.toString()}`,
      { headers }
    );
    return response.data;
  },
};

