import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './database/database';
import transcriptRoutes from './routes/transcripts';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/transcripts', transcriptRoutes);

// API health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Call Zen Panel API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.resolve(__dirname, '../../dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../../dist/index.html'));
  });
}

// 404 handler for undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`Frontend available at http://localhost:${PORT}`);
      } else {
        console.log('Running in development mode');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export default app;
