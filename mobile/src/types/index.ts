export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'technician' | 'user';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  clientId: string;
  name: string;
  type: string;
  model?: string;
  serialNumber?: string;
  specifications?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  client?: Client;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'assigned' | 'in_progress' | 'pending' | 'resolved';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  clientId: string;
  deviceId?: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  device?: Device;
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  quantityOnHand: number;
  reorderPoint: number;
  cost: number;
  price: number;
  barcode?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeLog {
  id: string;
  ticketId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Tickets: undefined;
  TicketDetail: { ticketId: string };
  BarcodeScanner: { onScan: (data: string) => void };
  Inventory: undefined;
  Clients: undefined;
  Profile: undefined;
};