import { config } from '../config/config.js';
import { generateConversationId, isValidConversationId } from '../utils/helpers.js';

/**
 * Conversation Service
 * Manages conversation storage and retrieval
 */
class ConversationService {
  constructor() {
    // In-memory storage (in production, use a database)
    this.conversations = new Map();
    this.conversationTTL = config.cache.conversationTTL;
  }

  /**
   * Get or create a conversation
   * @param {string} conversationId - Conversation ID (optional)
   * @returns {Object} Conversation object
   */
  getOrCreateConversation(conversationId = null) {
    // Validate or generate ID
    if (conversationId && isValidConversationId(conversationId)) {
      const existing = this.conversations.get(conversationId);
      if (existing) {
        return existing;
      }
    }

    // Create new conversation
    const newId = conversationId && isValidConversationId(conversationId) 
      ? conversationId 
      : generateConversationId();

    const conversation = {
      id: newId,
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    this.conversations.set(newId, conversation);
    console.log(`[Conversation] Created new conversation: ${newId}`);
    
    return conversation;
  }

  /**
   * Get conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Object|null} Conversation or null if not found
   */
  getConversation(conversationId) {
    if (!isValidConversationId(conversationId)) {
      return null;
    }
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Add message to conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message object
   * @returns {Object} Updated conversation
   */
  addMessage(conversationId, message) {
    const conversation = this.getOrCreateConversation(conversationId);
    
    conversation.messages.push({
      ...message,
      timestamp: new Date().toISOString(),
    });
    
    conversation.lastUpdated = new Date().toISOString();
    this.conversations.set(conversationId, conversation);
    
    return conversation;
  }

  /**
   * Get conversation messages formatted for OpenAI
   * @param {string} conversationId - Conversation ID
   * @returns {Array} Formatted messages
   */
  getFormattedMessages(conversationId) {
    const conversation = this.getConversation(conversationId);
    if (!conversation) {
      return [];
    }

    return conversation.messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
  }

  /**
   * Clean up old conversations
   * @returns {number} Number of conversations cleaned
   */
  cleanupOldConversations() {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, conv] of this.conversations.entries()) {
      const lastUpdated = new Date(conv.lastUpdated || conv.createdAt).getTime();
      if (now - lastUpdated > this.conversationTTL) {
        this.conversations.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Conversation] Cleaned up ${cleaned} old conversations`);
    }

    return cleaned;
  }

  /**
   * Delete a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {boolean} Success
   */
  deleteConversation(conversationId) {
    if (!isValidConversationId(conversationId)) {
      return false;
    }
    return this.conversations.delete(conversationId);
  }

  /**
   * Get conversation statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      totalConversations: this.conversations.size,
      ttl: this.conversationTTL,
    };
  }
}

export default new ConversationService();

