import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../auth";
import { insertPartsOrderSchema, insertReminderSchema } from "@shared/schema";
import { z } from "zod";

export function registerInventoryRoutes(app: Express) {
  // Parts Orders
  app.get("/api/parts-orders", requireAuth, async (req, res) => {
    try {
      const ticketId = req.query.ticketId as string;
      if (ticketId) {
        const partsOrders = await storage.getPartsOrdersByTicket(parseInt(ticketId));
        res.json(partsOrders);
      } else {
        const partsOrders = await storage.getPartsOrders();
        res.json(partsOrders);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parts orders" });
    }
  });

  app.get("/api/parts-orders/:id", requireAuth, async (req, res) => {
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

  app.post("/api/parts-orders", requireAuth, async (req, res) => {
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

  app.put("/api/parts-orders/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/parts-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePartsOrder(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete parts order" });
    }
  });

  // Reminders
  app.get("/api/reminders", requireAuth, async (req, res) => {
    try {
      const type = req.query.type as string;
      let reminders;
      
      switch (type) {
        case "upcoming":
          reminders = await storage.getUpcomingReminders();
          break;
        case "overdue":
          reminders = await storage.getOverdueReminders();
          break;
        default:
          reminders = await storage.getReminders();
      }
      
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", requireAuth, async (req, res) => {
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

  app.put("/api/reminders/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/reminders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReminder(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });
}