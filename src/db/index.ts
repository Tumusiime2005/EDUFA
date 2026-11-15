import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

declare global {
  var _postgresPool: Pool | undefined;
  var _dbInitialized: boolean | undefined;
  var _dbInitPromise: Promise<void> | undefined;
}

export const isDatabaseConfigured = (): boolean => {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      (process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER)
  );
};

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (connectionString) {
      const isLocal =
        connectionString.includes('localhost') ||
        connectionString.includes('127.0.0.1') ||
        connectionString.includes('sslmode=disable');

      global._postgresPool = new Pool({
        connectionString,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 8000,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 8000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'applicant',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  region TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  applicant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  financial_data_json TEXT NOT NULL,
  academic_data_json TEXT NOT NULL,
  alignment_data_json TEXT NOT NULL,
  funding_scope_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS score_records (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  need_score DOUBLE PRECISION NOT NULL,
  academic_score DOUBLE PRECISION NOT NULL,
  alignment_score DOUBLE PRECISION NOT NULL,
  sustainability_score DOUBLE PRECISION NOT NULL,
  composite_score DOUBLE PRECISION NOT NULL,
  explanation_json TEXT NOT NULL,
  calculated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  notes TEXT NOT NULL,
  decided_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_score_records_application_id ON score_records(application_id);
CREATE INDEX IF NOT EXISTS idx_score_records_composite_score ON score_records(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_application_id ON decisions(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
`;

/**
 * Ensures database schema exists and at least one initial administrator is seeded on a fresh DB.
 * Fast no-op when tables and users already exist.
 */
export async function ensureDatabaseReady(): Promise<void> {
  if (global._dbInitialized) return;

  if (!isDatabaseConfigured()) {
    throw new Error(
      'Database connection is not configured. Set DATABASE_URL (or POSTGRES_URL / SQL_HOST) in your environment variables.'
    );
  }

  if (!global._dbInitPromise) {
    global._dbInitPromise = (async () => {
      try {
        try {
          await pool.query('GRANT USAGE, CREATE ON SCHEMA public TO CURRENT_USER;');
        } catch (_) {
          // Ignore if user lacks grant privileges
        }
        try {
          await pool.query('SET search_path TO public;');
        } catch (_) {}

        await pool.query(SCHEMA_SQL);
        await seedInitialAdmin();
        global._dbInitialized = true;
      } catch (err: any) {
        console.error('Error in ensureDatabaseReady:', err);
        throw err;
      } finally {
        global._dbInitPromise = undefined;
      }
    })();
  }

  return global._dbInitPromise;
}

async function seedInitialAdmin() {
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'tumusiimeeltonmarvin@gmail.com').trim().toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@2026';
  const adminName = process.env.INITIAL_ADMIN_NAME || 'Tumusiime Elton Marvin';
  const uid = `admin_seed_${Date.now()}`;

  const existing = await pool.query('SELECT id FROM users WHERE lower(email) = lower($1)', [adminEmail]);
  if (existing.rows.length === 0) {
    const userRes = await pool.query(
      `INSERT INTO users (uid, email, password, role) VALUES ($1, $2, $3, 'admin') RETURNING id`,
      [uid, adminEmail, adminPassword]
    );
    const userId = userRes.rows[0]?.id;
    if (userId) {
      await pool.query(
        `INSERT INTO profiles (user_id, full_name, region) VALUES ($1, $2, $3)`,
        [userId, adminName, 'Central Region (Kampala)']
      );
    }
  } else {
    const userId = existing.rows[0].id;
    await pool.query(
      `UPDATE users SET password = $1, role = 'admin' WHERE id = $2`,
      [adminPassword, userId]
    );
  }
}
