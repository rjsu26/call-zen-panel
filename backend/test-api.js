/**
 * Simple API Test Script for Call Zen Panel
 * 
 * This script tests the database connection, service layer functions,
 * and simulates API calls without starting the full Express server.
 * It helps diagnose data flow issues between backend and frontend.
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const DB_PATH = path.resolve(__dirname, '../database/call_center.db');

// Import service functions directly (bypassing Express)
const CallTranscriptService = require('./dist/services/CallTranscriptService').default;
const service = new CallTranscriptService();

// Test database connection directly
console.log('===== TESTING DATABASE CONNECTION =====');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connection successful');
  
  // Check if data exists
  db.get('SELECT COUNT(*) as count FROM call_transcripts', (err, row) => {
    if (err) {
      console.error('❌ Error counting transcripts:', err.message);
    } else {
      console.log(`✅ Found ${row.count} transcripts in database`);
      
      // If no data, suggest importing
      if (row.count === 0) {
        console.log('⚠️ No data found. Run import script: node simple-import.js');
      }
    }
    
    // Continue with service layer tests
    testServiceLayer();
  });
});

// Test service layer functions
function testServiceLayer() {
  console.log('\n===== TESTING SERVICE LAYER FUNCTIONS =====');
  
  // Test 1: Get dashboard stats
  console.log('\n1. Testing getDashboardStats()');
  service.getDashboardStats()
    .then(stats => {
      console.log('✅ getDashboardStats() returned data:');
      console.log('  • Total Calls:', stats.totalCalls);
      console.log('  • Average Satisfaction:', stats.averageSatisfactionScore.toFixed(2));
      console.log('  • Average Call Duration:', stats.averageCallDuration.toFixed(2), 'minutes');
      console.log('  • Follow-up Required Count:', stats.followUpRequiredCount);
      
      // Check categories
      console.log('\n  • Call Categories:');
      stats.callsByCategory.forEach(cat => {
        console.log(`    - ${cat.category}: ${cat.count} calls`);
      });
      
      // Check resolution status
      console.log('\n  • Resolution Status:');
      stats.callsByResolution.forEach(res => {
        console.log(`    - ${res.status}: ${res.count} calls`);
      });
      
      // Calculate resolved percentage
      const resolvedCount = stats.callsByResolution.find(r => r.status === 'Resolved')?.count || 0;
      const totalResolutionCalls = stats.callsByResolution.reduce((sum, item) => sum + item.count, 0);
      const resolvedPercentage = totalResolutionCalls > 0 
        ? Math.round((resolvedCount / totalResolutionCalls) * 100) 
        : 0;
      
      console.log(`\n  • Resolved Percentage: ${resolvedPercentage}%`);
      
      // Test 2: Get recent transcripts
      testGetRecentTranscripts();
    })
    .catch(error => {
      console.error('❌ getDashboardStats() failed:', error.message);
      // Continue with next test even if this one fails
      testGetRecentTranscripts();
    });
}

// Test getting recent transcripts
function testGetRecentTranscripts() {
  console.log('\n2. Testing getAllCallTranscripts()');
  
  service.getAllCallTranscripts({}, { page: 1, limit: 5 })
    .then(result => {
      console.log(`✅ getAllCallTranscripts() returned ${result.transcripts.length} transcripts`);
      
      if (result.transcripts.length > 0) {
        const sample = result.transcripts[0];
        console.log('\nSample transcript:');
        console.log('  • ID:', sample.id);
        console.log('  • Customer:', sample.customer_name);
        console.log('  • Agent:', sample.support_agent_name);
        console.log('  • Category:', sample.category_of_call);
        console.log('  • Date:', sample.call_date_time);
        console.log('  • Satisfaction:', sample.overall_satisfaction_score);
      } else {
        console.log('⚠️ No transcripts returned');
      }
      
      // Test complete
      testComplete();
    })
    .catch(error => {
      console.error('❌ getAllCallTranscripts() failed:', error.message);
      testComplete();
    });
}

// Final diagnostics and suggestions
function testComplete() {
  console.log('\n===== TEST COMPLETE =====');
  console.log('\nDiagnostics:');
  console.log('1. If database tests pass but service tests fail, check service implementation');
  console.log('2. If all tests pass but frontend shows zeros, check:');
  console.log('   - CORS settings (backend/src/server.ts)');
  console.log('   - API URL in frontend (src/lib/api.ts)');
  console.log('   - Network requests in browser console');
  console.log('3. To start the backend server:');
  console.log('   - Development: npm run dev');
  console.log('   - Production: npm run build && npm start');
  
  // Close database connection
  db.close(err => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('\nDatabase connection closed');
    }
    
    // Exit with success
    process.exit(0);
  });
}
