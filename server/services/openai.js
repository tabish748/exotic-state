import OpenAI from 'openai';
import { config } from '../config/config.js';

/**
 * OpenAI Service
 * Handles all interactions with OpenAI API
 */
class OpenAIService {
  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.model = config.openai.model;
    this.temperature = config.openai.temperature;
    this.maxTokens = config.openai.maxTokens;
  }

  /**
   * Generate chat response with context
   * @param {Array} messages - Conversation messages
   * @param {Object} pageContext - Current page context
   * @returns {Promise<string>} AI response
   */
  async generateResponse(messages, pageContext = null) {
    try {
      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(pageContext);
      
      // Prepare messages array
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

      console.log(`[OpenAI] Generating response with ${messages.length} messages`);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: chatMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        presence_penalty: 0.3, // Encourage more focused responses
        frequency_penalty: 0.3, // Reduce repetition
      });

      const aiResponse = response.choices[0].message.content;
      console.log(`[OpenAI] Response generated successfully (${aiResponse.length} chars)`);
      
      return aiResponse;
    } catch (error) {
      console.error('[OpenAI] API Error:', error);
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.status === 500) {
        throw new Error('OpenAI API server error. Please try again later.');
      }
      
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * Build comprehensive system prompt with page context
   * @param {Object} pageContext - Current page context from scraper
   * @returns {string} System prompt
   */
  buildSystemPrompt(pageContext) {
    let prompt = `You are a knowledgeable and friendly AI assistant for Exotic Estates, a premier luxury villa rental company specializing in high-end vacation properties.

COMPANY OVERVIEW:
Exotic Estates offers luxury villa rentals in premium destinations including:
- Hawaii (Maui, Kauai, Big Island, Oahu)
- Mexico (Cabo, Riviera Maya, Nayarit, Puerto Vallarta, Zihuatanejo)
- Colorado (Breckenridge, Vail, Telluride, Steamboat Springs, Beaver Creek)
- Utah (Park City, Deer Valley, The Canyons)
- California (Palm Springs)
- Montana (Big Sky)
- Caribbean (Jamaica, St. Barts, St. Martin, Dominican Republic)

YOUR ROLE:
- Help visitors find the perfect luxury vacation rental
- Answer questions about destinations, properties, amenities, and local attractions
- Provide personalized recommendations based on preferences
- Assist with property comparisons and availability inquiries
- Share information about destinations, activities, and experiences

GUIDELINES:
1. Be friendly, professional, and luxury-focused in your tone
2. Provide accurate information based on the context provided
3. If you don't know something specific, admit it and suggest contacting Exotic Estates directly at 888.628.4896 or info@exoticestates.com
4. Help users find properties that match their preferences (bedrooms, location, amenities, budget)
5. Provide information about destinations, local attractions, activities, and experiences
6. Be conversational and engaging while maintaining professionalism
7. Focus on the luxury and premium nature of the properties
8. When discussing properties, mention key features like bedrooms, amenities, location highlights
9. When discussing destinations, mention what makes them special and unique
10. Always be helpful and aim to provide value to the user

RESPONSE STYLE:
- Use natural, conversational language
- Be enthusiastic but concise
- Provide specific, relevant details without unnecessary elaboration
- Keep responses between 2-4 sentences for most questions
- For complex questions, use 4-6 sentences maximum
- Be direct and to the point while remaining helpful
- Avoid repeating information
- Focus on answering the specific question asked`;

    // Add page context if available
    if (pageContext) {
      prompt += `\n\n=== CURRENT PAGE CONTEXT ===\n`;
      prompt += `The user is currently viewing: ${pageContext.title || pageContext.url}\n`;
      prompt += `Page Type: ${pageContext.pageType}\n`;
      prompt += `URL: ${pageContext.url}\n\n`;

      // Property page context
      if (pageContext.pageType === 'property' && pageContext.property) {
        prompt += `PROPERTY INFORMATION:\n`;
        const prop = pageContext.property;
        
        if (prop.name) prompt += `- Property Name: ${prop.name}\n`;
        if (prop.location) prompt += `- Location: ${prop.location}\n`;
        if (prop.destinationInfo) {
          prompt += `- Destination: ${prop.destinationInfo.location}\n`;
        }
        if (prop.bedrooms) prompt += `- Bedrooms: ${prop.bedrooms}\n`;
        if (prop.bathrooms) prompt += `- Bathrooms: ${prop.bathrooms}\n`;
        if (prop.sleeps) prompt += `- Sleeps: ${prop.sleeps} guests\n`;
        if (prop.price) prompt += `- Price: ${prop.price}\n`;
        if (prop.amenities && prop.amenities.length > 0) {
          prompt += `- Amenities: ${prop.amenities.slice(0, 10).join(', ')}\n`;
        }
        if (prop.description) {
          prompt += `- Description: ${prop.description}\n`;
        }
        prompt += `\nUse this property information to provide detailed and accurate responses about this specific property.\n`;
      }
      
      // Destination page context
      else if (pageContext.pageType === 'destination' && pageContext.destination) {
        prompt += `DESTINATION INFORMATION:\n`;
        const dest = pageContext.destination;
        
        if (dest.name) prompt += `- Destination: ${dest.name}\n`;
        if (pageContext.destinationInfo) {
          prompt += `- Region: ${pageContext.destinationInfo.region}\n`;
          prompt += `- Location: ${pageContext.destinationInfo.location}\n`;
        }
        if (dest.description) {
          prompt += `- About: ${dest.description}\n`;
        }
        if (dest.features && dest.features.length > 0) {
          prompt += `- Key Features: ${dest.features.slice(0, 8).join(', ')}\n`;
        }
        if (dest.highlights && dest.highlights.length > 0) {
          prompt += `- Highlights: ${dest.highlights.slice(0, 5).join(', ')}\n`;
        }
        prompt += `\nUse this destination information to provide helpful details about this location, its attractions, and available properties.\n`;
      }
      
      // Guide or blog context
      else if ((pageContext.pageType === 'guide' || pageContext.pageType === 'blog') && pageContext.content) {
        prompt += `CONTENT INFORMATION:\n`;
        if (pageContext.title) prompt += `- Title: ${pageContext.title}\n`;
        if (pageContext.content.mainText) {
          prompt += `- Content Summary: ${pageContext.content.mainText.substring(0, 400)}\n`;
        }
        if (pageContext.content.headings && pageContext.content.headings.length > 0) {
          prompt += `- Key Topics: ${pageContext.content.headings.slice(0, 5).join(', ')}\n`;
        }
        prompt += `\nUse this content to answer questions related to the guide or article the user is reading.\n`;
      }
      
      // Generic page context
      else if (pageContext.content) {
        prompt += `PAGE CONTENT:\n`;
        if (pageContext.content.mainText) {
          prompt += `${pageContext.content.mainText.substring(0, 500)}\n`;
        }
        if (pageContext.content.headings && pageContext.content.headings.length > 0) {
          prompt += `\nKey Topics: ${pageContext.content.headings.slice(0, 5).join(', ')}\n`;
        }
      }

      // Add destination info if available
      if (pageContext.destinationInfo) {
        prompt += `\nDestination Context: ${pageContext.destinationInfo.location} (${pageContext.destinationInfo.region})\n`;
      }

      prompt += `\nRemember to use this context to provide relevant and helpful responses. If the user asks about something on this page, reference the context provided.\n`;
    }

    return prompt;
  }

  /**
   * Validate API connection
   * @returns {Promise<boolean>}
   */
  async validateConnection() {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('[OpenAI] Connection validation failed:', error.message);
      return false;
    }
  }
}

export default new OpenAIService();

