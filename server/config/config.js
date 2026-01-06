import dotenv from 'dotenv';

dotenv.config();

/**
 * Application Configuration
 * Centralized configuration management
 */
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.7,
    maxTokens: 300, // Reduced for more concise responses
  },

  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [
      'https://www.exoticestates.com',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
  },

  // Scraping Configuration
  scraping: {
    timeout: parseInt(process.env.SCRAPE_TIMEOUT) || 15000,
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    maxRetries: 3,
    retryDelay: 1000,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Cache Configuration
  cache: {
    contextCacheTTL: parseInt(process.env.CONTEXT_CACHE_TTL_MS) || 60 * 60 * 1000, // 1 hour
    conversationTTL: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Chatbot Configuration
  chatbot: {
    greetingMessage: "Hello! I'm here to help you find the perfect luxury villa for your vacation. What are you looking for?",
    maxConversationHistory: 20, // Maximum messages to keep in context
  },
};

// Validate required configuration
if (!config.openai.apiKey) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY is not set in environment variables');
}

