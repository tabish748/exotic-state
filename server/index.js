import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/config.js';
import chatRoutes from './routes/chat.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Express Server
 * Main application entry point
 */
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for chatbot widget
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, file://, etc.)
    if (!origin) return callback(null, true);
    
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://') || origin === 'null') {
      return callback(null, true);
    }
    
    if (config.cors.allowedOrigins.includes(origin) || config.server.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/chat', chatRoutes);

// Serve static files (chatbot widget)
app.use('/public', express.static(join(__dirname, '../public')));

// Serve demo page
app.get('/demo', (req, res) => {
  res.sendFile(join(__dirname, '../demo.html'));
});

// Serve testing interface
app.get('/test', (req, res) => {
  res.sendFile(join(__dirname, '../test-interface.html'));
});

// Serve widget prototype
app.get('/prototype', (req, res) => {
  res.sendFile(join(__dirname, '../widget-prototype.html'));
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Exotic Estates Chatbot API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      chat: '/api/chat',
      health: '/api/chat/health',
      stats: '/api/chat/stats',
      widget: '/public/chatbot-widget.js',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(config.server.isDevelopment && { stack: err.stack }),
  });
});

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
  console.log('\n🚀 Exotic Estates Chatbot Server');
  console.log('================================');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`🤖 OpenAI Model: ${config.openai.model}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📦 Widget URL: http://localhost:${PORT}/public/chatbot-widget.js`);
  console.log('================================\n');
  
  // Validate OpenAI connection on startup
  if (config.openai.apiKey) {
    import('./services/openai.js').then(({ default: openaiService }) => {
      openaiService.validateConnection().then(isValid => {
        if (isValid) {
          console.log('✅ OpenAI connection validated\n');
        } else {
          console.warn('⚠️  OpenAI connection validation failed. Please check your API key.\n');
        }
      });
    });
  } else {
    console.warn('⚠️  OPENAI_API_KEY not set. Chat functionality will not work.\n');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;

