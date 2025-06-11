#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `techfix_backup_${timestamp}.sql`);
    
    console.log(`Creating backup: ${backupFile}`);
    
    // Create database backup using pg_dump
    const command = `pg_dump "${DATABASE_URL}" > "${backupFile}"`;
    execSync(command, { stdio: 'inherit' });
    
    // Compress the backup
    const compressedFile = `${backupFile}.gz`;
    execSync(`gzip "${backupFile}"`, { stdio: 'inherit' });
    
    console.log(`Backup created successfully: ${compressedFile}`);
    
    // Clean up old backups
    await cleanupOldBackups();
    
    return compressedFile;
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  }
}

async function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith('techfix_backup_') && file.endsWith('.sql.gz'));
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    
    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    console.error('Cleanup failed:', error.message);
  }
}

async function restoreBackup(backupFile) {
  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    console.log(`Restoring backup: ${backupFile}`);
    
    // If compressed, decompress first
    let sqlFile = backupFile;
    if (backupFile.endsWith('.gz')) {
      sqlFile = backupFile.replace('.gz', '');
      execSync(`gunzip -c "${backupFile}" > "${sqlFile}"`, { stdio: 'inherit' });
    }
    
    // Restore database using psql
    const command = `psql "${DATABASE_URL}" < "${sqlFile}"`;
    execSync(command, { stdio: 'inherit' });
    
    // Clean up temporary decompressed file
    if (backupFile.endsWith('.gz') && fs.existsSync(sqlFile)) {
      fs.unlinkSync(sqlFile);
    }
    
    console.log('Backup restored successfully');
  } catch (error) {
    console.error('Restore failed:', error.message);
    process.exit(1);
  }
}

async function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('techfix_backup_') && file.endsWith('.sql.gz'))
      .sort()
      .reverse();
    
    if (backupFiles.length === 0) {
      console.log('No backups found');
      return;
    }
    
    console.log('Available backups:');
    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  ${file} (${size} MB) - ${stats.mtime.toISOString()}`);
    }
  } catch (error) {
    console.error('List failed:', error.message);
  }
}

// CLI interface
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'create':
    createBackup();
    break;
  case 'restore':
    if (!arg) {
      console.error('Usage: node backup-db.js restore <backup-file>');
      process.exit(1);
    }
    restoreBackup(arg);
    break;
  case 'list':
    listBackups();
    break;
  default:
    console.log('Usage:');
    console.log('  node backup-db.js create           - Create a new backup');
    console.log('  node backup-db.js restore <file>   - Restore from backup');
    console.log('  node backup-db.js list             - List available backups');
    break;
}

export { createBackup, restoreBackup, listBackups, cleanupOldBackups };