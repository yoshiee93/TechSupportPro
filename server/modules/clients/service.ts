import { storage } from "../../storage";
import type { InsertClient, ClientWithDevices } from "@shared/schema";

export class ClientService {
  async getAllClients(): Promise<ClientWithDevices[]> {
    return await storage.getClients();
  }

  async getClientById(id: number): Promise<ClientWithDevices | undefined> {
    return await storage.getClient(id);
  }

  async createClient(clientData: InsertClient) {
    return await storage.createClient(clientData);
  }

  async updateClient(id: number, clientData: Partial<InsertClient>) {
    return await storage.updateClient(id, clientData);
  }

  async deleteClient(id: number): Promise<void> {
    return await storage.deleteClient(id);
  }

  async searchClients(query: string): Promise<ClientWithDevices[]> {
    const clients = await storage.getClients();
    return clients.filter(client => 
      client.name.toLowerCase().includes(query.toLowerCase()) ||
      client.email?.toLowerCase().includes(query.toLowerCase()) ||
      client.phone?.includes(query)
    );
  }
}

export const clientService = new ClientService();