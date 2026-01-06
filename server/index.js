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

// CORS configuration with detailed logging
app.use(cors({
  origin: (origin, callback) => {
    console.log('\n🔐 [CORS] Checking origin...');
    console.log(`  📍 Received origin: ${origin || 'null/undefined'}`);
    console.log(`  📋 Type: ${typeof origin}`);
    console.log(`  📏 Length: ${origin ? origin.length : 0}`);
    
    // Allow requests with no origin (mobile apps, Postman, file://, etc.)
    if (!origin) {
      console.log('  ✅ [CORS] Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check for file:// protocol variations
    const isFileProtocol = 
      origin.startsWith('file://') || 
      origin === 'null' || 
      origin === 'file:///' ||
      origin.includes('file:///') ||
      origin.includes('/Users') || // macOS file paths
      (origin.startsWith('/') && !origin.startsWith('http')); // Local file paths
    
    if (isFileProtocol) {
      console.log(`  ✅ [CORS] Allowing file:// or local file origin: ${origin}`);
      console.log(`  🔍 Matched pattern: ${origin.startsWith('file://') ? 'file://' : origin.includes('/Users') ? '/Users path' : 'local path'}`);
      return callback(null, true);
    }
    
    // Check allowed origins
    const isAllowedOrigin = config.cors.allowedOrigins.includes(origin);
    const isDevelopment = config.server.isDevelopment;
    
    console.log(`  📋 Allowed origins: ${config.cors.allowedOrigins.join(', ')}`);
    console.log(`  ✅ Is in allowed list: ${isAllowedOrigin}`);
    console.log(`  🛠️  Is development: ${isDevelopment}`);
    
    if (isAllowedOrigin || isDevelopment) {
      console.log(`  ✅ [CORS] Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`  ❌ [CORS] BLOCKING origin: ${origin}`);
      console.log(`  💡 Add to ALLOWED_ORIGINS in .env or enable development mode`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
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

// Request logging middleware - Enhanced for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.headers.origin || 'no-origin';
  const referer = req.headers.referer || 'no-referer';
  const userAgent = req.headers['user-agent'] || 'no-user-agent';
  const isPreflight = req.method === 'OPTIONS';
  
  if (isPreflight) {
    console.log(`\n🔄 [PREFLIGHT] ${req.method} ${req.path}`);
  } else {
    console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  }
  
  console.log(`  📍 Origin: ${origin}`);
  console.log(`  🔗 Referer: ${referer}`);
  console.log(`  🌐 User-Agent: ${userAgent.substring(0, 50)}...`);
  console.log(`  📋 Headers:`, {
    origin: req.headers.origin,
    referer: req.headers.referer,
    'content-type': req.headers['content-type'],
    'access-control-request-method': req.headers['access-control-request-method'],
    'access-control-request-headers': req.headers['access-control-request-headers'],
  });
  
  // Log response headers for CORS
  res.on('finish', () => {
    console.log(`  ✅ [RESPONSE] Status: ${res.statusCode}`);
    console.log(`  📋 Response headers:`, {
      'access-control-allow-origin': res.getHeader('access-control-allow-origin'),
      'access-control-allow-methods': res.getHeader('access-control-allow-methods'),
      'access-control-allow-headers': res.getHeader('access-control-allow-headers'),
    });
  });
  
  next();
});

// API Routes
app.use('/api/chat', chatRoutes);

// Serve static files (chatbot widget) with logging and explicit CORS
// CRITICAL: 304 responses don't include CORS headers by default, so we need to handle this
app.use('/public', (req, res, next) => {
  console.log(`📦 [STATIC] Serving file: ${req.path}`);
  console.log(`  📍 Origin: ${req.headers.origin || 'no-origin'}`);
  
  // Set CORS headers BEFORE any response (including 304)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // Intercept response methods to ensure CORS headers are ALWAYS included
  const originalSend = res.send;
  const originalEnd = res.end;
  const originalWriteHead = res.writeHead;
  
  res.send = function(data) {
    this.setHeader('Access-Control-Allow-Origin', '*');
    return originalSend.call(this, data);
  };
  
  res.end = function(data) {
    this.setHeader('Access-Control-Allow-Origin', '*');
    return originalEnd.call(this, data);
  };
  
  res.writeHead = function(statusCode, statusMessage, headers) {
    if (!headers) headers = statusMessage;
    if (headers && typeof headers === 'object') {
      headers['Access-Control-Allow-Origin'] = '*';
    }
    return originalWriteHead.call(this, statusCode, statusMessage, headers);
  };
  
  next();
}, express.static(join(__dirname, '../public'), {
  setHeaders: (res, path, stat) => {
    console.log(`  ✅ [STATIC] Sending file: ${path}`);
    // Ensure CORS headers are ALWAYS set, even for 304 responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Disable caching for widget file to avoid 304 issues with CORS
    if (path.includes('chatbot-widget.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', ''); // Remove ETag to prevent 304
    }
  }
}));

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

// Serve test-widget.html
app.get('/test-widget.html', (req, res) => {
  res.sendFile(join(__dirname, '../test-widget.html'));
});

// Serve test-widget-local.html
app.get('/test-widget-local.html', (req, res) => {
  res.sendFile(join(__dirname, '../test-widget-local.html'));
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

// 404 handler with logging
app.use((req, res) => {
  console.log(`❌ [404] Endpoint not found: ${req.method} ${req.path}`);
  console.log(`  📍 Origin: ${req.headers.origin || 'no-origin'}`);
  console.log(`  🔗 Referer: ${req.headers.referer || 'no-referer'}`);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    origin: req.headers.origin || 'no-origin',
  });
});

// Error handling middleware with detailed logging
app.use((err, req, res, next) => {
  console.error('\n❌ [ERROR] Server error occurred:');
  console.error(`  📍 Path: ${req.method} ${req.path}`);
  console.error(`  📍 Origin: ${req.headers.origin || 'no-origin'}`);
  console.error(`  ❌ Error: ${err.message}`);
  console.error(`  📋 Stack: ${err.stack}`);
  console.error(`  🔍 Full error:`, err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    path: req.path,
    method: req.method,
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

