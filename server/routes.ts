import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertClientSchema, insertDeviceSchema, insertTicketSchema, insertPartsOrderSchema, insertRepairNoteSchema, insertReminderSchema, insertTimeLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);
  // Clients
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Devices
  app.get("/api/devices", async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      let devices;
      if (clientId) {
        devices = await storage.getDevicesByClient(clientId);
      } else {
        devices = await storage.getDevices();
      }
      
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  app.get("/api/devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const device = await storage.getDevice(id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch device" });
    }
  });

  app.post("/api/devices", async (req, res) => {
    try {
      const deviceData = insertDeviceSchema.parse(req.body);
      const device = await storage.createDevice(deviceData);
      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid device data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create device" });
    }
  });

  app.put("/api/devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deviceData = insertDeviceSchema.partial().parse(req.body);
      const device = await storage.updateDevice(id, deviceData);
      res.json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid device data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update device" });
    }
  });

  app.delete("/api/devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDevice(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Tickets
  app.get("/api/tickets", async (req, res) => {
    try {
      const search = req.query.search as string;
      
      let tickets;
      if (search) {
        tickets = await storage.searchTickets(search);
      } else {
        tickets = await storage.getTickets();
      }
      
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.get("/api/tickets/number/:ticketNumber", async (req, res) => {
    try {
      const ticketNumber = req.params.ticketNumber;
      const ticket = await storage.getTicketByNumber(ticketNumber);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.put("/api/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticketData = insertTicketSchema.partial().parse(req.body);
      const ticket = await storage.updateTicket(id, ticketData);
      res.json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  app.delete("/api/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTicket(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // Parts Orders
  app.get("/api/parts-orders", async (req, res) => {
    try {
      const ticketId = req.query.ticketId ? parseInt(req.query.ticketId as string) : undefined;
      
      let partsOrders;
      if (ticketId) {
        partsOrders = await storage.getPartsOrdersByTicket(ticketId);
      } else {
        partsOrders = await storage.getPartsOrders();
      }
      
      res.json(partsOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parts orders" });
    }
  });

  app.get("/api/parts-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partsOrder = await storage.getPartsOrder(id);
      if (!partsOrder) {
        return res.status(404).json({ message: "Parts order not found" });
      }
      res.json(partsOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parts order" });
    }
  });

  app.post("/api/parts-orders", async (req, res) => {
    try {
      const partsOrderData = insertPartsOrderSchema.parse(req.body);
      const partsOrder = await storage.createPartsOrder(partsOrderData);
      res.status(201).json(partsOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid parts order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create parts order" });
    }
  });

  app.put("/api/parts-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partsOrderData = insertPartsOrderSchema.partial().parse(req.body);
      const partsOrder = await storage.updatePartsOrder(id, partsOrderData);
      res.json(partsOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid parts order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update parts order" });
    }
  });

  app.delete("/api/parts-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePartsOrder(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete parts order" });
    }
  });

  // Activity Logs
  app.get("/api/tickets/:ticketId/activity-logs", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const logs = await storage.getActivityLogs(ticketId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Repair Notes
  app.get("/api/tickets/:ticketId/repair-notes", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const notes = await storage.getRepairNotes(ticketId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch repair notes" });
    }
  });

  app.post("/api/repair-notes", async (req, res) => {
    try {
      const repairNoteData = insertRepairNoteSchema.parse(req.body);
      const repairNote = await storage.createRepairNote(repairNoteData);
      res.status(201).json(repairNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid repair note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create repair note" });
    }
  });

  app.put("/api/repair-notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const repairNoteData = insertRepairNoteSchema.partial().parse(req.body);
      const repairNote = await storage.updateRepairNote(id, repairNoteData);
      res.json(repairNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid repair note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update repair note" });
    }
  });

  app.delete("/api/repair-notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRepairNote(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete repair note" });
    }
  });

  // Reminders
  app.get("/api/reminders", async (req, res) => {
    try {
      const type = req.query.type as string;
      
      let reminders;
      if (type === "upcoming") {
        reminders = await storage.getUpcomingReminders();
      } else if (type === "overdue") {
        reminders = await storage.getOverdueReminders();
      } else {
        reminders = await storage.getReminders();
      }
      
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const reminderData = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reminder data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.put("/api/reminders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reminderData = insertReminderSchema.partial().parse(req.body);
      const reminder = await storage.updateReminder(id, reminderData);
      res.json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reminder data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReminder(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // Time logs
  app.get("/api/time-logs/:ticketId", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const timeLogs = await storage.getTimeLogs(ticketId);
      res.json(timeLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time logs" });
    }
  });

  app.get("/api/time-logs/:ticketId/active", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const technicianName = req.query.technician as string || "Unknown";
      const activeLog = await storage.getActiveTimeLog(ticketId, technicianName);
      res.json(activeLog || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active time log" });
    }
  });

  app.post("/api/time-logs", async (req, res) => {
    try {
      const timeLogData = {
        ...req.body,
        startTime: req.body.startTime ? new Date(req.body.startTime) : new Date(),
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };
      const validatedData = insertTimeLogSchema.parse(timeLogData);
      const timeLog = await storage.createTimeLog(validatedData);
      res.status(201).json(timeLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time log data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create time log" });
    }
  });

  app.patch("/api/time-logs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const timeLogData = insertTimeLogSchema.partial().parse(req.body);
      const timeLog = await storage.updateTimeLog(id, timeLogData);
      res.json(timeLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time log data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update time log" });
    }
  });

  app.patch("/api/time-logs/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const endTime = req.body.endTime ? new Date(req.body.endTime) : undefined;
      const timeLog = await storage.stopTimeLog(id, endTime);
      res.json(timeLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to stop time log" });
    }
  });

  app.delete("/api/time-logs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTimeLog(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time log" });
    }
  });

  // Dashboard
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
