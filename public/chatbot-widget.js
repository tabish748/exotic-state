/**
 * Exotic Estates Chatbot Widget
 * Professional embeddable chatbot with real-time page context awareness
 * 
 * Usage:
 * <script src="http://your-server.com/public/chatbot-widget.js"
 *         data-api-url="http://your-server.com/api"
 *         data-config='{"theme": "light", "position": "bottom-right"}'></script>
 */

(function() {
  'use strict';

  // Configuration
  const DEFAULT_CONFIG = {
    apiUrl: '', // Will be set from data-api-url attribute (required)
    theme: 'light',
    position: 'bottom-right',
    primaryColor: '#1a1a1a',
    buttonText: 'Chat with us',
    buttonIcon: '💬',
    greetingMessage: "Hello! I'm here to help you find the perfect luxury villa for your vacation. What are you looking for?",
    enableContextAwareness: true,
    storageKey: 'exoticestates_chat',
  };

  // Get configuration from script tag
  function getConfig() {
    const script = document.currentScript || document.querySelector('script[data-api-url]');
    if (!script) {
      console.error('[Chatbot] Script tag not found or missing data-api-url attribute');
      return DEFAULT_CONFIG;
    }

    const config = { ...DEFAULT_CONFIG };
    
    // API URL from data attribute (REQUIRED)
    const apiUrl = script.getAttribute('data-api-url');
    if (!apiUrl) {
      console.error('[Chatbot] data-api-url attribute is required!');
      return DEFAULT_CONFIG;
    }
    config.apiUrl = apiUrl;

    // Additional config from data-config JSON
    if (script.getAttribute('data-config')) {
      try {
        const customConfig = JSON.parse(script.getAttribute('data-config'));
        Object.assign(config, customConfig);
      } catch (e) {
        console.error('Invalid data-config JSON:', e);
      }
    }

    return config;
  }

  const config = getConfig();

  // Chatbot Widget Class
  class ExoticEstatesChatbot {
    constructor(config) {
      this.config = config;
      this.isOpen = false;
      this.conversationId = null;
      this.messages = [];
      this.isLoading = false;
      this.isDarkTheme = (this.config.theme || 'light').toLowerCase() === 'dark';
      this.init();
    }

    init() {
      this.loadConversation();
      this.createWidget();
      this.attachEventListeners();
      console.log('[Chatbot] Widget initialized');
    }

    // Create widget HTML
    createWidget() {
      // Create container
      const container = document.createElement('div');
      container.id = 'exoticestates-chatbot';
      container.className = `ee-chatbot-container ee-theme-${this.config.theme}`;
      container.style.cssText = `
        position: fixed;
        ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      `;

      // Create button
      const button = document.createElement('button');
      button.id = 'ee-chatbot-button';
      button.className = 'ee-chatbot-button';
      button.innerHTML = `
        <span class="ee-chatbot-icon">${this.config.buttonIcon}</span>
        <span class="ee-chatbot-text">${this.config.buttonText}</span>
      `;
      button.style.cssText = `
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      `;

      // Create chat window
      const chatWindow = document.createElement('div');
      chatWindow.id = 'ee-chatbot-window';
      chatWindow.className = 'ee-chatbot-window';
      chatWindow.style.cssText = `
        display: none;
        width: 380px;
        height: 600px;
        background: ${this.isDarkTheme ? '#0f172a' : 'white'};
        border-radius: 16px;
        box-shadow: ${this.isDarkTheme ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.2)'};
        flex-direction: column;
        overflow: hidden;
        position: absolute;
        bottom: 80px;
        ${this.config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
        color: ${this.isDarkTheme ? '#e5e7eb' : '#333'};
      `;

      // Header
      const header = document.createElement('div');
      header.className = 'ee-chatbot-header';
      header.style.cssText = `
        background: ${this.config.primaryColor};
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      header.innerHTML = `
        <div>
          <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Exotic Estates</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Luxury Villa Specialist</p>
        </div>
        <button id="ee-chatbot-close" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
      `;

      // Messages container
      const messagesContainer = document.createElement('div');
      messagesContainer.id = 'ee-chatbot-messages';
      messagesContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: ${this.isDarkTheme ? '#0b1220' : '#f8f9fa'};
        color: ${this.isDarkTheme ? '#e5e7eb' : '#333'};
      `;

      // Input container
      const inputContainer = document.createElement('div');
      inputContainer.className = 'ee-chatbot-input-container';
      inputContainer.style.cssText = `
        padding: 16px;
        background: ${this.isDarkTheme ? '#0b1220' : 'white'};
        border-top: 1px solid ${this.isDarkTheme ? '#1f2937' : '#e0e0e0'};
        display: flex;
        gap: 8px;
      `;

      const input = document.createElement('input');
      input.id = 'ee-chatbot-input';
      input.type = 'text';
      input.placeholder = 'Type your message...';
      input.style.cssText = `
        flex: 1;
        padding: 12px 16px;
        border: 1px solid ${this.isDarkTheme ? '#1f2937' : '#e0e0e0'};
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        background: ${this.isDarkTheme ? '#0f172a' : '#fff'};
        color: ${this.isDarkTheme ? '#e5e7eb' : '#333'};
      `;
      input.addEventListener('focus', () => {
        input.style.borderColor = this.config.primaryColor;
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = this.isDarkTheme ? '#1f2937' : '#e0e0e0';
      });

      const sendButton = document.createElement('button');
      sendButton.id = 'ee-chatbot-send';
      sendButton.innerHTML = 'Send';
      sendButton.style.cssText = `
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        border-radius: 24px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      `;

      // Assemble
      inputContainer.appendChild(input);
      inputContainer.appendChild(sendButton);
      chatWindow.appendChild(header);
      chatWindow.appendChild(messagesContainer);
      chatWindow.appendChild(inputContainer);
      container.appendChild(button);
      container.appendChild(chatWindow);
      document.body.appendChild(container);

      // Store references
      this.button = button;
      this.chatWindow = chatWindow;
      this.messagesContainer = messagesContainer;
      this.input = input;
      this.sendButton = sendButton;

      // Additional dark theme tweaks
      if (this.isDarkTheme) {
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)';
      }

      // Add hover effects
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      });

      sendButton.addEventListener('mouseenter', () => {
        sendButton.style.opacity = '0.9';
      });
      sendButton.addEventListener('mouseleave', () => {
        sendButton.style.opacity = '1';
      });

      // Load initial greeting if new conversation
      if (this.messages.length === 0) {
        this.addMessage('assistant', this.config.greetingMessage);
      } else {
        // Render existing messages
        this.messages.forEach(msg => this.renderMessage(msg));
      }
    }

    // Attach event listeners
    attachEventListeners() {
      this.button.addEventListener('click', () => this.toggleChat());
      document.getElementById('ee-chatbot-close').addEventListener('click', () => this.closeChat());
      this.sendButton.addEventListener('click', () => this.sendMessage());
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Toggle chat window
    toggleChat() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.openChat();
      } else {
        this.closeChat();
      }
    }

    // Open chat
    openChat() {
      this.chatWindow.style.display = 'flex';
      this.button.style.display = 'none';
      this.input.focus();
      this.scrollToBottom();
    }

    // Close chat
    closeChat() {
      this.chatWindow.style.display = 'none';
      this.button.style.display = 'flex';
    }

    // Send message
    async sendMessage() {
      const message = this.input.value.trim();
      if (!message || this.isLoading) return;

      // Add user message
      this.addMessage('user', message);
      this.input.value = '';
      this.setLoading(true);

      try {
        // Get current page URL for context
        const pageUrl = this.config.enableContextAwareness ? window.location.href : null;

        // Send to API
        const response = await fetch(`${this.config.apiUrl}/chat/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationId: this.conversationId,
            pageUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Update conversation ID
        if (data.conversationId) {
          this.conversationId = data.conversationId;
        }

        // Add assistant response
        this.addMessage('assistant', data.response);
        this.saveConversation();

      } catch (error) {
        console.error('[Chatbot] Error sending message:', error);
        this.addMessage('assistant', 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment, or contact Exotic Estates directly at 888.628.4896.');
      } finally {
        this.setLoading(false);
      }
    }

    // Add message to chat
    addMessage(role, content) {
      const message = {
        role,
        content,
        timestamp: new Date().toISOString(),
      };
      this.messages.push(message);
      this.renderMessage(message);
      this.scrollToBottom();
      this.saveConversation();
    }

    // Render message
    renderMessage(message) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `ee-chatbot-message ee-message-${message.role}`;
      messageDiv.style.cssText = `
        display: flex;
        ${message.role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
        margin-bottom: 8px;
      `;

      const bubble = document.createElement('div');
      bubble.className = 'ee-message-bubble';
      const isUser = message.role === 'user';
      const assistantBg = this.isDarkTheme ? '#1f2937' : 'white';
      const assistantColor = this.isDarkTheme ? '#e5e7eb' : '#333';
      const assistantShadow = this.isDarkTheme ? '' : 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
      bubble.style.cssText = `
        max-width: 75%;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
        ${isUser 
          ? `background: ${this.config.primaryColor}; color: white; border-bottom-right-radius: 4px;`
          : `background: ${assistantBg}; color: ${assistantColor}; border-bottom-left-radius: 4px; ${assistantShadow}`
        }
      `;
      bubble.textContent = message.content;

      messageDiv.appendChild(bubble);
      this.messagesContainer.appendChild(messageDiv);
    }

    // Set loading state with professional typing animation
    setLoading(loading) {
      this.isLoading = loading;
      if (loading) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'ee-chatbot-loading';
        loadingDiv.className = 'ee-chatbot-message ee-message-assistant';
        loadingDiv.style.cssText = 'display: flex; justify-content: flex-start; margin-bottom: 8px;';
        const assistantBg = this.isDarkTheme ? '#1f2937' : 'white';
        const assistantColor = this.isDarkTheme ? '#e5e7eb' : '#333';
        loadingDiv.innerHTML = `
          <div class="ee-message-bubble" style="background: ${assistantBg}; color: ${assistantColor}; padding: 16px 20px; border-radius: 18px; border-bottom-left-radius: 4px; ${this.isDarkTheme ? '' : 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);'} display: flex; align-items: center; gap: 8px;">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span style="color: ${this.isDarkTheme ? '#cbd5e1' : '#64748b'}; font-size: 13px; margin-left: 4px;"></span>
          </div>
        `;
        this.messagesContainer.appendChild(loadingDiv);
        this.scrollToBottom();
      } else {
        const loadingEl = document.getElementById('ee-chatbot-loading');
        if (loadingEl) loadingEl.remove();
      }
    }

    // Scroll to bottom
    scrollToBottom() {
      setTimeout(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }, 100);
    }

    // Save conversation to localStorage
    saveConversation() {
      try {
        const data = {
          conversationId: this.conversationId,
          messages: this.messages,
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(this.config.storageKey, JSON.stringify(data));
      } catch (error) {
        console.error('[Chatbot] Error saving conversation:', error);
      }
    }

    // Load conversation from localStorage
    loadConversation() {
      try {
        const data = localStorage.getItem(this.config.storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          this.conversationId = parsed.conversationId;
          this.messages = parsed.messages || [];
        }
      } catch (error) {
        console.error('[Chatbot] Error loading conversation:', error);
      }
    }
  }

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.3; }
      40% { opacity: 1; }
    }
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0;
    }
    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #667eea;
      display: inline-block;
      animation: typing-bounce 1.4s infinite ease-in-out;
    }
    .typing-indicator span:nth-child(1) {
      animation-delay: -0.32s;
    }
    .typing-indicator span:nth-child(2) {
      animation-delay: -0.16s;
    }
    .typing-indicator span:nth-child(3) {
      animation-delay: 0s;
    }
    @keyframes typing-bounce {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
    .ee-chatbot-messages::-webkit-scrollbar {
      width: 6px;
    }
    .ee-chatbot-messages::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    .ee-chatbot-messages::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;
    }
    .ee-chatbot-messages::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `;
  document.head.appendChild(style);

  // Initialize chatbot when DOM is ready
  function initChatbot() {
    try {
      console.log('[Chatbot] Initializing...', config);
      window.ExoticEstatesChatbot = new ExoticEstatesChatbot(config);
      console.log('[Chatbot] Initialized successfully');
    } catch (error) {
      console.error('[Chatbot] Initialization error:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }

})();

