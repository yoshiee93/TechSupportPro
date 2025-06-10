import type { Client, Device, InsertClient, ClientWithDevices } from "@shared/schema";

export interface ClientSearchParams {
  query?: string;
  page?: number;
  limit?: number;
}

export interface ClientResponse {
  clients: ClientWithDevices[];
  total: number;
  page: number;
  limit: number;
}

export interface ClientCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
}

export interface ClientUpdateRequest extends Partial<ClientCreateRequest> {}

export { Client, Device, InsertClient, ClientWithDevices };