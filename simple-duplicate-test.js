#!/usr/bin/env node
/**
 * Simple Duplicate Prevention Test for Call Zen Panel
 * 
 * This script:
 * 1. Selects an existing transcript file
 * 2. Attempts to import it again
 * 3. Verifies it gets rejected due to duplicate prevention
 * 4. Shows clear pass/fail results
 * 
 * Usage:
 *   node simple-duplicate-test.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

// Configuration
const TRANSCRIPTS_DIR = path.resolve(__dirname, '../call_center_transcripts');
const DB_PATH = path.resolve(__dirname, '../database/call_center.db');
const TEMP_DIR = path.resolve(__dirname, 'temp_test');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// Helper function to print colored messages
function print(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Main test function
async function testDuplicatePrevention() {
  console.clear();
  print('Call Zen Panel - Simple Duplicate Prevention Test', 'bright');
  print('==============================================\n');
  
  try {
    // Step 1: Check if transcripts directory exists
    if (!fs.existsSync(TRANSCRIPTS_DIR)) {
      print('❌ Transcripts directory not found!', 'red');
      print(`Expected at: ${TRANSCRIPTS_DIR}`, 'yellow');
      return false;
    }
    
    // Step 2: Get a list of transcript files
    const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      print('❌ No transcript files found!', 'red');
      return false;
    }
    
    print(`Found ${files.length} transcript files`, 'cyan');
    
    // Step 3: Select the first transcript file
    const testFile = files[0];
    const testFilePath = path.join(TRANSCRIPTS_DIR, testFile);
    
    print(`Selected test file: ${testFile}`, 'cyan');
    
    // Step 4: Create temporary directory for test
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
    
    // Step 5: Copy the test file to the temp directory
    const tempFilePath = path.join(TEMP_DIR, testFile);
    fs.copyFileSync(testFilePath, tempFilePath);
    
    print(`Copied test file to: ${tempFilePath}`, 'cyan');
    
    // Step 6: Get current count of records in database
    const initialCount = await getRecordCount();
    print(`Initial record count in database: ${initialCount}`, 'cyan');
    
    // Step 7: Run the import script on the original file
    print('\nAttempting first import (should succeed)...', 'bright');
    try {
      const firstImportOutput = execSync(`node simple-import.js --dir=${TRANSCRIPTS_DIR} --file=${testFile}`, {
        cwd: __dirname,
        encoding: 'utf8'
      });
      
      print(firstImportOutput, 'reset');
    } catch (error) {
      print(`❌ First import failed: ${error.message}`, 'red');
      return false;
    }
    
    // Step 8: Get updated count
    const midCount = await getRecordCount();
    const firstImportSucceeded = midCount > initialCount;
    
    if (firstImportSucceeded) {
      print('✅ First import succeeded as expected', 'green');
    } else {
      print('❌ First import did not add any records', 'red');
      return false;
    }
    
    // Step 9: Try to import the same file again
    print('\nAttempting second import (should be rejected)...', 'bright');
    try {
      const secondImportOutput = execSync(`node simple-import.js --dir=${TRANSCRIPTS_DIR} --file=${testFile}`, {
        cwd: __dirname,
        encoding: 'utf8'
      });
      
      print(secondImportOutput, 'reset');
    } catch (error) {
      // Even if it throws an error, that might be expected
      print(`Note: Import script returned error: ${error.message}`, 'yellow');
    }
    
    // Step 10: Check if any new records were added
    const finalCount = await getRecordCount();
    const duplicatePrevented = finalCount === midCount;
    
    if (duplicatePrevented) {
      print('\n✅ PASS: Duplicate prevention is working!', 'green');
      print('No new records were added on second import attempt', 'green');
      return true;
    } else {
      print('\n❌ FAIL: Duplicate prevention is NOT working!', 'red');
      print(`Records increased from ${midCount} to ${finalCount}`, 'red');
      return false;
    }
  } catch (error) {
    print(`❌ Error during test: ${error.message}`, 'red');
    return false;
  } finally {
    // Clean up temp directory
    if (fs.existsSync(TEMP_DIR)) {
      fs.readdirSync(TEMP_DIR).forEach(file => {
        fs.unlinkSync(path.join(TEMP_DIR, file));
      });
      fs.rmdirSync(TEMP_DIR);
    }
  }
}

// Helper function to get the current record count in the database
function getRecordCount() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      db.get('SELECT COUNT(*) as count FROM call_transcripts', (err, row) => {
        db.close();
        
        if (err) {
          reject(err);
          return;
        }
        
        resolve(row.count);
      });
    });
  });
}

// Run the test
testDuplicatePrevention()
  .then(passed => {
    if (passed) {
      print('\n✨ Duplicate prevention test completed successfully!', 'bright');
    } else {
      print('\n⚠️ Duplicate prevention test failed!', 'bright');
      print('Please check the database configuration and unique constraints.', 'yellow');
    }
  })
  .catch(error => {
    print(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
