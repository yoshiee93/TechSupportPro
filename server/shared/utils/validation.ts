import { z } from "zod";

export function validateId(id: string): number {
  const parsed = parseInt(id);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error("Invalid ID format");
  }
  return parsed;
}

export function validatePagination(page?: string, limit?: string) {
  const pageNum = page ? parseInt(page) : 1;
  const limitNum = limit ? parseInt(limit) : 10;
  
  if (isNaN(pageNum) || pageNum < 1) {
    throw new Error("Invalid page number");
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new Error("Invalid limit (must be between 1 and 100)");
  }
  
  return { page: pageNum, limit: limitNum };
}

export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message
  };
}

export function createErrorResponse(message: string, errors?: any[]) {
  return {
    success: false,
    message,
    errors
  };
}