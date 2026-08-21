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

export const api = {
  getToken(): string | null {
    return localStorage.getItem('opsflow_token');
  },

  setToken(token: string) {
    localStorage.setItem('opsflow_token', token);
  },

  clearToken() {
    localStorage.removeItem('opsflow_token');
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.success && data.data?.token) {
      this.setToken(data.data.token);
    }
    return data;
  },

  async getMe(): Promise<MeResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch user');
    }

    return data;
  },

  async testRoleEndpoint(role: 'admin' | 'operations' | 'sales'): Promise<{ success: boolean; message: string }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/auth/${role}-test`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Failed to access ${role} test endpoint`);
    }

    return data;
  },

  async getItems(): Promise<{ success: boolean; data: any[] }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getLocations(): Promise<{ success: boolean; data: any[] }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getBatches(): Promise<{ success: boolean; data: any[] }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/batches`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getUsers(): Promise<{ success: boolean; data: any[] }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getInventory(): Promise<{ success: boolean; data: any[] }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/inventory`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch inventory');
    return data;
  },

  async createInventory(payload: any): Promise<{ success: boolean; data: any }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create inventory record');
    return data;
  },

  async updateInventory(id: string, payload: any): Promise<{ success: boolean; data: any }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/inventory/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update inventory record');
    return data;
  },

  async getWorkOrders(): Promise<{ success: boolean; data: any[] }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/work-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch work orders');
    return data;
  },

  async createWorkOrder(payload: any): Promise<{ success: boolean; data: any }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/work-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create work order');
    return data;
  },

  async updateWorkOrderStatus(id: string, status: string): Promise<{ success: boolean; data: any }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/work-orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update work order status');
    return data;
  },

  async getTransfers(): Promise<{ success: boolean; data: any[] }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/transfers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch transfers');
    return data;
  },

  async createTransfer(payload: any): Promise<{ success: boolean; data: any }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create transfer');
    return data;
  },

  async dispatchTransfer(id: string): Promise<{ success: boolean; data: any }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/transfers/${id}/dispatch`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to dispatch transfer');
    return data;
  },

  async receiveTransfer(id: string): Promise<{ success: boolean; data: any }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/transfers/${id}/receive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to receive transfer');
    return data;
  },

  async getOrders(): Promise<{ success: boolean; data: any[] }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch customer orders');
    return data;
  },

  async createOrder(payload: any): Promise<{ success: boolean; data: any }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create customer order');
    return data;
  },

  async getOrderById(id: string): Promise<{ success: boolean; data: any }> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch customer order details');
    return data;
  },
};
export default api;
