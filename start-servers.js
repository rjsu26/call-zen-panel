#!/usr/bin/env node
/**
 * Start Servers Script for Call Zen Panel
 * 
 * This script:
 * 1. Starts the backend server
 * 2. Verifies the backend API is working
 * 3. Tests the database connection
 * 4. Provides instructions for accessing the frontend
 * 
 * Usage:
 *   node start-servers.js
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Configuration
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 5173;
const MAX_RETRY_COUNT = 20;
const RETRY_INTERVAL = 1000; // 1 second
const API_ENDPOINTS = [
  '/api/health',
  '/api/transcripts/stats',
  '/api/transcripts?limit=1'
];

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

// Helper function to print success messages
function printSuccess(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

// Helper function to print error messages
function printError(message) {
  console.log(colors.red + '✗ ' + message + colors.reset);
}

// Helper function to print warning messages
function printWarning(message) {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

// Helper function to make an HTTP request
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: endpoint,
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    
    req.end();
  });
}

// Helper function to wait for the server to be ready
async function waitForServer(retryCount = 0) {
  if (retryCount >= MAX_RETRY_COUNT) {
    throw new Error('Maximum retry count exceeded. Server may not be running properly.');
  }
  
  try {
    await makeRequest('/api/health');
    return true;
  } catch (error) {
    print(`Waiting for server to start... (${retryCount + 1}/${MAX_RETRY_COUNT})`, 'dim');
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    return waitForServer(retryCount + 1);
  }
}

// Helper function to test API endpoints
async function testApiEndpoints() {
  printHeader('Testing API Endpoints');
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await makeRequest(endpoint);
      
      if (response.statusCode === 200) {
        printSuccess(`Endpoint ${endpoint} is working`);
        
        // Print some data for stats endpoint
        if (endpoint === '/api/transcripts/stats') {
          const { data } = response;
          if (data && data.data) {
            const stats = data.data;
            print(`  • Total Calls: ${stats.totalCalls}`, 'cyan');
            print(`  • Average Satisfaction: ${stats.averageSatisfactionScore.toFixed(2)}`, 'cyan');
            
            if (stats.callsByResolution && stats.callsByResolution.length > 0) {
              const resolvedStatus = stats.callsByResolution.find(r => r.status === 'Resolved');
              const totalCalls = stats.callsByResolution.reduce((sum, item) => sum + item.count, 0);
              
              if (resolvedStatus && totalCalls > 0) {
                const resolvedPercentage = Math.round((resolvedStatus.count / totalCalls) * 100);
                print(`  • Resolved Rate: ${resolvedPercentage}%`, 'cyan');
              }
            }
            
            print(`  • Follow-up Required: ${stats.followUpRequiredCount}`, 'cyan');
          }
        }
        
        // Print some data for transcripts endpoint
        if (endpoint.startsWith('/api/transcripts?')) {
          const { data } = response;
          if (data && data.data && data.data.transcripts && data.data.transcripts.length > 0) {
            const transcript = data.data.transcripts[0];
            print(`  • Sample Transcript: ${transcript.customer_name} (${transcript.customer_tier})`, 'cyan');
            print(`  • Category: ${transcript.category_of_call}`, 'cyan');
          }
        }
      } else {
        printWarning(`Endpoint ${endpoint} returned status code ${response.statusCode}`);
      }
    } catch (error) {
      printError(`Failed to test endpoint ${endpoint}: ${error.message}`);
    }
  }
}

// Check if database exists and has data
function checkDatabase() {
  printHeader('Checking Database');
  
  const dbPath = path.resolve(__dirname, 'database/call_center.db');
  
  if (!fs.existsSync(dbPath)) {
    printWarning('Database file not found at: ' + dbPath);
    printWarning('You may need to import transcripts using:');
    print('  cd backend && node simple-import.js', 'cyan');
    return false;
  }
  
  printSuccess('Database file exists at: ' + dbPath);
  return true;
}

// Start the backend server
function startBackendServer() {
  printHeader('Starting Backend Server');
  
  // Check if backend directory exists
  const backendDir = path.resolve(__dirname, 'backend');
  if (!fs.existsSync(backendDir)) {
    printError('Backend directory not found at: ' + backendDir);
    process.exit(1);
  }
  
  // Determine which server script to use
  const useSimpleServer = fs.existsSync(path.join(backendDir, 'simple-server.js'));
  const serverScript = useSimpleServer ? 'simple-server.js' : 'src/server.ts';
  const startCommand = useSimpleServer ? 'node' : 'npm run dev';
  const startArgs = useSimpleServer ? [serverScript] : [];
  
  print(`Starting backend using: ${startCommand} ${serverScript}`, 'cyan');
  
  // Start the server process
  const serverProcess = spawn(startCommand, startArgs, {
    cwd: backendDir,
    shell: true,
    stdio: 'pipe'
  });
  
  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(colors.dim + '[Backend] ' + data + colors.reset);
  });
  
  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(colors.yellow + '[Backend Error] ' + data + colors.reset);
  });
  
  // Handle server exit
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      printError(`Backend server exited with code ${code}`);
      process.exit(1);
    }
  });
  
  // Return the server process
  return serverProcess;
}

// Start the frontend development server
function startFrontendServer() {
  printHeader('Starting Frontend Server');
  
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe'
  });
  
  // Handle frontend output
  frontendProcess.stdout.on('data', (data) => {
    process.stdout.write(colors.dim + '[Frontend] ' + data + colors.reset);
  });
  
  frontendProcess.stderr.on('data', (data) => {
    process.stderr.write(colors.yellow + '[Frontend Error] ' + data + colors.reset);
  });
  
  // Handle frontend exit
  frontendProcess.on('close', (code) => {
    if (code !== 0) {
      printError(`Frontend server exited with code ${code}`);
    }
  });
  
  return frontendProcess;
}

// Print access instructions
function printInstructions() {
  printHeader('Access Information');
  print('Backend API is running at:', 'bright');
  print(`  http://localhost:${BACKEND_PORT}/api`, 'green');
  print('\nFrontend is running at:', 'bright');
  print(`  http://localhost:${FRONTEND_PORT}`, 'green');
  
  print('\nAPI Endpoints:', 'bright');
  print('  • Health Check: /api/health', 'cyan');
  print('  • Dashboard Stats: /api/transcripts/stats', 'cyan');
  print('  • Call Transcripts: /api/transcripts', 'cyan');
  print('  • Single Transcript: /api/transcripts/:id', 'cyan');
  
  print('\nTo stop the servers:', 'bright');
  print('  Press Ctrl+C in this terminal', 'cyan');
}

// Main function
async function main() {
  try {
    console.clear();
    print('Call Zen Panel - Server Starter', 'bright');
    print('================================\n');
    
    // Check if database exists
    checkDatabase();
    
    // Start backend server
    const backendProcess = startBackendServer();
    
    // Wait for backend server to be ready
    print('Waiting for backend server to start...', 'cyan');
    await waitForServer();
    printSuccess('Backend server is running!');
    
    // Test API endpoints
    await testApiEndpoints();
    
    // Start frontend server
    const frontendProcess = startFrontendServer();
    
    // Print instructions
    printInstructions();
    
    // Handle process termination
    process.on('SIGINT', () => {
      print('\nShutting down servers...', 'yellow');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });
  } catch (error) {
    printError(`Failed to start servers: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
