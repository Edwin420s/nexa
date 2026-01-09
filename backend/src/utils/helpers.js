"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQueryString = exports.stringToColor = exports.calculateStringSimilarity = exports.sanitizeObject = exports.setCacheHeaders = exports.generatePagination = exports.isValidEmail = exports.retryWithBackoff = exports.sleep = exports.deepMerge = exports.deepClone = exports.sanitizeFilename = exports.truncateString = exports.formatTime = exports.formatBytes = exports.generateUniqueId = exports.generateRandomString = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a random string of specified length
 */
const generateRandomString = (length = 16) => {
    return crypto_1.default.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};
exports.generateRandomString = generateRandomString;
/**
 * Generate a unique ID for projects, agents, etc.
 */
const generateUniqueId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${random}`;
};
exports.generateUniqueId = generateUniqueId;
/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
exports.formatBytes = formatBytes;
/**
 * Format milliseconds to human readable time
 */
const formatTime = (ms) => {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000)
        return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
};
exports.formatTime = formatTime;
/**
 * Truncate string with ellipsis
 */
const truncateString = (str, length = 100) => {
    if (str.length <= length)
        return str;
    return str.substring(0, length - 3) + '...';
};
exports.truncateString = truncateString;
/**
 * Sanitize filename
 */
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-z0-9.\-_]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
};
exports.sanitizeFilename = sanitizeFilename;
/**
 * Deep clone an object
 */
const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => (0, exports.deepClone)(item));
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = (0, exports.deepClone)(obj[key]);
            }
        }
        return cloned;
    }
    return obj;
};
exports.deepClone = deepClone;
/**
 * Merge two objects deeply
 */
const deepMerge = (target, source) => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    output[key] = source[key];
                }
                else {
                    output[key] = (0, exports.deepMerge)(target[key], source[key]);
                }
            }
            else {
                output[key] = source[key];
            }
        });
    }
    return output;
};
exports.deepMerge = deepMerge;
const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
};
/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.sleep = sleep;
/**
 * Retry a function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries)
                break;
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await (0, exports.sleep)(delay + Math.random() * 1000); // Add jitter
        }
    }
    throw lastError;
};
exports.retryWithBackoff = retryWithBackoff;
/**
 * Validate email address
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Generate pagination metadata
 */
const generatePagination = (totalItems, currentPage, pageSize, baseUrl) => {
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
exports.generatePagination = generatePagination;
/**
 * Set cache headers on response
 */
const setCacheHeaders = (res, maxAge = 3600, staleWhileRevalidate = 86400) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
    res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
};
exports.setCacheHeaders = setCacheHeaders;
/**
 * Remove sensitive data from object
 */
const sanitizeObject = (obj, sensitiveFields = ['password', 'token', 'secret', 'apiKey']) => {
    const sanitized = { ...obj };
    for (const field of sensitiveFields) {
        if (sanitized[field] !== undefined) {
            sanitized[field] = '[REDACTED]';
        }
        // Check nested objects
        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] && typeof sanitized[key] === 'object') {
                sanitized[key] = (0, exports.sanitizeObject)(sanitized[key], sensitiveFields);
            }
        });
    }
    return sanitized;
};
exports.sanitizeObject = sanitizeObject;
/**
 * Calculate similarity between two strings (0-1)
 */
const calculateStringSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0)
        return 1.0;
    const distance = levenshteinDistance(longer, shorter);
    return 1.0 - distance / longer.length;
};
exports.calculateStringSimilarity = calculateStringSimilarity;
const levenshteinDistance = (a, b) => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++)
        matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++)
        matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(matrix[j][i - 1] + 1, // deletion
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
const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
};
exports.stringToColor = stringToColor;
/**
 * Parse query string to object
 */
const parseQueryString = (query) => {
    return query.split('&').reduce((params, param) => {
        const [key, value] = param.split('=');
        if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
        return params;
    }, {});
};
exports.parseQueryString = parseQueryString;
