# Authentication

## Non-Negotiable Rules

This application uses **Clerk and ONLY Clerk** for authentication. Violating any of these rules will break the application.

### ❌ FORBIDDEN

- **NextAuth** / Auth.js
- **Supabase Auth**
- **Firebase Auth**
- **Custom JWT auth**
- **Any other authentication library or method**

### ✅ REQUIRED

1. **Clerk ONLY** - All authentication must use Clerk
2. **Modal Mode** - Sign in/sign up MUST use `mode="modal"` 
3. **Protected Dashboard** - `/dashboard` requires authentication
4. **Homepage Redirect** - Logged-in users at `/` redirect to `/dashboard`

---

## Setup

### Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Root Layout

Wrap your app with `<ClerkProvider>` in `app/layout.tsx`:

```tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

## Protected Routes

### Pattern 1: Server Component (Recommended)

Use this for pages that need auth. Redirects to sign-in if not authenticated:

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/');
  }
  
  // User is authenticated - render page
  return <div>Dashboard</div>;
}
```

### Pattern 2: Middleware (Alternative)

For protecting multiple routes, use `middleware.ts`:

```tsx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

---

## Homepage Redirect

Logged-in users accessing `/` should be redirected to `/dashboard`:

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const { userId } = await auth();
  
  if (userId) {
    redirect('/dashboard');
  }
  
  // User is not logged in - show landing page
  return <div>Welcome to Link Shortener</div>;
}
```

---

## Sign In / Sign Up UI

### ALWAYS Use Modal Mode

```tsx
import { SignInButton, SignUpButton } from '@clerk/nextjs';

export function AuthButtons() {
  return (
    <div>
      <SignInButton mode="modal">
        <button>Sign In</button>
      </SignInButton>
      
      <SignUpButton mode="modal">
        <button>Sign Up</button>
      </SignUpButton>
    </div>
  );
}
```

### ❌ NEVER Use Redirect Mode

```tsx
// ❌ FORBIDDEN - Do NOT use this
<SignInButton mode="redirect" />
```

---

## User Information

### Get Current User ID (Server)

```tsx
import { auth } from '@clerk/nextjs/server';

export default async function MyPage() {
  const { userId } = await auth();
  
  if (!userId) {
    // User not authenticated
    return null;
  }
  
  // Use userId for database queries
}
```

### Get User Profile (Server)

```tsx
import { currentUser } from '@clerk/nextjs/server';

export default async function MyPage() {
  const user = await currentUser();
  
  if (!user) return null;
  
  // Access user.emailAddresses, user.firstName, etc.
}
```

### Get User Info (Client)

```tsx
'use client';

import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Not signed in</div>;
  
  return <div>Hello, {user.firstName}!</div>;
}
```

---

## Server Actions

Always verify authentication in server actions:

```tsx
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { links } from '@/db/schema';

export async function createLink(url: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  const [link] = await db.insert(links)
    .values({
      originalUrl: url,
      userId, // Store user ID with data
    })
    .returning();
  
  return link;
}
```

---

## User Sign Out

### Client Component

```tsx
'use client';

import { SignOutButton } from '@clerk/nextjs';

export function SignOut() {
  return (
    <SignOutButton>
      <button>Sign Out</button>
    </SignOutButton>
  );
}
```

### Programmatic Sign Out

```tsx
'use client';

import { useClerk } from '@clerk/nextjs';

export function SignOutProgrammatically() {
  const { signOut } = useClerk();
  
  return (
    <button onClick={() => signOut()}>
      Sign Out
    </button>
  );
}
```

---

## User Data Ownership

### Storing User ID

Always store the Clerk user ID with user-generated content:

```tsx
// db/schema.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const links = pgTable('links', {
  id: text('id').primaryKey(),
  originalUrl: text('original_url').notNull(),
  shortCode: text('short_code').notNull().unique(),
  userId: text('user_id').notNull(), // ← Store Clerk user ID
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Verifying Ownership

Before updating or deleting, verify the user owns the resource:

```tsx
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { links } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteLink(linkId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  // Only delete if user owns this link
  const result = await db.delete(links)
    .where(
      and(
        eq(links.id, linkId),
        eq(links.userId, userId) // ← Ownership check
      )
    )
    .returning();
  
  if (result.length === 0) {
    throw new Error('Link not found or unauthorized');
  }
  
  return result[0];
}
```

---

## API Routes

Protect API routes with Clerk:

```tsx
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Handle authenticated request
  return NextResponse.json({ data: 'secret data' });
}
```

---

## Common Patterns

### Conditional Rendering Based on Auth

```tsx
import { auth } from '@clerk/nextjs/server';

export default async function Header() {
  const { userId } = await auth();
  
  return (
    <header>
      {userId ? (
        <div>
          <a href="/dashboard">Dashboard</a>
          <SignOutButton />
        </div>
      ) : (
        <div>
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </div>
      )}
    </header>
  );
}
```

### Loading States

```tsx
'use client';

import { useUser } from '@clerk/nextjs';

export function ConditionalUI() {
  const { isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {isSignedIn ? 'Authenticated' : 'Not authenticated'}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: Infinite Redirect Loop

**Cause**: Middleware or page logic creating circular redirects

**Solution**: Ensure homepage doesn't redirect if user is not authenticated:

```tsx
// ✅ CORRECT
if (userId) {
  redirect('/dashboard');
}
// Don't redirect if no userId - just show landing page
```

### Issue: Modal Not Appearing

**Cause**: Missing `mode="modal"` on auth buttons

**Solution**: Always specify modal mode:

```tsx
<SignInButton mode="modal">Sign In</SignInButton>
```

### Issue: "Unauthorized" in Server Actions

**Cause**: Not checking auth before operations

**Solution**: Always call `auth()` at the start:

```tsx
const { userId } = await auth();
if (!userId) throw new Error('Unauthorized');
```

---

## Quick Reference

| Task | Import | Usage |
|------|--------|-------|
| Get user ID (server) | `auth` from `@clerk/nextjs/server` | `const { userId } = await auth()` |
| Get user profile (server) | `currentUser` from `@clerk/nextjs/server` | `const user = await currentUser()` |
| Get user info (client) | `useUser` from `@clerk/nextjs` | `const { user } = useUser()` |
| Sign in button | `SignInButton` from `@clerk/nextjs` | `<SignInButton mode="modal" />` |
| Sign up button | `SignUpButton` from `@clerk/nextjs` | `<SignUpButton mode="modal" />` |
| Sign out button | `SignOutButton` from `@clerk/nextjs` | `<SignOutButton />` |
| Protect routes | middleware or `auth()` + `redirect()` | See examples above |

---

## Remember

1. **Clerk ONLY** - No exceptions
2. **Modal mode** - Always for sign in/sign up
3. **Verify ownership** - Before modifying user data
4. **Store user ID** - With all user-generated content
5. **Check auth** - In every protected route and server action

**When in doubt, refer to this document - not external auth tutorials.**
