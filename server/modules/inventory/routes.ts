import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { 
  insertSupplierSchema, 
  insertCategorySchema, 
  insertPartSchema,
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
  insertStockMovementSchema,
  insertLowStockAlertSchema
} from "@shared/schema";
import { requireAuth } from "../../auth";

const router = Router();

// Suppliers
router.get("/suppliers", requireAuth, async (req, res) => {
  try {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

router.get("/suppliers/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const supplier = await storage.getSupplier(id);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

router.post("/suppliers", requireAuth, async (req, res) => {
  try {
    const validatedData = insertSupplierSchema.parse(req.body);
    const supplier = await storage.createSupplier(validatedData);
    res.status(201).json(supplier);
  } catch (error) {
    console.error("Error creating supplier:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid supplier data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

router.patch("/suppliers/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertSupplierSchema.partial().parse(req.body);
    const supplier = await storage.updateSupplier(id, validatedData);
    res.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid supplier data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

router.delete("/suppliers/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteSupplier(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

// Categories
router.get("/categories", requireAuth, async (req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/categories", requireAuth, async (req, res) => {
  try {
    const validatedData = insertCategorySchema.parse(req.body);
    const category = await storage.createCategory(validatedData);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid category data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.patch("/categories/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertCategorySchema.partial().parse(req.body);
    const category = await storage.updateCategory(id, validatedData);
    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid category data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/categories/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteCategory(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Parts
router.get("/parts", requireAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let parts;
    
    if (search && typeof search === 'string') {
      parts = await storage.searchParts(search);
    } else {
      parts = await storage.getParts();
    }
    
    res.json(parts);
  } catch (error) {
    console.error("Error fetching parts:", error);
    res.status(500).json({ error: "Failed to fetch parts" });
  }
});

router.get("/parts/low-stock", requireAuth, async (req, res) => {
  try {
    const parts = await storage.getLowStockParts();
    res.json(parts);
  } catch (error) {
    console.error("Error fetching low stock parts:", error);
    res.status(500).json({ error: "Failed to fetch low stock parts" });
  }
});

router.get("/parts/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const part = await storage.getPart(id);
    if (!part) {
      return res.status(404).json({ error: "Part not found" });
    }
    res.json(part);
  } catch (error) {
    console.error("Error fetching part:", error);
    res.status(500).json({ error: "Failed to fetch part" });
  }
});

router.post("/parts", requireAuth, async (req, res) => {
  try {
    const validatedData = insertPartSchema.parse(req.body);
    const part = await storage.createPart(validatedData);
    res.status(201).json(part);
  } catch (error) {
    console.error("Error creating part:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid part data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create part" });
  }
});

router.patch("/parts/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertPartSchema.partial().parse(req.body);
    const part = await storage.updatePart(id, validatedData);
    res.json(part);
  } catch (error) {
    console.error("Error updating part:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid part data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update part" });
  }
});

router.delete("/parts/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deletePart(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting part:", error);
    res.status(500).json({ error: "Failed to delete part" });
  }
});

// Purchase Orders
router.get("/purchase-orders", requireAuth, async (req, res) => {
  try {
    const purchaseOrders = await storage.getPurchaseOrders();
    res.json(purchaseOrders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

router.get("/purchase-orders/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const purchaseOrder = await storage.getPurchaseOrder(id);
    if (!purchaseOrder) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    res.json(purchaseOrder);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    res.status(500).json({ error: "Failed to fetch purchase order" });
  }
});

router.post("/purchase-orders", requireAuth, async (req, res) => {
  try {
    const validatedData = insertPurchaseOrderSchema.parse({
      ...req.body,
      createdBy: req.user?.username || 'Unknown'
    });
    const purchaseOrder = await storage.createPurchaseOrder(validatedData);
    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error("Error creating purchase order:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid purchase order data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create purchase order" });
  }
});

router.patch("/purchase-orders/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertPurchaseOrderSchema.partial().parse(req.body);
    const purchaseOrder = await storage.updatePurchaseOrder(id, validatedData);
    res.json(purchaseOrder);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid purchase order data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update purchase order" });
  }
});

router.delete("/purchase-orders/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deletePurchaseOrder(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    res.status(500).json({ error: "Failed to delete purchase order" });
  }
});

// Purchase Order Items
router.post("/purchase-orders/:poId/items", requireAuth, async (req, res) => {
  try {
    const purchaseOrderId = parseInt(req.params.poId);
    const validatedData = insertPurchaseOrderItemSchema.parse({
      ...req.body,
      purchaseOrderId
    });
    const item = await storage.createPurchaseOrderItem(validatedData);
    res.status(201).json(item);
  } catch (error) {
    console.error("Error creating purchase order item:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid purchase order item data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create purchase order item" });
  }
});

router.patch("/purchase-order-items/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertPurchaseOrderItemSchema.partial().parse(req.body);
    const item = await storage.updatePurchaseOrderItem(id, validatedData);
    res.json(item);
  } catch (error) {
    console.error("Error updating purchase order item:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid purchase order item data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update purchase order item" });
  }
});

router.delete("/purchase-order-items/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deletePurchaseOrderItem(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting purchase order item:", error);
    res.status(500).json({ error: "Failed to delete purchase order item" });
  }
});

// Stock Movements
router.get("/stock-movements", requireAuth, async (req, res) => {
  try {
    const { partId } = req.query;
    const movements = await storage.getStockMovements(
      partId ? parseInt(partId as string) : undefined
    );
    res.json(movements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    res.status(500).json({ error: "Failed to fetch stock movements" });
  }
});

router.post("/stock-movements", requireAuth, async (req, res) => {
  try {
    const validatedData = insertStockMovementSchema.parse({
      ...req.body,
      performedBy: req.user?.username || 'Unknown'
    });
    const movement = await storage.createStockMovement(validatedData);
    res.status(201).json(movement);
  } catch (error) {
    console.error("Error creating stock movement:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid stock movement data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create stock movement" });
  }
});

// Low Stock Alerts
router.get("/low-stock-alerts", requireAuth, async (req, res) => {
  try {
    const alerts = await storage.getLowStockAlerts();
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    res.status(500).json({ error: "Failed to fetch low stock alerts" });
  }
});

router.patch("/low-stock-alerts/:id/resolve", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.resolveLowStockAlert(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error resolving low stock alert:", error);
    res.status(500).json({ error: "Failed to resolve low stock alert" });
  }
});

export default router;

export function registerInventoryRoutes(app: any) {
  app.use("/api/inventory", router);
}