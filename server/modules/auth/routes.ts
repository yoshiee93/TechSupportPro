import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth, requireAdmin } from "../../auth";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

export function registerAuthRoutes(app: Express) {
  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Login endpoint (handled by auth middleware)
  app.post("/api/login", (req, res) => {
    res.json({ message: "Login successful", user: req.user });
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const userData = req.body;
      
      if (userData.role) {
        const user = await storage.updateUserRole(id, userData.role);
        res.json(user);
      } else {
        const user = await storage.updateUser(id, userData);
        res.json(user);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:id/deactivate", requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const user = await storage.deactivateUser(id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });
}