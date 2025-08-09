import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-production-url.com/api';  // Production

class ApiService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(username: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Tickets
  async getTickets() {
    return this.request('/tickets');
  }

  async getTicket(id: string) {
    return this.request(`/tickets/${id}`);
  }

  async updateTicket(id: string, data: any) {
    return this.request(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Parts/Inventory
  async getParts() {
    return this.request('/parts');
  }

  async searchPartByBarcode(barcode: string) {
    return this.request(`/parts/search?barcode=${barcode}`);
  }

  // Clients
  async getClients() {
    return this.request('/clients');
  }

  async getClient(id: string) {
    return this.request(`/clients/${id}`);
  }

  // File uploads
  async uploadPhoto(uri: string, ticketId?: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    if (ticketId) {
      formData.append('ticketId', ticketId);
    }

    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/attachments/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;