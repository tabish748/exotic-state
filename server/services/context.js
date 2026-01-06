import scraper from './scraper.js';
import { config } from '../config/config.js';

/**
 * Context Service
 * Manages page context caching and conversation context building
 */
class ContextService {
  constructor() {
    this.contextCache = new Map();
    this.cacheTimeout = config.cache.contextCacheTTL;
  }

  /**
   * Get or scrape page context with caching
   * @param {string} url - Page URL
   * @param {boolean} forceRefresh - Force refresh even if cached
   * @returns {Promise<Object>} Page context
   */
  async getPageContext(url, forceRefresh = false) {
    if (!url) {
      return null;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.contextCache.get(url);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`[Context] Using cached context for: ${url}`);
        return cached.context;
      }
    }

    // Scrape page
    console.log(`[Context] Scraping page context: ${url}`);
    try {
      const context = await scraper.scrapePage(url);
      
      // Cache it
      this.contextCache.set(url, {
        context,
        timestamp: Date.now(),
      });

      return context;
    } catch (error) {
      console.error(`[Context] Error scraping ${url}:`, error.message);
      
      // Return minimal context if scraping fails
      return {
        url,
        pathname: new URL(url).pathname,
        pageType: 'unknown',
        title: 'Page',
        scrapedAt: new Date().toISOString(),
        error: 'Failed to scrape page',
      };
    }
  }

  /**
   * Build conversation context from current page and history
   * @param {Object} currentPageContext - Current page context
   * @param {Array} conversationHistory - Previous messages
   * @returns {Object} Combined context
   */
  buildConversationContext(currentPageContext, conversationHistory = []) {
    return {
      currentPage: currentPageContext,
      conversationHistory: conversationHistory.slice(-config.chatbot.maxConversationHistory),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    let cleared = 0;

    for (const [url, cached] of this.contextCache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.contextCache.delete(url);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`[Context] Cleared ${cleared} expired cache entries`);
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    const size = this.contextCache.size;
    this.contextCache.clear();
    console.log(`[Context] Cleared all cache (${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.contextCache.size,
      timeout: this.cacheTimeout,
    };
  }
}

export default new ContextService();

