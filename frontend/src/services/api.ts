const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATIONS' | 'SALES';
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: User;
  };
}

const GET_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function clearCache() {
  GET_CACHE.clear();
}

async function apiFetch(url: string, options?: RequestInit) {
  const isGet = !options?.method || options.method === 'GET';
  
  if (isGet) {
    const now = Date.now();
    if (GET_CACHE.has(url)) {
      const cached = GET_CACHE.get(url)!;
      if (now - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }
  } else {
    // Clear cache on any mutation (POST, PATCH, DELETE) to ensure fresh data
    clearCache();
  }

  const res = await fetch(url, options);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'API request failed');
  }

  if (isGet) {
    GET_CACHE.set(url, { data, timestamp: Date.now() });
  }

  return data;
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem('opsflow_token');
  },

  setToken(token: string) {
    localStorage.setItem('opsflow_token', token);
  },

  clearToken() {
    localStorage.removeItem('opsflow_token');
    clearCache();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await apiFetch(${BASE_URL}/auth/login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (data.success && data.data?.token) {
      this.setToken(data.data.token);
    }
    return data;
  },

  async getMe(): Promise<MeResponse> {
    const token = this.getToken();
    if (!token) throw new Error('No authentication token found');
    return apiFetch(${BASE_URL}/auth/me, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
    });
  },

  async getItems(): Promise<{ success: boolean; data: any[] }> {
    return apiFetch(${BASE_URL}/items, { headers: { Authorization: Bearer  } });
  },

  async getLocations(): Promise<{ success: boolean; data: any[] }> {
    return apiFetch(${BASE_URL}/locations, { headers: { Authorization: Bearer  } });
  },

  async getBatches(): Promise<{ success: boolean; data: any[] }> {
    return apiFetch(${BASE_URL}/batches, { headers: { Authorization: Bearer  } });
  },

  async getUsers(): Promise<{ success: boolean; data: any[] }> {
    return apiFetch(${BASE_URL}/users, { headers: { Authorization: Bearer  } });
  },

  async getCategories(): Promise<{ success: boolean; data: any[] }> {
    return apiFetch(${BASE_URL}/categories, { headers: { Authorization: Bearer  } });
  },

  async createCategory(payload: { name: string }): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/categories, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async createItem(payload: { name: string; sku: string; categoryId: string }): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/items, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async createBatch(payload: { batchNumber: string; itemId: string }): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/batches, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async getInventory(): Promise<{ success: boolean; data: any[] }> {
    return apiFetch(${BASE_URL}/inventory, { headers: { Authorization: Bearer  } });
  },

  async createInventory(payload: any): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/inventory, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async updateInventory(id: string, payload: any): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/inventory/, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async deleteInventory(id: string): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/inventory/, {
      method: 'DELETE',
      headers: { Authorization: Bearer  },
    });
  },

  async getWorkOrders(): Promise<{ success: boolean; data: any[] }> {
    return apiFetch(${BASE_URL}/work-orders, { headers: { Authorization: Bearer  } });
  },

  async createWorkOrder(payload: any): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/work-orders, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async updateWorkOrderStatus(id: string, status: string): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/work-orders//status, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify({ status }),
    });
  },

  async updateWorkOrder(id: string, payload: any): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/work-orders/, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async deleteWorkOrder(id: string): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/work-orders/, {
      method: 'DELETE',
      headers: { Authorization: Bearer  },
    });
  },

  async getTransfers(): Promise<{ success: boolean; data: any[] }> {
    return apiFetch(${BASE_URL}/transfers, { headers: { Authorization: Bearer  } });
  },

  async createTransfer(payload: any): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/transfers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async dispatchTransfer(id: string): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/transfers//dispatch, {
      method: 'PATCH',
      headers: { Authorization: Bearer  },
    });
  },

  async receiveTransfer(id: string): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/transfers//receive, {
      method: 'PATCH',
      headers: { Authorization: Bearer  },
    });
  },

  async updateTransfer(id: string, payload: any): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/transfers/, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async deleteTransfer(id: string): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/transfers/, {
      method: 'DELETE',
      headers: { Authorization: Bearer  },
    });
  },

  async getOrders(): Promise<{ success: boolean; data: any[] }> {
    return apiFetch(${BASE_URL}/orders, { headers: { Authorization: Bearer  } });
  },

  async createOrder(payload: any): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/orders, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async getOrderById(id: string): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/orders/, { headers: { Authorization: Bearer  } });
  },

  async updateOrder(id: string, payload: any): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/orders/, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
      body: JSON.stringify(payload),
    });
  },

  async deleteOrder(id: string): Promise<{ success: boolean; data: any }> {
    return apiFetch(${BASE_URL}/orders/, {
      method: 'DELETE',
      headers: { Authorization: Bearer  },
    });
  }
};
export default api;