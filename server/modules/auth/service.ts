import { storage } from "../../storage";
import { JWTManager } from "./jwt";
import type { User, InsertUser } from "@shared/schema";

export class AuthService {
  private jwtManager?: JWTManager;

  constructor(jwtSecret?: string) {
    if (jwtSecret) {
      try {
        this.jwtManager = new JWTManager(jwtSecret);
      } catch (error) {
        console.warn('JWT initialization failed, JWT features disabled');
      }
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    return await storage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return await storage.getUserByUsername(username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    return await storage.createUser(userData);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return await storage.updateUser(id, userData);
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    return await storage.updateUserRole(id, role);
  }

  async deactivateUser(id: string): Promise<User> {
    return await storage.deactivateUser(id);
  }

  async deleteUser(id: string): Promise<void> {
    return await storage.deleteUser(id);
  }

  async getAllUsers(): Promise<User[]> {
    return await storage.getAllUsers();
  }

  // JWT token methods
  generateJWTToken(user: User): string {
    if (!this.jwtManager) {
      throw new Error('JWT not configured');
    }
    return this.jwtManager.generateToken(user);
  }

  verifyJWTToken(token: string) {
    if (!this.jwtManager) {
      throw new Error('JWT not configured');
    }
    return this.jwtManager.verifyToken(token);
  }

  refreshJWTToken(token: string): string {
    if (!this.jwtManager) {
      throw new Error('JWT not configured');
    }
    return this.jwtManager.refreshToken(token);
  }

  // User authorization helpers
  isAdmin(user: User): boolean {
    return user.role === 'admin';
  }

  isTechnician(user: User): boolean {
    return user.role === 'technician' || user.role === 'admin';
  }

  canAccessTicket(user: User, assignedTo?: string): boolean {
    if (this.isAdmin(user)) return true;
    if (!assignedTo) return true;
    return assignedTo === user.firstName + ' ' + user.lastName;
  }

  canModifyUser(currentUser: User, targetUserId: string): boolean {
    if (this.isAdmin(currentUser)) return true;
    return currentUser.id === targetUserId;
  }
}

export const authService = new AuthService(process.env.JWT_SECRET);