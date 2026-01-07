import express from 'express';
import openaiService from '../services/openai.js';
import contextService from '../services/context.js';
import conversationService from '../services/conversation.js';
import { formatError } from '../utils/helpers.js';
import { config } from '../config/config.js';

const router = express.Router();

/**
 * Detect if question requires additional context from general pages
 */
function detectRequiredPages(message) {
  const messageLower = message.toLowerCase();
  const additionalPages = [];

  // Home page keywords (general overview, destinations, what we offer)
  const homeKeywords = [
    'home', 'main page', 'overview', 'what do you offer', 'destinations', 'all locations',
    'where do you have', 'what areas', 'all properties', 'show me everything'
  ];

  // FAQ-related keywords
  const faqKeywords = [
    'faq', 'minimum', 'stay', 'night', 'discount', 'month', 'children', 'air conditioning',
    'question', 'policy', 'allowed', 'equipped', 'photo', 'image',
    'concierge', 'service', 'property manager', 'extended stay', 'long stay'
  ];

  // About-related keywords
  const aboutKeywords = [
    'about', 'company', 'who are you', 'history', 'team', 'exotic estates',
    'specialist', 'work with', 'help with', 'what do you do', 'since when', 'founded'
  ];

  // Contact-related keywords
  const contactKeywords = [
    'contact', 'phone', 'email', 'call', 'reach', 'get in touch', 'speak with',
    'talk to', 'consultant', 'travel consultant', 'reservation', 'booking contact',
    'how to contact', 'where to call', 'phone number', 'email address'
  ];

  // Terms & Conditions keywords
  const termsKeywords = [
    'terms', 'conditions', 'terms and conditions', 'booking terms', 'cancellation',
    'refund', 'policy', 'rules', 'agreement', 'contract', 'booking agreement',
    'cancellation policy', 'refund policy', 'terms of service'
  ];

  // Privacy Policy keywords
  const privacyKeywords = [
    'privacy', 'privacy policy', 'data', 'information', 'personal information',
    'cookies', 'data collection', 'how you use', 'what you collect', 'gdpr',
    'data protection', 'information security'
  ];

  // Blog keywords
  const blogKeywords = [
    'blog', 'article', 'post', 'guide', 'tips', 'advice', 'travel tips',
    'vacation tips', 'destination guide', 'things to do', 'local guide',
    'travel blog', 'luxury advisor'
  ];

  // Check if question is about home/overview
  if (homeKeywords.some(keyword => messageLower.includes(keyword))) {
    additionalPages.push('https://www.exoticestates.com/');
  }

  // Check if question is about FAQs
  if (faqKeywords.some(keyword => messageLower.includes(keyword))) {
    additionalPages.push('https://www.exoticestates.com/faqs');
  }

  // Check if question is about company info
  if (aboutKeywords.some(keyword => messageLower.includes(keyword))) {
    additionalPages.push('https://www.exoticestates.com/about-us');
  }

  // Check if question is about contact information
  if (contactKeywords.some(keyword => messageLower.includes(keyword))) {
    additionalPages.push('https://www.exoticestates.com/contact');
  }

  // Check if question is about terms & conditions
  if (termsKeywords.some(keyword => messageLower.includes(keyword))) {
    additionalPages.push('https://www.exoticestates.com/terms-and-conditions');
  }

  // Check if question is about privacy policy
  if (privacyKeywords.some(keyword => messageLower.includes(keyword))) {
    additionalPages.push('https://www.exoticestates.com/privacy-policy');
  }

  // Check if question is about blog/guides
  if (blogKeywords.some(keyword => messageLower.includes(keyword))) {
    additionalPages.push('https://www.exoticestates.com/blog');
  }

  return additionalPages;
}

/**
 * POST /api/chat
 * Send a message and get AI response
 * 
 * Body:
 * - message: string (required) - User message
 * - conversationId: string (optional) - Conversation ID
 * - pageUrl: string (optional) - Current page URL for context
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationId, pageUrl } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string',
      });
    }

    // Get or create conversation
    const conversation = conversationService.getOrCreateConversation(conversationId);

    // Get page context if URL provided
    let pageContext = null;
    if (pageUrl) {
      try {
        pageContext = await contextService.getPageContext(pageUrl);
      } catch (error) {
        console.error('[Chat] Error getting page context:', error.message);
        // Continue without context if scraping fails
      }
    }

    // Detect if we need additional context from general pages (FAQ, About, etc.)
    const additionalPages = detectRequiredPages(message);
    const additionalContexts = [];

    if (additionalPages.length > 0) {
      console.log(`[Chat] Question requires additional context from: ${additionalPages.join(', ')}`);
      
      // Scrape additional pages in parallel
      const scrapePromises = additionalPages.map(url => 
        contextService.getPageContext(url).catch(err => {
          console.error(`[Chat] Error scraping ${url}:`, err.message);
          return null;
        })
      );
      
      const results = await Promise.all(scrapePromises);
      additionalContexts.push(...results.filter(ctx => ctx !== null));
      
      console.log(`[Chat] Successfully scraped ${additionalContexts.length} additional pages`);
    }

    // Merge current page context with additional contexts
    let mergedContext = pageContext;
    if (additionalContexts.length > 0) {
      mergedContext = {
        ...pageContext,
        additionalPages: additionalContexts,
      };
    }

    // Add user message to conversation
    conversationService.addMessage(conversation.id, {
      role: 'user',
      content: message.trim(),
      pageContext: mergedContext ? {
        url: mergedContext.url,
        pageType: mergedContext.pageType,
        title: mergedContext.title,
        additionalPages: additionalContexts.map(ctx => ({
          url: ctx.url,
          title: ctx.title,
          pageType: ctx.pageType,
        })),
      } : null,
    });

    // Get formatted messages for OpenAI
    const messages = conversationService.getFormattedMessages(conversation.id);

    // Generate AI response
    let aiResponse;
    try {
      aiResponse = await openaiService.generateResponse(messages, mergedContext);
    } catch (error) {
      console.error('[Chat] OpenAI error:', error);
      
      // Add error message to conversation
      conversationService.addMessage(conversation.id, {
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment, or contact Exotic Estates directly at 888.628.4896.',
      });

      return res.status(500).json({
        error: 'Failed to generate response',
        message: error.message,
        conversationId: conversation.id,
      });
    }

    // Add AI response to conversation
    conversationService.addMessage(conversation.id, {
      role: 'assistant',
      content: aiResponse,
    });

    // Clean up old conversations periodically
    if (Math.random() < 0.1) { // 10% chance on each request
      conversationService.cleanupOldConversations();
      contextService.clearExpiredCache();
    }

    // Return response
    res.json({
      response: aiResponse,
      conversationId: conversation.id,
      pageContext: pageContext ? {
        url: pageContext.url,
        pageType: pageContext.pageType,
        title: pageContext.title,
      } : null,
      additionalContext: additionalContexts.map(ctx => ({
        url: ctx.url,
        title: ctx.title,
        pageType: ctx.pageType,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Chat] Unexpected error:', error);
    res.status(500).json(formatError(error, config.server.isDevelopment));
  }
});

/**
 * GET /api/chat/context
 * Get page context (for testing/debugging)
 * 
 * Query params:
 * - url: string (required) - Page URL to scrape
 */
router.get('/context', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'URL query parameter is required',
      });
    }

    const context = await contextService.getPageContext(url);
    res.json(context);
  } catch (error) {
    console.error('[Chat] Context error:', error);
    res.status(500).json(formatError(error, config.server.isDevelopment));
  }
});

/**
 * GET /api/chat/conversation/:id
 * Get conversation history
 */
router.get('/conversation/:id', (req, res) => {
  try {
    const conversation = conversationService.getConversation(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error('[Chat] Get conversation error:', error);
    res.status(500).json(formatError(error, config.server.isDevelopment));
  }
});

/**
 * DELETE /api/chat/conversation/:id
 * Delete a conversation
 */
router.delete('/conversation/:id', (req, res) => {
  try {
    const deleted = conversationService.deleteConversation(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    res.json({
      message: 'Conversation deleted successfully',
      conversationId: req.params.id,
    });
  } catch (error) {
    console.error('[Chat] Delete conversation error:', error);
    res.status(500).json(formatError(error, config.server.isDevelopment));
  }
});

/**
 * GET /api/chat/stats
 * Get service statistics (for monitoring)
 */
router.get('/stats', (req, res) => {
  try {
    res.json({
      conversations: conversationService.getStats(),
      cache: contextService.getCacheStats(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Chat] Stats error:', error);
    res.status(500).json(formatError(error, config.server.isDevelopment));
  }
});

/**
 * POST /api/chat/health
 * Health check endpoint
 */
router.post('/health', async (req, res) => {
  try {
    const openaiHealthy = await openaiService.validateConnection();
    
    res.json({
      status: 'ok',
      services: {
        openai: openaiHealthy ? 'healthy' : 'unhealthy',
        scraper: 'healthy',
        context: 'healthy',
        conversation: 'healthy',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

