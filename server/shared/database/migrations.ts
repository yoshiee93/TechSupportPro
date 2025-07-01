import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool } from '@neondatabase/serverless';
import fs from 'fs/promises';
import path from 'path';

export class MigrationManager {
  private db: any;
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool });
  }

  async runMigrations() {
    try {
      // console.log('🔄 Running database migrations...');
      await migrate(this.db, { migrationsFolder: './migrations' });
      // console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async rollback(steps = 1) {
    // console.log(`🔄 Rolling back ${steps} migration(s)...`);
    // Implementation for rollback
    // This would require custom rollback scripts
    // console.log('⚠️  Manual rollback required - check backup files');
  }

  async getMigrationStatus() {
    try {
      // Query migration status from drizzle's internal table
      const result = await this.db.execute(
        "SELECT * FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 10"
      );
      return result.rows;
    } catch (error) {
      // console.log('No migration history found');
      return [];
    }
  }

  async validateSchema() {
    // console.log('🔄 Validating database schema...');
    // Add schema validation logic
    // console.log('✅ Schema validation completed');
  }

  async close() {
    await this.pool.end();
  }
}

export async function createMigration(name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
  const filepath = path.join('migrations', filename);
  
  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Remember to include both UP and DOWN sections

-- UP
-- Add tables, columns, indexes, etc.

-- DOWN (for rollbacks)
-- Drop tables, columns, indexes, etc.
`;

  await fs.writeFile(filepath, template);
  // console.log(`✅ Created migration file: ${filepath}`);
  
  return filepath;
}