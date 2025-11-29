require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
const { passport } = require('./src/config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import dependencies
const rateLimiter = require('./src/middleware/rateLimiter');

// Import routes
const authRoutes = require('./src/routes/auth');
const oauthRoutes = require('./src/routes/oauth');
const twoFactorRoutes = require('./src/routes/twoFactor');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', rateLimiter(15 * 60 * 1000, 5), authRoutes); // 5 requests per 15 minutes
app.use('/api/oauth', oauthRoutes);
app.use('/api/2fa', twoFactorRoutes);

// MongoDB connection (optional for initial testing)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      console.log(`📦 Database: ${mongoose.connection.name}`);
    })
    .catch(err => {
      console.log('⚠️  MongoDB not connected (optional for testing)');
      console.log('💡 To enable MongoDB, install and start it:');
      console.log('   Download: https://www.mongodb.com/try/download/community');
    });
} else {
  console.log('⚠️  MongoDB URI not configured (server will run without database)');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    status: 404
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log('🚀 ================================\n');
  console.log('📝 Test the server:');
  console.log(`   curl http://localhost:${PORT}/api/health`);
  console.log('\n💡 Press Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

