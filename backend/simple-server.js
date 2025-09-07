/**
 * Simple Express Server for Call Zen Panel
 * 
 * This is a simplified version of the backend server that:
 * - Uses plain JavaScript instead of TypeScript
 * - Connects directly to SQLite without the service layer
 * - Provides the essential endpoints needed by the frontend
 * 
 * Use this for troubleshooting when the TypeScript backend has issues.
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create Express app
const app = express();
const PORT = 3001;

// Database setup
const DB_PATH = path.resolve(__dirname, '../database/call_center.db');
console.log(`Using database at: ${DB_PATH}`);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Connect to database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');

  // ------------------------------------------------------------------
  // Ensure table & duplicate-prevention UNIQUE index exist
  // ------------------------------------------------------------------
  db.serialize(() => {
    // Create table if it doesn't exist (schema identical to main backend)
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
        console.error('Error ensuring call_transcripts table:', err.message);
      }
    });

    // Composite UNIQUE index to prevent duplicates
    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_call_transcripts_unique_call
      ON call_transcripts (customer_unique_id, call_date_time, support_agent_id)
    `, (err) => {
      if (err) {
        console.error('Error creating duplicate-prevention index:', err.message);
      } else {
        console.log('Duplicate-prevention UNIQUE index ready');
      }
    });
  });
});

/**
 * API Health Check
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Simple Call Zen Panel API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get dashboard statistics
 */
app.get('/api/transcripts/stats', (req, res) => {
  console.log('Fetching dashboard statistics...');
  
  // Get total calls
  db.get('SELECT COUNT(*) as totalCalls FROM call_transcripts', (err, totalCallsRow) => {
    if (err) {
      console.error('Error getting total calls:', err.message);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const totalCalls = totalCallsRow.totalCalls;
    
    // Get average satisfaction score
    db.get('SELECT AVG(overall_satisfaction_score) as averageSatisfactionScore FROM call_transcripts', (err, satisfactionRow) => {
      if (err) {
        console.error('Error getting satisfaction score:', err.message);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      const averageSatisfactionScore = satisfactionRow.averageSatisfactionScore || 0;
      
      // Get calls by category
      db.all('SELECT category_of_call as category, COUNT(*) as count FROM call_transcripts GROUP BY category_of_call ORDER BY count DESC', (err, categoryRows) => {
        if (err) {
          console.error('Error getting categories:', err.message);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        const callsByCategory = categoryRows;
        
        // Get calls by resolution status
        db.all('SELECT call_resolution_status as status, COUNT(*) as count FROM call_transcripts GROUP BY call_resolution_status ORDER BY count DESC', (err, resolutionRows) => {
          if (err) {
            console.error('Error getting resolution status:', err.message);
            return res.status(500).json({ success: false, message: 'Database error' });
          }
          
          const callsByResolution = resolutionRows;
          
          // Get calls by customer tier
          db.all('SELECT customer_tier as tier, COUNT(*) as count FROM call_transcripts GROUP BY customer_tier ORDER BY count DESC', (err, tierRows) => {
            if (err) {
              console.error('Error getting customer tiers:', err.message);
              return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            const callsByTier = tierRows;
            
            // Get calls by severity
            db.all('SELECT issue_severity as severity, COUNT(*) as count FROM call_transcripts GROUP BY issue_severity ORDER BY count DESC', (err, severityRows) => {
              if (err) {
                console.error('Error getting severity:', err.message);
                return res.status(500).json({ success: false, message: 'Database error' });
              }
              
              const callsBySeverity = severityRows;
              
              // Get average call duration
              db.get('SELECT AVG(call_duration) as averageCallDuration FROM call_transcripts', (err, durationRow) => {
                if (err) {
                  console.error('Error getting call duration:', err.message);
                  return res.status(500).json({ success: false, message: 'Database error' });
                }
                
                const averageCallDuration = durationRow.averageCallDuration || 0;
                
                // Get follow-up required count
                db.get('SELECT COUNT(*) as followUpRequiredCount FROM call_transcripts WHERE follow_up_required = "Yes"', (err, followUpRow) => {
                  if (err) {
                    console.error('Error getting follow-up count:', err.message);
                    return res.status(500).json({ success: false, message: 'Database error' });
                  }
                  
                  const followUpRequiredCount = followUpRow.followUpRequiredCount || 0;
                  
                  // Get call trends by date
                  db.all('SELECT DATE(call_date_time) as date, COUNT(*) as count, AVG(overall_satisfaction_score) as averageSatisfaction FROM call_transcripts GROUP BY DATE(call_date_time) ORDER BY date DESC LIMIT 30', (err, trendRows) => {
                    if (err) {
                      console.error('Error getting call trends:', err.message);
                      return res.status(500).json({ success: false, message: 'Database error' });
                    }
                    
                    const callTrends = trendRows;
                    
                    // Assemble the complete stats object
                    const stats = {
                      totalCalls,
                      averageSatisfactionScore,
                      callsByCategory,
                      callsByResolution,
                      callsByTier,
                      callsBySeverity,
                      averageCallDuration,
                      followUpRequiredCount,
                      callTrends
                    };
                    
                    console.log('Dashboard stats retrieved successfully');
                    res.status(200).json({
                      success: true,
                      message: 'Dashboard statistics retrieved successfully',
                      data: stats
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

/**
 * Get all transcripts with optional filtering and pagination
 */
app.get('/api/transcripts', (req, res) => {
  console.log('Fetching transcripts...');
  
  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  // Build the base query
  let countQuery = 'SELECT COUNT(*) as total FROM call_transcripts';
  let dataQuery = `
    SELECT 
      id, customer_name, customer_unique_id, support_agent_name, support_agent_id,
      call_transcript, overall_satisfaction_score, category_of_call, call_duration,
      call_date_time, call_resolution_status, escalation_level, follow_up_required,
      customer_tier, issue_severity, agent_experience_level, customer_previous_contact_count,
      created_at
    FROM call_transcripts
    ORDER BY call_date_time DESC
    LIMIT ? OFFSET ?
  `;
  
  // Get total count
  db.get(countQuery, (err, totalRow) => {
    if (err) {
      console.error('Error getting transcript count:', err.message);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const total = totalRow.total;
    
    // Get paginated data
    db.all(dataQuery, [limit, offset], (err, transcripts) => {
      if (err) {
        console.error('Error getting transcripts:', err.message);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      console.log(`Retrieved ${transcripts.length} transcripts`);
      res.status(200).json({
        success: true,
        message: 'Call transcripts retrieved successfully',
        data: {
          transcripts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    });
  });
});

/**
 * Get a single transcript by ID
 */
app.get('/api/transcripts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  
  db.get('SELECT * FROM call_transcripts WHERE id = ?', [id], (err, transcript) => {
    if (err) {
      console.error(`Error getting transcript with ID ${id}:`, err.message);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!transcript) {
      return res.status(404).json({ success: false, message: 'Transcript not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Call transcript retrieved successfully',
      data: transcript
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log('Press Ctrl+C to stop the server');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
