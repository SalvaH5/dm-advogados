import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '../config/migrations/fase2b.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Migration Fase 2B executada com sucesso');
  await pool.end();
}
run().catch(console.error);
