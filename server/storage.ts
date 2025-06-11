import { 
  users, clients, devices, tickets, partsOrders, activityLogs, repairNotes, reminders, timeLogs, attachments,
  suppliers, categories, parts, purchaseOrders, purchaseOrderItems, stockMovements, lowStockAlerts,
  billableItems, salesTransactions, saleItems, payments,
  type User, type UpsertUser, type InsertUser, type Client, type Device, type Ticket, type PartsOrder, type ActivityLog, type RepairNote, type Reminder, type TimeLog, type Attachment,
  type Supplier, type Category, type Part, type PurchaseOrder, type PurchaseOrderItem, type StockMovement, type LowStockAlert,
  type BillableItem, type SalesTransaction, type SaleItem, type Payment,
  type InsertClient, type InsertDevice, type InsertTicket, type InsertPartsOrder, 
  type InsertActivityLog, type InsertRepairNote, type InsertReminder, type InsertTimeLog, type InsertAttachment,
  type InsertSupplier, type InsertCategory, type InsertPart, type InsertPurchaseOrder, type InsertPurchaseOrderItem, type InsertStockMovement, type InsertLowStockAlert,
  type InsertBillableItem, type InsertSalesTransaction, type InsertSaleItem, type InsertPayment,
  type TicketWithRelations, type ClientWithDevices, type PartWithRelations, type PurchaseOrderWithRelations, type CategoryWithParent,
  type SalesTransactionWithRelations, type BillableItemWithTicket
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, count, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  deactivateUser(id: string): Promise<User>;

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

  // Time Logs
  getTimeLogs(ticketId: number): Promise<TimeLog[]>;
  getActiveTimeLog(ticketId: number, technicianName: string): Promise<TimeLog | undefined>;
  createTimeLog(timeLog: InsertTimeLog): Promise<TimeLog>;
  updateTimeLog(id: number, timeLog: Partial<InsertTimeLog>): Promise<TimeLog>;
  deleteTimeLog(id: number): Promise<void>;
  stopTimeLog(id: number, endTime?: Date): Promise<TimeLog>;

  // Attachments
  getAttachment(id: number): Promise<Attachment | undefined>;
  getAttachmentsByTicket(ticketId: number): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: number): Promise<void>;

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

  // Phase 3: Inventory Management
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;

  // Categories
  getCategories(): Promise<CategoryWithParent[]>;
  getCategory(id: number): Promise<CategoryWithParent | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Parts
  getParts(): Promise<PartWithRelations[]>;
  getPart(id: number): Promise<PartWithRelations | undefined>;
  getPartBySku(sku: string): Promise<PartWithRelations | undefined>;
  createPart(part: InsertPart): Promise<Part>;
  updatePart(id: number, part: Partial<InsertPart>): Promise<Part>;
  deletePart(id: number): Promise<void>;
  searchParts(query: string): Promise<PartWithRelations[]>;
  getLowStockParts(): Promise<PartWithRelations[]>;

  // Purchase Orders
  getPurchaseOrders(): Promise<PurchaseOrderWithRelations[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrderWithRelations | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: number, po: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder>;
  deletePurchaseOrder(id: number): Promise<void>;

  // Purchase Order Items
  createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  updatePurchaseOrderItem(id: number, item: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem>;
  deletePurchaseOrderItem(id: number): Promise<void>;

  // Stock Movements
  getStockMovements(partId?: number): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  
  // Low Stock Alerts
  getLowStockAlerts(): Promise<LowStockAlert[]>;
  createLowStockAlert(alert: InsertLowStockAlert): Promise<LowStockAlert>;
  resolveLowStockAlert(id: number): Promise<void>;

  // Phase 3.5: Billing & Sales
  // Billable Items
  getBillableItems(ticketId?: number): Promise<BillableItemWithTicket[]>;
  getUnbilledItems(): Promise<BillableItemWithTicket[]>;
  createBillableItem(item: InsertBillableItem): Promise<BillableItem>;
  updateBillableItem(id: number, item: Partial<InsertBillableItem>): Promise<BillableItem>;
  markItemsAsBilled(itemIds: number[]): Promise<void>;
  deleteBillableItem(id: number): Promise<void>;

  // Sales Transactions
  getSalesTransactions(): Promise<SalesTransactionWithRelations[]>;
  getSalesTransaction(id: number): Promise<SalesTransactionWithRelations | undefined>;
  createSalesTransaction(transaction: InsertSalesTransaction): Promise<SalesTransaction>;
  updateSalesTransaction(id: number, transaction: Partial<InsertSalesTransaction>): Promise<SalesTransaction>;
  deleteSalesTransaction(id: number): Promise<void>;

  // Sale Items
  createSaleItem(item: InsertSaleItem): Promise<SaleItem>;
  updateSaleItem(id: number, item: Partial<InsertSaleItem>): Promise<SaleItem>;
  deleteSaleItem(id: number): Promise<void>;

  // Payments (future-proofed)
  getPayments(transactionId?: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values([userData])
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as "admin" | "technician", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async deactivateUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
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
    // Get all tickets for this client's devices to cascade delete properly
    const clientDevices = await db.select().from(devices).where(eq(devices.clientId, id));
    const deviceIds = clientDevices.map(device => device.id);
    
    if (deviceIds.length > 0) {
      // Get all tickets for these devices
      const clientTickets = await db.select().from(tickets).where(inArray(tickets.deviceId, deviceIds));
      const ticketIds = clientTickets.map(ticket => ticket.id);
      
      if (ticketIds.length > 0) {
        // Delete ticket-related records
        await db.delete(repairNotes).where(inArray(repairNotes.ticketId, ticketIds));
        await db.delete(partsOrders).where(inArray(partsOrders.ticketId, ticketIds));
        await db.delete(activityLogs).where(inArray(activityLogs.ticketId, ticketIds));
        await db.delete(tickets).where(inArray(tickets.id, ticketIds));
      }
      
      // Delete devices
      await db.delete(devices).where(eq(devices.clientId, id));
    }
    
    // Finally delete the client
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
    try {
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
          timeLogs: {
            orderBy: [desc(timeLogs.createdAt)],
          },
        },
        orderBy: [desc(tickets.createdAt)],
      });
    } catch (error) {
      console.error("Database error in getTickets:", error);
      // Fallback to basic query without relations if there's a schema mismatch
      const basicTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
      const ticketsWithRelations: TicketWithRelations[] = [];
      
      for (const ticket of basicTickets) {
        const [client] = await db.select().from(clients).where(eq(clients.id, ticket.clientId));
        const [device] = await db.select().from(devices).where(eq(devices.id, ticket.deviceId));
        
        ticketsWithRelations.push({
          ...ticket,
          client,
          device,
          partsOrders: [],
          activityLogs: [],
          repairNotes: [],
          timeLogs: [],
        });
      }
      
      return ticketsWithRelations;
    }
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
        repairNotes: {
          orderBy: [desc(repairNotes.createdAt)],
        },
        timeLogs: {
          orderBy: [desc(timeLogs.createdAt)],
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
        repairNotes: {
          orderBy: [desc(repairNotes.createdAt)],
        },
        timeLogs: {
          orderBy: [desc(timeLogs.createdAt)],
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
    
    // Create initial activity log - temporarily skip until we have proper user context
    // await this.createActivityLog({
    //   ticketId: ticket.id,
    //   type: "ticket_created",
    //   description: "Ticket created",
    //   userId: "system",
    //   createdBy: "system",
    // });

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
        userId: "system",
        createdBy: "system",
      });
    }

    return updated;
  }

  async deleteTicket(id: number): Promise<void> {
    // Delete related records first due to foreign key constraints
    await db.delete(timeLogs).where(eq(timeLogs.ticketId, id));
    await db.delete(repairNotes).where(eq(repairNotes.ticketId, id));
    await db.delete(partsOrders).where(eq(partsOrders.ticketId, id));
    await db.delete(activityLogs).where(eq(activityLogs.ticketId, id));
    
    // Finally delete the ticket
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
        repairNotes: {
          orderBy: [desc(repairNotes.createdAt)],
        },
        timeLogs: {
          orderBy: [desc(timeLogs.createdAt)],
        },
      },
      orderBy: [desc(tickets.createdAt)],
    });
  }

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const [result] = await db
        .select({ count: count() })
        .from(tickets)
        .where(like(tickets.ticketNumber, `TF-${year}-%`));
      
      const nextNumber = (result.count + 1 + attempts).toString().padStart(3, '0');
      const ticketNumber = `TF-${year}-${nextNumber}`;
      
      // Check if this number already exists
      const [existing] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .where(eq(tickets.ticketNumber, ticketNumber))
        .limit(1);
      
      if (!existing) {
        return ticketNumber;
      }
      
      attempts++;
    }
    
    // Fallback to timestamp-based number if all attempts fail
    const timestamp = Date.now().toString().slice(-6);
    return `TF-${year}-${timestamp}`;
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
      userId: "system",
      createdBy: "system",
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
    const [activityLog] = await db.insert(activityLogs).values([log]).returning();
    return activityLog;
  }

  // Repair Notes
  async getRepairNotes(ticketId: number): Promise<RepairNote[]> {
    return await db
      .select()
      .from(repairNotes)
      .where(eq(repairNotes.ticketId, ticketId))
      .orderBy(desc(repairNotes.createdAt));
  }

  async createRepairNote(insertRepairNote: InsertRepairNote): Promise<RepairNote> {
    const [repairNote] = await db.insert(repairNotes).values([insertRepairNote]).returning();
    
    // Create activity log
    await this.createActivityLog({
      ticketId: repairNote.ticketId,
      type: "repair_note_added",
      description: `Repair note added: ${repairNote.title}`,
      userId: repairNote.userId,
      createdBy: repairNote.userId,
    });

    return repairNote;
  }

  async updateRepairNote(id: number, repairNote: Partial<InsertRepairNote>): Promise<RepairNote> {
    const [updated] = await db
      .update(repairNotes)
      .set({ 
        ...repairNote,
        updatedAt: new Date(),
      })
      .where(eq(repairNotes.id, id))
      .returning();
    return updated;
  }

  async deleteRepairNote(id: number): Promise<void> {
    await db.delete(repairNotes).where(eq(repairNotes.id, id));
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

  // Time Logs
  async getTimeLogs(ticketId: number): Promise<TimeLog[]> {
    return await db.select().from(timeLogs)
      .where(eq(timeLogs.ticketId, ticketId))
      .orderBy(desc(timeLogs.createdAt));
  }

  async getActiveTimeLog(ticketId: number, technicianName: string): Promise<TimeLog | undefined> {
    const [timeLog] = await db.select().from(timeLogs)
      .where(and(
        eq(timeLogs.ticketId, ticketId),
        eq(timeLogs.technicianName, technicianName),
        sql`${timeLogs.endTime} IS NULL`
      ));
    return timeLog || undefined;
  }

  async createTimeLog(insertTimeLog: InsertTimeLog): Promise<TimeLog> {
    console.log("Storage: Creating time log with data:", JSON.stringify(insertTimeLog, null, 2));
    
    try {
      // Ensure dates are properly converted
      const timeLogData = {
        ...insertTimeLog,
        startTime: insertTimeLog.startTime instanceof Date ? insertTimeLog.startTime : new Date(insertTimeLog.startTime),
        endTime: insertTimeLog.endTime ? 
          (insertTimeLog.endTime instanceof Date ? insertTimeLog.endTime : new Date(insertTimeLog.endTime)) 
          : null,
        updatedAt: new Date(),
      };
      
      const [timeLog] = await db.insert(timeLogs).values([timeLogData]).returning();
      
      console.log("Storage: Successfully created time log:", JSON.stringify(timeLog, null, 2));
      return timeLog;
    } catch (error) {
      console.error("Storage: Time log creation failed:", error);
      throw error;
    }
  }

  async updateTimeLog(id: number, timeLog: Partial<InsertTimeLog>): Promise<TimeLog> {
    // Ensure dates are properly converted
    const updateData: any = { ...timeLog, updatedAt: new Date() };
    
    if (updateData.startTime && typeof updateData.startTime === 'string') {
      updateData.startTime = new Date(updateData.startTime);
    }
    
    if (updateData.endTime && typeof updateData.endTime === 'string') {
      updateData.endTime = new Date(updateData.endTime);
    }
    
    const [updated] = await db
      .update(timeLogs)
      .set(updateData)
      .where(eq(timeLogs.id, id))
      .returning();
    return updated;
  }

  async deleteTimeLog(id: number): Promise<void> {
    await db.delete(timeLogs).where(eq(timeLogs.id, id));
  }

  async stopTimeLog(id: number, endTime?: Date): Promise<TimeLog> {
    console.log("Storage: Stopping time log", { id, endTime });
    
    const stopTime = endTime || new Date();
    
    // Get the current time log to calculate duration
    const [currentLog] = await db.select().from(timeLogs).where(eq(timeLogs.id, id));
    if (!currentLog) {
      console.error("Storage: Time log not found for ID:", id);
      throw new Error("Time log not found");
    }
    
    console.log("Storage: Current log before stopping:", JSON.stringify(currentLog, null, 2));
    
    const duration = Math.floor((stopTime.getTime() - new Date(currentLog.startTime).getTime()) / 1000);
    console.log("Storage: Calculated duration:", duration, "seconds");
    
    const [updated] = await db
      .update(timeLogs)
      .set({ 
        endTime: stopTime,
        duration: duration,
        updatedAt: new Date()
      })
      .where(eq(timeLogs.id, id))
      .returning();
    
    console.log("Storage: Updated time log:", JSON.stringify(updated, null, 2));
    return updated;
  }

  // Attachments
  async getAttachment(id: number): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment || undefined;
  }

  async getAttachmentsByTicket(ticketId: number): Promise<Attachment[]> {
    return await db.select().from(attachments)
      .where(eq(attachments.ticketId, ticketId))
      .orderBy(desc(attachments.createdAt));
  }

  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const [attachment] = await db.insert(attachments).values(insertAttachment).returning();
    return attachment;
  }

  async deleteAttachment(id: number): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
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

  // Phase 3: Inventory Management Implementation
  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true));
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0];
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(insertSupplier).returning();
    return result[0];
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const result = await db.update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.update(suppliers)
      .set({ isActive: false })
      .where(eq(suppliers.id, id));
  }

  // Categories
  async getCategories(): Promise<CategoryWithParent[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }

  async getCategory(id: number): Promise<CategoryWithParent | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(insertCategory).returning();
    return result[0];
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const result = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<void> {
    await db.update(categories)
      .set({ isActive: false })
      .where(eq(categories.id, id));
  }

  // Parts
  async getParts(): Promise<PartWithRelations[]> {
    return await db.select().from(parts).where(eq(parts.isActive, true));
  }

  async getPart(id: number): Promise<PartWithRelations | undefined> {
    const result = await db.select().from(parts).where(eq(parts.id, id));
    return result[0];
  }

  async getPartBySku(sku: string): Promise<PartWithRelations | undefined> {
    const result = await db.select().from(parts).where(eq(parts.sku, sku));
    return result[0];
  }

  async createPart(insertPart: InsertPart): Promise<Part> {
    const result = await db.insert(parts).values(insertPart).returning();
    return result[0];
  }

  async updatePart(id: number, part: Partial<InsertPart>): Promise<Part> {
    const result = await db.update(parts)
      .set({ ...part, updatedAt: new Date() })
      .where(eq(parts.id, id))
      .returning();
    return result[0];
  }

  async deletePart(id: number): Promise<void> {
    await db.update(parts)
      .set({ isActive: false })
      .where(eq(parts.id, id));
  }

  async searchParts(query: string): Promise<PartWithRelations[]> {
    return await db.select()
      .from(parts)
      .where(and(
        eq(parts.isActive, true),
        or(
          like(parts.sku, `%${query}%`),
          like(parts.name, `%${query}%`),
          like(parts.description, `%${query}%`)
        )
      ));
  }

  async getLowStockParts(): Promise<PartWithRelations[]> {
    return await db.select()
      .from(parts)
      .where(and(
        eq(parts.isActive, true),
        sql`${parts.quantityOnHand} <= ${parts.reorderPoint}`
      ));
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrderWithRelations[]> {
    const result = await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
    return result as PurchaseOrderWithRelations[];
  }

  async getPurchaseOrder(id: number): Promise<PurchaseOrderWithRelations | undefined> {
    const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return result[0] as PurchaseOrderWithRelations | undefined;
  }

  async createPurchaseOrder(insertPurchaseOrder: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const poNumber = await this.generatePONumber();
    const result = await db.insert(purchaseOrders)
      .values({ ...insertPurchaseOrder, poNumber })
      .returning();
    return result[0];
  }

  async updatePurchaseOrder(id: number, po: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder> {
    const result = await db.update(purchaseOrders)
      .set({ ...po, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return result[0];
  }

  async deletePurchaseOrder(id: number): Promise<void> {
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  }

  private async generatePONumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db.select({ count: count() })
      .from(purchaseOrders)
      .where(like(purchaseOrders.poNumber, `PO-${year}-%`));
    
    const nextNumber = (result[0]?.count || 0) + 1;
    return `PO-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  // Purchase Order Items
  async createPurchaseOrderItem(insertItem: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const result = await db.insert(purchaseOrderItems).values(insertItem).returning();
    return result[0];
  }

  async updatePurchaseOrderItem(id: number, item: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem> {
    const result = await db.update(purchaseOrderItems)
      .set(item)
      .where(eq(purchaseOrderItems.id, id))
      .returning();
    return result[0];
  }

  async deletePurchaseOrderItem(id: number): Promise<void> {
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.id, id));
  }

  // Stock Movements
  async getStockMovements(partId?: number): Promise<StockMovement[]> {
    const query = db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
    
    if (partId) {
      return await query.where(eq(stockMovements.partId, partId));
    }
    
    return await query;
  }

  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> {
    const result = await db.insert(stockMovements).values(insertMovement).returning();
    
    // Update part quantity
    const movement = result[0];
    const currentPart = await this.getPart(movement.partId);
    if (currentPart) {
      let newQuantity = (currentPart.quantityOnHand ?? 0);
      
      if (movement.movementType === "in") {
        newQuantity += movement.quantity;
      } else if (movement.movementType === "out") {
        newQuantity -= movement.quantity;
      } else if (movement.movementType === "adjustment") {
        newQuantity = movement.quantity; // Adjustment sets absolute quantity
      }
      
      const finalQuantity = Math.max(0, newQuantity);
      await this.updatePart(movement.partId, { quantityOnHand: finalQuantity });
      
      // Check for low stock alerts
      const reorderPoint = (currentPart.reorderPoint ?? 0);
      if (finalQuantity <= reorderPoint) {
        await this.createLowStockAlert({
          partId: movement.partId,
          currentQuantity: finalQuantity,
          reorderPoint: reorderPoint
        });
      }
    }
    
    return movement;
  }

  // Low Stock Alerts
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    return await db.select()
      .from(lowStockAlerts)
      .where(eq(lowStockAlerts.isResolved, false))
      .orderBy(desc(lowStockAlerts.createdAt));
  }

  async createLowStockAlert(insertAlert: InsertLowStockAlert): Promise<LowStockAlert> {
    // Check if alert already exists for this part
    const existing = await db.select()
      .from(lowStockAlerts)
      .where(and(
        eq(lowStockAlerts.partId, insertAlert.partId),
        eq(lowStockAlerts.isResolved, false)
      ));
    
    if (existing.length > 0) {
      return existing[0]; // Return existing alert
    }
    
    const result = await db.insert(lowStockAlerts).values(insertAlert).returning();
    return result[0];
  }

  async resolveLowStockAlert(id: number): Promise<void> {
    await db.update(lowStockAlerts)
      .set({ isResolved: true, resolvedAt: new Date() })
      .where(eq(lowStockAlerts.id, id));
  }

  // Phase 3.5: Billing & Sales Implementation
  
  // Billable Items
  async getBillableItems(ticketId?: number): Promise<BillableItemWithTicket[]> {
    const baseQuery = db.select()
      .from(billableItems)
      .leftJoin(tickets, eq(billableItems.ticketId, tickets.id))
      .leftJoin(clients, eq(tickets.clientId, clients.id))
      .leftJoin(devices, eq(tickets.deviceId, devices.id))
      .orderBy(desc(billableItems.createdAt));

    const query = ticketId 
      ? baseQuery.where(eq(billableItems.ticketId, ticketId))
      : baseQuery;

    const result = await query;
    
    return result.map(row => ({
      ...row.billable_items,
      ticket: {
        ...row.tickets,
        client: row.clients,
        device: row.devices,
        partsOrders: [],
        activityLogs: [],
        repairNotes: [],
        timeLogs: []
      }
    })) as BillableItemWithTicket[];
  }

  async getUnbilledItems(): Promise<BillableItemWithTicket[]> {
    const result = await db.select()
      .from(billableItems)
      .leftJoin(tickets, eq(billableItems.ticketId, tickets.id))
      .leftJoin(clients, eq(tickets.clientId, clients.id))
      .leftJoin(devices, eq(tickets.deviceId, devices.id))
      .where(eq(billableItems.billingStatus, 'pending'))
      .orderBy(desc(billableItems.createdAt));
    
    return result.map(row => ({
      ...row.billable_items,
      ticket: {
        ...row.tickets,
        client: row.clients,
        device: row.devices,
        partsOrders: [],
        activityLogs: [],
        repairNotes: [],
        timeLogs: []
      }
    })) as BillableItemWithTicket[];
  }

  async createBillableItem(item: InsertBillableItem): Promise<BillableItem> {
    const result = await db.insert(billableItems).values(item).returning();
    return result[0];
  }

  async updateBillableItem(id: number, item: Partial<InsertBillableItem>): Promise<BillableItem> {
    const result = await db.update(billableItems)
      .set(item)
      .where(eq(billableItems.id, id))
      .returning();
    return result[0];
  }

  async markItemsAsBilled(itemIds: number[]): Promise<void> {
    await db.update(billableItems)
      .set({ 
        billingStatus: 'billed',
        billedDate: new Date()
      })
      .where(inArray(billableItems.id, itemIds));
  }

  async deleteBillableItem(id: number): Promise<void> {
    await db.delete(billableItems).where(eq(billableItems.id, id));
  }

  // Sales Transactions
  async getSalesTransactions(): Promise<SalesTransactionWithRelations[]> {
    const result = await db.select()
      .from(salesTransactions)
      .leftJoin(clients, eq(salesTransactions.clientId, clients.id))
      .leftJoin(users, eq(salesTransactions.createdByUserId, users.id))
      .orderBy(desc(salesTransactions.createdAt));

    const transactionsWithRelations = [];
    
    for (const row of result) {
      const items = await db.select()
        .from(saleItems)
        .leftJoin(parts, eq(saleItems.partId, parts.id))
        .where(eq(saleItems.transactionId, row.sales_transactions.id));

      const paymentsData = await db.select()
        .from(payments)
        .where(eq(payments.transactionId, row.sales_transactions.id));

      transactionsWithRelations.push({
        ...row.sales_transactions,
        client: row.clients,
        createdBy: row.users,
        items: items.map(item => ({
          ...item.sale_items,
          part: item.parts
        })),
        payments: paymentsData
      });
    }

    return transactionsWithRelations as SalesTransactionWithRelations[];
  }

  async getSalesTransaction(id: number): Promise<SalesTransactionWithRelations | undefined> {
    const result = await db.select()
      .from(salesTransactions)
      .leftJoin(clients, eq(salesTransactions.clientId, clients.id))
      .leftJoin(users, eq(salesTransactions.createdByUserId, users.id))
      .where(eq(salesTransactions.id, id));

    if (result.length === 0) return undefined;

    const row = result[0];
    
    const items = await db.select()
      .from(saleItems)
      .leftJoin(parts, eq(saleItems.partId, parts.id))
      .where(eq(saleItems.transactionId, id));

    const paymentsResult = await db.select()
      .from(payments)
      .where(eq(payments.transactionId, id));

    return {
      ...row.sales_transactions,
      client: row.clients,
      createdBy: row.users,
      items: items.map(item => ({
        ...item.sale_items,
        part: item.parts
      })),
      payments: paymentsResult
    } as SalesTransactionWithRelations;
  }

  async createSalesTransaction(transaction: InsertSalesTransaction): Promise<SalesTransaction> {
    const result = await db.insert(salesTransactions).values(transaction).returning();
    return result[0];
  }

  async updateSalesTransaction(id: number, transaction: Partial<InsertSalesTransaction>): Promise<SalesTransaction> {
    const result = await db.update(salesTransactions)
      .set(transaction)
      .where(eq(salesTransactions.id, id))
      .returning();
    return result[0];
  }

  async deleteSalesTransaction(id: number): Promise<void> {
    // Delete related items and payments first
    await db.delete(saleItems).where(eq(saleItems.transactionId, id));
    await db.delete(payments).where(eq(payments.transactionId, id));
    await db.delete(salesTransactions).where(eq(salesTransactions.id, id));
  }

  // Sale Items
  async createSaleItem(item: InsertSaleItem): Promise<SaleItem> {
    const result = await db.insert(saleItems).values(item).returning();
    
    // Update inventory if part is linked
    if (item.partId) {
      const quantity = parseFloat(item.quantity as string);
      // Create stock movement record
      await this.createStockMovement({
        partId: item.partId,
        movementType: 'outbound',
        quantity: -quantity,
        reason: 'Sale',
        performedBy: 'System'
      });
    }
    
    return result[0];
  }

  async updateSaleItem(id: number, item: Partial<InsertSaleItem>): Promise<SaleItem> {
    const result = await db.update(saleItems)
      .set(item)
      .where(eq(saleItems.id, id))
      .returning();
    return result[0];
  }

  async deleteSaleItem(id: number): Promise<void> {
    // Get the item details before deletion for inventory adjustment
    const [item] = await db.select().from(saleItems).where(eq(saleItems.id, id));
    
    if (item && item.partId) {
      const quantity = parseFloat(item.quantity as string);
      // Create stock movement record for reversal
      await this.createStockMovement({
        partId: item.partId,
        movementType: 'inbound',
        quantity: quantity,
        reason: 'Sale Reversal',
        performedBy: 'System'
      });
    }
    
    await db.delete(saleItems).where(eq(saleItems.id, id));
  }

  // Payments (future-proofed)
  async getPayments(transactionId?: number): Promise<Payment[]> {
    const query = db.select().from(payments).orderBy(desc(payments.createdAt));
    
    if (transactionId) {
      query.where(eq(payments.transactionId, transactionId));
    }
    
    return await query;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const result = await db.update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }
}

export const storage = new DatabaseStorage();
