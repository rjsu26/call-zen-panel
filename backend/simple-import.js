/**
 * Simple script to import all call transcripts from JSON files into the database
 * Uses synchronous operations for simplicity
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database setup
const DB_DIR = path.resolve(__dirname, '../database');
const DB_PATH = path.join(DB_DIR, 'call_center.db');

// Transcript directory
const TRANSCRIPTS_DIR = path.resolve(__dirname, '../call_center_transcripts');

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
  
  // Get all JSON files in the transcript directory
  console.log(`Reading transcript files from: ${TRANSCRIPTS_DIR}`);
  try {
    if (!fs.existsSync(TRANSCRIPTS_DIR)) {
      console.error(`Transcript directory not found: ${TRANSCRIPTS_DIR}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(file => file.endsWith('.json'));
    console.log(`Found ${files.length} transcript files`);
    
    // Statistics
    let successCount = 0;
    let errorCount = 0;
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(TRANSCRIPTS_DIR, file);
      
      console.log(`Processing file ${i+1}/${files.length}: ${file}`);
      
      try {
        // Read and parse the transcript file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const transcript = JSON.parse(fileContent);
        
        // Insert the transcript into the database
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
        
        // Use a synchronous-style approach with callbacks
        db.run(insertSql, params, function(err) {
          if (err) {
            console.error(`  Error inserting transcript: ${err.message}`);
            errorCount++;
          } else {
            console.log(`  Success! Inserted with ID: ${this.lastID}`);
            successCount++;
          }
          
          // Check if this is the last file
          if (i === files.length - 1) {
            // Print summary
            console.log('\nImport Summary:');
            console.log(`Total files processed: ${files.length}`);
            console.log(`Successfully imported: ${successCount}`);
            console.log(`Failed to import: ${errorCount}`);
            
            // Close the database connection
            db.close((err) => {
              if (err) {
                console.error('Error closing database connection:', err.message);
              } else {
                console.log('Database connection closed');
                console.log('Import completed!');
              }
            });
          }
        });
      } catch (error) {
        console.error(`  Error processing file: ${error.message}`);
        errorCount++;
        
        // Check if this is the last file
        if (i === files.length - 1) {
          // Print summary
          console.log('\nImport Summary:');
          console.log(`Total files processed: ${files.length}`);
          console.log(`Successfully imported: ${successCount}`);
          console.log(`Failed to import: ${errorCount}`);
          
          // Close the database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database connection:', err.message);
            } else {
              console.log('Database connection closed');
              console.log('Import completed!');
            }
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading transcript directory: ${error.message}`);
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
      } else {
        console.log('Database connection closed');
      }
      process.exit(1);
    });
  }
});
