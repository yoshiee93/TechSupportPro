import { Router } from "express";
import { aiService } from "./openai-service";
import { db } from "../../db";
import { tickets, devices } from "../../../shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Analyze a ticket with AI
router.post("/analyze-ticket", async (req, res) => {
  try {
    const { ticketId, deviceBrand, deviceModel, issueDescription, customerComplaints } = req.body;

    if (!deviceBrand || !deviceModel || !issueDescription) {
      return res.status(400).json({ 
        error: "Device brand, model, and issue description are required" 
      });
    }

    const analysis = await aiService.analyzeTicket(
      deviceBrand,
      deviceModel,
      issueDescription,
      customerComplaints
    );

    // If ticketId is provided, save the analysis to the ticket
    if (ticketId) {
      await db
        .update(tickets)
        .set({
          priority: analysis.priority,
          estimatedCompletionTime: new Date(Date.now() + analysis.estimatedTimeHours * 60 * 60 * 1000)
        })
        .where(eq(tickets.id, ticketId));
    }

    res.json(analysis);
  } catch (error: any) {
    console.error("Error analyzing ticket:", error);
    res.status(500).json({ error: error.message || "Failed to analyze ticket" });
  }
});

// Parse voice transcript into structured ticket data
router.post("/parse-voice-ticket", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Voice transcript is required" });
    }

    const parsedData = await aiService.parseVoiceTicket(transcript);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error parsing voice ticket:", error);
    res.status(500).json({ error: error.message || "Failed to parse voice ticket" });
  }
});

// Generate repair suggestions
router.post("/repair-suggestions", async (req, res) => {
  try {
    const { deviceBrand, deviceModel, diagnosedIssue, availableParts } = req.body;

    if (!deviceBrand || !deviceModel || !diagnosedIssue) {
      return res.status(400).json({ 
        error: "Device brand, model, and diagnosed issue are required" 
      });
    }

    const suggestions = await aiService.generateRepairSuggestions(
      deviceBrand,
      deviceModel,
      diagnosedIssue,
      availableParts
    );

    res.json(suggestions);
  } catch (error: any) {
    console.error("Error generating repair suggestions:", error);
    res.status(500).json({ error: error.message || "Failed to generate repair suggestions" });
  }
});

// Suggest parts based on symptoms
router.post("/suggest-parts", async (req, res) => {
  try {
    const { deviceBrand, deviceModel, symptoms } = req.body;

    if (!deviceBrand || !deviceModel || !symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ 
        error: "Device brand, model, and symptoms array are required" 
      });
    }

    const suggestedParts = await aiService.suggestPartsBySymptoms(
      deviceBrand,
      deviceModel,
      symptoms
    );

    res.json({ parts: suggestedParts });
  } catch (error: any) {
    console.error("Error suggesting parts:", error);
    res.status(500).json({ error: error.message || "Failed to suggest parts" });
  }
});

// Prioritize multiple tickets
router.post("/prioritize-tickets", async (req, res) => {
  try {
    const { ticketIds } = req.body;

    if (!ticketIds || !Array.isArray(ticketIds)) {
      return res.status(400).json({ 
        error: "Ticket IDs array is required" 
      });
    }

    // Fetch tickets from database
    const ticketData = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketIds[0])); // This would need to be modified for multiple IDs

    // For now, let's get all tickets if no specific IDs provided
    const allTickets = await db.select().from(tickets);
    
    const priorityAdjustments = await aiService.prioritizeTickets(allTickets);

    res.json({ priorityAdjustments });
  } catch (error: any) {
    console.error("Error prioritizing tickets:", error);
    res.status(500).json({ error: error.message || "Failed to prioritize tickets" });
  }
});

// Get AI insights for dashboard
router.get("/insights", async (req, res) => {
  try {
    // Get recent tickets for analysis
    const recentTickets = await db
      .select()
      .from(tickets)
      .limit(10);

    if (recentTickets.length === 0) {
      return res.json({ 
        insights: "No recent tickets available for analysis",
        recommendations: []
      });
    }

    // Get device information for tickets
    const ticketsWithDevices = await Promise.all(
      recentTickets.map(async (ticket) => {
        const [device] = await db
          .select()
          .from(devices)
          .where(eq(devices.id, ticket.deviceId));
        return { ...ticket, device };
      })
    );

    // Analyze patterns in recent tickets
    const deviceTypes = ticketsWithDevices.reduce((acc: any, ticket) => {
      if (ticket.device) {
        const deviceKey = `${ticket.device.brand} ${ticket.device.model}`;
        acc[deviceKey] = (acc[deviceKey] || 0) + 1;
      }
      return acc;
    }, {});

    const commonIssues = recentTickets.map(ticket => ticket.description);
    
    const insights = {
      totalTickets: recentTickets.length,
      mostCommonDevice: Object.keys(deviceTypes).sort((a, b) => deviceTypes[b] - deviceTypes[a])[0],
      averageTicketsPerDay: Math.round(recentTickets.length / 7), // Assuming last week
      priorityDistribution: recentTickets.reduce((acc: any, ticket) => {
        acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
        return acc;
      }, {}),
      recommendations: [
        "Consider stocking more parts for the most common device types",
        "Review ticket priority assignments for better workflow",
        "Monitor repair completion times to improve estimates"
      ]
    };

    res.json(insights);
  } catch (error: any) {
    console.error("Error getting AI insights:", error);
    res.status(500).json({ error: error.message || "Failed to get AI insights" });
  }
});

export default router;