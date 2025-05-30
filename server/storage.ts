import { 
  clients, devices, tickets, partsOrders, activityLogs, repairNotes, reminders,
  type Client, type Device, type Ticket, type PartsOrder, type ActivityLog, type RepairNote, type Reminder,
  type InsertClient, type InsertDevice, type InsertTicket, type InsertPartsOrder, 
  type InsertActivityLog, type InsertRepairNote, type InsertReminder, type TicketWithRelations, type ClientWithDevices
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, count, sql } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(): Promise<ClientWithDevices[]>;
  getClient(id: number): Promise<ClientWithDevices | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Devices
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  getDevicesByClient(clientId: number): Promise<Device[]>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device>;
  deleteDevice(id: number): Promise<void>;

  // Tickets
  getTickets(): Promise<TicketWithRelations[]>;
  getTicket(id: number): Promise<TicketWithRelations | undefined>;
  getTicketByNumber(ticketNumber: string): Promise<TicketWithRelations | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket>;
  deleteTicket(id: number): Promise<void>;
  searchTickets(query: string): Promise<TicketWithRelations[]>;

  // Parts Orders
  getPartsOrders(): Promise<PartsOrder[]>;
  getPartsOrder(id: number): Promise<PartsOrder | undefined>;
  getPartsOrdersByTicket(ticketId: number): Promise<PartsOrder[]>;
  createPartsOrder(partsOrder: InsertPartsOrder): Promise<PartsOrder>;
  updatePartsOrder(id: number, partsOrder: Partial<InsertPartsOrder>): Promise<PartsOrder>;
  deletePartsOrder(id: number): Promise<void>;

  // Activity Logs
  getActivityLogs(ticketId: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Repair Notes
  getRepairNotes(ticketId: number): Promise<RepairNote[]>;
  createRepairNote(note: InsertRepairNote): Promise<RepairNote>;
  updateRepairNote(id: number, note: Partial<InsertRepairNote>): Promise<RepairNote>;
  deleteRepairNote(id: number): Promise<void>;

  // Reminders
  getReminders(): Promise<Reminder[]>;
  getUpcomingReminders(): Promise<Reminder[]>;
  getOverdueReminders(): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder>;
  deleteReminder(id: number): Promise<void>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    activeTickets: number;
    pendingParts: number;
    readyForPickup: number;
    revenue: number;
    completedToday: number;
    newToday: number;
    partsReceivedToday: number;
    revenueToday: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Clients
  async getClients(): Promise<ClientWithDevices[]> {
    return await db.query.clients.findMany({
      with: {
        devices: true,
      },
      orderBy: [asc(clients.name)],
    });
  }

  async getClient(id: number): Promise<ClientWithDevices | undefined> {
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        devices: true,
      },
    });
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [updated] = await db
      .update(clients)
      .set({ ...client })
      .where(eq(clients.id, id))
      .returning();
    return updated;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    return await db.select().from(devices).orderBy(asc(devices.brand), asc(devices.model));
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device || undefined;
  }

  async getDevicesByClient(clientId: number): Promise<Device[]> {
    return await db.select().from(devices).where(eq(devices.clientId, clientId));
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const [device] = await db.insert(devices).values(insertDevice).returning();
    return device;
  }

  async updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device> {
    const [updated] = await db
      .update(devices)
      .set({ ...device })
      .where(eq(devices.id, id))
      .returning();
    return updated;
  }

  async deleteDevice(id: number): Promise<void> {
    await db.delete(devices).where(eq(devices.id, id));
  }

  // Tickets
  async getTickets(): Promise<TicketWithRelations[]> {
    return await db.query.tickets.findMany({
      with: {
        client: true,
        device: true,
        partsOrders: true,
        activityLogs: {
          orderBy: [desc(activityLogs.createdAt)],
        },
        repairNotes: {
          orderBy: [desc(repairNotes.createdAt)],
        },
      },
      orderBy: [desc(tickets.createdAt)],
    });
  }

  async getTicket(id: number): Promise<TicketWithRelations | undefined> {
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
      with: {
        client: true,
        device: true,
        partsOrders: true,
        activityLogs: {
          orderBy: [desc(activityLogs.createdAt)],
        },
      },
    });
    return ticket || undefined;
  }

  async getTicketByNumber(ticketNumber: string): Promise<TicketWithRelations | undefined> {
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.ticketNumber, ticketNumber),
      with: {
        client: true,
        device: true,
        partsOrders: true,
        activityLogs: {
          orderBy: [desc(activityLogs.createdAt)],
        },
      },
    });
    return ticket || undefined;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const ticketNumber = await this.generateTicketNumber();
    const [ticket] = await db
      .insert(tickets)
      .values({ 
        ...insertTicket, 
        ticketNumber,
        updatedAt: new Date(),
      })
      .returning();
    
    // Create initial activity log
    await this.createActivityLog({
      ticketId: ticket.id,
      type: "ticket_created",
      description: "Ticket created",
      createdBy: "System",
    });

    return ticket;
  }

  async updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket> {
    const currentTicket = await this.getTicket(id);
    const [updated] = await db
      .update(tickets)
      .set({ 
        ...ticket, 
        updatedAt: new Date(),
        completedAt: ticket.status === "completed" ? new Date() : undefined,
      })
      .where(eq(tickets.id, id))
      .returning();

    // Log status change if status was updated
    if (ticket.status && currentTicket && ticket.status !== currentTicket.status) {
      await this.createActivityLog({
        ticketId: id,
        type: "status_change",
        description: `Status changed from ${currentTicket.status} to ${ticket.status}`,
        createdBy: "System",
      });
    }

    return updated;
  }

  async deleteTicket(id: number): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  async searchTickets(query: string): Promise<TicketWithRelations[]> {
    return await db.query.tickets.findMany({
      where: or(
        like(tickets.ticketNumber, `%${query}%`),
        like(tickets.title, `%${query}%`),
        like(tickets.description, `%${query}%`)
      ),
      with: {
        client: true,
        device: true,
        partsOrders: true,
        activityLogs: {
          orderBy: [desc(activityLogs.createdAt)],
        },
      },
      orderBy: [desc(tickets.createdAt)],
    });
  }

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await db
      .select({ count: count() })
      .from(tickets)
      .where(like(tickets.ticketNumber, `TF-${year}-%`));
    
    const nextNumber = (result.count + 1).toString().padStart(3, '0');
    return `TF-${year}-${nextNumber}`;
  }

  // Parts Orders
  async getPartsOrders(): Promise<PartsOrder[]> {
    return await db.select().from(partsOrders).orderBy(desc(partsOrders.orderDate));
  }

  async getPartsOrder(id: number): Promise<PartsOrder | undefined> {
    const [partsOrder] = await db.select().from(partsOrders).where(eq(partsOrders.id, id));
    return partsOrder || undefined;
  }

  async getPartsOrdersByTicket(ticketId: number): Promise<PartsOrder[]> {
    return await db.select().from(partsOrders).where(eq(partsOrders.ticketId, ticketId));
  }

  async createPartsOrder(insertPartsOrder: InsertPartsOrder): Promise<PartsOrder> {
    const [partsOrder] = await db.insert(partsOrders).values(insertPartsOrder).returning();
    
    // Create activity log
    await this.createActivityLog({
      ticketId: partsOrder.ticketId,
      type: "part_ordered",
      description: `Part ordered: ${partsOrder.partName}`,
      createdBy: "System",
    });

    return partsOrder;
  }

  async updatePartsOrder(id: number, partsOrder: Partial<InsertPartsOrder>): Promise<PartsOrder> {
    const [updated] = await db
      .update(partsOrders)
      .set({ 
        ...partsOrder,
        receivedDate: partsOrder.status === "delivered" ? new Date() : undefined,
      })
      .where(eq(partsOrders.id, id))
      .returning();
    return updated;
  }

  async deletePartsOrder(id: number): Promise<void> {
    await db.delete(partsOrders).where(eq(partsOrders.id, id));
  }

  // Activity Logs
  async getActivityLogs(ticketId: number): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.ticketId, ticketId))
      .orderBy(desc(activityLogs.createdAt));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [activityLog] = await db.insert(activityLogs).values(log).returning();
    return activityLog;
  }

  // Reminders
  async getReminders(): Promise<Reminder[]> {
    return await db.select().from(reminders).orderBy(asc(reminders.dueDate));
  }

  async getUpcomingReminders(): Promise<Reminder[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.isCompleted, false),
          sql`${reminders.dueDate} <= ${tomorrow}`
        )
      )
      .orderBy(asc(reminders.dueDate));
  }

  async getOverdueReminders(): Promise<Reminder[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.isCompleted, false),
          sql`${reminders.dueDate} < ${now}`
        )
      )
      .orderBy(asc(reminders.dueDate));
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values(insertReminder).returning();
    return reminder;
  }

  async updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder> {
    const [updated] = await db
      .update(reminders)
      .set({ 
        ...reminder,
        completedAt: reminder.isCompleted ? new Date() : undefined,
      })
      .where(eq(reminders.id, id))
      .returning();
    return updated;
  }

  async deleteReminder(id: number): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  // Dashboard Stats
  async getDashboardStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [activeTicketsResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(sql`${tickets.status} NOT IN ('completed')`);

    const [pendingPartsResult] = await db
      .select({ count: count() })
      .from(partsOrders)
      .where(sql`${partsOrders.status} IN ('ordered', 'in_transit')`);

    const [readyForPickupResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.status, "ready_for_pickup"));

    const [revenueResult] = await db
      .select({ 
        revenue: sql<number>`COALESCE(SUM(${tickets.finalCost}), 0)` 
      })
      .from(tickets)
      .where(eq(tickets.isPaid, true));

    const [completedTodayResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.status, "completed"),
          sql`${tickets.completedAt} >= ${startOfDay}`,
          sql`${tickets.completedAt} < ${endOfDay}`
        )
      );

    const [newTodayResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(
        and(
          sql`${tickets.createdAt} >= ${startOfDay}`,
          sql`${tickets.createdAt} < ${endOfDay}`
        )
      );

    const [partsReceivedTodayResult] = await db
      .select({ count: count() })
      .from(partsOrders)
      .where(
        and(
          eq(partsOrders.status, "delivered"),
          sql`${partsOrders.receivedDate} >= ${startOfDay}`,
          sql`${partsOrders.receivedDate} < ${endOfDay}`
        )
      );

    const [revenueTodayResult] = await db
      .select({ 
        revenue: sql<number>`COALESCE(SUM(${tickets.finalCost}), 0)` 
      })
      .from(tickets)
      .where(
        and(
          eq(tickets.isPaid, true),
          sql`${tickets.paymentDate} >= ${startOfDay}`,
          sql`${tickets.paymentDate} < ${endOfDay}`
        )
      );

    return {
      activeTickets: activeTicketsResult.count,
      pendingParts: pendingPartsResult.count,
      readyForPickup: readyForPickupResult.count,
      revenue: Number(revenueResult.revenue) || 0,
      completedToday: completedTodayResult.count,
      newToday: newTodayResult.count,
      partsReceivedToday: partsReceivedTodayResult.count,
      revenueToday: Number(revenueTodayResult.revenue) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
