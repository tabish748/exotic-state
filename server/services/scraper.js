import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../config/config.js';
import { sanitizeUrl, extractDestinationFromUrl, cleanText } from '../utils/helpers.js';

/**
 * Professional Page Scraper Service
 * Handles real-time scraping of Exotic Estates pages
 */
class PageScraper {
  constructor() {
    this.timeout = config.scraping.timeout;
    this.userAgent = config.scraping.userAgent;
    this.maxRetries = config.scraping.maxRetries;
    this.retryDelay = config.scraping.retryDelay;
  }

  /**
   * Scrape a page and extract structured data
   * @param {string} url - Page URL to scrape
   * @returns {Promise<Object>} Structured page context
   */
  async scrapePage(url) {
    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
      throw new Error('Invalid URL provided');
    }

    let lastError;
    
    // Retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[Scraper] Scraping ${sanitizedUrl} (attempt ${attempt}/${this.maxRetries})`);
        
        const response = await axios.get(sanitizedUrl, {
          timeout: this.timeout,
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          validateStatus: (status) => status >= 200 && status < 400,
        });

        const $ = cheerio.load(response.data);
        
        // Detect page type
        const pageType = this.detectPageType(sanitizedUrl, $);
        
        // Build base context
        const context = {
          url: sanitizedUrl,
          pathname: new URL(sanitizedUrl).pathname,
          pageType,
          title: this.extractTitle($),
          metaDescription: this.extractMetaDescription($),
          scrapedAt: new Date().toISOString(),
        };

        // Extract page-specific data
        switch (pageType) {
          case 'property':
            context.property = this.extractPropertyData($, sanitizedUrl);
            break;
          case 'destination':
            context.destination = this.extractDestinationData($, sanitizedUrl);
            break;
          case 'guide':
            context.guide = this.extractGuideData($);
            break;
          case 'blog':
            context.blog = this.extractBlogData($);
            break;
          case 'homepage':
            context.homepage = this.extractHomepageData($);
            break;
          default:
            context.content = this.extractGenericContent($);
        }

        // Extract common content
        context.content = {
          headings: this.extractHeadings($),
          mainText: this.extractMainText($),
          keyPoints: this.extractKeyPoints($),
        };

        // Add destination info if available
        const destinationInfo = extractDestinationFromUrl(sanitizedUrl);
        if (destinationInfo) {
          context.destinationInfo = destinationInfo;
        }

        console.log(`[Scraper] Successfully scraped ${pageType} page: ${context.title}`);
        return context;

      } catch (error) {
        lastError = error;
        console.error(`[Scraper] Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Failed to scrape page after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Delay helper for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Detect page type from URL and content
   */
  detectPageType(url, $) {
    const pathname = new URL(url).pathname.toLowerCase();
    
    if (pathname === '/' || pathname === '') return 'homepage';
    if (pathname.includes('/properties/') || pathname.includes('/property/')) return 'property';
    if (pathname.includes('/destinations/') || pathname.includes('/destination/')) return 'destination';
    if (pathname.includes('/guides/') || pathname.includes('/guide/')) return 'guide';
    if (pathname.includes('/blog/') || pathname.includes('/luxury-advisor/')) return 'blog';
    if (pathname.includes('/about') || pathname.includes('/contact')) return 'static';
    
    return 'other';
  }

  /**
   * Extract page title
   */
  extractTitle($) {
    return cleanText(
      $('title').text() || 
      $('h1').first().text() || 
      $('meta[property="og:title"]').attr('content') || 
      $('meta[name="twitter:title"]').attr('content') || ''
    );
  }

  /**
   * Extract meta description
   */
  extractMetaDescription($) {
    return cleanText(
      $('meta[name="description"]').attr('content') || 
      $('meta[property="og:description"]').attr('content') || 
      $('meta[name="twitter:description"]').attr('content') || ''
    );
  }

  /**
   * Extract property-specific data
   */
  extractPropertyData($, url) {
    const property = {
      name: cleanText(
        $('h1').first().text() || 
        $('.property-title, .villa-title, [class*="property-name"]').first().text() || 
        $('meta[property="og:title"]').attr('content') || ''
      ),
      location: cleanText($('.location, .address, [class*="location"]').first().text()),
      description: cleanText($('.property-description, .villa-description, article p, .description').first().text(), 500),
    };

    // Extract property details
    const detailsText = $('.property-details, .villa-details, .details, [class*="details"]').text();
    
    // Extract bedrooms
    const bedroomMatch = detailsText.match(/(\d+)\s*(?:bedroom|bed|br|bd)/i) || 
                        $('body').text().match(/(\d+)\s*(?:bedroom|bed|br|bd)/i);
    if (bedroomMatch) property.bedrooms = parseInt(bedroomMatch[1]);

    // Extract bathrooms
    const bathroomMatch = detailsText.match(/(\d+)\s*(?:bathroom|bath|ba)/i) ||
                         $('body').text().match(/(\d+)\s*(?:bathroom|bath|ba)/i);
    if (bathroomMatch) property.bathrooms = parseInt(bathroomMatch[1]);

    // Extract sleeps/guests
    const sleepsMatch = detailsText.match(/(?:sleeps|accommodates|guests?)\s*:?\s*(\d+)/i) ||
                       $('body').text().match(/(?:sleeps|accommodates|guests?)\s*:?\s*(\d+)/i);
    if (sleepsMatch) property.sleeps = parseInt(sleepsMatch[1]);

    // Extract amenities
    property.amenities = this.extractAmenities($);
    
    // Extract price
    const priceText = $('.price, .rate, [class*="price"], [class*="rate"]').first().text().trim();
    if (priceText) {
      property.price = cleanText(priceText, 50);
    }

    // Extract images
    const images = [];
    $('img[src*="property"], img[src*="villa"], .property-image img, .gallery img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !images.includes(src) && images.length < 5) {
        images.push(src.startsWith('http') ? src : `https://www.exoticestates.com${src}`);
      }
    });
    if (images.length > 0) property.images = images;

    return property;
  }

  /**
   * Extract destination-specific data
   */
  extractDestinationData($, url) {
    const destination = {
      name: cleanText($('h1').first().text() || $('.destination-title').first().text()),
      description: cleanText($('.destination-description, article p, .description, main p').first().text(), 500),
    };

    // Extract key features or highlights
    const features = [];
    $('.features li, .highlights li, .key-points li, [class*="feature"] li').each((i, el) => {
      const text = cleanText($(el).text());
      if (text && text.length < 200) features.push(text);
    });
    destination.features = features.slice(0, 15);

    // Extract destination highlights from headings
    const highlights = [];
    $('h2, h3').each((i, el) => {
      const text = cleanText($(el).text());
      if (text && text.length < 100) highlights.push(text);
    });
    destination.highlights = highlights.slice(0, 10);

    return destination;
  }

  /**
   * Extract guide data
   */
  extractGuideData($) {
    return {
      title: cleanText($('h1, .guide-title, .article-title').first().text()),
      content: cleanText($('article, .guide-content, main, .content').text(), 2000),
    };
  }

  /**
   * Extract blog data
   */
  extractBlogData($) {
    return {
      title: cleanText($('h1, .post-title, .article-title').first().text()),
      content: cleanText($('article, .post-content, .article-content, main').text(), 2000),
      author: cleanText($('.author, .by-author, [class*="author"]').first().text()),
      date: cleanText($('.date, .published-date, [class*="date"]').first().text()),
    };
  }

  /**
   * Extract homepage data
   */
  extractHomepageData($) {
    const featuredDestinations = [];
    $('.destination, .featured-destination, [class*="destination"]').each((i, el) => {
      const text = cleanText($(el).text());
      if (text && text.length < 100) featuredDestinations.push(text);
    });

    return {
      heroText: cleanText($('.hero h1, .banner h1, .hero-title').first().text()),
      featuredDestinations: featuredDestinations.slice(0, 10),
    };
  }

  /**
   * Extract generic content
   */
  extractGenericContent($) {
    return {
      mainText: cleanText($('main, article, .content, .main-content').first().text(), 1000),
    };
  }

  /**
   * Extract headings
   */
  extractHeadings($) {
    const headings = [];
    $('h1, h2, h3').each((i, el) => {
      const text = cleanText($(el).text());
      if (text && text.length > 0 && text.length < 200) {
        headings.push(text);
      }
    });
    return headings.slice(0, 15);
  }

  /**
   * Extract main text content
   */
  extractMainText($) {
    // Remove unwanted elements
    $('script, style, nav, footer, header, .nav, .footer, .header, .sidebar').remove();
    
    const mainContent = $('main, article, .content, .main-content, .page-content').first();
    if (mainContent.length) {
      return cleanText(mainContent.text(), 2000);
    }
    
    // Fallback to body text
    return cleanText($('body').text(), 2000);
  }

  /**
   * Extract key points (bullets, lists)
   */
  extractKeyPoints($) {
    const points = [];
    $('ul li, ol li, .key-points li, .features li, .highlights li').each((i, el) => {
      const text = cleanText($(el).text());
      if (text && text.length > 0 && text.length < 200) {
        points.push(text);
      }
    });
    return points.slice(0, 20);
  }

  /**
   * Extract amenities
   */
  extractAmenities($) {
    const amenities = [];
    
    // Try multiple selectors
    $('.amenities li, .amenity, [class*="amenity"] li, [class*="amenity"]').each((i, el) => {
      const text = cleanText($(el).text());
      if (text && text.length > 0 && text.length < 100) {
        amenities.push(text);
      }
    });
    
    // If no amenities found, try to extract from text
    if (amenities.length === 0) {
      const bodyText = $('body').text().toLowerCase();
      const commonAmenities = [
        'pool', 'wifi', 'kitchen', 'beachfront', 'ocean view', 'parking',
        'air conditioning', 'hot tub', 'fireplace', 'gym', 'tennis',
        'golf', 'concierge', 'maid service', 'linens', 'towels'
      ];
      
      commonAmenities.forEach(amenity => {
        if (bodyText.includes(amenity)) {
          amenities.push(amenity);
        }
      });
    }
    
    return amenities.slice(0, 20);
  }
}

export default new PageScraper();

