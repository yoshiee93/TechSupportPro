import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { registerAuthRoutes } from "./modules/auth/routes";
import { registerClientRoutes } from "./modules/clients/routes";
import { registerTicketingRoutes } from "./modules/ticketing/routes";
import { registerInventoryRoutes } from "./modules/inventory/routes";
import { registerOrderingRoutes } from "./modules/ordering/routes";
import { registerAttachmentRoutes } from "./modules/attachments/routes";
import { registerBillingRoutes } from "./modules/billing/routes";
import { errorHandler } from "./shared/middleware/error-handler";
import { setupWebSocket } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth setup
  setupAuth(app);

  // Register modular routes
  registerAuthRoutes(app);
  registerClientRoutes(app);
  registerTicketingRoutes(app);
  registerInventoryRoutes(app);
  registerOrderingRoutes(app);
  registerAttachmentRoutes(app);
  registerBillingRoutes(app);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Create HTTP server
  const server = createServer(app);

  // Setup WebSocket
  setupWebSocket(server);

  return server;
}