#!/usr/bin/env node
/**
 * Script to import call transcripts from JSON files into the database
 * 
 * Usage:
 *   npm run import-transcripts
 *   
 * Options:
 *   --dir=<path>    Specify a custom directory path (default: '../call_center_transcripts')
 *   --verbose       Show detailed output for each file
 */

import path from 'path';
import fs from 'fs';
import { initializeDatabase } from '../src/database/database';
import callTranscriptService from '../src/services/CallTranscriptService';

// Default directory path (relative to the script location)
const DEFAULT_TRANSCRIPTS_DIR = path.join(__dirname, '../../call_center_transcripts');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dir: DEFAULT_TRANSCRIPTS_DIR,
  verbose: false
};

// Process command line arguments
args.forEach(arg => {
  if (arg.startsWith('--dir=')) {
    options.dir = arg.substring(6);
  } else if (arg === '--verbose') {
    options.verbose = true;
  }
});

// Resolve the directory path (handle both absolute and relative paths)
const directoryPath = path.resolve(options.dir);

/**
 * Main function to import transcripts
 */
async function importTranscripts() {
  console.log('Call Zen Panel - Transcript Import Tool');
  console.log('=======================================');
  console.log(`Importing transcripts from: ${directoryPath}`);
  
  try {
    // Check if directory exists
    if (!fs.existsSync(directoryPath)) {
      console.error(`Error: Directory not found: ${directoryPath}`);
      process.exit(1);
    }
    
    // Initialize the database
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    // Get all JSON files in the directory
    const files = fs.readdirSync(directoryPath)
      .filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      console.warn(`No JSON files found in directory: ${directoryPath}`);
      process.exit(0);
    }
    
    console.log(`Found ${files.length} transcript files to process`);
    
    // Process statistics
    let successCount = 0;
    let errorCount = 0;
    const errors: { file: string, error: string }[] = [];
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(directoryPath, file);
      
      try {
        // Show progress
        process.stdout.write(`Processing file ${i + 1}/${files.length}: ${file}... `);
        
        // Parse and validate the transcript file
        const transcriptData = await callTranscriptService.parseTranscriptFile(filePath);
        
        // Create the transcript in the database
        const transcript = await callTranscriptService.createCallTranscript(transcriptData);
        
        // Update success count and show result
        successCount++;
        
        if (options.verbose) {
          console.log(`SUCCESS - Created transcript with ID: ${transcript.id}`);
          console.log(`  Customer: ${transcript.customer_name}`);
          console.log(`  Agent: ${transcript.support_agent_name}`);
          console.log(`  Category: ${transcript.category_of_call}`);
          console.log(`  Date: ${transcript.call_date_time}`);
          console.log('');
        } else {
          console.log('SUCCESS');
        }
      } catch (error: any) {
        // Update error count and record error
        errorCount++;
        errors.push({ file, error: error.message });
        
        // Show error
        console.log('ERROR');
        if (options.verbose) {
          console.error(`  Error details: ${error.message}`);
        }
      }
    }
    
    // Show summary
    console.log('\nImport Summary');
    console.log('==============');
    console.log(`Total files processed: ${files.length}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Failed to import: ${errorCount}`);
    
    // Show error details if any
    if (errorCount > 0) {
      console.log('\nError Details');
      console.log('============');
      
      errors.forEach((error, index) => {
        console.log(`${index + 1}. File: ${error.file}`);
        console.log(`   Error: ${error.error}`);
      });
      
      // Exit with error code if any files failed
      process.exit(1);
    }
    
    console.log('\nImport completed successfully!');
  } catch (error: any) {
    console.error('Fatal error during import process:', error.message);
    process.exit(1);
  }
}

// Run the import process
importTranscripts().catch(error => {
  console.error('Unhandled error during import:', error);
  process.exit(1);
});
