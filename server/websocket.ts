import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { requireAuth } from "./auth";
import jwt from "jsonwebtoken";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: any) {
    console.log('WebSocket connection attempt');
    
    try {
      // Extract token from query string or headers
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('WebSocket: No token provided');
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      ws.userId = decoded.id || decoded.userId;
      ws.username = decoded.username || decoded.name;

      console.log(`WebSocket authenticated: ${ws.username || 'Unknown'} (${ws.userId || 'Unknown'})`);

      // Add to clients map
      if (ws.userId) {
        if (!this.clients.has(ws.userId)) {
          this.clients.set(ws.userId, []);
        }
        this.clients.get(ws.userId)!.push(ws);

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'WebSocket connected successfully',
          userId: ws.userId
        }));
      } else {
        ws.close(1008, 'Invalid user ID');
        return;
      }

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.removeClient(ws);
        console.log(`WebSocket disconnected: ${ws.username}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Invalid token');
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: any) {
    console.log('WebSocket message:', message);

    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      
      case 'subscribe':
        // Subscribe to specific ticket updates
        if (message.ticketId) {
          ws.send(JSON.stringify({
            type: 'subscribed',
            ticketId: message.ticketId
          }));
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private removeClient(ws: AuthenticatedWebSocket) {
    if (ws.userId && this.clients.has(ws.userId)) {
      const userClients = this.clients.get(ws.userId)!;
      const index = userClients.indexOf(ws);
      if (index > -1) {
        userClients.splice(index, 1);
      }
      if (userClients.length === 0) {
        this.clients.delete(ws.userId);
      }
    }
  }

  // Broadcast to all connected clients
  broadcast(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach((userClients) => {
      userClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    });
  }

  // Send to specific user
  sendToUser(userId: string, message: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const data = JSON.stringify(message);
      userClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    }
  }

  // Send to all users except sender
  broadcastExcept(excludeUserId: string, message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach((userClients, userId) => {
      if (userId !== excludeUserId) {
        userClients.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });
      }
    });
  }

  // Notify about ticket updates
  notifyTicketUpdate(ticketId: number, updateType: string, data: any, excludeUserId?: string) {
    const message = {
      type: 'ticket_update',
      ticketId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    };

    if (excludeUserId) {
      this.broadcastExcept(excludeUserId, message);
    } else {
      this.broadcast(message);
    }
  }

  // Notify about timer updates
  notifyTimerUpdate(ticketId: number, timeLogData: any, excludeUserId?: string) {
    const message = {
      type: 'timer_update',
      ticketId,
      data: timeLogData,
      timestamp: new Date().toISOString()
    };

    if (excludeUserId) {
      this.broadcastExcept(excludeUserId, message);
    } else {
      this.broadcast(message);
    }
  }

  // Get connected users count
  getConnectedCount(): number {
    let count = 0;
    this.clients.forEach((userClients) => {
      count += userClients.length;
    });
    return count;
  }
}

let wsManager: WebSocketManager | null = null;

export function setupWebSocket(server: HttpServer): WebSocketManager {
  wsManager = new WebSocketManager(server);
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}