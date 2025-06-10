import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export interface ApiError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }

  // Handle database errors
  if (message.includes("duplicate key")) {
    return res.status(409).json({
      message: "Resource already exists"
    });
  }

  if (message.includes("foreign key")) {
    return res.status(400).json({
      message: "Invalid reference to related resource"
    });
  }

  // Log error for debugging
  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  }

  res.status(status).json({ message });
}