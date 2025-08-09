// Shared types between mobile app and backend

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'technician' | 'manager';
  firstName?: string;
  lastName?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'assigned' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  clientId: string;
  deviceId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  estimatedCost?: number;
  actualCost?: number;
  timeSpent?: number;
  client?: Client;
  device?: Device;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  company?: string;
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
}

export interface Part {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  supplier?: string;
  cost: number;
  price: number;
  quantityOnHand: number;
  reorderPoint: number;
  location?: string;
  barcode?: string;
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
  billable: boolean;
  createdAt: string;
}

export interface Attachment {
  id: string;
  ticketId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TicketDetail: { ticketId: string };
  BarcodeScanner: { onScan: (barcode: string) => void };
  PhotoCapture: { ticketId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tickets: undefined;
  Inventory: undefined;
  Clients: undefined;
  Profile: undefined;
};

// Form types
export interface TicketUpdateForm {
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  description?: string;
  notes?: string;
  timeSpent?: number;
  parts?: string[];
}

export interface LoginForm {
  username: string;
  password: string;
}