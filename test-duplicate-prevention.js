#!/usr/bin/env node
/**
 * Duplicate Prevention Test Script for Call Zen Panel
 * 
 * This script tests the database and API duplicate prevention mechanisms:
 * 1. Tests various duplicate scenarios (same customer+agent+datetime)
 * 2. Tests that new unique transcripts can still be added
 * 3. Tests the import scripts with duplicate prevention
 * 4. Verifies the API endpoints handle duplicates correctly
 * 5. Shows clear test results with pass/fail status
 * 
 * Usage:
 *   node test-duplicate-prevention.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

// Configuration
const DB_PATH = path.resolve(__dirname, '../database/call_center.db');
const API_BASE_URL = 'http://localhost:3001/api';
const TEMP_DIR = path.resolve(__dirname, 'temp_test_files');
const RESULTS = {
  passed: 0,
  failed: 0,
  tests: []
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m'
};

// Helper function to print colored messages
function print(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Helper function to print section headers
function printHeader(message) {
  console.log('\n' + colors.bright + colors.cyan + '==== ' + message + ' ====' + colors.reset);
}

// Helper function to record test results
function recordTest(name, passed, message = '') {
  if (passed) {
    RESULTS.passed++;
    print(`✓ PASS: ${name}`, 'green');
  } else {
    RESULTS.failed++;
    print(`✗ FAIL: ${name}`, 'red');
  }
  
  if (message) {
    print(`  ${message}`, 'dim');
  }
  
  RESULTS.tests.push({
    name,
    passed,
    message
  });
}

// Helper function to make an HTTP request
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${endpoint}`,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = responseData ? JSON.parse(responseData) : {};
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Helper function to create a test transcript
function createTestTranscript(uniqueId = Date.now().toString()) {
  return {
    customer_name: `Test Customer ${uniqueId}`,
    customer_unique_id: `TEST_${uniqueId}`,
    support_agent_name: `Test Agent ${uniqueId}`,
    support_agent_id: `AGT_TEST_${uniqueId}`,
    call_transcript: `This is a test transcript ${uniqueId}`,
    overall_satisfaction_score: 8,
    category_of_call: 'Test Category',
    call_duration: 10,
    call_date_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
    call_resolution_status: 'Resolved',
    escalation_level: 'None',
    follow_up_required: 'No',
    customer_tier: 'Basic',
    issue_severity: 'Low',
    agent_experience_level: 'Junior',
    customer_previous_contact_count: 0
  };
}

// Helper function to create a duplicate of an existing transcript
function createDuplicateTranscript(original, modifyFields = {}) {
  const duplicate = { ...original, ...modifyFields };
  return duplicate;
}

// Helper function to create a test transcript JSON file
function createTranscriptFile(transcript, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(transcript, null, 2));
  return filePath;
}

// Helper function to ensure temp directory exists
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

// Helper function to clean up temp directory
function cleanupTempDir() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.readdirSync(TEMP_DIR).forEach((file) => {
      fs.unlinkSync(path.join(TEMP_DIR, file));
    });
    fs.rmdirSync(TEMP_DIR);
  }
}

// Test 1: Direct database duplicate prevention
async function testDatabaseDuplicatePrevention() {
  printHeader('Test 1: Database-Level Duplicate Prevention');
  
  return new Promise((resolve) => {
    const db = new sqlite3.Database(DB_PATH);
    
    // Create a unique test transcript
    const uniqueTranscript = createTestTranscript('DB_TEST_1');
    
    // Insert the unique transcript
    const insertSql = `
      INSERT INTO call_transcripts (
        customer_name, customer_unique_id, support_agent_name, support_agent_id,
        call_transcript, overall_satisfaction_score, category_of_call, call_duration,
        call_date_time, call_resolution_status, escalation_level, follow_up_required,
        customer_tier, issue_severity, agent_experience_level, customer_previous_contact_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = Object.values(uniqueTranscript);
    
    // Step 1: Insert unique transcript
    db.run(insertSql, params, function(err) {
      if (err) {
        recordTest('DB: Insert unique transcript', false, `Error: ${err.message}`);
        db.close();
        resolve();
        return;
      }
      
      const insertedId = this.lastID;
      recordTest('DB: Insert unique transcript', true, `Inserted with ID: ${insertedId}`);
      
      // Step 2: Try to insert exact duplicate
      db.run(insertSql, params, function(err) {
        const duplicatePrevented = err && err.message.includes('UNIQUE constraint failed');
        recordTest('DB: Prevent exact duplicate', duplicatePrevented, 
          duplicatePrevented ? 'Correctly rejected duplicate' : 'Failed to prevent duplicate');
        
        // Step 3: Try to insert with only customer name changed (should still be rejected)
        const slightlyDifferentTranscript = createDuplicateTranscript(uniqueTranscript, {
          customer_name: 'Different Name But Same ID'
        });
        
        db.run(insertSql, Object.values(slightlyDifferentTranscript), function(err) {
          const duplicatePrevented = err && err.message.includes('UNIQUE constraint failed');
          recordTest('DB: Prevent duplicate with different name', duplicatePrevented,
            duplicatePrevented ? 'Correctly rejected duplicate with different name' : 'Failed to prevent duplicate');
          
          // Step 4: Insert with different datetime (should succeed)
          const differentDateTranscript = createDuplicateTranscript(uniqueTranscript, {
            call_date_time: '2025-01-01 12:00:00'
          });
          
          db.run(insertSql, Object.values(differentDateTranscript), function(err) {
            recordTest('DB: Allow same customer/agent with different datetime', !err,
              err ? `Error: ${err.message}` : 'Successfully inserted with different datetime');
            
            // Step 5: Insert with different agent (should succeed)
            const differentAgentTranscript = createDuplicateTranscript(uniqueTranscript, {
              support_agent_id: 'AGT_DIFFERENT'
            });
            
            db.run(insertSql, Object.values(differentAgentTranscript), function(err) {
              recordTest('DB: Allow same customer/datetime with different agent', !err,
                err ? `Error: ${err.message}` : 'Successfully inserted with different agent');
              
              // Clean up test data
              db.run('DELETE FROM call_transcripts WHERE customer_unique_id LIKE "TEST_DB_TEST_%"', function(err) {
                if (err) {
                  print(`Warning: Clean-up error: ${err.message}`, 'yellow');
                }
                
                db.close();
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

// Test 2: API endpoint duplicate prevention
async function testApiDuplicatePrevention() {
  printHeader('Test 2: API Endpoint Duplicate Prevention');
  
  try {
    // Create a unique test transcript
    const uniqueTranscript = createTestTranscript('API_TEST_1');
    
    // Step 1: Insert unique transcript via API
    let response = await makeRequest('POST', '/transcripts', uniqueTranscript);
    const firstInsertSuccess = response.statusCode === 201;
    recordTest('API: Insert unique transcript', firstInsertSuccess,
      firstInsertSuccess ? `Created with ID: ${response.data?.data?.id}` : `Failed with status: ${response.statusCode}`);
    
    if (!firstInsertSuccess) {
      return;
    }
    
    const insertedId = response.data?.data?.id;
    
    // Step 2: Try to insert exact duplicate
    response = await makeRequest('POST', '/transcripts', uniqueTranscript);
    const duplicatePrevented = response.statusCode === 500 && 
                              response.data?.message?.includes('Duplicate');
    recordTest('API: Prevent exact duplicate', duplicatePrevented,
      duplicatePrevented ? 'API correctly rejected duplicate' : `Unexpected response: ${JSON.stringify(response.data)}`);
    
    // Step 3: Try to insert with only customer name changed (should still be rejected)
    const slightlyDifferentTranscript = createDuplicateTranscript(uniqueTranscript, {
      customer_name: 'Different Name But Same ID'
    });
    
    response = await makeRequest('POST', '/transcripts', slightlyDifferentTranscript);
    const nameChangeDuplicatePrevented = response.statusCode === 500 && 
                                        response.data?.message?.includes('Duplicate');
    recordTest('API: Prevent duplicate with different name', nameChangeDuplicatePrevented,
      nameChangeDuplicatePrevented ? 'API correctly rejected duplicate with name change' : 
                                   `Unexpected response: ${JSON.stringify(response.data)}`);
    
    // Step 4: Insert with different datetime (should succeed)
    const differentDateTranscript = createDuplicateTranscript(uniqueTranscript, {
      call_date_time: '2025-02-01 12:00:00'
    });
    
    response = await makeRequest('POST', '/transcripts', differentDateTranscript);
    const differentDateSuccess = response.statusCode === 201;
    recordTest('API: Allow same customer/agent with different datetime', differentDateSuccess,
      differentDateSuccess ? `Created with ID: ${response.data?.data?.id}` : 
                          `Failed with status: ${response.statusCode}`);
    
    // Step 5: Insert with different agent (should succeed)
    const differentAgentTranscript = createDuplicateTranscript(uniqueTranscript, {
      support_agent_id: 'AGT_API_DIFF'
    });
    
    response = await makeRequest('POST', '/transcripts', differentAgentTranscript);
    const differentAgentSuccess = response.statusCode === 201;
    recordTest('API: Allow same customer/datetime with different agent', differentAgentSuccess,
      differentAgentSuccess ? `Created with ID: ${response.data?.data?.id}` : 
                          `Failed with status: ${response.statusCode}`);
    
    // Clean up test data via API
    if (insertedId) {
      await makeRequest('DELETE', `/transcripts/${insertedId}`);
    }
  } catch (error) {
    recordTest('API: Duplicate prevention tests', false, `Error: ${error.message}`);
  }
}

// Test 3: Import script duplicate prevention
async function testImportScriptDuplicatePrevention() {
  printHeader('Test 3: Import Script Duplicate Prevention');
  
  try {
    ensureTempDir();
    
    // Create a unique test transcript
    const uniqueTranscript = createTestTranscript('IMPORT_TEST_1');
    const filePath = path.join(TEMP_DIR, 'test_transcript_1.json');
    createTranscriptFile(uniqueTranscript, filePath);
    
    // Step 1: Import unique transcript
    try {
      const importOutput = execSync(`node simple-import.js --dir=${TEMP_DIR}`, { 
        cwd: __dirname,
        encoding: 'utf8'
      });
      
      const firstImportSuccess = importOutput.includes('Successfully imported');
      recordTest('Import: Unique transcript', firstImportSuccess,
        firstImportSuccess ? 'Successfully imported unique transcript' : 'Failed to import');
      
      // Step 2: Try to import the same file again (should be skipped or rejected)
      const secondImportOutput = execSync(`node simple-import.js --dir=${TEMP_DIR}`, { 
        cwd: __dirname,
        encoding: 'utf8'
      });
      
      const duplicatePrevented = secondImportOutput.includes('Skipped') || 
                                secondImportOutput.includes('Failed to import') ||
                                secondImportOutput.includes('duplicate');
      
      recordTest('Import: Prevent duplicate import', duplicatePrevented,
        duplicatePrevented ? 'Successfully prevented duplicate import' : 'Failed to prevent duplicate');
      
      // Step 3: Create a slightly different transcript file
      const slightlyDifferentTranscript = createDuplicateTranscript(uniqueTranscript, {
        customer_name: 'Different Name But Same ID',
        call_transcript: 'This is a modified transcript'
      });
      
      const differentFilePath = path.join(TEMP_DIR, 'test_transcript_2.json');
      createTranscriptFile(slightlyDifferentTranscript, differentFilePath);
      
      // Import the slightly different transcript
      const thirdImportOutput = execSync(`node simple-import.js --dir=${TEMP_DIR}`, { 
        cwd: __dirname,
        encoding: 'utf8'
      });
      
      const slightlyDifferentPrevented = thirdImportOutput.includes('Skipped') || 
                                        thirdImportOutput.includes('Failed to import') ||
                                        thirdImportOutput.includes('duplicate');
      
      recordTest('Import: Prevent duplicate with content changes', slightlyDifferentPrevented,
        slightlyDifferentPrevented ? 'Successfully prevented import of modified duplicate' : 
                                   'Failed to prevent duplicate with content changes');
      
      // Step 4: Create a transcript with different datetime
      const differentDateTranscript = createDuplicateTranscript(uniqueTranscript, {
        call_date_time: '2025-03-01 12:00:00'
      });
      
      const differentDateFilePath = path.join(TEMP_DIR, 'test_transcript_3.json');
      createTranscriptFile(differentDateTranscript, differentDateFilePath);
      
      // Import the different datetime transcript
      const fourthImportOutput = execSync(`node simple-import.js --dir=${TEMP_DIR}`, { 
        cwd: __dirname,
        encoding: 'utf8'
      });
      
      const differentDateSuccess = fourthImportOutput.includes('Successfully imported');
      recordTest('Import: Allow same customer/agent with different datetime', differentDateSuccess,
        differentDateSuccess ? 'Successfully imported transcript with different datetime' : 
                             'Failed to import valid transcript');
    } catch (error) {
      recordTest('Import: Script execution', false, `Error: ${error.message}`);
    }
  } finally {
    // Clean up temp files
    cleanupTempDir();
    
    // Clean up test data from database
    const db = new sqlite3.Database(DB_PATH);
    db.run('DELETE FROM call_transcripts WHERE customer_unique_id LIKE "TEST_IMPORT_TEST_%"', function(err) {
      if (err) {
        print(`Warning: Clean-up error: ${err.message}`, 'yellow');
      }
      db.close();
    });
  }
}

// Test 4: Bulk API endpoint duplicate prevention
async function testBulkApiDuplicatePrevention() {
  printHeader('Test 4: Bulk API Endpoint Duplicate Prevention');
  
  try {
    ensureTempDir();
    
    // Create a unique test transcript
    const uniqueTranscript = createTestTranscript('BULK_API_TEST_1');
    const filePath = path.join(TEMP_DIR, 'bulk_test_1.json');
    createTranscriptFile(uniqueTranscript, filePath);
    
    // Create a second unique transcript
    const secondTranscript = createTestTranscript('BULK_API_TEST_2');
    const secondFilePath = path.join(TEMP_DIR, 'bulk_test_2.json');
    createTranscriptFile(secondTranscript, secondFilePath);
    
    // Step 1: Use bulk API to import both transcripts
    let response = await makeRequest('POST', '/transcripts/bulk', {
      directoryPath: TEMP_DIR
    });
    
    const firstBulkSuccess = response.statusCode === 201 && 
                            response.data?.data?.createdIds?.length === 2;
    
    recordTest('Bulk API: Import unique transcripts', firstBulkSuccess,
      firstBulkSuccess ? `Successfully imported ${response.data?.data?.createdIds?.length} transcripts` : 
                       `Failed with status: ${response.statusCode}`);
    
    // Step 2: Try to import the same files again (should skip duplicates)
    response = await makeRequest('POST', '/transcripts/bulk', {
      directoryPath: TEMP_DIR
    });
    
    const duplicatesHandled = response.statusCode === 201 && 
                             response.data?.data?.createdIds?.length === 0;
    
    recordTest('Bulk API: Handle duplicate imports', duplicatesHandled,
      duplicatesHandled ? 'Successfully handled duplicate imports' : 
                        `Unexpected behavior: ${JSON.stringify(response.data)}`);
    
    // Step 3: Create a modified transcript file
    const modifiedTranscript = createDuplicateTranscript(uniqueTranscript, {
      call_date_time: '2025-04-01 12:00:00'
    });
    
    const modifiedFilePath = path.join(TEMP_DIR, 'bulk_test_3.json');
    createTranscriptFile(modifiedTranscript, modifiedFilePath);
    
    // Import the modified transcript
    response = await makeRequest('POST', '/transcripts/bulk', {
      directoryPath: TEMP_DIR
    });
    
    const modifiedImportSuccess = response.statusCode === 201 && 
                                 response.data?.data?.createdIds?.length === 1;
    
    recordTest('Bulk API: Import modified transcripts', modifiedImportSuccess,
      modifiedImportSuccess ? 'Successfully imported modified transcript' : 
                            `Unexpected behavior: ${JSON.stringify(response.data)}`);
  } catch (error) {
    recordTest('Bulk API: Duplicate prevention tests', false, `Error: ${error.message}`);
  } finally {
    // Clean up temp files
    cleanupTempDir();
    
    // Clean up test data from database
    const db = new sqlite3.Database(DB_PATH);
    db.run('DELETE FROM call_transcripts WHERE customer_unique_id LIKE "TEST_BULK_API_TEST_%"', function(err) {
      if (err) {
        print(`Warning: Clean-up error: ${err.message}`, 'yellow');
      }
      db.close();
    });
  }
}

// Print summary of test results
function printSummary() {
  printHeader('Test Results Summary');
  
  print(`Total Tests: ${RESULTS.passed + RESULTS.failed}`, 'bright');
  print(`Passed: ${RESULTS.passed}`, 'green');
  print(`Failed: ${RESULTS.failed}`, 'red');
  
  const passRate = Math.round((RESULTS.passed / (RESULTS.passed + RESULTS.failed)) * 100);
  print(`Pass Rate: ${passRate}%`, passRate === 100 ? 'green' : passRate >= 80 ? 'yellow' : 'red');
  
  if (RESULTS.failed > 0) {
    print('\nFailed Tests:', 'red');
    RESULTS.tests.filter(test => !test.passed).forEach((test, index) => {
      print(`${index + 1}. ${test.name}`, 'red');
      if (test.message) {
        print(`   ${test.message}`, 'dim');
      }
    });
  }
  
  print('\nDuplicate Prevention Status: ' + 
    (RESULTS.failed === 0 ? colors.green + 'FULLY WORKING' : 
                          colors.yellow + 'PARTIALLY WORKING') + 
    colors.reset);
}

// Main function to run all tests
async function runTests() {
  console.clear();
  print('Call Zen Panel - Duplicate Prevention Test', 'bright');
  print('==========================================\n');
  
  try {
    // Check if server is running
    try {
      await makeRequest('GET', '/health');
      print('✓ Backend server is running', 'green');
    } catch (error) {
      print('✗ Backend server is not running - please start it first', 'red');
      print('  Run: cd backend && node simple-server.js', 'cyan');
      process.exit(1);
    }
    
    // Run all tests
    await testDatabaseDuplicatePrevention();
    await testApiDuplicatePrevention();
    await testImportScriptDuplicatePrevention();
    await testBulkApiDuplicatePrevention();
    
    // Print summary
    printSummary();
  } catch (error) {
    print(`Fatal error during tests: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the tests
runTests();
