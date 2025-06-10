#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = 'backups';
  const backupFile = `${backupDir}/backup-${timestamp}.sql`;
  
  try {
    // Create backups directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });
    
    // Create database backup
    const command = `pg_dump ${process.env.DATABASE_URL} > ${backupFile}`;
    await execAsync(command);
    
    console.log(`✅ Database backup created: ${backupFile}`);
    
    // Keep only last 7 backups
    const files = await fs.readdir(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .sort()
      .reverse();
    
    if (backupFiles.length > 7) {
      for (const file of backupFiles.slice(7)) {
        await fs.unlink(path.join(backupDir, file));
        console.log(`🗑️  Removed old backup: ${file}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

backupDatabase();