require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { Event: eventStore } = require('./models/dbStore');

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for client
app.use(cors({
  origin: true,
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for development
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'EventSphere API', time: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'EventSphere API', time: new Date().toISOString() });
});

// Mount routes on both /api and root paths for maximum client flexibility
app.use('/api', authRoutes);
app.use('/', authRoutes);

app.use('/api', eventRoutes);
app.use('/', eventRoutes);

app.use('/api', registrationRoutes);
app.use('/', registrationRoutes);

app.use('/api', profileRoutes);
app.use('/', profileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    // Auto-seed sample events if database is empty
    await eventStore.seedIfEmpty();

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 EventSphere Server is running on port ${PORT}`);
      console.log(`📡 Base URL: http://localhost:${PORT}`);
      console.log(`===============================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use by another process.`);
        console.error(`💡 Run this command to free it: kill -9 $(lsof -ti :${PORT})\n`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
