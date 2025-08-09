import { User, Client, Ticket, Part, Device, TimeLog } from '../types';

const API_BASE_URL = __DEV__ ? 'http://localhost:3000/api' : '/api';

class ApiService {
  private async fetch(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<User> {
    return this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout(): Promise<void> {
    return this.fetch('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.fetch('/auth/me');
  }

  // Tickets
  async getTickets(): Promise<Ticket[]> {
    return this.fetch('/tickets');
  }

  async getTicket(id: string): Promise<Ticket> {
    return this.fetch(`/tickets/${id}`);
  }

  async createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
    return this.fetch('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    return this.fetch(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return this.fetch('/clients');
  }

  async getClient(id: string): Promise<Client> {
    return this.fetch(`/clients/${id}`);
  }

  async createClient(client: Partial<Client>): Promise<Client> {
    return this.fetch('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    return this.fetch('/devices');
  }

  async getDevice(id: string): Promise<Device> {
    return this.fetch(`/devices/${id}`);
  }

  // Parts/Inventory
  async getParts(): Promise<Part[]> {
    return this.fetch('/parts');
  }

  async getPart(id: string): Promise<Part> {
    return this.fetch(`/parts/${id}`);
  }

  async getPartByBarcode(barcode: string): Promise<Part | null> {
    try {
      return await this.fetch(`/parts/barcode/${barcode}`);
    } catch (error) {
      return null;
    }
  }

  // Time Tracking
  async getTimeLogs(ticketId: string): Promise<TimeLog[]> {
    return this.fetch(`/time-logs?ticketId=${ticketId}`);
  }

  async startTimeLog(ticketId: string): Promise<TimeLog> {
    return this.fetch('/time-logs', {
      method: 'POST',
      body: JSON.stringify({ ticketId }),
    });
  }

  async stopTimeLog(id: string): Promise<TimeLog> {
    return this.fetch(`/time-logs/${id}/stop`, {
      method: 'PATCH',
    });
  }

  // Photo upload
  async uploadPhoto(ticketId: string, photoUri: string): Promise<any> {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    return fetch(`${API_BASE_URL}/tickets/${ticketId}/photos`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export default new ApiService();