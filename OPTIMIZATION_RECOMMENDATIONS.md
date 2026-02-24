# Contenly - Optimization Recommendations

> **Review Date:** February 2026  
> **Reviewer:** AI Code Review  
> **Status:** Post-Security-Fix Review

---

## 📊 Summary Score (Updated)

| Category | Before | After | Notes |
|----------|--------|-------|-------|
| **Architecture** | 8/10 | 8/10 | Clean module structure, good separation of concerns |
| **Security** | 5/10 | **7/10** | ✅ Fixed: temp-user bypass, encryption key requirement, auth middleware |
| **Code Quality** | 6/10 | **7/10** | ✅ Fixed: Replaced console.log with Logger, removed debug code |
| **Feature Completeness** | 6/10 | 6/10 | Core features work, but billing/email/queue need completion |
| **Frontend** | 7/10 | **8/10** | ✅ Fixed: Added server-side auth middleware, HTML sanitization |
| **Database Design** | 9/10 | 9/10 | Well-structured schema with proper relations |

**Overall: 7.5/10** (improved from 7/10)

---

## 🔴 Critical Priority (Before Production)

### 1. Email Service Integration
**Status:** ✅ DONE  
**Implementation:** Resend integrated with beautiful HTML email template

- Installed `resend` package
- Email service auto-initializes if `RESEND_API_KEY` is set
- Graceful fallback to logging in development mode
- `.env.example` created with all required variables

---

### 2. Set Required Environment Variables
**Status:** ✅ DONE  
**Implementation:** `.env.example` files created for both backend and frontend

Generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. Install DOMPurify for Robust HTML Sanitization
**Status:** ✅ DONE  
**Implementation:** `isomorphic-dompurify` installed and integrated

- Works on both client and server side
- Configured with safe default allowed tags and attributes

---

## 🟠 High Priority

### 4. Enable Redis/Bull Queue for RSS Feed Polling
**Status:** ✅ DONE  
**Implementation:**

- Enabled `BullModule.forRoot()` in `app.module.ts`
- Registered `feed-polling` queue in `feeds.module.ts`
- Uncommented and enhanced queue logic in `feeds.service.ts`
- Added `removeScheduledPolling()` for cleanup on feed deletion
- Updated `.env.example` with Redis configuration

**To use:**
1. Install Redis locally or use Upstash/Redis Cloud (free tier available)
2. Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in `.env`
3. Feeds will automatically poll on schedule

---

### 5. Add Per-Endpoint Rate Limiting
**Status:** ✅ DONE  
**Implementation:** Added `@Throttle` decorators to AI endpoints

- `/ai/generate` - 10 req/min
- `/ai/generate-seo` - 20 req/min
- `/ai/generate-image` - 5 req/min (expensive operation)

---

### 6. Replace `any` Types with Proper Interfaces
**Status:** ✅ DONE  
**Implementation:**

Created comprehensive type definitions in `backend/src/db/types.ts`:
- `ArticleStatus`, `ArticleUpdateData`, `ArticleCreateData`
- `WpSite`, `WpSiteStatus`, `WpCategory`, `WpPostData`, `WpPostResponse`
- `ViewBoostJob`, `ViewBoostStatus`, `ViewBoostJobUpdate`
- All billing and notification types

Updated services to use proper types:
- `articles.service.ts` - Replaced `any` with `ArticleStatus`, `ArticleUpdateData`
- `wordpress.service.ts` - Replaced `any` with `WpPostData`, `ArticleStatus`, proper error handling
- `view-boost.service.ts` - Replaced `any` with `ViewBoostJob`, `AxiosRequestConfig`, `ViewBoostJobUpdate`

---

## 🟡 Medium Priority

### 7. Add Unit Tests for Critical Services
**Status:** ✅ DONE  
**Implementation:**

Created unit tests for:

**BillingService** (`billing.service.spec.ts`):
- `getBalance` - Returns existing balance, creates initial balance
- `checkBalance` - Returns true/false based on sufficient balance
- `deductTokens` - Deducts tokens, throws on insufficient balance
- `addTokens` - Adds to existing or creates new balance
- `getTransactions` - Returns paginated transactions
- `initializeBalance` - Creates balance only if not exists

**ArticlesService** (`articles.service.spec.ts`):
- `findAll` - Returns paginated articles with filtering
- `findById` - Returns article or throws NotFoundException
- `create` - Creates new article with default status
- `update` - Updates existing article
- `delete` - Deletes article or throws NotFoundException
- `updateStatus` - Updates article status with WP data

---

### 8. Implement Stripe Webhook Handler
**Status:** ✅ DONE  
**Implementation:**

Installed `stripe` package and implemented full webhook handling:

**Webhook Events Handled:**
- `checkout.session.completed` - One-time payments & subscription creation
- `invoice.payment_succeeded` - Monthly subscription token credits
- `invoice.payment_failed` - Mark subscription as past due
- `customer.subscription.deleted` - Mark subscription as canceled

**New Endpoints:**
- `POST /billing/checkout` - Create Stripe checkout session
- `POST /billing/webhooks/stripe` - Stripe webhook handler (no auth)

**Features:**
- Webhook signature verification
- Automatic token crediting on payment
- Subscription period tracking
- Graceful fallback if Stripe not configured

---

### 9. Add WebSocket/SSE for Real-time Notifications
**Status:** ✅ DONE  
**Implementation:**

Installed `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`

**Created `NotificationsGateway`:**
- WebSocket namespace: `/notifications`
- User subscription via `subscribe` event
- Real-time push notifications to connected clients
- Connection tracking per user

**Updated `NotificationsService`:**
- Auto-push notifications via WebSocket on create
- Helper methods: `notifyJobSuccess`, `notifyJobFailed`, `notifyLowTokens`, `notifySubscriptionExpiring`

**Frontend Usage:**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/notifications');
socket.emit('subscribe', { userId: 'user-id' });
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

---

### 10. Use `@nestjs/schedule` Instead of `setInterval`
**Status:** ✅ DONE  
**Implementation:** 

- Installed `@nestjs/schedule`
- Added `ScheduleModule.forRoot()` to app.module
- Replaced `setInterval` with `@Cron(CronExpression.EVERY_30_MINUTES)` decorator

---

## 🟢 Low Priority

### 11. Clean Up Development Files
**Status:** ✅ DONE  
**Implementation:** Moved all test scripts to `backend/scripts/` directory

- `simulate-publish.ts`
- `simulate-publish-mock.ts`
- `test-comprehensive.ts`
- `test-scraper.ts`
- `test-simple.ts`

---

### 12. Update Style Guide
**Status:** ✅ DONE  
**Implementation:** Updated branding from "Monev" to "Contenly"

---

### 13. Remove Duplicate Directory
**Status:** ✅ DONE (already removed)

---

### 14. Add API Versioning
**Status:** ✅ DONE  
**Implementation:**

- Backend: `app.setGlobalPrefix('api/v1')`
- Frontend: Updated API_URL to use `/api/v1`
- Swagger docs now at `/api/v1/docs`

---

### 15. Implement Request Validation DTOs

Ensure all endpoints use class-validator DTOs:

```typescript
// backend/src/modules/articles/dto/create-article.dto.ts
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateArticleDto {
    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(['DRAFT', 'PUBLISHED', 'SCHEDULED'])
    status?: string;
}
```

---

## 📈 Performance Optimizations

### Database
- [ ] Add indexes on frequently queried columns (`userId`, `status`, `createdAt`)
- [ ] Implement pagination cursor for large datasets
- [ ] Add connection pooling configuration

### Caching
- [ ] Cache WordPress categories in Redis (currently stored in DB)
- [ ] Cache recent posts for internal link injection
- [ ] Implement response caching for analytics endpoints

### Frontend
- [ ] Implement route-based code splitting
- [ ] Add skeleton loaders for all data-fetching components
- [ ] Optimize images with Next.js Image component

---

## 🔒 Security Checklist

- [x] Remove `temp-user-id` bypass
- [x] Require `ENCRYPTION_KEY` at startup
- [x] Add server-side auth middleware
- [x] Add HTML sanitization utility
- [x] Integrate real email service (Resend)
- [ ] Add CSRF protection
- [ ] Implement request signing for API-to-API calls
- [ ] Add audit logging for sensitive operations
- [ ] Review and update CORS origins for production
- [ ] Add rate limiting per user (not just per IP)

---

## 📝 Recommended Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=<64-char-hex>
OPENROUTER_API_KEY=sk-or-...

# Authentication
BETTER_AUTH_SECRET=<random-32-chars>
FRONTEND_URL=https://yourdomain.com

# Email (choose one)
RESEND_API_KEY=re_...
# OR
SMTP_HOST=smtp.example.com
SMTP_USER=noreply@example.com
SMTP_PASS=...

# Redis (for queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=...

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
REDIS_URL=redis://...
API_URL=https://api.yourdomain.com
```

---

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up SSL certificates
- [ ] Configure database backups
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Configure log aggregation
- [ ] Set up health check endpoints
- [ ] Configure auto-scaling
- [ ] Review rate limits for production load

---

## 📚 Recommended Reading

1. [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
2. [Next.js Authentication](https://nextjs.org/docs/authentication)
3. [OWASP Top 10](https://owasp.org/www-project-top-ten/)
4. [Drizzle ORM Best Practices](https://orm.drizzle.team/docs/goodies)

---

*Last updated: February 2026*