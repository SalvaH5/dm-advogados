import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const sqlPath = path.join(__dirname, '../config/migrations/fase2a.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('✅ Migration Fase 2A executada com sucesso');
  await pool.end();
}

runMigration().catch(console.error);
