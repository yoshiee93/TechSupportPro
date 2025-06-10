import type { 
  Ticket, 
  InsertTicket, 
  TicketWithRelations, 
  RepairNote, 
  InsertRepairNote,
  TimeLog,
  InsertTimeLog,
  ActivityLog
} from "@shared/schema";

export interface TicketSearchParams {
  query?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  clientId?: number;
  page?: number;
  limit?: number;
}

export interface TicketResponse {
  tickets: TicketWithRelations[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  activeTickets: number;
  pendingParts: number;
  readyForPickup: number;
  revenue: number;
  completedToday: number;
  newToday: number;
  partsReceivedToday: number;
  revenueToday: number;
}

export interface TicketCreateRequest {
  clientId: number;
  deviceId: number;
  title: string;
  description: string;
  priority?: string;
  status?: string;
  estimatedCost?: number;
  assignedTo?: string;
}

export interface TicketUpdateRequest extends Partial<TicketCreateRequest> {}

export interface TimeLogCreateRequest {
  ticketId: number;
  technicianName: string;
  description?: string;
  startTime: Date;
}

export interface TimeLogStopRequest {
  endTime?: Date;
}

export { 
  Ticket, 
  InsertTicket, 
  TicketWithRelations, 
  RepairNote, 
  InsertRepairNote,
  TimeLog,
  InsertTimeLog,
  ActivityLog
};