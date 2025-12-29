import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Configure axios defaults
axios.defaults.withCredentials = true;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

class AuthClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/login`, {
      email,
      password,
    });
    this.setAccessToken(response.data.accessToken);
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/register`, data);
    this.setAccessToken(response.data.accessToken);
    return response.data;
  }

  async refreshToken(): Promise<string> {
    const response = await axios.post<{ accessToken: string }>(`${API_URL}/api/auth/refresh`, {}, {
      withCredentials: true,
    });
    this.setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        withCredentials: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setAccessToken(null);
    }
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get<{ user: User }>(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.user;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authClient = new AuthClient();

