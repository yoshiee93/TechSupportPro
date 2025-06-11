import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import { timeLogs, tickets } from "../../../shared/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const router = Router();

const insertTimeLogSchema = createInsertSchema(timeLogs).omit({
  id: true,
  createdAt: true,
});

const startTimeLogSchema = z.object({
  ticketId: z.number(),
  description: z.string().optional(),
  hourlyRate: z.number().optional(),
});

const stopTimeLogSchema = z.object({
  id: z.number(),
  description: z.string().optional(),
});

// Start time tracking
router.post("/start", async (req, res) => {
  try {
    const { ticketId, description, hourlyRate } = startTimeLogSchema.parse(req.body);
    
    // Check if there's already an active time log for this user and ticket
    const existingActiveLog = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.ticketId, ticketId),
          eq(timeLogs.userId, req.user.id),
          eq(timeLogs.isActive, true)
        )
      );

    if (existingActiveLog.length > 0) {
      return res.status(400).json({ error: "Time tracking already active for this ticket" });
    }

    // Stop any other active time logs for this user
    await db
      .update(timeLogs)
      .set({ 
        isActive: false,
        endTime: new Date(),
      })
      .where(
        and(
          eq(timeLogs.userId, req.user.id),
          eq(timeLogs.isActive, true)
        )
      );

    // Create new time log
    const [timeLog] = await db
      .insert(timeLogs)
      .values({
        ticketId,
        userId: req.user.id,
        startTime: new Date(),
        description,
        hourlyRate: hourlyRate?.toString(),
        isActive: true,
      })
      .returning();

    res.json(timeLog);
  } catch (error: any) {
    console.error("Error starting time log:", error);
    res.status(500).json({ error: error.message || "Failed to start time tracking" });
  }
});

// Stop time tracking
router.post("/stop", async (req, res) => {
  try {
    const { id, description } = stopTimeLogSchema.parse(req.body);
    
    const [timeLog] = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.id, id),
          eq(timeLogs.userId, req.user.id),
          eq(timeLogs.isActive, true)
        )
      );

    if (!timeLog) {
      return res.status(404).json({ error: "Active time log not found" });
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - timeLog.startTime.getTime()) / (1000 * 60)); // minutes
    
    let laborCost = 0;
    if (timeLog.hourlyRate) {
      laborCost = (parseFloat(timeLog.hourlyRate) / 60) * duration; // cost per minute * duration
    }

    const [updatedTimeLog] = await db
      .update(timeLogs)
      .set({
        endTime,
        duration,
        laborCost: laborCost.toString(),
        description: description || timeLog.description,
        isActive: false,
      })
      .where(eq(timeLogs.id, id))
      .returning();

    res.json(updatedTimeLog);
  } catch (error: any) {
    console.error("Error stopping time log:", error);
    res.status(500).json({ error: error.message || "Failed to stop time tracking" });
  }
});

// Get active time log for user
router.get("/active", async (req, res) => {
  try {
    const [activeLog] = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.userId, req.user.id),
          eq(timeLogs.isActive, true)
        )
      );

    res.json(activeLog || null);
  } catch (error: any) {
    console.error("Error getting active time log:", error);
    res.status(500).json({ error: error.message || "Failed to get active time log" });
  }
});

// Get time logs for a ticket
router.get("/ticket/:ticketId", async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    
    const logs = await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.ticketId, ticketId))
      .orderBy(desc(timeLogs.startTime));

    res.json(logs);
  } catch (error: any) {
    console.error("Error getting time logs:", error);
    res.status(500).json({ error: error.message || "Failed to get time logs" });
  }
});

// Get time logs for user
router.get("/user", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const logs = await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.userId, req.user.id))
      .orderBy(desc(timeLogs.startTime))
      .limit(limit)
      .offset(offset);

    res.json(logs);
  } catch (error: any) {
    console.error("Error getting user time logs:", error);
    res.status(500).json({ error: error.message || "Failed to get time logs" });
  }
});

// Update time log
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertTimeLogSchema.partial().parse(req.body);
    
    // Verify ownership
    const [existingLog] = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.id, id),
          eq(timeLogs.userId, req.user.id)
        )
      );

    if (!existingLog) {
      return res.status(404).json({ error: "Time log not found" });
    }

    // Recalculate labor cost if hourly rate or duration changed
    let laborCost = existingLog.laborCost;
    if (updates.hourlyRate || updates.duration) {
      const rate = updates.hourlyRate ? parseFloat(updates.hourlyRate) : parseFloat(existingLog.hourlyRate || "0");
      const duration = updates.duration || existingLog.duration || 0;
      laborCost = ((rate / 60) * duration).toString();
    }

    const [updatedLog] = await db
      .update(timeLogs)
      .set({
        ...updates,
        laborCost,
      })
      .where(eq(timeLogs.id, id))
      .returning();

    res.json(updatedLog);
  } catch (error: any) {
    console.error("Error updating time log:", error);
    res.status(500).json({ error: error.message || "Failed to update time log" });
  }
});

// Delete time log
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verify ownership
    const [existingLog] = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.id, id),
          eq(timeLogs.userId, req.user.id)
        )
      );

    if (!existingLog) {
      return res.status(404).json({ error: "Time log not found" });
    }

    await db.delete(timeLogs).where(eq(timeLogs.id, id));
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting time log:", error);
    res.status(500).json({ error: error.message || "Failed to delete time log" });
  }
});

// Get time tracking statistics
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const logs = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.userId, userId),
          eq(timeLogs.isActive, false) // Only completed logs
        )
      );

    const totalMinutes = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + parseFloat(log.laborCost || "0"), 0);
    const averageSessionLength = logs.length > 0 ? totalMinutes / logs.length : 0;

    const stats = {
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      totalMinutes,
      totalCost: Math.round(totalCost * 100) / 100,
      sessionsCount: logs.length,
      averageSessionLength: Math.round(averageSessionLength),
      ticketsWorked: [...new Set(logs.map(log => log.ticketId))].length,
    };

    res.json(stats);
  } catch (error: any) {
    console.error("Error getting time tracking stats:", error);
    res.status(500).json({ error: error.message || "Failed to get statistics" });
  }
});

export default router;