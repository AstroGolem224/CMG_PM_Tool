/** Axios instance configured for the CMG PM Tool API */
import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export default client;
