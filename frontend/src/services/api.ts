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
};
export default api;
