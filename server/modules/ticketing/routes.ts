import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../auth";
import { insertTicketSchema, insertRepairNoteSchema, insertTimeLogSchema } from "@shared/schema";
import { z } from "zod";
import { getWebSocketManager } from "../../websocket";

export function registerTicketingRoutes(app: Express) {
  // Get all tickets with search
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string;
      if (search) {
        const tickets = await storage.searchTickets(search);
        res.json(tickets);
      } else {
        const tickets = await storage.getTickets();
        res.json(tickets);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Get ticket by ID
  app.get("/api/tickets/:id", requireAuth, async (req, res) => {
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

  // Get ticket by number
  app.get("/api/tickets/number/:ticketNumber", requireAuth, async (req, res) => {
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

  // Create new ticket
  app.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      
      // Notify WebSocket clients about new ticket
      const wsManager = getWebSocketManager();
      if (wsManager) {
        wsManager.notifyTicketUpdate(ticket.id, 'created', ticket, req.user?.id);
      }
      
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Ticket creation error:", error);
      if (error instanceof z.ZodError) {
        // Log validation errors for debugging
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create ticket", error: errorMessage });
    }
  });

  // Update ticket
  app.put("/api/tickets/:id", requireAuth, async (req, res) => {
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

  // Delete ticket
  app.delete("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Deleting ticket with id:", id);
      await storage.deleteTicket(id);
      res.status(204).send();
    } catch (error) {
      console.error("Ticket deletion error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to delete ticket", error: errorMessage });
    }
  });

  // Activity logs
  app.get("/api/tickets/:id/activity", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const activityLogs = await storage.getActivityLogs(ticketId);
      res.json(activityLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Repair notes
  app.get("/api/tickets/:id/repair-notes", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const repairNotes = await storage.getRepairNotes(ticketId);
      res.json(repairNotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch repair notes" });
    }
  });

  app.post("/api/tickets/:id/repair-notes", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      
      console.log("Creating repair note for ticket:", ticketId, "by user:", userId);
      console.log("Request body:", req.body);
      
      const repairNoteData = insertRepairNoteSchema.parse({
        ...req.body,
        ticketId,
        userId
      });
      
      console.log("Parsed repair note data:", repairNoteData);
      
      const repairNote = await storage.createRepairNote(repairNoteData);
      console.log("Created repair note:", repairNote);
      
      res.status(201).json(repairNote);
    } catch (error) {
      console.error("Repair note creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid repair note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create repair note" });
    }
  });

  app.put("/api/repair-notes/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/repair-notes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRepairNote(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete repair note" });
    }
  });

  // Time logs
  app.get("/api/time-logs/:ticketId", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const timeLogs = await storage.getTimeLogs(ticketId);
      res.json(timeLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time logs" });
    }
  });

  app.get("/api/time-logs/:ticketId/active", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const technicianName = req.query.technician as string || "Unknown";
      const activeTimeLog = await storage.getActiveTimeLog(ticketId, technicianName);
      res.json(activeTimeLog || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active time log" });
    }
  });

  app.get("/api/tickets/:id/time-logs", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const timeLogs = await storage.getTimeLogs(ticketId);
      res.json(timeLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time logs" });
    }
  });

  app.post("/api/time-logs", requireAuth, async (req, res) => {
    try {
      console.log("Creating time log with data:", JSON.stringify(req.body, null, 2));
      console.log("User from request:", req.user);
      
      const timeLogData = insertTimeLogSchema.parse(req.body);
      console.log("Validated time log data:", JSON.stringify(timeLogData, null, 2));
      
      const timeLog = await storage.createTimeLog(timeLogData);
      console.log("Created time log:", JSON.stringify(timeLog, null, 2));
      
      // Notify WebSocket clients about timer start
      const wsManager = getWebSocketManager();
      if (wsManager) {
        wsManager.notifyTimerUpdate(timeLog.ticketId, timeLog, req.user?.id);
      }
      
      res.status(201).json(timeLog);
    } catch (error) {
      console.error("Time log creation error:", error);
      if (error instanceof z.ZodError) {
        console.log("Zod validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid time log data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create time log", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/tickets/:id/time-logs", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const timeLogData = insertTimeLogSchema.parse({
        ...req.body,
        ticketId
      });
      const timeLog = await storage.createTimeLog(timeLogData);
      res.status(201).json(timeLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time log data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create time log" });
    }
  });

  app.put("/api/time-logs/:id", requireAuth, async (req, res) => {
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

  app.post("/api/time-logs/:id/stop", requireAuth, async (req, res) => {
    try {
      console.log("Stopping time log ID:", req.params.id);
      console.log("Stop request body:", req.body);
      
      const id = parseInt(req.params.id);
      const { endTime } = req.body;
      const timeLog = await storage.stopTimeLog(id, endTime ? new Date(endTime) : undefined);
      
      console.log("Stopped time log result:", JSON.stringify(timeLog, null, 2));
      res.json(timeLog);
    } catch (error) {
      console.error("Stop time log error:", error);
      res.status(500).json({ message: "Failed to stop time log", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/time-logs/:id/stop", requireAuth, async (req, res) => {
    try {
      console.log("PATCH: Stopping time log ID:", req.params.id);
      console.log("PATCH: Stop request body:", req.body);
      
      const id = parseInt(req.params.id);
      const { endTime } = req.body;
      const timeLog = await storage.stopTimeLog(id, endTime ? new Date(endTime) : undefined);
      
      console.log("PATCH: Stopped time log result:", JSON.stringify(timeLog, null, 2));
      res.json(timeLog);
    } catch (error) {
      console.error("PATCH: Stop time log error:", error);
      res.status(500).json({ message: "Failed to stop time log", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/time-logs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTimeLog(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time log" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
}