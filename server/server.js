require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
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
const keyExchangeRoutes = require('./src/routes/keyExchange');
const userRoutes = require('./src/routes/users');

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
app.use('/api/keyexchange', keyExchangeRoutes);
app.use('/api/users', userRoutes);

// MongoDB connection (optional - will use in-memory storage if not connected)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
  })
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      console.log(`📦 Database: ${mongoose.connection.name}`);
    })
    .catch(err => {
      console.log('⚠️  MongoDB connection failed - using in-memory storage');
      console.log('💡 Server will work without MongoDB for testing');
      console.log('💡 To enable MongoDB, configure MONGODB_URI in .env file');
    });
} else {
  console.log('ℹ️  MongoDB URI not configured - using in-memory storage');
  console.log('💡 This is fine for testing cryptographic features!');
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

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  // Authenticate user
  socket.on('authenticate', async (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      socket.join(`user:${decoded.userId}`);
      console.log(`✅ User ${decoded.userId} authenticated (socket: ${socket.id})`);
      socket.emit('authenticated', { userId: decoded.userId });
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      socket.emit('auth_error', { error: 'Authentication failed' });
      socket.disconnect();
    }
  });
  
  // Handle encrypted message sending
  socket.on('message:send', async (encryptedMessage) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      console.log(`📨 Message from ${socket.userId} to ${encryptedMessage.receiverId}`);
      
      // Forward to recipient
      io.to(`user:${encryptedMessage.receiverId}`).emit('message:receive', encryptedMessage);
      
      // Also emit back to sender for confirmation
      socket.emit('message:sent', { messageId: encryptedMessage.messageId || Date.now() });
    } catch (error) {
      console.error('Message send error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle key exchange messages
  socket.on('keyexchange:send', async (message) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const recipientId = message.receiverId || message.recipientId;
      console.log(`🔑 Key exchange message from ${socket.userId} to ${recipientId}`);
      
      // Forward to recipient
      io.to(`user:${recipientId}`).emit('keyexchange:receive', {
        ...message,
        senderId: socket.userId
      });
    } catch (error) {
      console.error('Key exchange send error:', error);
      socket.emit('error', { message: 'Failed to send key exchange message' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id} (userId: ${socket.userId || 'unknown'})`);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready for connections`);
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

