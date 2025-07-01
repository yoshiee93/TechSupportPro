import { Router, type Express } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { requireAuth } from "../../auth";
import { insertBillableItemSchema, insertSalesTransactionSchema, insertSaleItemSchema } from "@shared/schema";

const router = Router();

// Billable Items Routes
router.get("/billable-items", requireAuth, async (req, res) => {
  try {
    const ticketId = req.query.ticketId ? parseInt(req.query.ticketId as string) : undefined;
    const items = await storage.getBillableItems(ticketId);
    res.json(items);
  } catch (error) {
    console.error("Error getting billable items:", error);
    res.status(500).json({ error: "Failed to get billable items" });
  }
});

router.get("/billable-items/unbilled", requireAuth, async (req, res) => {
  try {
    const items = await storage.getUnbilledItems();
    res.json(items);
  } catch (error) {
    console.error("Error getting unbilled items:", error);
    res.status(500).json({ error: "Failed to get unbilled items" });
  }
});

router.post("/billable-items", requireAuth, async (req, res) => {
  try {
    const data = insertBillableItemSchema.parse(req.body);
    const item = await storage.createBillableItem(data);
    res.json(item);
  } catch (error) {
    console.error("Error creating billable item:", error);
    res.status(500).json({ error: "Failed to create billable item" });
  }
});

router.put("/billable-items/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertBillableItemSchema.partial().parse(req.body);
    const item = await storage.updateBillableItem(id, data);
    res.json(item);
  } catch (error) {
    console.error("Error updating billable item:", error);
    res.status(500).json({ error: "Failed to update billable item" });
  }
});

router.post("/billable-items/mark-billed", requireAuth, async (req, res) => {
  try {
    const { itemIds } = z.object({ itemIds: z.array(z.number()) }).parse(req.body);
    await storage.markItemsAsBilled(itemIds);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking items as billed:", error);
    res.status(500).json({ error: "Failed to mark items as billed" });
  }
});

router.delete("/billable-items/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteBillableItem(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting billable item:", error);
    res.status(500).json({ error: "Failed to delete billable item" });
  }
});

// Sales Transactions Routes
router.get("/sales", requireAuth, async (req, res) => {
  try {
    const transactions = await storage.getSalesTransactions();
    res.json(transactions);
  } catch (error) {
    console.error("Error getting sales transactions:", error);
    res.status(500).json({ error: "Failed to get sales transactions" });
  }
});

router.get("/sales/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const transaction = await storage.getSalesTransaction(id);
    if (!transaction) {
      return res.status(404).json({ error: "Sales transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    console.error("Error getting sales transaction:", error);
    res.status(500).json({ error: "Failed to get sales transaction" });
  }
});

// Create new sale with items
router.post("/sales", requireAuth, async (req, res) => {
  try {
    const { transaction: baseTransactionData, items: itemsData } = req.body;
    // Create transaction with authenticated user ID
    const userId = req.user?.id || '6b7d97fb-ed95-4f00-bfa3-6a6db20888b3';
    
    const transactionData = {
      clientId: baseTransactionData.clientId,
      subtotal: baseTransactionData.subtotal,
      taxAmount: baseTransactionData.taxAmount,
      totalAmount: baseTransactionData.totalAmount,
      paymentStatus: 'pending',
      notes: baseTransactionData.notes || null,
      createdByUserId: userId
    };
    
    const transaction = await storage.createSalesTransaction(transactionData);
    
    // Create sale items and update inventory
    const items = [];
    for (const itemData of itemsData) {
      const item = await storage.createSaleItem({
        transactionId: transaction.id,
        partId: itemData.partId || null,
        description: itemData.description,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        taxRate: itemData.taxRate,
        taxInclusive: itemData.taxInclusive,
        lineTotal: itemData.lineTotal
      });
      items.push(item);
    }
    
    res.json({ transaction, items });
  } catch (error) {
    console.error("Error creating sales transaction:", error);
    res.status(500).json({ error: "Failed to create sales transaction" });
  }
});

router.put("/sales/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertSalesTransactionSchema.partial().parse(req.body);
    const transaction = await storage.updateSalesTransaction(id, data);
    res.json(transaction);
  } catch (error) {
    console.error("Error updating sales transaction:", error);
    res.status(500).json({ error: "Failed to update sales transaction" });
  }
});

router.delete("/sales/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteSalesTransaction(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting sales transaction:", error);
    res.status(500).json({ error: "Failed to delete sales transaction" });
  }
});

// Sale Items Routes
router.post("/sale-items", requireAuth, async (req, res) => {
  try {
    const data = insertSaleItemSchema.parse(req.body);
    const item = await storage.createSaleItem(data);
    res.json(item);
  } catch (error) {
    console.error("Error creating sale item:", error);
    res.status(500).json({ error: "Failed to create sale item" });
  }
});

router.put("/sale-items/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertSaleItemSchema.partial().parse(req.body);
    const item = await storage.updateSaleItem(id, data);
    res.json(item);
  } catch (error) {
    console.error("Error updating sale item:", error);
    res.status(500).json({ error: "Failed to update sale item" });
  }
});

router.delete("/sale-items/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteSaleItem(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting sale item:", error);
    res.status(500).json({ error: "Failed to delete sale item" });
  }
});

// Get billable items for a specific ticket
router.get("/billable-items/ticket/:ticketId", requireAuth, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const items = await storage.getBillableItemsByTicket(ticketId);
    res.json(items);
  } catch (error) {
    console.error("Error fetching billable items:", error);
    res.status(500).json({ error: "Failed to fetch billable items" });
  }
});

// Add billable item to ticket
router.post("/billable-items", requireAuth, async (req, res) => {
  try {
    // console.log("Received billable item data:", req.body);
    const data = insertBillableItemSchema.parse(req.body);
    // console.log("Parsed billable item data:", data);
    const item = await storage.createBillableItem(data);
    res.json(item);
  } catch (error) {
    console.error("Error creating billable item:", error);
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.issues);
      return res.status(400).json({ error: "Validation failed", details: error.issues });
    }
    res.status(500).json({ error: "Failed to create billable item" });
  }
});

// Delete billable item
router.delete("/billable-items/:id", requireAuth, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    await storage.deleteBillableItem(itemId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting billable item:", error);
    res.status(500).json({ error: "Failed to delete billable item" });
  }
});

// Get all invoices
router.get("/invoices", requireAuth, async (req, res) => {
  try {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  } catch (error) {
    console.error("Error getting invoices:", error);
    res.status(500).json({ error: "Failed to get invoices" });
  }
});

// Generate invoice for ticket
router.post("/invoices/generate/:ticketId", requireAuth, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const invoice = await storage.generateInvoiceForTicket(ticketId);
    res.json({ invoice });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

export function registerBillingRoutes(app: Express) {
  app.use("/api", router);
}