console.log('Step 1: File started');

require('dotenv').config();
const express = require('express');
console.log('Step 2: Express loaded');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const lazyRoute = (modulePath) => {
  let router;

  return (req, res, next) => {
    try {
      if (!router) {
        console.log(`[RouteLoader] Loading ${modulePath}`);
        router = require(modulePath);
      }
      return router(req, res, next);
    } catch (error) {
      return next(error);
    }
  };
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', lazyRoute('./routes/auth'));
app.use('/api/resume', lazyRoute('./routes/resume'));
app.use('/api/interview', lazyRoute('./routes/interview'));
app.use('/api/practice', lazyRoute('./routes/practice'));
app.use('/api/analytics', lazyRoute('./routes/analytics'));
app.use('/api/code', lazyRoute('./routes/code')); // Local Judge0 code execution

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.get('/', (req, res) => {
  res.send('Server is working');
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('[Startup] Initializing backend server...');
  console.log('Step 3: Before DB connection');
  await connectDB();
  console.log('Step 4: After DB connection');

  console.log('Step 5: Before listen');
  app.listen(PORT, () => {
    console.log(`Step 6: Server running on port ${PORT}`);
    console.log(`[Startup] Server running on port ${PORT}`);
  });
};

process.on('unhandledRejection', (reason) => {
  console.error('[Startup] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Startup] Uncaught Exception:', error);
});

startServer();
