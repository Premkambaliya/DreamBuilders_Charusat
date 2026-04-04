import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Resolve the correct backend URL for every environment ────────────────────
const getBaseUrl = () => {
  // 1. Running in Expo web browser
  if (Platform.OS === 'web') return 'http://localhost:5000/api';

  // 2. Physical device / Expo Go on local network → hostUri is like "172.24.44.18:8081"
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    console.log('[API] Resolved host from hostUri:', ip);
    return `http://${ip}:5000/api`;
  }

  // 3. Android Emulator (10.0.2.2 maps to the host machine's localhost)
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';

  // 4. iOS Simulator
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseUrl();
console.log('[API] API_BASE_URL =', API_BASE_URL);

// ─── Network helpers ──────────────────────────────────────────────────────────

const fetchWithTimeout = async (resource, options = {}) => {
  const timeout = options.timeout || 12000; // 12 second timeout
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out. Is the backend running at ${API_BASE_URL}?`);
    }
    throw new Error(`Network failed: ${error.message}`);
  }
};

const tryFetchJson = async (path, token = null) => {
  const url = `${API_BASE_URL}${path}`;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log('[API] GET', url, token ? '(authenticated)' : '(no token)');

  const response = await fetchWithTimeout(url, { headers });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg = errBody.message || `HTTP ${response.status}`;
    console.error('[API] Error', response.status, msg);
    throw new Error(msg);
  }

  const data = await response.json();
  console.log('[API] OK', path, '→', JSON.stringify(data).slice(0, 120));
  return data;
};

const tryFetchJsonMethod = async (method, path, body = null, token = null) => {
  const url = `${API_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  console.log('[API]', method, url);

  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg = errBody.message || `HTTP ${response.status}`;
    console.error('[API] Error', response.status, msg);
    throw new Error(msg);
  }

  return response.json();
};

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (credentials) =>
    await tryFetchJsonMethod('POST', '/auth/login', credentials),

  signup: async (details) =>
    await tryFetchJsonMethod('POST', '/auth/signup', details),

  updateProfile: async (payload, token) =>
    await tryFetchJsonMethod('PUT', '/auth/profile', payload, token),

  deleteAccount: async (token) =>
    await tryFetchJsonMethod('DELETE', '/auth/account', null, token),
};

// ─── Call normalizer ──────────────────────────────────────────────────────────

const normalizeCalls = (calls) =>
  (calls || []).map((call) => {
    const insights = call.aiInsights || {};
    return {
      ...call,
      callId:          call.callId || call._id,
      callTitle:       call.callTitle       || call.call_title       || insights.callTitle    || 'Sales Call',
      callType:        call.callType        || call.call_type        || insights.callType     || 'other',
      productName:     call.productName     || call.product_name     || insights.productName  || 'Product',
      summary:         call.summary         || insights.summary      || 'No summary available.',
      sentiment:       (call.sentiment      || insights.sentiment    || 'neutral').toLowerCase(),
      dealProbability: call.dealProbability ?? insights.dealProbability ?? 0,
      createdAt:       call.createdAt       || call.created_at,
      aiInsights: {
        ...insights,
        objections:          insights.objections          || [],
        buyingSignals:       insights.buyingSignals       || [],
        improvementsNeeded:  insights.improvementsNeeded  || [],
      },
    };
  });

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardApi = {
  getAnalytics: async (token) => {
    try {
      const data = await tryFetchJson('/dashboard/analytics', token);
      return { analytics: data.analytics || data.data || null };
    } catch (err) {
      console.error('[dashboardApi.getAnalytics]', err.message);
      throw err; // re-throw so the dashboard can show the error
    }
  },

  getCalls: async (token) => {
    try {
      const data = await tryFetchJson('/dashboard/calls', token);
      return { calls: normalizeCalls(data.calls || data.data || []) };
    } catch (err) {
      console.error('[dashboardApi.getCalls]', err.message);
      return { calls: [] };
    }
  },

  getCompetitors: async (token) => {
    try {
      const data = await tryFetchJson('/dashboard/competitors', token);
      return {
        competitorInsights:
          data.competitorInsights || data.data || { competitorsFrequency: [], topAdvantages: [] },
      };
    } catch (err) {
      console.error('[dashboardApi.getCompetitors]', err.message);
      return { competitorInsights: { competitorsFrequency: [], topAdvantages: [] } };
    }
  },

  getRiskRadar: async (token) => {
    try {
      const data = await tryFetchJson('/dashboard/risk-radar', token);
      return { riskCalls: data.riskCalls || [] };
    } catch (err) {
      console.error('[dashboardApi.getRiskRadar]', err.message);
      return { riskCalls: [] };
    }
  },

  getCallDetails: async (callId, token) => {
    try {
      const data = await tryFetchJson(`/dashboard/call/${callId}`, token);
      return { call: data.call || data.data || null };
    } catch (err) {
      console.error('[dashboardApi.getCallDetails]', err.message);
      return { call: null };
    }
  },

  downloadCallReport: async (callId, token) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetchWithTimeout(`${API_BASE_URL}/dashboard/report/${callId}`, { headers });
    if (!response.ok) throw new Error('Failed to download report');
    const blob = await response.blob();
    return { blob, fileName: `call-report-${callId}.pdf` };
  },
};

// ─── Users / Products / Intelligence APIs ────────────────────────────────────

export const usersApi = {
  getEmployees: async (token) => {
    try {
      const data = await tryFetchJson('/users/employees', token);
      return { employees: data.data || [] };
    } catch { return { employees: [] }; }
  },
  addEmployee: async (employeeData, token) =>
    await tryFetchJsonMethod('POST', '/users/employees', employeeData, token),
};

export const productsApi = {
  getProducts: async (token) => {
    try {
      const data = await tryFetchJson('/products', token);
      return { products: data.data || [] };
    } catch { return { products: [] }; }
  },
  addProduct: async (productData, token) =>
    await tryFetchJsonMethod('POST', '/products', productData, token),
};

export const productIntelligenceApi = {
  getOverview: async (token) => {
    try {
      const data = await tryFetchJson('/product-intelligence/overview', token);
      return { products: data.products || [] };
    } catch { return { products: [] }; }
  },
  getProductIntelligence: async (productId, token) => {
    try { return await tryFetchJson(`/product-intelligence/${productId}`, token); }
    catch { return null; }
  },
};

export const employeeIntelligenceApi = {
  getOverview: async (token) => {
    try {
      const data = await tryFetchJson('/employee-intelligence/overview', token);
      return { employees: data.employees || [] };
    } catch { return { employees: [] }; }
  },
  getEmployeeIntelligence: async (employeeId, token) => {
    try { return await tryFetchJson(`/employee-intelligence/${employeeId}`, token); }
    catch { return null; }
  },
};
