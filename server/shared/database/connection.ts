import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';

export interface DatabaseConfig {
  primary: string;
  backup?: string;
  maxConnections?: number;
  idleTimeout?: number;
}

export class DatabaseManager {
  private primaryPool: Pool;
  private backupPool?: Pool;
  private primaryDb: any;
  private backupDb?: any;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.primaryPool = new Pool({ 
      connectionString: config.primary,
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeout || 30000
    });
    this.primaryDb = drizzle({ client: this.primaryPool, schema });

    if (config.backup) {
      this.backupPool = new Pool({ 
        connectionString: config.backup,
        max: config.maxConnections || 10
      });
      this.backupDb = drizzle({ client: this.backupPool, schema });
    }
  }

  getPrimaryDatabase() {
    return this.primaryDb;
  }

  getBackupDatabase() {
    if (!this.backupDb) {
      throw new Error('Backup database not configured');
    }
    return this.backupDb;
  }

  async testConnection() {
    try {
      await this.primaryPool.query('SELECT 1');
      // console.log('✅ Primary database connection successful');
      
      if (this.backupPool) {
        await this.backupPool.query('SELECT 1');
        // console.log('✅ Backup database connection successful');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  async switchToBackup() {
    if (!this.backupDb) {
      throw new Error('Backup database not available');
    }
    
    // console.log('⚠️  Switching to backup database');
    // In a real implementation, you'd update your storage layer
    // to use the backup database
    return this.backupDb;
  }

  async getConnectionStats() {
    return {
      primary: {
        totalConnections: this.primaryPool.totalCount,
        idleConnections: this.primaryPool.idleCount,
        waitingCount: this.primaryPool.waitingCount
      },
      backup: this.backupPool ? {
        totalConnections: this.backupPool.totalCount,
        idleConnections: this.backupPool.idleCount,
        waitingCount: this.backupPool.waitingCount
      } : null
    };
  }

  async close() {
    await this.primaryPool.end();
    if (this.backupPool) {
      await this.backupPool.end();
    }
  }
}

// Environment-based configuration
export function createDatabaseConfig(): DatabaseConfig {
  const config: DatabaseConfig = {
    primary: process.env.DATABASE_URL!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000')
  };

  if (process.env.BACKUP_DATABASE_URL) {
    config.backup = process.env.BACKUP_DATABASE_URL;
  }

  return config;
}