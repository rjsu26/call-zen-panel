#!/usr/bin/env node
/**
 * Script to import all call transcripts from JSON files into the database
 * 
 * Usage:
 *   node import-all.js
 *   
 * Options:
 *   --dir=<path>    Specify a custom directory path (default: '../call_center_transcripts')
 *   --verbose       Show detailed output for each file
 *   --force         Force import even if duplicates exist
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dir: path.resolve(__dirname, '../call_center_transcripts'),
  verbose: false,
  force: false
};

// Process command line arguments
args.forEach(arg => {
  if (arg.startsWith('--dir=')) {
    options.dir = path.resolve(arg.substring(6));
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--force') {
    options.force = true;
  }
});

// Database setup
const DB_DIR = path.resolve(__dirname, '../database');
const DB_PATH = path.join(DB_DIR, 'call_center.db');

// Statistics tracking
const stats = {
  total: 0,
  success: 0,
  skipped: 0,
  failed: 0,
  errors: []
};

/**
 * Main function to import all transcripts
 */
async function importAllTranscripts() {
  console.log('Call Zen Panel - Transcript Import Tool');
  console.log('=======================================');
  console.log(`Importing transcripts from: ${options.dir}`);
  
  try {
    // Create database directory if it doesn't exist
    if (!fs.existsSync(DB_DIR)) {
      console.log(`Creating database directory: ${DB_DIR}`);
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    // Check if directory exists
    if (!fs.existsSync(options.dir)) {
      console.error(`Error: Directory not found: ${options.dir}`);
      process.exit(1);
    }
    
    // Get all JSON files in the directory
    const files = fs.readdirSync(options.dir)
      .filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      console.warn(`No JSON files found in directory: ${options.dir}`);
      process.exit(0);
    }
    
    stats.total = files.length;
    console.log(`Found ${files.length} transcript files to process`);
    
    // Connect to database
    const db = await connectToDatabase();
    
    // Create table if it doesn't exist
    await createTable(db);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(options.dir, file);
      
      // Show progress
      process.stdout.write(`Processing file ${i + 1}/${files.length}: ${file}... `);
      
      try {
        // Read and parse the transcript file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const transcript = JSON.parse(fileContent);
        
        // Check if transcript already exists in the database
        const exists = await checkTranscriptExists(db, transcript);
        
        if (exists && !options.force) {
          console.log('SKIPPED (already exists)');
          stats.skipped++;
          continue;
        }
        
        // Insert the transcript into the database
        const id = await insertTranscript(db, transcript);
        
        stats.success++;
        if (options.verbose) {
          console.log(`SUCCESS - Created transcript with ID: ${id}`);
          console.log(`  Customer: ${transcript.customer_name}`);
          console.log(`  Agent: ${transcript.support_agent_name}`);
          console.log(`  Category: ${transcript.category_of_call}`);
          console.log(`  Date: ${transcript.call_date_time}`);
          console.log('');
        } else {
          console.log('SUCCESS');
        }
      } catch (error) {
        console.log('ERROR');
        if (options.verbose) {
          console.error(`  Error details: ${error.message}`);
        }
        
        stats.failed++;
        stats.errors.push({
          file,
          error: error.message
        });
      }
    }
    
    // Close database connection
    await closeDatabase(db);
    
    // Show summary
    console.log('\nImport Summary');
    console.log('==============');
    console.log(`Total files processed: ${stats.total}`);
    console.log(`Successfully imported: ${stats.success}`);
    console.log(`Skipped (already exist): ${stats.skipped}`);
    console.log(`Failed to import: ${stats.failed}`);
    
    // Show error details if any
    if (stats.failed > 0) {
      console.log('\nError Details');
      console.log('============');
      
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. File: ${error.file}`);
        console.log(`   Error: ${error.error}`);
      });
    }
    
    console.log('\nImport completed!');
    
    // Exit with error code if any files failed
    if (stats.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during import process:', error.message);
    process.exit(1);
  }
}

/**
 * Connect to the SQLite database
 * @returns {Promise<sqlite3.Database>} Database connection
 */
function connectToDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(new Error(`Error connecting to database: ${err.message}`));
      } else {
        resolve(db);
      }
    });
  });
}

/**
 * Create the call_transcripts table if it doesn't exist
 * @param {sqlite3.Database} db Database connection
 * @returns {Promise<void>}
 */
function createTable(db) {
  return new Promise((resolve, reject) => {
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
    `, (err) => {
      if (err) {
        reject(new Error(`Error creating table: ${err.message}`));
      } else {
        // Create indexes for frequently queried fields
        db.run(`CREATE INDEX IF NOT EXISTS idx_customer_unique_id ON call_transcripts(customer_unique_id)`, (err) => {
          if (err) {
            reject(new Error(`Error creating index: ${err.message}`));
          } else {
            db.run(`CREATE INDEX IF NOT EXISTS idx_call_date_time ON call_transcripts(call_date_time)`, (err) => {
              if (err) {
                reject(new Error(`Error creating index: ${err.message}`));
              } else {
                resolve();
              }
            });
          }
        });
      }
    });
  });
}

/**
 * Check if a transcript already exists in the database
 * @param {sqlite3.Database} db Database connection
 * @param {Object} transcript Transcript data
 * @returns {Promise<boolean>} True if transcript exists, false otherwise
 */
function checkTranscriptExists(db, transcript) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) as count 
      FROM call_transcripts 
      WHERE customer_unique_id = ? AND call_date_time = ?
    `;
    
    db.get(sql, [transcript.customer_unique_id, transcript.call_date_time], (err, row) => {
      if (err) {
        reject(new Error(`Error checking for duplicate: ${err.message}`));
      } else {
        resolve(row.count > 0);
      }
    });
  });
}

/**
 * Insert a transcript into the database
 * @param {sqlite3.Database} db Database connection
 * @param {Object} transcript Transcript data
 * @returns {Promise<number>} ID of the inserted transcript
 */
function insertTranscript(db, transcript) {
  return new Promise((resolve, reject) => {
    // Validate required fields
    const requiredFields = [
      'customer_name',
      'customer_unique_id',
      'support_agent_name',
      'support_agent_id',
      'call_transcript',
      'overall_satisfaction_score',
      'category_of_call',
      'call_duration',
      'call_date_time',
      'call_resolution_status',
      'escalation_level',
      'follow_up_required',
      'customer_tier',
      'issue_severity',
      'agent_experience_level',
      'customer_previous_contact_count'
    ];
    
    const missingFields = requiredFields.filter(field => !transcript[field]);
    
    if (missingFields.length > 0) {
      reject(new Error(`Missing required fields: ${missingFields.join(', ')}`));
      return;
    }
    
    const insertSql = `
      INSERT INTO call_transcripts (
        customer_name,
        customer_unique_id,
        support_agent_name,
        support_agent_id,
        call_transcript,
        overall_satisfaction_score,
        category_of_call,
        call_duration,
        call_date_time,
        call_resolution_status,
        escalation_level,
        follow_up_required,
        customer_tier,
        issue_severity,
        agent_experience_level,
        customer_previous_contact_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      transcript.customer_name,
      transcript.customer_unique_id,
      transcript.support_agent_name,
      transcript.support_agent_id,
      transcript.call_transcript,
      transcript.overall_satisfaction_score,
      transcript.category_of_call,
      transcript.call_duration,
      transcript.call_date_time,
      transcript.call_resolution_status,
      transcript.escalation_level,
      transcript.follow_up_required,
      transcript.customer_tier,
      transcript.issue_severity,
      transcript.agent_experience_level,
      transcript.customer_previous_contact_count
    ];
    
    db.run(insertSql, params, function(err) {
      if (err) {
        reject(new Error(`Error inserting transcript: ${err.message}`));
      } else {
        resolve(this.lastID);
      }
    });
  });
}

/**
 * Close the database connection
 * @param {sqlite3.Database} db Database connection
 * @returns {Promise<void>}
 */
function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(new Error(`Error closing database connection: ${err.message}`));
      } else {
        resolve();
      }
    });
  });
}

// Run the import process
importAllTranscripts().catch(error => {
  console.error('Unhandled error during import:', error);
  process.exit(1);
});
