import jwt from 'jsonwebtoken';
import type { User } from '@shared/schema';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class JWTManager {
  private secret: string;
  private expiresIn: string;

  constructor(secret: string, expiresIn = '24h') {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'techfix-pro',
      audience: 'techfix-users',
    });
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.secret, {
        issuer: 'techfix-pro',
        audience: 'techfix-users',
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  refreshToken(token: string): string {
    const decoded = this.verifyToken(token);
    
    // Create new token with fresh expiry
    const payload: JWTPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'techfix-pro',
      audience: 'techfix-users',
    });
  }

  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Middleware for JWT authentication
export function createJWTMiddleware(jwtManager: JWTManager) {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = jwtManager.verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      return res.status(401).json({ message });
    }
  };
}