# Security Policy

## 🔒 Security Overview

Nexa takes security seriously and implements multiple layers of protection to ensure user data and API keys are kept secure.

## 🛡️ Security Measures

### Environment Variables & Secrets
- **All sensitive data** is stored in environment variables
- **`.env` files are excluded** from version control via `.gitignore`
- **Example files** provided (`.env.example`) for configuration reference
- **Production secrets** should use secret management services (AWS Secrets Manager, etc.)

### Authentication & Authorization
- **JWT tokens** with configurable expiration
- **Password hashing** using bcrypt with salt rounds
- **Secure password reset** functionality with expiration
- **Role-based access control** (admin/user roles)

### API Security
- **Rate limiting** to prevent abuse and DDoS attacks
- **CORS protection** with configurable allowed origins
- **Input validation** and sanitization on all endpoints
- **SQL injection prevention** through Mongoose ODM
- **XSS protection** via Helmet.js middleware

### Data Protection
- **Encryption in transit** (HTTPS/WSS in production)
- **Secure file uploads** with type and size validation
- **Database connection security** with authentication
- **Session management** with secure cookie settings

## 🚨 Security Best Practices

### For Developers
1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for JWT and API keys
3. **Enable HTTPS** in production environments
4. **Regularly update dependencies** to patch vulnerabilities
5. **Implement proper logging** without exposing sensitive data
6. **Use environment-specific configurations**

### For Production Deployment
1. **Environment variables** should be set via hosting platform
2. **Database connections** should use SSL/TLS
3. **API keys** should be rotated regularly
4. **Monitoring and alerting** for security events
5. **Regular security audits** and penetration testing

## 🔍 Security Checklist

### ✅ Pre-Deployment Checklist
- [ ] All `.env` files are in `.gitignore`
- [ ] Production secrets are not hardcoded
- [ ] HTTPS is enabled for all endpoints
- [ ] Rate limiting is configured appropriately
- [ ] CORS settings are restrictive
- [ ] Database connections use authentication
- [ ] File upload restrictions are in place
- [ ] JWT secrets are strong and unique
- [ ] Error messages don't leak sensitive information
- [ ] Logging doesn't expose passwords/tokens

### ✅ Runtime Security
- [ ] Input validation on all user inputs
- [ ] SQL injection protection active
- [ ] XSS protection headers set
- [ ] CSRF protection implemented
- [ ] Session management secure
- [ ] Password complexity requirements
- [ ] Account lockout mechanisms
- [ ] Security headers configured

## 🚨 Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

### How to Report
1. **Email**: security@nexa.ai
2. **Private Issue**: Create a private GitHub issue
3. **Include**: Detailed description, steps to reproduce, impact assessment

### Response Time
- **Initial response**: Within 24 hours
- **Assessment**: Within 3 business days
- **Resolution**: Based on severity and complexity

### Security Policy
- **No public disclosure** until patch is released
- **Credit given** to security researchers
- **Bug bounty program** coming soon

## 🔧 Security Configuration

### Environment Variables Security
```env
# Strong JWT secrets (use random strings, min 32 chars)
JWT_SECRET=your_super_secure_random_string_here_min_32_chars
JWT_REFRESH_SECRET=another_secure_random_string_here

# API keys from official sources
GEMINI_API_KEY=official_gemini_api_key_here

# Database with authentication
MONGODB_URI=mongodb://username:password@host:port/database?ssl=true
```

### Rate Limiting Configuration
```javascript
// Production rate limits
RATE_LIMIT_WINDOW_MS=900000  // 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   // Per IP per window
```

### CORS Security
```javascript
// Restrictive CORS for production
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## 📊 Security Monitoring

### Logging
- **Security events** logged with appropriate severity
- **Failed login attempts** tracked and monitored
- **API abuse** detected and flagged
- **Database access** logged for audit trails

### Monitoring
- **Unusual activity detection** via rate limiting
- **Error monitoring** for security exceptions
- **Performance monitoring** for DoS detection
- **File integrity monitoring** for critical files

## 🔄 Security Updates

### Dependency Management
- **Regular updates** to latest secure versions
- **Vulnerability scanning** with npm audit
- **Security patches** applied promptly
- **Change log monitoring** for security fixes

### Security Patches
- **Critical patches**: Within 24 hours
- **High severity**: Within 72 hours
- **Medium severity**: Within 1 week
- **Low severity**: Next release cycle

## ⚠️ Common Security Mistakes to Avoid

### ❌ Don't Do This
- Commit `.env` files to version control
- Use default passwords or secrets
- Disable authentication in production
- Ignore CORS and rate limiting
- Log sensitive user data
- Use outdated dependencies
- Ignore security headers

### ✅ Do This Instead
- Use environment variables for secrets
- Generate strong, random secrets
- Implement proper authentication
- Configure security middleware
- Log security events appropriately
- Keep dependencies updated
- Set security headers

## 📞 Security Contact

- **Security Team**: security@nexa.ai
- **GitHub Issues**: [Private Issues Only](https://github.com/Edwin420s/nexa/issues/new)
- **PGP Key**: Available on request

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Next Review**: March 2026
