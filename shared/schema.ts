import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with username/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: text("role").notNull().default("technician"), // admin, technician
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(), // laptop, desktop, smartphone, tablet
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  deviceId: integer("device_id").notNull().references(() => devices.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("received"), // received, diagnosed, awaiting_parts, in_progress, ready_for_pickup, completed
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  finalCost: decimal("final_cost", { precision: 10, scale: 2 }),
  isPaid: boolean("is_paid").default(false),
  paymentMethod: text("payment_method"),
  paymentDate: timestamp("payment_date"),
  aiAnalysis: jsonb("ai_analysis"), // AI analysis results
  estimatedCompletionTime: timestamp("estimated_completion_time"), // AI-estimated completion
  repairSuggestions: jsonb("repair_suggestions"), // AI-generated repair steps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const partsOrders = pgTable("parts_orders", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  partName: text("part_name").notNull(),
  supplier: text("supplier"),
  orderNumber: text("order_number"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(1),
  status: text("status").notNull().default("ordered"), // ordered, in_transit, delivered, installed
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDate: timestamp("expected_date"),
  receivedDate: timestamp("received_date"),
  notes: text("notes"),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // status_change, note_added, part_ordered, payment_received, etc.
  description: text("description").notNull(),
  details: jsonb("details"), // Additional structured data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
});

export const repairNotes = pgTable("repair_notes", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // diagnostic, test_result, repair_step, observation, issue_found
  title: text("title").notNull(),
  content: text("content").notNull(),
  technicianName: text("technician_name").notNull(),
  isResolved: boolean("is_resolved").default(false),
  priority: text("priority").notNull().default("normal"), // low, normal, high, critical
  tags: text("tags").array(), // Array of tags like "hardware", "software", "driver", etc.
  attachments: jsonb("attachments"), // Store file paths or references
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id),
  clientId: integer("client_id").references(() => clients.id),
  type: text("type").notNull(), // follow_up, warranty_expiry, maintenance, custom
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timeLogs = pgTable("time_logs", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  technicianName: text("technician_name").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // Duration in seconds
  description: text("description"), // What was worked on during this time
  billable: boolean("billable").default(true),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }), // Rate per hour
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimetype: text("mimetype").notNull(),
  size: integer("size").notNull(),
  description: text("description"),
  type: text("type").notNull().default("device_photo"), // device_photo, repair_photo, document
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Phase 3: Advanced Inventory Management Tables
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  accountNumber: text("account_number"),
  paymentTerms: text("payment_terms").default("NET30"), // NET30, NET15, COD, etc.
  taxId: text("tax_id"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  supplierPartNumber: text("supplier_part_number"),
  manufacturer: text("manufacturer"),
  manufacturerPartNumber: text("manufacturer_part_number"),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).default("0.00"),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).default("0.00"),
  markup: decimal("markup", { precision: 5, scale: 2 }).default("0.00"),
  quantityOnHand: integer("quantity_on_hand").default(0),
  quantityAllocated: integer("quantity_allocated").default(0),
  quantityOnOrder: integer("quantity_on_order").default(0),
  reorderPoint: integer("reorder_point").default(0),
  reorderQuantity: integer("reorder_quantity").default(0),
  maxStockLevel: integer("max_stock_level"),
  location: text("location"), // warehouse location/bin
  weight: decimal("weight", { precision: 8, scale: 3 }),
  dimensions: text("dimensions"), // L x W x H
  warrantyPeriod: integer("warranty_period"), // days
  isActive: boolean("is_active").default(true),
  isStocked: boolean("is_stocked").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  status: text("status").notNull().default("draft"), // draft, sent, confirmed, receiving, completed, cancelled
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDate: timestamp("expected_date"),
  receivedDate: timestamp("received_date"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  partId: integer("part_id").notNull().references(() => parts.id),
  quantityOrdered: integer("quantity_ordered").notNull(),
  quantityReceived: integer("quantity_received").default(0),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  partId: integer("part_id").notNull().references(() => parts.id),
  movementType: text("movement_type").notNull(), // in, out, adjustment, transfer
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(), // purchase, sale, adjustment, return, etc.
  referenceId: integer("reference_id"), // ticket_id, purchase_order_id, etc.
  referenceType: text("reference_type"), // ticket, purchase_order, adjustment
  notes: text("notes"),
  performedBy: text("performed_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lowStockAlerts = pgTable("low_stock_alerts", {
  id: serial("id").primaryKey(),
  partId: integer("part_id").notNull().references(() => parts.id),
  currentQuantity: integer("current_quantity").notNull(),
  reorderPoint: integer("reorder_point").notNull(),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Phase 3.5: Billing & Sales System
export const billableItems = pgTable("billable_items", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  type: text("type").notNull(), // labor, parts, service
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default('1.00'),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('10.00'), // Default 10%
  taxInclusive: boolean("tax_inclusive").default(false),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  billingStatus: text("billing_status").notNull().default('pending'), // pending, billed, void
  billedDate: timestamp("billed_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salesTransactions = pgTable("sales_transactions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default('pending'), // pending, partial, paid
  notes: text("notes"),
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => salesTransactions.id),
  partId: integer("part_id").references(() => parts.id), // nullable for non-inventory items
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('10.00'),
  taxInclusive: boolean("tax_inclusive").default(false),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Future-proofed payment tracking
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => salesTransactions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, transfer, etc.
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  reference: text("reference"), // receipt number, transaction id, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  devices: many(devices),
  tickets: many(tickets),
  reminders: many(reminders),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  client: one(clients, {
    fields: [devices.clientId],
    references: [clients.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  client: one(clients, {
    fields: [tickets.clientId],
    references: [clients.id],
  }),
  device: one(devices, {
    fields: [tickets.deviceId],
    references: [devices.id],
  }),
  partsOrders: many(partsOrders),
  activityLogs: many(activityLogs),
  repairNotes: many(repairNotes),
  reminders: many(reminders),
  timeLogs: many(timeLogs),
}));

export const partsOrdersRelations = relations(partsOrders, ({ one }) => ({
  ticket: one(tickets, {
    fields: [partsOrders.ticketId],
    references: [tickets.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [activityLogs.ticketId],
    references: [tickets.id],
  }),
}));

export const repairNotesRelations = relations(repairNotes, ({ one }) => ({
  ticket: one(tickets, {
    fields: [repairNotes.ticketId],
    references: [tickets.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  ticket: one(tickets, {
    fields: [reminders.ticketId],
    references: [tickets.id],
  }),
  client: one(clients, {
    fields: [reminders.clientId],
    references: [clients.id],
  }),
}));

export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [timeLogs.ticketId],
    references: [tickets.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [attachments.ticketId],
    references: [tickets.id],
  }),
}));

// Phase 3 Relations
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  parts: many(parts),
  purchaseOrders: many(purchaseOrders),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  parts: many(parts),
}));

export const partsRelations = relations(parts, ({ one, many }) => ({
  category: one(categories, {
    fields: [parts.categoryId],
    references: [categories.id],
  }),
  supplier: one(suppliers, {
    fields: [parts.supplierId],
    references: [suppliers.id],
  }),
  purchaseOrderItems: many(purchaseOrderItems),
  stockMovements: many(stockMovements),
  lowStockAlerts: many(lowStockAlerts),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  part: one(parts, {
    fields: [purchaseOrderItems.partId],
    references: [parts.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  part: one(parts, {
    fields: [stockMovements.partId],
    references: [parts.id],
  }),
}));

export const lowStockAlertsRelations = relations(lowStockAlerts, ({ one }) => ({
  part: one(parts, {
    fields: [lowStockAlerts.partId],
    references: [parts.id],
  }),
}));

// Phase 3.5 Relations
export const billableItemsRelations = relations(billableItems, ({ one }) => ({
  ticket: one(tickets, {
    fields: [billableItems.ticketId],
    references: [tickets.id],
  }),
}));

export const salesTransactionsRelations = relations(salesTransactions, ({ one, many }) => ({
  client: one(clients, {
    fields: [salesTransactions.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [salesTransactions.createdByUserId],
    references: [users.id],
  }),
  items: many(saleItems),
  payments: many(payments),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  transaction: one(salesTransactions, {
    fields: [saleItems.transactionId],
    references: [salesTransactions.id],
  }),
  part: one(parts, {
    fields: [saleItems.partId],
    references: [parts.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  transaction: one(salesTransactions, {
    fields: [payments.transactionId],
    references: [salesTransactions.id],
  }),
}));

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertPartsOrderSchema = createInsertSchema(partsOrders).omit({
  id: true,
  orderDate: true,
  receivedDate: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertRepairNoteSchema = createInsertSchema(repairNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTimeLogSchema = z.object({
  ticketId: z.number(),
  userId: z.string(),
  technicianName: z.string(),
  startTime: z.union([z.date(), z.string()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  endTime: z.union([z.date(), z.string()]).optional().transform((val) => 
    val && typeof val === 'string' ? new Date(val) : val
  ),
  duration: z.number().optional(),
  description: z.string().optional(),
  billable: z.boolean().default(true),
  hourlyRate: z.string().optional(),
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
});

// Phase 3 Insert Schemas
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertPartSchema = createInsertSchema(parts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  poNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

export const insertLowStockAlertSchema = createInsertSchema(lowStockAlerts).omit({
  id: true,
  createdAt: true,
});

// Phase 3.5 Insert Schemas
export const insertBillableItemSchema = createInsertSchema(billableItems).omit({
  id: true,
  createdAt: true,
});

export const insertSalesTransactionSchema = createInsertSchema(salesTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "technician"]).default("technician"),
  isActive: z.boolean().default(true),
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertPartsOrder = z.infer<typeof insertPartsOrderSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertRepairNote = z.infer<typeof insertRepairNoteSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type InsertTimeLog = z.infer<typeof insertTimeLogSchema>;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

// Phase 3 Types
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertPart = z.infer<typeof insertPartSchema>;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type InsertLowStockAlert = z.infer<typeof insertLowStockAlertSchema>;

// Phase 3.5 Types
export type InsertBillableItem = z.infer<typeof insertBillableItemSchema>;
export type InsertSalesTransaction = z.infer<typeof insertSalesTransactionSchema>;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Client = typeof clients.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type PartsOrder = typeof partsOrders.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type RepairNote = typeof repairNotes.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type TimeLog = typeof timeLogs.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;

// Phase 3 Select Types
export type Supplier = typeof suppliers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Part = typeof parts.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type LowStockAlert = typeof lowStockAlerts.$inferSelect;

// Phase 3.5 Select Types
export type BillableItem = typeof billableItems.$inferSelect;
export type SalesTransaction = typeof salesTransactions.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;

// Extended types with relations
export type TicketWithRelations = Ticket & {
  client: Client;
  device: Device;
  partsOrders: PartsOrder[];
  activityLogs: ActivityLog[];
  repairNotes: RepairNote[];
  timeLogs: TimeLog[];
};

export type ClientWithDevices = Client & {
  devices: Device[];
};

export type DeviceWithClient = Device & {
  client: Client;
};

// Phase 3 Extended Types
export type PartWithRelations = Part & {
  category?: Category;
  supplier?: Supplier;
  stockMovements?: StockMovement[];
  lowStockAlerts?: LowStockAlert[];
};

export type PurchaseOrderWithRelations = PurchaseOrder & {
  supplier: Supplier;
  items: (PurchaseOrderItem & { part: Part })[];
};

export type CategoryWithParent = Category & {
  parent?: Category;
  children?: Category[];
};

// Phase 3.5 Extended Types
export type SalesTransactionWithRelations = SalesTransaction & {
  client: Client;
  createdBy: User;
  items: (SaleItem & { part?: Part })[];
  payments: Payment[];
};

export type BillableItemWithTicket = BillableItem & {
  ticket: TicketWithRelations;
};
