# Security & Code Quality Audit Report

**Project:** Contently / Camedia - AI Content Automation Platform  
**Date:** February 19, 2026  
**Auditor:** AI Assistant  
**Status:** ⚠️ **CRITICAL ISSUES FOUND - NOT READY FOR PRODUCTION**

---

## Executive Summary

This audit covers a monorepo containing a **NestJS backend** and **Next.js frontend** for an AI-powered content generation and WordPress publishing platform. 

| Category | Grade | Status |
|----------|-------|--------|
| **Security** | D+ | ⚠️ Critical issues must be addressed |
| **Code Quality** | C | 🟡 Acceptable but needs improvement |
| **Test Coverage** | F | 🔴 Minimal tests (3 files only) |

---

## Critical Security Issues (Fix Immediately)

### 1. 🔴 CRITICAL: `.env` File Committed to Repository

**Severity:** CRITICAL  
**Location:** `backend/.env`  
**Impact:** All credentials exposed in version control

**Exposed Credentials:**
- Database URL with password: `postgresql://postgres.xtodvyjcrosvdxnsdrot:Fpkitjalyi123!@...`
- OpenAI API Key: `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`
- Encryption Key: `cafaee4d9e5c90d5993bece202f1df496a0a2a840555920e981fd796633e8618`
- Better Auth Secret: `69549939cefa406dd5a83376496d90008138ff98309cd8993cf95d34dbb21daa`

**Remediation:**
```bash
# 1. Add to .gitignore
echo "backend/.env" >> .gitignore

# 2. Remove from git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env' \
  --prune-empty --tag-name-filter cat -- --all

# 3. Rotate ALL exposed credentials immediately
```

---

### 2. 🔴 CRITICAL: Hardcoded Encryption Key Fallback

**Severity:** CRITICAL  
**Location:** `backend/src/integrations/integrations.service.ts:17,28`  
**Impact:** All encrypted passwords can be decrypted if ENCRYPTION_KEY not set

**Current Code:**
```typescript
const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!', 'utf-8').slice(0, 32);
```

**Remediation:**
```typescript
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'utf-8').slice(0, 32);
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}
```

---

## High Priority Issues

### 3. 🟠 HIGH: Inconsistent Authentication Guards

**Severity:** HIGH  
**Impact:** Potential authorization bypasses

**Problem:** Different controllers use different guards:
- `AuthGuard` in `users.controller.ts`
- `SessionAuthGuard` in `articles.controller.ts`, `ai.controller.ts`, `billing.controller.ts`

**Remediation:**
- Audit all controllers and unify to single guard strategy
- Remove unused guard implementations
- Document guard usage patterns

---

### 4. 🟠 HIGH: Duplicate Encryption Logic

**Severity:** HIGH  
**Impact:** Code duplication, potential decryption failures

**Locations:**
- `backend/src/wordpress/wordpress.service.ts` (lines 51-97)
- `backend/src/integrations/integrations.service.ts` (lines 15-51)

**Different implementations could lead to:**
- Inconsistent encryption/decryption
- Maintenance issues
- Security vulnerabilities

**Remediation:**
Create a shared `EncryptionService`:
```typescript
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY is required');
    }
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8').slice(0, 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

---

### 5. 🟠 HIGH: Missing Input Validation

**Severity:** HIGH  
**Location:** `backend/src/feeds/feeds.controller.ts:23-28,38-44`

**Problem:** Inline DTOs without validation decorators bypass global ValidationPipe:
```typescript
@Post()
async create(@CurrentUser() user: User, @Body() dto: { name: string; url: string; pollingIntervalMinutes?: number }) {}
```

**Remediation:**
Create proper DTO classes with decorators:
```typescript
export class CreateFeedDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  pollingIntervalMinutes?: number;
}
```

---

## Medium Priority Issues

### 6. 🟡 MEDIUM: Information Disclosure in Error Responses

**Severity:** MEDIUM  
**Location:** `backend/src/auth/session-auth.guard.ts:40-47`

**Problem:** Debug messages leak information:
```typescript
throw new UnauthorizedException(`DEBUG: Session NULL. Cookies: [${cookieKeys}]. AuthHeader: [${authHeaderPrefix}]`);
```

**Remediation:**
Remove debug information from production error messages:
```typescript
throw new UnauthorizedException('Invalid or expired session');
```

---

### 7. 🟡 MEDIUM: Console.log in Production Code

**Severity:** MEDIUM  
**Location:** `backend/src/auth/auth.controller.ts:79-83`

**Problem:** Sensitive data may be logged:
```typescript
console.log(`🔵 Better Auth: ${req.method} ${req.url}`);
console.log(`📍 All Headers:`, JSON.stringify(req.headers));
```

**Remediation:**
Use NestJS Logger with appropriate levels:
```typescript
private readonly logger = new Logger(AuthController.name);

// In method:
this.logger.debug(`Auth request: ${req.method} ${req.url}`);
// Remove or sanitize header logging
```

---

### 8. 🟡 MEDIUM: Excessive `any` Type Usage

**Severity:** MEDIUM  
**Count:** 18 instances

**Common patterns:**
- `error: any` in catch blocks (13 instances)
- `@Req() req: any` in controllers (5 instances)

**Remediation:**
Use `unknown` with type guards:
```typescript
// Instead of:
catch (error: any) {
  throw new BadRequestException(error.message);
}

// Use:
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new BadRequestException(message);
}
```

---

### 9. 🟡 MEDIUM: Overly Permissive CORS

**Severity:** MEDIUM  
**Location:** `backend/src/auth/auth.config.ts:43-48`

**Problem:** Development origins mixed with production:
```typescript
trustedOrigins: [
  'http://localhost:3000',  // Should not be in production
  'http://localhost:3001',
  'https://contenly.vercel.app',
]
```

**Remediation:**
Use environment-based configuration:
```typescript
trustedOrigins: process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL!]
  : ['http://localhost:3000', 'http://localhost:3001'];
```

---

## Code Quality Issues

### 10. 🔴 CRITICAL: Minimal Test Coverage

**Severity:** CRITICAL  
**Current State:** 3 test files for entire application

**Test Files Found:**
- `app.controller.spec.ts` (only tests "Hello World")
- `billing.service.spec.ts`
- `articles.service.spec.ts`

**Target:** Minimum 60% coverage for production

---

### 11. 🟡 MEDIUM: No Environment Variable Validation

**Severity:** MEDIUM  
**Impact:** App can start with missing required variables

**Remediation:**
Create validation schema using `@nestjs/config`:
```typescript
// app.module.ts
ConfigModule.forRoot({
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().required(),
    ENCRYPTION_KEY: Joi.string().length(64).hex().required(),
    OPENAI_API_KEY: Joi.string().required(),
    BETTER_AUTH_SECRET: Joi.string().required(),
  }),
});
```

---

### 12. 🟡 MEDIUM: Missing Content Security Policy

**Severity:** MEDIUM  
**Location:** Global middleware configuration

**Remediation:**
Add Helmet with CSP:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

## Good Security Practices (Keep These!)

### ✅ SQL Injection Prevention
- Uses Drizzle ORM with parameterized queries
- No raw SQL concatenation found

### ✅ XSS Prevention
- Frontend uses DOMPurify for sanitization
- Comprehensive allowed tags/attributes whitelist

### ✅ Password Security
- bcrypt with salt rounds for password hashing
- Password reset tokens expire after 1 hour

### ✅ Rate Limiting
- Global throttler configured
- Granular rate limits on AI endpoints:
  - `/ai/generate`: 10 req/min
  - `/ai/generate-image`: 5 req/min
  - `/ai/generate-seo`: 20 req/min

### ✅ Type Safety
- Full TypeScript implementation
- Drizzle ORM provides type-safe database queries

---

## Action Items Checklist

### Immediate (Before Any Deployment)
- [ ] Remove `.env` from git history
- [ ] Rotate all exposed credentials (Database, OpenAI, Encryption keys)
- [ ] Remove hardcoded encryption fallback
- [ ] Unify authentication guard usage
- [ ] Create shared EncryptionService

### High Priority (Within 1 Week)
- [ ] Add proper DTO validation to feeds controller
- [ ] Remove debug information from error responses
- [ ] Replace console.log with proper logging
- [ ] Add environment variable validation

### Medium Priority (Within 1 Month)
- [ ] Fix all `any` type usages
- [ ] Add CSP headers
- [ ] Separate dev/prod CORS origins
- [ ] Add JSDoc documentation to all public methods

### Long Term
- [ ] Increase test coverage to 60%+
- [ ] Add E2E tests
- [ ] Implement audit logging
- [ ] Add API versioning strategy

---

## File References

### Critical Issues
- `backend/.env` - Credentials exposure
- `backend/src/integrations/integrations.service.ts:17,28` - Hardcoded encryption key

### High Priority
- `backend/src/auth/session-auth.guard.ts` - Inconsistent guards
- `backend/src/wordpress/wordpress.service.ts:51-97` - Duplicate encryption
- `backend/src/integrations/integrations.service.ts:15-51` - Duplicate encryption
- `backend/src/feeds/feeds.controller.ts:23-28,38-44` - Missing validation

### Medium Priority
- `backend/src/auth/session-auth.guard.ts:40-47` - Info disclosure
- `backend/src/auth/auth.controller.ts:79-83` - Console.log
- `backend/src/auth/auth.config.ts:43-48` - CORS config

---

## Conclusion

**This codebase is NOT ready for production deployment** due to critical security vulnerabilities. The most urgent issues are:

1. **Exposed credentials in version control**
2. **Hardcoded encryption fallback**

Once these are resolved, the codebase has a solid foundation with good architectural patterns and security practices in most areas. However, test coverage is severely lacking and must be addressed before production use.

**Recommended Timeline:**
- **Week 1:** Fix critical issues (items 1-2)
- **Week 2:** Fix high priority issues (items 3-5)
- **Month 1:** Address medium priority and add tests
- **Month 2+:** Full production readiness with comprehensive testing

---

*Report generated: February 19, 2026*  
*Next review recommended: After critical issues resolved*
