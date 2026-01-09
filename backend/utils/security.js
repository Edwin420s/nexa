"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
exports.getSecurityService = getSecurityService;
exports.securityHeaders = securityHeaders;
exports.inputSanitization = inputSanitization;
exports.sqlInjectionProtection = sqlInjectionProtection;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
class SecurityService {
    constructor(config) {
        this.config = {
            jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            jwtExpire: process.env.JWT_EXPIRE || '7d',
            bcryptRounds: 10,
            apiKeyLength: 32,
            tokenExpiry: {
                access: 3600, // 1 hour
                refresh: 604800, // 7 days
                resetPassword: 3600 // 1 hour
            },
            ...config
        };
    }
    // Password hashing and verification
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(this.config.bcryptRounds);
        return bcryptjs_1.default.hash(password, salt);
    }
    async verifyPassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    // JWT token generation and verification
    generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.config.jwtSecret, {
            expiresIn: this.config.tokenExpiry.access
        });
    }
    generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.config.jwtSecret, {
            expiresIn: this.config.tokenExpiry.refresh
        });
    }
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.config.jwtSecret);
        }
        catch (error) {
            logger_1.default.error('Token verification failed:', error);
            return null;
        }
    }
    decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            logger_1.default.error('Token decoding failed:', error);
            return null;
        }
    }
    // API key generation
    generateApiKey() {
        const key = crypto_1.default.randomBytes(this.config.apiKeyLength).toString('hex');
        const hash = crypto_1.default.createHash('sha256').update(key).digest('hex');
        return { key, hash };
    }
    verifyApiKey(apiKey, storedHash) {
        const hash = crypto_1.default.createHash('sha256').update(apiKey).digest('hex');
        return hash === storedHash;
    }
    // CSRF token generation and verification
    generateCsrfToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    verifyCsrfToken(token, storedToken) {
        return crypto_1.default.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
    }
    // Password strength validation
    validatePasswordStrength(password) {
        const suggestions = [];
        let score = 0;
        // Length check
        if (password.length >= 12)
            score += 2;
        else if (password.length >= 8)
            score += 1;
        else
            suggestions.push('Use at least 8 characters');
        // Character variety
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        if (hasLower && hasUpper)
            score += 1;
        else
            suggestions.push('Use both uppercase and lowercase letters');
        if (hasDigit)
            score += 1;
        else
            suggestions.push('Add numbers');
        if (hasSpecial)
            score += 1;
        else
            suggestions.push('Add special characters');
        // Common password check
        const commonPasswords = [
            'password', '123456', 'qwerty', 'admin', 'welcome',
            'password123', '123456789', '12345678', '12345'
        ];
        if (commonPasswords.includes(password.toLowerCase())) {
            score = 0;
            suggestions.push('Avoid common passwords');
        }
        // Sequential characters check
        if (/(.)\1{2,}/.test(password)) {
            score -= 1;
            suggestions.push('Avoid repeating characters');
        }
        // Sequential numbers/letters
        if (/123|234|345|456|567|678|789|abc|bcd|cde|def/.test(password.toLowerCase())) {
            score -= 1;
            suggestions.push('Avoid sequential characters');
        }
        const valid = score >= 4;
        return { valid, score, suggestions };
    }
    // Generate secure random string
    generateSecureRandom(length = 16) {
        return crypto_1.default.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }
    // Encrypt and decrypt data
    encryptData(data, key) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }
    decryptData(encryptedData, key) {
        const parts = encryptedData.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    // Generate HMAC signature
    generateHmac(data, secret) {
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }
    verifyHmac(data, signature, secret) {
        const expectedSignature = this.generateHmac(data, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    // Request signature verification
    verifyRequestSignature(req, secret) {
        const timestamp = req.headers['x-timestamp'];
        const signature = req.headers['x-signature'];
        if (!timestamp || !signature) {
            return false;
        }
        // Check if timestamp is within allowed window (5 minutes)
        const requestTime = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        if (Math.abs(currentTime - requestTime) > 300) {
            return false;
        }
        // Reconstruct the signed data
        const data = `${req.method}:${req.path}:${timestamp}:${JSON.stringify(req.body)}`;
        return this.verifyHmac(data, signature, secret);
    }
    // Generate password reset token
    generatePasswordResetToken(userId) {
        const payload = {
            userId,
            type: 'password_reset',
            timestamp: Date.now()
        };
        return jsonwebtoken_1.default.sign(payload, this.config.jwtSecret, {
            expiresIn: this.config.tokenExpiry.resetPassword
        });
    }
    verifyPasswordResetToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.config.jwtSecret);
            if (decoded.type !== 'password_reset') {
                return { valid: false };
            }
            return { valid: true, userId: decoded.userId };
        }
        catch (error) {
            return { valid: false };
        }
    }
    // Sanitize user input
    sanitizeInput(input) {
        return input
            .replace(/[<>]/g, '') // Remove HTML tags
            .replace(/javascript:/gi, '') // Remove JavaScript protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }
    sanitizeObject(obj) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value);
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    // Check for SQL injection patterns
    detectSqlInjection(input) {
        const patterns = [
            /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi, // SQL meta characters
            /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi, // Typical SQL injection
            /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi, // OR injection
            /((\%27)|(\'))union/gi, // UNION injection
            /exec(\s|\+)+(s|x)p\w+/gi, // Stored procedure injection
            /(\s|%20)or(\s|%20)/gi // OR keyword with spaces
        ];
        return patterns.some(pattern => pattern.test(input));
    }
    // Check for XSS patterns
    detectXss(input) {
        const patterns = [
            /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
            /javascript:[^"]*/gi,
            /on\w+\s*=\s*"[^"]*"/gi,
            /on\w+\s*=\s*'[^']*'/gi,
            /on\w+\s*=\s*[^"'\s>]*/gi,
            /<iframe[^>]*>/gi,
            /<object[^>]*>/gi,
            /<embed[^>]*>/gi,
            /<applet[^>]*>/gi,
            /<meta[^>]*>/gi,
            /<link[^>]*>/gi,
            /<img[^>]*>/gi,
            /<style[^>]*>([\s\S]*?)<\/style>/gi
        ];
        return patterns.some(pattern => pattern.test(input));
    }
    // Generate secure session ID
    generateSessionId() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    // Calculate password entropy
    calculatePasswordEntropy(password) {
        const charsetSize = this.getPasswordCharsetSize(password);
        const entropy = password.length * Math.log2(charsetSize);
        return Math.round(entropy * 100) / 100;
    }
    getPasswordCharsetSize(password) {
        let charset = 0;
        if (/[a-z]/.test(password))
            charset += 26;
        if (/[A-Z]/.test(password))
            charset += 26;
        if (/\d/.test(password))
            charset += 10;
        if (/[^a-zA-Z0-9]/.test(password))
            charset += 32;
        return charset || 1; // Avoid division by zero
    }
    // Get security headers for responses
    getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };
    }
    // Rate limiting helper
    getRateLimitKey(req) {
        const ip = req.ip || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const userId = req.user?.id || 'anonymous';
        return `${ip}:${userId}:${userAgent}`;
    }
}
exports.SecurityService = SecurityService;
// Singleton instance
let securityInstance;
function getSecurityService() {
    if (!securityInstance) {
        securityInstance = new SecurityService();
    }
    return securityInstance;
}
// Security middleware
function securityHeaders() {
    const securityService = getSecurityService();
    const headers = securityService.getSecurityHeaders();
    return (req, res, next) => {
        for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
        }
        next();
    };
}
function inputSanitization() {
    const securityService = getSecurityService();
    return (req, res, next) => {
        if (req.body) {
            req.body = securityService.sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = securityService.sanitizeObject(req.query);
        }
        if (req.params) {
            req.params = securityService.sanitizeObject(req.params);
        }
        next();
    };
}
function sqlInjectionProtection() {
    const securityService = getSecurityService();
    return (req, res, next) => {
        const checkInput = (input) => {
            if (typeof input === 'string') {
                return securityService.detectSqlInjection(input);
            }
            if (typeof input === 'object' && input !== null) {
                return Object.values(input).some(checkInput);
            }
            return false;
        };
        const hasInjection = checkInput(req.body) ||
            checkInput(req.query) ||
            checkInput(req.params);
        if (hasInjection) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input detected'
            });
        }
        next();
    };
}
