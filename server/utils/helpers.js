/**
 * Helper utility functions
 */

/**
 * Sanitize URL to ensure it's valid
 */
export function sanitizeUrl(url) {
  if (!url) return null;
  
  // Allowlist of trusted hosts for scraping (add EC2/local IPs for testing)
  const allowedHosts = [
    'www.exoticestates.com',
    'exoticestates.com',
    '16.16.128.91',
    'localhost',
    '127.0.0.1',
  ];

  // If URL doesn't start with http, assume it's a path on the primary domain
  if (!url.startsWith('http')) {
    const path = url.startsWith('/') ? url : `/${url}`;
    return `https://www.exoticestates.com${path}`;
  }
  
  // Validate allowed host
  try {
    const urlObj = new URL(url);
    if (allowedHosts.includes(urlObj.hostname)) {
      return url;
    }
  } catch (error) {
    return null;
  }
  
  return null;
}

/**
 * Extract destination information from URL
 */
export function extractDestinationFromUrl(url) {
  if (!url) return null;
  
  const urlLower = url.toLowerCase();
  const destinationMap = {
    // Hawaii
    'hawaii': { region: 'Hawaii', location: 'Hawaii' },
    'maui': { region: 'Hawaii', location: 'Maui, Hawaii' },
    'kauai': { region: 'Hawaii', location: 'Kauai, Hawaii' },
    'big-island': { region: 'Hawaii', location: 'Big Island, Hawaii' },
    'oahu': { region: 'Hawaii', location: 'Oahu, Hawaii' },
    
    // Mexico
    'cabo': { region: 'Mexico', location: 'Cabo, Mexico' },
    'cabo-san-lucas': { region: 'Mexico', location: 'Cabo San Lucas, Mexico' },
    'riviera-maya': { region: 'Mexico', location: 'Riviera Maya, Mexico' },
    'nayarit': { region: 'Mexico', location: 'Nayarit, Mexico' },
    'puerto-vallarta': { region: 'Mexico', location: 'Puerto Vallarta, Mexico' },
    'zihuatanejo': { region: 'Mexico', location: 'Zihuatanejo, Mexico' },
    
    // Colorado
    'breckenridge': { region: 'Colorado', location: 'Breckenridge, Colorado' },
    'vail': { region: 'Colorado', location: 'Vail, Colorado' },
    'telluride': { region: 'Colorado', location: 'Telluride, Colorado' },
    'steamboat-springs': { region: 'Colorado', location: 'Steamboat Springs, Colorado' },
    'beaver-creek': { region: 'Colorado', location: 'Beaver Creek, Colorado' },
    
    // Utah
    'park-city': { region: 'Utah', location: 'Park City, Utah' },
    'deer-valley': { region: 'Utah', location: 'Deer Valley, Utah' },
    'the-canyons': { region: 'Utah', location: 'The Canyons, Utah' },
    
    // California
    'palm-springs': { region: 'California', location: 'Palm Springs, California' },
    
    // Montana
    'big-sky': { region: 'Montana', location: 'Big Sky, Montana' },
    
    // Caribbean
    'jamaica': { region: 'Caribbean', location: 'Jamaica' },
    'st-barts': { region: 'Caribbean', location: 'St. Barts' },
    'st-martin': { region: 'Caribbean', location: 'St. Martin' },
    'dominican-rep': { region: 'Caribbean', location: 'Dominican Republic' },
  };

  for (const [key, value] of Object.entries(destinationMap)) {
    if (urlLower.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * Clean and truncate text
 */
export function cleanText(text, maxLength = 2000) {
  if (!text) return '';
  
  // Remove extra whitespace
  let cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Truncate if needed
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
}

/**
 * Generate unique conversation ID
 */
export function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate conversation ID format
 */
export function isValidConversationId(id) {
  return id && typeof id === 'string' && id.startsWith('conv_');
}

/**
 * Error response formatter
 */
export function formatError(error, includeStack = false) {
  const response = {
    error: error.message || 'An error occurred',
    timestamp: new Date().toISOString(),
  };
  
  if (includeStack && error.stack) {
    response.stack = error.stack;
  }
  
  return response;
}

