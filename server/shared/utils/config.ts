export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
    maxConnections: number;
    idleTimeout: number;
  };
  auth: {
    sessionSecret: string;
    jwtSecret?: string;
    tokenExpiry: string;
  };
  uploads: {
    maxFileSize: number;
    allowedTypes: string[];
    storageDirectory: string;
  };
  api: {
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
    corsOrigins: string[];
  };
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
      url: process.env.DATABASE_URL || '',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    },
    auth: {
      sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
      jwtSecret: process.env.JWT_SECRET,
      tokenExpiry: process.env.TOKEN_EXPIRY || '24h',
    },
    uploads: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
      allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
      storageDirectory: process.env.UPLOAD_DIR || 'uploads',
    },
    api: {
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
      },
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5000').split(','),
    },
  };
}

export function validateConfig(config: AppConfig): string[] {
  const errors: string[] = [];

  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (config.nodeEnv === 'production' && config.auth.sessionSecret === 'dev-secret-change-in-production') {
    errors.push('SESSION_SECRET must be set in production');
  }

  if (config.uploads.maxFileSize > 50 * 1024 * 1024) {
    errors.push('MAX_FILE_SIZE should not exceed 50MB');
  }

  return errors;
}