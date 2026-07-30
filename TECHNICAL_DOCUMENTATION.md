# Link Shortener - Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Authentication](#authentication)
6. [API Routes](#api-routes)
7. [Server Actions](#server-actions)
8. [Data Layer](#data-layer)
9. [Component Structure](#component-structure)
10. [Features](#features)
11. [Development Setup](#development-setup)
12. [Deployment](#deployment)
13. [Security Considerations](#security-considerations)

---

## Project Overview

**Link Shortener** is a modern, serverless URL shortening service built with Next.js 16, TypeScript, and deployed on edge infrastructure. It provides users with the ability to create, manage, and track shortened URLs with click analytics.

### Key Capabilities

- 🔗 **URL Shortening**: Convert long URLs into short, shareable links
- 📊 **Click Tracking**: Monitor link performance with click counts
- 🔐 **User Authentication**: Secure user accounts with Clerk
- ✏️ **Link Management**: Create, update, and delete links
- 🎯 **Custom Short Codes**: Edit and customize short codes
- 📱 **Responsive Design**: Works seamlessly across all devices

---

## Architecture

### Application Structure

```
linkshortenerproject/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout with Clerk provider
│   ├── page.tsx              # Landing page
│   ├── globals.css           # Global styles
│   ├── dashboard/            # Protected dashboard routes
│   │   ├── page.tsx          # Dashboard UI
│   │   ├── actions.ts        # Server actions for CRUD
│   │   └── components/       # Dashboard-specific components
│   └── l/[shortcode]/        # Redirect route handler
│       └── route.ts          # API route for redirection
├── components/
│   └── ui/                   # shadcn/ui components
├── data/
│   └── links.ts              # Data access layer
├── db/
│   ├── index.ts              # Database connection
│   └── schema.ts             # Drizzle schema definitions
├── lib/
│   └── utils.ts              # Utility functions
├── public/                   # Static assets
├── proxy.ts                  # Clerk middleware (Next.js 16)
├── drizzle.config.ts         # Drizzle ORM configuration
└── tsconfig.json             # TypeScript configuration
```

### Architecture Patterns

1. **Server Components First**: Maximizes performance by defaulting to server components
2. **Server Actions**: Uses Next.js server actions for data mutations
3. **Data Access Layer**: Centralized database queries in `data/links.ts`
4. **Type Safety**: Fully typed with TypeScript strict mode
5. **Serverless Database**: Neon PostgreSQL for scalable, serverless database

---

## Technology Stack

### Core Framework

- **Next.js 16.2.2**: React framework with App Router
  - Server Components
  - Server Actions
  - Route Handlers
  - File-based routing

### Language & Type Safety

- **TypeScript 5**: Strict mode enabled
- **Zod 4.4.3**: Runtime type validation and schema validation

### Database & ORM

- **Neon Database**: Serverless PostgreSQL
  - `@neondatabase/serverless` (v1.0.2)
- **Drizzle ORM** (v0.45.2): Type-safe ORM
  - `drizzle-kit` (v0.31.10): Schema management and migrations

### Authentication

- **Clerk** (v7.0.8): Complete authentication solution
  - User management
  - Session handling
  - Protected routes via proxy
  - Sign in/Sign up modals

### UI Framework

- **React 19.2.4**: UI library
- **shadcn/ui**: Component library built on Radix UI
- **Radix UI** (v1.4.3): Accessible component primitives
- **Lucide React** (v1.7.0): Icon library
- **Tailwind CSS v4**: Utility-first CSS
- **class-variance-authority** (v0.7.1): Component variant management

### Build & Development Tools

- **ESLint 9**: Code linting
- **Prettier 3.8.3**: Code formatting
- **tsx 4.21.0**: TypeScript execution

---

## Database Schema

### Links Table

Defined in `db/schema.ts`:

```typescript
export const links = pgTable(
  'links',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    userId: text('user_id').notNull(),
    originalUrl: text('original_url').notNull(),
    shortCode: varchar('short_code', { length: 20 }).notNull().unique(),
    clicks: integer('clicks').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    shortCodeIdx: uniqueIndex('short_code_idx').on(table.shortCode),
    userIdIdx: index('user_id_idx').on(table.userId),
  })
);
```

### Schema Details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| `userId` | text | NOT NULL, INDEXED | Clerk user ID (owner) |
| `originalUrl` | text | NOT NULL | Full destination URL |
| `shortCode` | varchar(20) | NOT NULL, UNIQUE, INDEXED | URL-safe short code |
| `clicks` | integer | NOT NULL, DEFAULT 0 | Click counter |
| `createdAt` | timestamp | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updatedAt` | timestamp | NOT NULL, DEFAULT NOW() | Last update timestamp |

### Indexes

1. **shortCodeIdx**: Unique index on `shortCode` for fast lookups during redirects
2. **userIdIdx**: Index on `userId` for efficient user link queries

### TypeScript Types

```typescript
export type Link = InferSelectModel<typeof links>;
export type NewLink = InferInsertModel<typeof links>;
```

These types are automatically inferred from the schema and provide full type safety.

---

## Authentication

### Authentication Provider

**Clerk** is used for authentication, providing:
- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- User profile management
- Session management

### Middleware Configuration

**Important**: Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`.

**File**: `proxy.ts`

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

This middleware:
- Runs on all routes except static assets
- Injects authentication context
- Enables `auth()` helper in server components

### Protected Routes Pattern

**Server Component Protection**:

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/');
  }
  
  // Protected content
}
```

**Server Action Protection**:

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

export async function protectedAction() {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  // Protected logic
}
```

### Authentication Flow

1. User clicks "Sign in" or "Sign up" on landing page
2. Clerk modal appears with authentication form
3. Upon success, user is redirected to `/dashboard` via `forceRedirectUrl`
4. Dashboard checks authentication via `auth()` helper
5. All subsequent server actions verify `userId` before mutations

---

## API Routes

### Redirect Route

**Route**: `GET /l/[shortcode]`  
**File**: `app/l/[shortcode]/route.ts`

**Purpose**: Handles link redirection and click tracking

**Flow**:

```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { shortcode } = await params;
  
  // 1. Query database for link
  const [link] = await db
    .select()
    .from(links)
    .where(eq(links.shortCode, shortcode))
    .limit(1);
  
  // 2. Return 404 if not found
  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }
  
  // 3. Increment click count (non-blocking)
  db.update(links)
    .set({ 
      clicks: link.clicks + 1,
      updatedAt: new Date(),
    })
    .where(eq(links.id, link.id))
    .then(...)
    .catch(...);
  
  // 4. Redirect to original URL (307 Temporary Redirect)
  return NextResponse.redirect(link.originalUrl, { status: 307 });
}
```

**Key Features**:
- Fast lookups via indexed `shortCode`
- Non-blocking click tracking (doesn't delay redirect)
- 307 status for temporary redirect (preserves HTTP method)
- Error handling with 404 and 500 responses

**Response Codes**:
- `307`: Successful redirect to original URL
- `404`: Short code not found
- `500`: Internal server error

---

## Server Actions

Server actions in `app/dashboard/actions.ts` handle all data mutations with authentication and validation.

### Create Link Action

**Function**: `createLink(data: unknown): Promise<CreateLinkResult>`

**Validation Schema**:
```typescript
const createLinkSchema = z.object({
  originalUrl: z.string().refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid URL" }
  ),
});
```

**Flow**:
1. Verify authentication via `auth()`
2. Validate input with Zod schema
3. Call `insertLink()` data layer function
4. Revalidate `/dashboard` path to show new link
5. Return typed result

**Return Type**:
```typescript
type CreateLinkResult = 
  | { success: true; data: Link }
  | { success: false; error: string };
```

### Update Link Action

**Function**: `editLink(data: unknown): Promise<UpdateLinkResult>`

**Validation Schema**:
```typescript
const updateLinkSchema = z.object({
  linkId: z.number(),
  originalUrl: z.string().refine(/* URL validation */),
  shortCode: z.string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});
```

**Flow**:
1. Verify authentication
2. Validate input (including optional custom short code)
3. Call `updateLink()` with ownership verification
4. Revalidate dashboard
5. Return typed result

**Key Features**:
- Optional custom short code editing
- Ownership verification in data layer
- URL validation with Zod

### Delete Link Action

**Function**: `removeLinkAction(linkId: number): Promise<DeleteLinkResult>`

**Flow**:
1. Verify authentication
2. Call `deleteLink()` with ownership verification
3. Revalidate dashboard to remove from UI
4. Return success/error

**Return Type**:
```typescript
type DeleteLinkResult = 
  | { success: true }
  | { success: false; error: string };
```

### Error Handling Pattern

All server actions follow this pattern:

```typescript
try {
  // Database operation
  const result = await databaseFunction();
  revalidatePath("/dashboard");
  return { success: true, data: result };
} catch (error) {
  console.error("Error:", error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : "Generic error message" 
  };
}
```

---

## Data Layer

The data access layer in `data/links.ts` provides reusable, type-safe database operations.

### Query Functions

#### getUserLinks

```typescript
export async function getUserLinks(userId: string): Promise<Link[]>
```

**Purpose**: Fetches all links for a user, ordered by most recently updated

**Implementation**:
```typescript
const userLinks = await db
  .select()
  .from(links)
  .where(eq(links.userId, userId))
  .orderBy(desc(links.updatedAt));
```

### Mutation Functions

#### insertLink

```typescript
export async function insertLink(
  originalUrl: string, 
  userId: string
): Promise<Link>
```

**Purpose**: Creates a new link with auto-generated unique short code

**Algorithm**:
1. Generate random 6-character alphanumeric code
2. Check for collisions in database
3. Retry up to 10 times if collision occurs
4. Insert link and return created record

**Short Code Generation**:
```typescript
function generateShortCode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
```

**Collision Handling**:
- Maximum 10 attempts
- Throws error if unique code cannot be generated
- Uses database query to check existing codes

#### updateLink

```typescript
export async function updateLink(
  linkId: number,
  originalUrl: string,
  userId: string,
  shortCode?: string
): Promise<Link | null>
```

**Purpose**: Updates link's URL and/or short code with ownership verification

**Key Features**:
- Verifies user owns the link before updating
- Optionally updates custom short code
- Updates `updatedAt` timestamp
- Returns `null` if link not found or unauthorized

#### deleteLink

```typescript
export async function deleteLink(
  linkId: number,
  userId: string
): Promise<boolean>
```

**Purpose**: Deletes a link with ownership verification

**Returns**: `true` if deleted, `false` if not found or unauthorized

### Statistics Functions

#### calculateLinkStats

```typescript
export function calculateLinkStats(userLinks: Link[]) {
  const totalLinks = userLinks.length;
  const totalClicks = userLinks.reduce((sum, link) => sum + link.clicks, 0);
  const activeLinks = userLinks.filter(link => link.clicks > 0).length;
  
  return { totalLinks, totalClicks, activeLinks };
}
```

**Purpose**: Calculates aggregate statistics from user's links

**Metrics**:
- `totalLinks`: Count of all links
- `totalClicks`: Sum of all click counts
- `activeLinks`: Count of links with at least 1 click

---

## Component Structure

### Server Components

#### Dashboard Page

**File**: `app/dashboard/page.tsx`

**Responsibilities**:
- Authentication check and redirect
- Fetch user's links via `getUserLinks()`
- Calculate statistics via `calculateLinkStats()`
- Render stats cards and link list
- Compose dialog components

**Data Flow**:
```typescript
export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');
  
  const userLinks = await getUserLinks(userId);
  const { totalLinks, totalClicks, activeLinks } = calculateLinkStats(userLinks);
  
  return (
    <main>
      {/* Stats cards */}
      {/* Links list with actions */}
    </main>
  );
}
```

#### Landing Page

**File**: `app/page.tsx`

**Responsibilities**:
- Check authentication and redirect to dashboard if logged in
- Display hero section with value proposition
- Show feature cards
- CTA buttons for sign in/sign up

**Features Highlighted**:
- Custom short links
- Click analytics
- Lightning fast redirects
- QR code generation (future feature)
- Secure authentication
- Link expiration (future feature)

#### Root Layout

**File**: `app/layout.tsx`

**Responsibilities**:
- Wrap app in `ClerkProvider`
- Configure fonts (Geist Sans, Geist Mono)
- Render navigation header
- Conditional rendering of auth buttons vs user button

**Navigation Components**:
```typescript
<Show when="signed-out">
  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
    <Button variant="ghost">Sign in</Button>
  </SignInButton>
  <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
    <Button>Sign up</Button>
  </SignUpButton>
</Show>
<Show when="signed-in">
  <UserButton />
</Show>
```

### Client Components

All dialog components use `"use client"` directive for interactivity.

#### CreateLinkDialog

**File**: `app/dashboard/components/CreateLinkDialog.tsx`

**Responsibilities**:
- Render "Create Link" button and dialog
- Form with URL input
- Client-side form state management
- Call `createLink()` server action
- Display loading state and error messages
- Close dialog on success

**State Management**:
- `url`: Input field value
- `isLoading`: Submission state
- `error`: Error message display
- `open`: Dialog open/close state

#### EditLinkDialog

**File**: `app/dashboard/components/EditLinkDialog.tsx`

**Responsibilities**:
- Render edit icon button and dialog
- Pre-populate form with existing link data
- Allow editing original URL and short code
- Call `editLink()` server action
- Handle validation errors

**Props**:
```typescript
interface EditLinkDialogProps {
  link: Link;
}
```

#### DeleteLinkDialog

**File**: `app/dashboard/components/DeleteLinkDialog.tsx`

**Responsibilities**:
- Render delete icon button
- Show confirmation alert dialog
- Call `removeLinkAction()` server action
- Display loading state during deletion
- Handle errors

**Props**:
```typescript
interface DeleteLinkDialogProps {
  link: Link;
}
```

### shadcn/ui Components

Located in `components/ui/`:

- `button.tsx`: Customizable button with variants
- `card.tsx`: Card container components
- `dialog.tsx`: Modal dialog primitive
- `alert-dialog.tsx`: Confirmation dialog
- `input.tsx`: Form input field
- `label.tsx`: Form label

**Usage Pattern**:
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
```

All components support:
- Dark mode via `dark:` variants
- Accessibility (ARIA attributes)
- Customization via `className` prop
- Variant props for different styles

---

## Features

### 1. URL Shortening

**User Flow**:
1. User clicks "Create Link" button on dashboard
2. Dialog opens with URL input field
3. User enters long URL
4. System validates URL format
5. Server generates unique 6-character short code
6. Link saved to database with user ownership
7. Dashboard updates to show new link

**Technical Details**:
- Short codes are alphanumeric (A-Z, a-z, 0-9)
- Default length: 6 characters (62^6 = 56.8 billion combinations)
- Collision detection with retry mechanism
- URL validation using `new URL()` constructor

### 2. Link Redirection

**User Flow**:
1. User or recipient visits `yourdomain.com/l/abc123`
2. System looks up short code in database
3. Click counter increments asynchronously
4. User redirected to original URL

**Technical Details**:
- Indexed lookup on `shortCode` for fast queries
- Non-blocking click tracking (doesn't delay redirect)
- 307 Temporary Redirect status
- 404 handling for invalid codes

### 3. Click Analytics

**Current Implementation**:
- Simple click counter per link
- Total clicks aggregated on dashboard
- "Active links" count (links with ≥1 click)

**Display Locations**:
- Dashboard stats cards (total clicks)
- Individual link cards (clicks per link)

**Future Enhancements** (not yet implemented):
- Geographic data
- Referrer tracking
- Click timestamps
- Charts and graphs

### 4. Link Management

#### Create
- Automated short code generation
- URL validation
- Immediate dashboard update via `revalidatePath()`

#### Edit
- Update original URL
- Change short code (custom alias)
- Ownership verification
- Unique short code validation

#### Delete
- Confirmation dialog
- Ownership verification
- Soft delete could be added (currently hard delete)

### 5. User Dashboard

**Components**:
- **Stats Cards**: Total links, total clicks, active links
- **Links List**: Sortable table of user's links
- **Quick Actions**: Edit and delete buttons per link
- **Copy Button**: Copy short link to clipboard

**Responsive Design**:
- Mobile: Stacked layout
- Tablet: 2-column grid for stats
- Desktop: 3-column grid for stats

---

## Development Setup

### Prerequisites

- Node.js 20+ (for React 19 support)
- npm or pnpm
- Neon database account
- Clerk account

### Environment Variables

Create `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Installation

```bash
# Install dependencies
npm install

# Generate database schema
npm run drizzle-kit generate

# Push schema to database
npm run drizzle-kit push

# Start development server
npm run dev
```

### Available Scripts

```json
{
  "dev": "next dev",              // Start dev server (localhost:3000)
  "build": "next build",          // Production build
  "start": "next start",          // Start production server
  "lint": "eslint"                // Run ESLint
}
```

### Drizzle Kit Commands

```bash
# Generate migration files
npm run drizzle-kit generate

# Push schema to database (no migration files)
npm run drizzle-kit push

# Open Drizzle Studio (database GUI)
npm run drizzle-kit studio
```

### Development Workflow

1. Make schema changes in `db/schema.ts`
2. Run `npm run drizzle-kit generate` to create migration
3. Run `npm run drizzle-kit push` to apply changes
4. Update TypeScript types (auto-inferred)
5. Update components/actions to use new schema

---

## Deployment

### Recommended Platforms

1. **Vercel** (Optimal for Next.js)
   - Zero-config deployment
   - Automatic HTTPS
   - Edge network
   - Serverless functions

2. **Netlify**
   - Next.js support
   - Serverless PostgreSQL compatible

3. **AWS Amplify**
   - Full AWS integration
   - Custom domain support

### Deployment Checklist

- [ ] Set environment variables in hosting platform
- [ ] Run database migrations
- [ ] Configure custom domain (optional)
- [ ] Set up Clerk production instance
- [ ] Enable production mode in Clerk
- [ ] Update Clerk redirect URLs
- [ ] Test authentication flow
- [ ] Test link creation and redirection
- [ ] Monitor error logs

### Build Configuration

**File**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 configuration
};

export default nextConfig;
```

### Database Migration for Production

```bash
# Before deploying
npm run drizzle-kit push
```

Or use Drizzle Kit's migration workflow:

```bash
# Generate migration
npm run drizzle-kit generate

# Apply to production database
DATABASE_URL=<prod_url> npm run drizzle-kit push
```

### Performance Considerations

- **Edge Deployment**: Deploy redirect route to edge for global low latency
- **Database Connection**: Use connection pooling (Neon handles this)
- **Caching**: Consider adding Redis for hot links
- **CDN**: Static assets served from CDN automatically (Vercel)

---

## Security Considerations

### Authentication Security

✅ **Implemented**:
- All mutations require authentication
- Ownership verification on updates/deletes
- Server-side session validation
- Secure cookies via Clerk

⚠️ **Recommendations**:
- Enable MFA in Clerk settings
- Configure session timeout
- Implement rate limiting (see `docs/rate-limiting.md`)

### Data Validation

✅ **Implemented**:
- Zod schemas for all inputs
- URL validation before insertion
- Short code format validation
- SQL injection protection via Drizzle ORM

### Database Security

✅ **Best Practices**:
- Parameterized queries (Drizzle ORM)
- Indexed user_id for row-level isolation
- Environment variables for credentials
- No sensitive data in version control

⚠️ **Future Enhancements**:
- Database encryption at rest (Neon supports this)
- Audit logs for sensitive operations
- Backup strategy

### Link Security

⚠️ **Considerations**:
- No malicious URL checking (could add third-party service)
- No spam/abuse prevention (rate limiting recommended)
- Public links are guessable (short codes are random, not sequential)

**Recommended Additions**:
- URL reputation checking (Google Safe Browsing API)
- Rate limiting per user/IP
- Link expiration feature
- Private/password-protected links

### OWASP Top 10 Compliance

| Vulnerability | Status | Mitigation |
|--------------|--------|------------|
| Injection | ✅ Protected | Parameterized queries via Drizzle |
| Broken Auth | ✅ Protected | Clerk handles auth securely |
| Sensitive Data | ✅ Protected | No PII stored, env vars used |
| XML External Entities | N/A | No XML parsing |
| Broken Access Control | ✅ Protected | Ownership verification on all mutations |
| Security Misconfiguration | ⚠️ Partial | Review Clerk settings, enable MFA |
| XSS | ✅ Protected | React auto-escaping |
| Insecure Deserialization | N/A | No deserialization of untrusted data |
| Using Components with Known Vulnerabilities | ⚠️ Monitor | Run `npm audit` regularly |
| Insufficient Logging | ⚠️ Partial | Add production logging service |

---

## API Reference

### Server Actions

#### createLink

```typescript
function createLink(data: unknown): Promise<CreateLinkResult>
```

**Input**:
```typescript
{
  originalUrl: string; // Must be valid URL
}
```

**Output**:
```typescript
// Success
{ success: true; data: Link }

// Error
{ success: false; error: string }
```

#### editLink

```typescript
function editLink(data: unknown): Promise<UpdateLinkResult>
```

**Input**:
```typescript
{
  linkId: number;
  originalUrl: string;
  shortCode?: string; // Optional, 3-20 chars, alphanumeric + hyphens/underscores
}
```

**Output**:
```typescript
// Success
{ success: true; data: Link }

// Error
{ success: false; error: string }
```

#### removeLinkAction

```typescript
function removeLinkAction(linkId: number): Promise<DeleteLinkResult>
```

**Input**: `linkId: number`

**Output**:
```typescript
// Success
{ success: true }

// Error
{ success: false; error: string }
```

### Data Layer Functions

#### getUserLinks

```typescript
function getUserLinks(userId: string): Promise<Link[]>
```

Returns all links owned by user, sorted by `updatedAt` descending.

#### insertLink

```typescript
function insertLink(originalUrl: string, userId: string): Promise<Link>
```

Creates new link with auto-generated short code.

**Throws**: Error if unique short code cannot be generated after 10 attempts.

#### updateLink

```typescript
function updateLink(
  linkId: number,
  originalUrl: string,
  userId: string,
  shortCode?: string
): Promise<Link | null>
```

Updates link if user owns it. Returns `null` if not found or unauthorized.

#### deleteLink

```typescript
function deleteLink(linkId: number, userId: string): Promise<boolean>
```

Deletes link if user owns it. Returns `false` if not found or unauthorized.

#### calculateLinkStats

```typescript
function calculateLinkStats(userLinks: Link[]): {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
}
```

Calculates aggregate statistics from array of links.

---

## TypeScript Types

### Link

```typescript
type Link = {
  id: number;
  userId: string;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### NewLink

```typescript
type NewLink = {
  userId: string;
  originalUrl: string;
  shortCode: string;
  clicks?: number; // Optional, defaults to 0
  createdAt?: Date; // Optional, defaults to now
  updatedAt?: Date; // Optional, defaults to now
}
```

### Server Action Results

```typescript
type CreateLinkResult = 
  | { success: true; data: Link }
  | { success: false; error: string };

type UpdateLinkResult = 
  | { success: true; data: Link }
  | { success: false; error: string };

type DeleteLinkResult = 
  | { success: true }
  | { success: false; error: string };
```

---

## Troubleshooting

### Common Issues

#### Database Connection Error

**Symptom**: `Error: Connection refused` or timeout errors

**Solutions**:
1. Verify `DATABASE_URL` is correct in `.env.local`
2. Check Neon database is active (free tier may suspend)
3. Whitelist your IP in Neon dashboard
4. Test connection with `npm run drizzle-kit studio`

#### Authentication Not Working

**Symptom**: Redirects to sign-in even when logged in

**Solutions**:
1. Clear browser cookies
2. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. Check Clerk dashboard for correct environment (dev vs prod)
4. Ensure `proxy.ts` is present (not `middleware.ts`)

#### Short Code Collisions

**Symptom**: Error "Failed to generate unique short code"

**Solutions**:
1. Increase short code length in `generateShortCode()`
2. Check database has capacity (rare with 6-char codes)
3. Review database indexes are working

#### Build Errors

**Symptom**: TypeScript errors during build

**Solutions**:
1. Run `npm install` to ensure all deps installed
2. Delete `.next` folder and rebuild
3. Check `tsconfig.json` is valid
4. Verify all imports use `@/` path alias

---

## Future Enhancements

### Planned Features

1. **QR Code Generation**
   - Auto-generate QR codes for each link
   - Download QR as PNG/SVG
   - Custom QR styling

2. **Advanced Analytics**
   - Geographic click distribution
   - Referrer tracking
   - Device/browser analytics
   - Click timeline charts

3. **Link Expiration**
   - Set expiration date/time
   - Auto-disable expired links
   - Notify user before expiration

4. **Custom Domains**
   - Allow users to use their own domains
   - Domain verification flow
   - SSL certificate management

5. **Link Collections**
   - Group links into folders/campaigns
   - Bulk operations
   - Shared collections

6. **API Access**
   - REST API for link creation
   - API key management
   - Rate limiting per key

7. **Link Passwords**
   - Password-protect sensitive links
   - Temporary access codes
   - Password expiration

8. **UTM Builder**
   - Append UTM parameters
   - Campaign tracking
   - Source/medium presets

---

## Glossary

- **Short Code**: The unique alphanumeric identifier in the shortened URL (e.g., "abc123" in `/l/abc123`)
- **Original URL**: The full destination URL that users are redirected to
- **Server Component**: React component that renders on the server (default in Next.js App Router)
- **Client Component**: React component that renders on the client (requires `"use client"` directive)
- **Server Action**: Function that runs on the server but can be called from client components
- **Drizzle ORM**: TypeScript ORM for SQL databases with full type safety
- **Clerk**: Authentication service that provides user management and session handling
- **Neon**: Serverless PostgreSQL database with automatic scaling
- **shadcn/ui**: Component library built on Radix UI with Tailwind CSS styling
- **Zod**: TypeScript-first schema validation library

---

## Contributing

### Code Style

- **Formatting**: Use Prettier (run `npm run format` if configured)
- **Linting**: Fix all ESLint errors before committing
- **TypeScript**: No `any` types, use `unknown` with type guards
- **Imports**: Use `@/` path alias for all local imports
- **Components**: Server Components by default, `"use client"` only when needed

### Pull Request Guidelines

1. Create feature branch from `main`
2. Write descriptive commit messages
3. Add tests for new features (if testing is set up)
4. Update documentation if changing behavior
5. Ensure build passes: `npm run build`
6. Request review from maintainer

### Documentation

When adding features, update:
- This technical documentation
- `AGENTS.md` (for AI agent context)
- `README.md` (user-facing docs)
- Inline code comments for complex logic

---

## Contact & Support

For questions or issues:

1. Check this documentation first
2. Review `AGENTS.md` for architecture decisions
3. Check `docs/` folder for specific topics (e.g., rate-limiting)
4. Open an issue in the repository

---

## License

[Specify license here, e.g., MIT, Apache 2.0, proprietary]

---

## Changelog

### Version 0.1.0 (Current)

**Features**:
- ✅ User authentication with Clerk
- ✅ Create shortened links with auto-generated codes
- ✅ Edit link URLs and custom short codes
- ✅ Delete links with confirmation
- ✅ Click tracking and analytics
- ✅ User dashboard with statistics
- ✅ Responsive design
- ✅ Dark mode support

**Technical**:
- ✅ Next.js 16 with App Router
- ✅ TypeScript strict mode
- ✅ Drizzle ORM with Neon PostgreSQL
- ✅ Server actions for mutations
- ✅ shadcn/ui components
- ✅ Tailwind CSS v4

---

**Last Updated**: June 2, 2026  
**Documentation Version**: 1.0
