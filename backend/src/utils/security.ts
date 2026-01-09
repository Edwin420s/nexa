import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import logger from './logger';

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpire: string;
  bcryptRounds: number;
  apiKeyLength: number;
  tokenExpiry: {
    access: number; // seconds
    refresh: number; // seconds
    resetPassword: number; // seconds
  };
}

export class SecurityService {
  private config: SecurityConfig;

  constructor(config?: Partial<SecurityConfig>) {
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
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.config.bcryptRounds);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT token generation and verification
  generateAccessToken(payload: any): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.tokenExpiry.access
    });
  }

  generateRefreshToken(payload: any): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.tokenExpiry.refresh
    });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret);
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Token decoding failed:', error);
      return null;
    }
  }

  // API key generation
  generateApiKey(): { key: string; hash: string } {
    const key = crypto.randomBytes(this.config.apiKeyLength).toString('hex');
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    return { key, hash };
  }

  verifyApiKey(apiKey: string, storedHash: string): boolean {
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    return hash === storedHash;
  }

  // CSRF token generation and verification
  generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyCsrfToken(token: string, storedToken: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(storedToken)
    );
  }

  // Password strength validation
  validatePasswordStrength(password: string): {
    valid: boolean;
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else suggestions.push('Use at least 8 characters');

    // Character variety
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (hasLower && hasUpper) score += 1;
    else suggestions.push('Use both uppercase and lowercase letters');

    if (hasDigit) score += 1;
    else suggestions.push('Add numbers');

    if (hasSpecial) score += 1;
    else suggestions.push('Add special characters');

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
  generateSecureRandom(length: number = 16): string {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  // Encrypt and decrypt data
  encryptData(data: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decryptData(encryptedData: string, key: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Generate HMAC signature
  generateHmac(data: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  verifyHmac(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHmac(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Request signature verification
  verifyRequestSignature(req: Request, secret: string): boolean {
    const timestamp = req.headers['x-timestamp'] as string;
    const signature = req.headers['x-signature'] as string;

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
  generatePasswordResetToken(userId: string): string {
    const payload = {
      userId,
      type: 'password_reset',
      timestamp: Date.now()
    };
    
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.tokenExpiry.resetPassword
    });
  }

  verifyPasswordResetToken(token: string): { valid: boolean; userId?: string } {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;
      
      if (decoded.type !== 'password_reset') {
        return { valid: false };
      }
      
      return { valid: true, userId: decoded.userId };
    } catch (error) {
      return { valid: false };
    }
  }

  // Sanitize user input
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove JavaScript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Check for SQL injection patterns
  detectSqlInjection(input: string): boolean {
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
  detectXss(input: string): boolean {
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
  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Calculate password entropy
  calculatePasswordEntropy(password: string): number {
    const charsetSize = this.getPasswordCharsetSize(password);
    const entropy = password.length * Math.log2(charsetSize);
    return Math.round(entropy * 100) / 100;
  }

  private getPasswordCharsetSize(password: string): number {
    let charset = 0;
    
    if (/[a-z]/.test(password)) charset += 26;
    if (/[A-Z]/.test(password)) charset += 26;
    if (/\d/.test(password)) charset += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charset += 32;
    
    return charset || 1; // Avoid division by zero
  }

  // Get security headers for responses
  getSecurityHeaders(): Record<string, string> {
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
  getRateLimitKey(req: Request): string {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = req.user?.id || 'anonymous';
    
    return `${ip}:${userId}:${userAgent}`;
  }
}

// Singleton instance
let securityInstance: SecurityService;

export function getSecurityService(): SecurityService {
  if (!securityInstance) {
    securityInstance = new SecurityService();
  }
  return securityInstance;
}

// Security middleware
export function securityHeaders() {
  const securityService = getSecurityService();
  const headers = securityService.getSecurityHeaders();
  
  return (req: any, res: any, next: any) => {
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }
    next();
  };
}

export function inputSanitization() {
  const securityService = getSecurityService();
  
  return (req: any, res: any, next: any) => {
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

export function sqlInjectionProtection() {
  const securityService = getSecurityService();
  
  return (req: any, res: any, next: any) => {
    const checkInput = (input: any): boolean => {
      if (typeof input === 'string') {
        return securityService.detectSqlInjection(input);
      }
      
      if (typeof input === 'object' && input !== null) {
        return Object.values(input).some(checkInput);
      }
      
      return false;
    };
    
    const hasInjection = 
      checkInput(req.body) || 
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