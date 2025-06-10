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
  createdBy: true,
});

export const insertRepairNoteSchema = createInsertSchema(repairNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  technicianName: true,
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
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  description: z.string().optional(),
  billable: z.boolean().default(true),
  hourlyRate: z.string().optional(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
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

export type Client = typeof clients.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type PartsOrder = typeof partsOrders.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type RepairNote = typeof repairNotes.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type TimeLog = typeof timeLogs.$inferSelect;

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
