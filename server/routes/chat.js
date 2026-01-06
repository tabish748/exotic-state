import express from 'express';
import openaiService from '../services/openai.js';
import contextService from '../services/context.js';
import conversationService from '../services/conversation.js';
import { formatError } from '../utils/helpers.js';
import { config } from '../config/config.js';

const router = express.Router();

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

    // Add user message to conversation
    conversationService.addMessage(conversation.id, {
      role: 'user',
      content: message.trim(),
      pageContext: pageContext ? {
        url: pageContext.url,
        pageType: pageContext.pageType,
        title: pageContext.title,
      } : null,
    });

    // Get formatted messages for OpenAI
    const messages = conversationService.getFormattedMessages(conversation.id);

    // Generate AI response
    let aiResponse;
    try {
      aiResponse = await openaiService.generateResponse(messages, pageContext);
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

