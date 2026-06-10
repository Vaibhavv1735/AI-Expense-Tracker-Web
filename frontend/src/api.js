import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
});

// Expenses
export const getExpenses = (start, end, category) =>
  api.get('/expenses', { params: { start, end, category } });

export const addExpense = (data) =>
  api.post('/expenses', data);

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`);

// Chat
export const sendMessage = (message, apiKey, provider) =>
  api.post('/chat', { message, api_key: apiKey, provider });

// Dashboard
export const getDashboard = () =>
  api.get('/dashboard');

// Insights
export const getInsights = () =>
  api.get('/insights');