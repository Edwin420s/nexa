import crypto from 'crypto';
import { Response } from 'express';

/**
 * Generate a random string of specified length
 */
export const generateRandomString = (length: number = 16): string => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Generate a unique ID for projects, agents, etc.
 */
export const generateUniqueId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format milliseconds to human readable time
 */
export const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
};

/**
 * Truncate string with ellipsis
 */
export const truncateString = (str: string, length: number = 100): string => {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9.\-_]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
};

/**
 * Merge two objects deeply
 */
export const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
};

const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) break;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay + Math.random() * 1000); // Add jitter
    }
  }
  
  throw lastError!;
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate pagination metadata
 */
export const generatePagination = (
  totalItems: number,
  currentPage: number,
  pageSize: number,
  baseUrl: string
) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  return {
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? `${baseUrl}?page=${currentPage + 1}&limit=${pageSize}` : null,
    prevPage: hasPrevPage ? `${baseUrl}?page=${currentPage - 1}&limit=${pageSize}` : null,
    firstPage: `${baseUrl}?page=1&limit=${pageSize}`,
    lastPage: `${baseUrl}?page=${totalPages}&limit=${pageSize}`
  };
};

/**
 * Set cache headers on response
 */
export const setCacheHeaders = (
  res: Response,
  maxAge: number = 3600,
  staleWhileRevalidate: number = 86400
): void => {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
  res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
};

/**
 * Remove sensitive data from object
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey']
): Partial<T> => {
  const sanitized: any = { ...obj };
  
  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }
    
    // Check nested objects
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] && typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeObject(sanitized[key], sensitiveFields);
      }
    });
  }
  
  return sanitized;
};

/**
 * Calculate similarity between two strings (0-1)
 */
export const calculateStringSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return 1.0 - distance / longer.length;
};

const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
};

/**
 * Generate a color from string (for consistent UI colors)
 */
export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

/**
 * Parse query string to object
 */
export const parseQueryString = (query: string): Record<string, string> => {
  return query.split('&').reduce((params, param) => {
    const [key, value] = param.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
    return params;
  }, {} as Record<string, string>);
};