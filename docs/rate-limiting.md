# Rate Limiting Implementation

## Overview

This document describes the rate limiting implementation for the Link Shortener project. Rate limiting protects the application from abuse, DDoS attacks, and brute force attempts by limiting the number of requests a user or IP address can make within a specific time window.

## Implementation Details

### Architecture

The rate limiting system is built using:
- **In-memory Map storage**: Serverless-friendly, no external dependencies required
- **Sliding window algorithm**: Tracks requests within a time window
- **Automatic cleanup**: Expired entries are removed every minute to prevent memory leaks

### Files Created/Modified

1. **`lib/rate-limit.ts`** (New)
   - Core rate limiting utility with RateLimiter class
   - Rate limit checking functions for different endpoints
   - Error formatting utilities

2. **`app/dashboard/actions.ts`** (Modified)
   - Added rate limiting to `createLink()` - 10 requests/minute per user
   - Added rate limiting to `editLink()` - 10 requests/minute per user
   - Added rate limiting to `removeLinkAction()` - 10 requests/minute per user

3. **`app/l/[shortcode]/route.ts`** (Modified)
   - Added rate limiting to redirect route - 100 requests/minute per IP
   - Added client IP extraction function
   - Returns 429 status with retry headers when rate limited

## Rate Limit Configuration

### Server Actions
- **Limit**: 10 requests per minute per user
- **Applies to**: `createLink`, `editLink`, `removeLinkAction`
- **Identifier**: Clerk user ID
- **Response**: JSON error message with rate limit details

```typescript
{
  success: false,
  error: "Rate limit exceeded. You have made too many requests. Please try again in 45 seconds."
}
```

### Redirect Routes
- **Limit**: 100 requests per minute per IP address
- **Applies to**: `GET /l/[shortcode]`
- **Identifier**: Client IP address (from `x-forwarded-for` or `x-real-ip` headers)
- **Response**: 429 status with rate limit headers

```typescript
{
  error: "Rate limit exceeded. You have made too many requests. Please try again in 30 seconds.",
  limit: 100,
  remaining: 0,
  resetAt: 1717257600000
}

Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-06-01T12:00:00.000Z
Retry-After: 30
```

## Usage

### Checking Rate Limits in Server Actions

```typescript
import { checkServerActionRateLimit, formatRateLimitError } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

export async function myServerAction() {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  // Check rate limit
  const rateLimitResult = checkServerActionRateLimit(userId);
  if (!rateLimitResult.success) {
    return { 
      success: false, 
      error: formatRateLimitError(rateLimitResult)
    };
  }
  
  // Continue with action logic...
}
```

### Checking Rate Limits in API Routes

```typescript
import { checkRedirectRateLimit, formatRateLimitError } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get client IP
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  
  // Check rate limit
  const rateLimitResult = checkRedirectRateLimit(clientIp);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: formatRateLimitError(rateLimitResult) },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
        }
      }
    );
  }
  
  // Continue with route logic...
}
```

## Customizing Rate Limits

To adjust rate limits, modify the configuration in `lib/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  SERVER_ACTIONS: {
    maxRequests: 10,      // Change this value
    windowMs: 60 * 1000,  // 1 minute window
  },
  
  REDIRECTS: {
    maxRequests: 100,     // Change this value
    windowMs: 60 * 1000,  // 1 minute window
  },
} as const;
```

## Production Considerations

### Current Implementation (In-Memory)

**Pros:**
- ✅ No external dependencies
- ✅ Fast and simple
- ✅ Works immediately in serverless environments
- ✅ Zero latency for rate limit checks

**Cons:**
- ❌ Rate limits are per-instance (not shared across serverless functions)
- ❌ Rate limits reset when function cold-starts
- ❌ Not suitable for distributed systems with multiple regions

### Recommended for Production: Upstash Redis

For production deployments with multiple serverless instances, consider upgrading to **Upstash Redis**:

```bash
npm install @upstash/redis
```

```typescript
// lib/rate-limit-redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);
  
  // Count requests in current window
  const count = await redis.zcard(key);
  
  if (count >= limit) {
    return { success: false };
  }
  
  // Add new request
  await redis.zadd(key, { score: now, member: now.toString() });
  await redis.expire(key, Math.ceil(windowMs / 1000));
  
  return { success: true, remaining: limit - count - 1 };
}
```

**Benefits of Upstash Redis:**
- ✅ Shared rate limits across all serverless instances
- ✅ Persistent rate limit state
- ✅ Supports distributed deployments
- ✅ HTTP-based API (works in serverless/edge)
- ✅ Automatic cleanup with TTL

## Testing

Run the rate limit tests:

```bash
npm test lib/__tests__/rate-limit.test.ts
```

### Manual Testing

#### Test Server Actions Rate Limiting

1. Sign in to the dashboard
2. Rapidly create links (click "Create Link" button 11+ times)
3. After the 10th request, you should see:
   ```
   Rate limit exceeded. You have made too many requests. Please try again in X seconds.
   ```

#### Test Redirect Rate Limiting

Use a tool like `curl` or Postman:

```bash
# Make 101 requests to a short link
for i in {1..101}; do
  curl -I http://localhost:3000/l/abc123
done
```

After the 100th request, you should receive:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
Retry-After: 30
```

## Security Benefits

1. **DDoS Protection**: Prevents overwhelming the server with excessive requests
2. **Brute Force Prevention**: Limits attempts to guess short codes or spam actions
3. **Resource Protection**: Prevents database overload from malicious actors
4. **Fair Usage**: Ensures equal access for all users
5. **Cost Control**: Limits API calls in serverless environments (prevents runaway bills)

## Monitoring and Observability

### Adding Logging

To monitor rate limit violations, add logging to `lib/rate-limit.ts`:

```typescript
if (entry.count >= config.maxRequests) {
  console.warn(`[RateLimit] Blocked request for ${identifier}`, {
    count: entry.count,
    limit: config.maxRequests,
    resetAt: new Date(entry.resetAt).toISOString(),
  });
  
  return {
    success: false,
    limit: config.maxRequests,
    remaining: 0,
    resetAt: entry.resetAt,
  };
}
```

### Metrics to Track

- Number of rate limit violations per hour/day
- Top offending IPs or users
- Average requests per user
- Time to rate limit reset

## Future Enhancements

1. **Tiered Rate Limits**: Different limits for free vs. paid users
2. **Dynamic Limits**: Adjust based on server load
3. **IP Whitelisting**: Exclude trusted IPs from rate limiting
4. **Custom Error Pages**: User-friendly rate limit error pages
5. **Admin Dashboard**: View and manage rate limits in real-time

## Troubleshooting

### Rate limit not working in development

- Ensure you're testing with the correct user ID or IP
- Check that the rate limit configuration is correct
- Verify that the rate limiter is being imported correctly

### Rate limits resetting too quickly

- This is expected behavior with in-memory storage in serverless environments
- Upgrade to Upstash Redis for persistent rate limits

### Different rate limits on different deployments

- Each serverless instance has its own memory
- Use a distributed solution like Redis for shared rate limits

## Related Documentation

- [Security Audit](../../.github/prompts/security-audit.prompt.md)
- [Authentication Guide](../../.github/instructions/authentication.instructions.md)
- [Server Actions](../../.github/instructions/server-actions.instructions.md)

---

**Last Updated**: June 1, 2026  
**Version**: 1.0.0
