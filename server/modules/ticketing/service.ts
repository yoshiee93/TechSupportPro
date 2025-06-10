import { storage } from "../../storage";
import type { InsertTicket, InsertRepairNote, InsertTimeLog, TicketWithRelations } from "@shared/schema";

export class TicketingService {
  async getAllTickets(): Promise<TicketWithRelations[]> {
    return await storage.getTickets();
  }

  async getTicketById(id: number): Promise<TicketWithRelations | undefined> {
    return await storage.getTicket(id);
  }

  async getTicketByNumber(ticketNumber: string): Promise<TicketWithRelations | undefined> {
    return await storage.getTicketByNumber(ticketNumber);
  }

  async searchTickets(query: string): Promise<TicketWithRelations[]> {
    return await storage.searchTickets(query);
  }

  async createTicket(ticketData: InsertTicket) {
    return await storage.createTicket(ticketData);
  }

  async updateTicket(id: number, ticketData: Partial<InsertTicket>) {
    return await storage.updateTicket(id, ticketData);
  }

  async deleteTicket(id: number): Promise<void> {
    return await storage.deleteTicket(id);
  }

  async getActivityLogs(ticketId: number) {
    return await storage.getActivityLogs(ticketId);
  }

  async getRepairNotes(ticketId: number) {
    return await storage.getRepairNotes(ticketId);
  }

  async createRepairNote(noteData: InsertRepairNote) {
    return await storage.createRepairNote(noteData);
  }

  async updateRepairNote(id: number, noteData: Partial<InsertRepairNote>) {
    return await storage.updateRepairNote(id, noteData);
  }

  async deleteRepairNote(id: number): Promise<void> {
    return await storage.deleteRepairNote(id);
  }

  async getTimeLogs(ticketId: number) {
    return await storage.getTimeLogs(ticketId);
  }

  async getActiveTimeLog(ticketId: number, technicianName: string) {
    return await storage.getActiveTimeLog(ticketId, technicianName);
  }

  async createTimeLog(timeLogData: InsertTimeLog) {
    return await storage.createTimeLog(timeLogData);
  }

  async updateTimeLog(id: number, timeLogData: Partial<InsertTimeLog>) {
    return await storage.updateTimeLog(id, timeLogData);
  }

  async stopTimeLog(id: number, endTime?: Date) {
    return await storage.stopTimeLog(id, endTime);
  }

  async deleteTimeLog(id: number): Promise<void> {
    return await storage.deleteTimeLog(id);
  }

  async getDashboardStats() {
    return await storage.getDashboardStats();
  }
}

export const ticketingService = new TicketingService();