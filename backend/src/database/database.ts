import sqlite3 from 'sqlite3';
import { Database, RunResult } from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure database directory exists
const DB_DIR = path.resolve(__dirname, '../../../database');
const DB_PATH = path.join(DB_DIR, 'call_center.db');

// Create database directory if it doesn't exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Enable verbose mode for debugging during development
sqlite3.verbose();

/**
 * Get a database connection
 * @returns A Promise that resolves to a database connection
 */
export const getDbConnection = (): Promise<Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message);
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
};

/**
 * Initialize the database by creating the necessary tables
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    const db = await getDbConnection();
    
    // Create call_transcripts table
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS call_transcripts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT NOT NULL,
          customer_unique_id TEXT NOT NULL,
          support_agent_name TEXT NOT NULL,
          support_agent_id TEXT NOT NULL,
          call_transcript TEXT NOT NULL,
          overall_satisfaction_score INTEGER NOT NULL,
          category_of_call TEXT NOT NULL,
          call_duration INTEGER NOT NULL,
          call_date_time TEXT NOT NULL,
          call_resolution_status TEXT NOT NULL,
          escalation_level TEXT NOT NULL,
          follow_up_required TEXT NOT NULL,
          customer_tier TEXT NOT NULL,
          issue_severity TEXT NOT NULL,
          agent_experience_level TEXT NOT NULL,
          customer_previous_contact_count INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err: Error | null) => {
        if (err) {
          console.error('Error creating call_transcripts table:', err.message);
          reject(err);
        } else {
          console.log('call_transcripts table created or already exists');
          resolve();
        }
      });
    });

    // Create indexes for frequently queried fields
    await createIndex(db, 'call_transcripts', 'customer_unique_id');
    await createIndex(db, 'call_transcripts', 'support_agent_id');
    await createIndex(db, 'call_transcripts', 'call_date_time');
    await createIndex(db, 'call_transcripts', 'category_of_call');

    // ------------------------------------------------------------------
    // Prevent duplicate transcripts
    // ------------------------------------------------------------------
    // We consider a transcript duplicate if the same customer, agent and
    // call date‐time combination already exists.  A composite UNIQUE
    // index guarantees this at the database layer. If the project was
    // run before this constraint existed, the statement below will still
    // succeed thanks to `IF NOT EXISTS`.
    //
    //  customer_unique_id + call_date_time + support_agent_id  -> UNIQUE
    //
    await new Promise<void>((resolve, reject) => {
      db.run(
        `CREATE UNIQUE INDEX IF NOT EXISTS ux_call_transcripts_unique_call
         ON call_transcripts (customer_unique_id, call_date_time, support_agent_id)`,
        (err: Error | null) => {
          if (err) {
            console.error('Error creating unique index (duplicate prevention):', err.message);
            reject(err);
          } else {
            console.log('Unique index created (duplicate prevention in place)');
            resolve();
          }
        }
      );
    });
    
    // Close the database connection
    await closeDbConnection(db);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Helper function to create an index on a table
 * @param db Database connection
 * @param table Table name
 * @param column Column to index
 */
const createIndex = async (db: Database, table: string, column: string): Promise<void> => {
  const indexName = `idx_${table}_${column}`;
  return new Promise<void>((resolve, reject) => {
    db.run(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${column})`, (err: Error | null) => {
      if (err) {
        console.error(`Error creating index ${indexName}:`, err.message);
        reject(err);
      } else {
        console.log(`Index ${indexName} created or already exists`);
        resolve();
      }
    });
  });
};

/**
 * Execute a SQL query with parameters
 * @param sql SQL query
 * @param params Query parameters
 * @returns A Promise that resolves to the query result
 */
export const executeQuery = async <T>(
  sql: string, 
  params: any[] = []
): Promise<T[]> => {
  const db = await getDbConnection();
  
  return new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: T[]) => {
      closeDbConnection(db)
        .catch(closeErr => console.error('Error closing database connection:', closeErr));
      
      if (err) {
        console.error('Error executing query:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Execute a SQL statement that modifies data (INSERT, UPDATE, DELETE)
 * @param sql SQL statement
 * @param params Statement parameters
 * @returns A Promise that resolves to the statement result
 */
export const executeStatement = async (
  sql: string, 
  params: any[] = []
): Promise<RunResult> => {
  const db = await getDbConnection();
  
  return new Promise<RunResult>((resolve, reject) => {
    db.run(sql, params, function(this: RunResult, err: Error | null) {
      closeDbConnection(db)
        .catch(closeErr => console.error('Error closing database connection:', closeErr));
      
      if (err) {
        console.error('Error executing statement:', err.message);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

/**
 * Close a database connection
 * @param db Database connection to close
 */
export const closeDbConnection = async (db: Database): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    db.close((err: Error | null) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Export additional utility functions for database operations
export default {
  getDbConnection,
  initializeDatabase,
  executeQuery,
  executeStatement,
  closeDbConnection
};
