/**
 * Simple test script to verify database functionality
 * This script:
 * 1. Creates the database and table
 * 2. Reads a transcript file
 * 3. Inserts it into the database
 * 4. Queries it back to verify
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database setup
const DB_DIR = path.resolve(__dirname, '../database');
const DB_PATH = path.join(DB_DIR, 'call_center.db');

// Create database directory if it doesn't exist
console.log('Checking database directory...');
if (!fs.existsSync(DB_DIR)) {
  console.log(`Creating database directory: ${DB_DIR}`);
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Connect to database
console.log(`Connecting to database: ${DB_PATH}`);
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database');
});

// Create table if it doesn't exist
console.log('Creating call_transcripts table if it doesn\'t exist...');
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
    console.error('Error creating table:', err.message);
    process.exit(1);
  }
  console.log('Table created or already exists');
  
  // Read a sample transcript file
  const sampleFilePath = path.resolve(__dirname, '../call_center_transcripts/transcript_001.json');
  console.log(`Reading sample transcript file: ${sampleFilePath}`);
  
  if (!fs.existsSync(sampleFilePath)) {
    console.error('Sample transcript file not found!');
    process.exit(1);
  }
  
  const fileContent = fs.readFileSync(sampleFilePath, 'utf8');
  const transcript = JSON.parse(fileContent);
  console.log('Transcript parsed successfully');
  
  // Insert the transcript into the database
  console.log('Inserting transcript into database...');
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
      console.error('Error inserting transcript:', err.message);
      process.exit(1);
    }
    
    const insertedId = this.lastID;
    console.log(`Transcript inserted successfully with ID: ${insertedId}`);
    
    // Query the inserted data to verify
    console.log('Querying the inserted transcript...');
    db.get('SELECT * FROM call_transcripts WHERE id = ?', [insertedId], (err, row) => {
      if (err) {
        console.error('Error querying transcript:', err.message);
        process.exit(1);
      }
      
      console.log('Transcript retrieved successfully:');
      console.log('ID:', row.id);
      console.log('Customer:', row.customer_name);
      console.log('Agent:', row.support_agent_name);
      console.log('Category:', row.category_of_call);
      console.log('Satisfaction:', row.overall_satisfaction_score);
      console.log('Created at:', row.created_at);
      
      // Close the database connection
      db.close((err) => {
        if (err) {
          console.error('Error closing database connection:', err.message);
          process.exit(1);
        }
        console.log('Database connection closed');
        console.log('Test completed successfully!');
      });
    });
  });
});
