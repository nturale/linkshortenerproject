# Agent Instructions

## Project Overview

**Link Shortener** - A modern URL shortening service built with Next.js 16, TypeScript, and deployed on serverless infrastructure.

**Tech Stack:**
- **Framework**: Next.js 16.2.2 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Database**: Neon (Serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Auth**: Clerk
- **UI**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

---

## ⚠️ CRITICAL: Next.js Version Warning

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## 🚨 MANDATORY: Read Documentation FIRST

<!-- BEGIN:mandatory-docs-rule -->
**STOP. READ BEFORE CODING.**

You MUST read the relevant `/docs/*.md` file(s) BEFORE writing ANY code. This is not optional.

**Failure to read the documentation first will result in:**
- ❌ Incorrect implementation patterns
- ❌ Security vulnerabilities (auth bypasses, data leaks)
- ❌ Breaking changes and rework
- ❌ Violations of project conventions

**Process:**
1. User makes a request
2. **YOU READ** the relevant `/docs/*.md` file(s) FIRST using the `read_file` tool
3. THEN you implement the solution following the patterns in that documentation

**Documentation Map:**
- **Authentication/Protected Routes/User Data** → Read `docs/authentication.md` FIRST
- **UI Components/Styling/shadcn** → Read `docs/ui-components.md` FIRST

Do NOT skip this step. Do NOT rely on general knowledge. Do NOT assume patterns.
<!-- END:mandatory-docs-rule -->

---

## Documentation Structure

Topic-specific guidelines are organized in `/docs` directory. **🚨 ALWAYS read the relevant .md file BEFORE generating any code:**

- **`docs/authentication.md`** - Clerk auth patterns, route protection, user data ownership
- **`docs/ui-components.md`** - shadcn/ui component usage, styling, and composition rules

**⚠️ WARNING: Implementing features without reading the corresponding documentation file is a critical error.**

---

## Project Structure

```
linkshortnerproject/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (Clerk, fonts, nav)
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   └── [feature]/          # Feature-based routes
├── components/
│   └── ui/                 # shadcn/ui components
├── db/
│   ├── index.ts            # Database connection
│   └── schema.ts           # Drizzle schema definitions
├── docs/                   # Agent instructions (you are here)
├── lib/
│   └── utils.ts            # Utility functions (cn, etc.)
├── public/                 # Static assets
├── drizzle.config.ts       # Drizzle Kit configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

---

## Core Principles

### 1. TypeScript Strict Mode

- **Always** use explicit types for function parameters and return values
- **Avoid** using `any` - use `unknown` and type guards instead
- **Use** `@/` path alias for all imports
- **Infer** types from Drizzle schemas using `InferSelectModel` and `InferInsertModel`

### 2. Server Components First

- Default to Server Components for better performance
- Only use `"use client"` when you need:
  - Hooks (useState, useEffect, etc.)
  - Browser APIs
  - Event handlers (onClick, onChange, etc.)
- Server Components can be async - use this for data fetching

### 3. Database Patterns

- **One database instance**: Import from `@/db`
- **Always use transactions** for multi-step operations
- **Use `.returning()`** to get inserted/updated data
- **Define schemas** in `db/schema.ts` using Drizzle syntax
- **Run migrations** before deploying: `npm run drizzle-kit push`

### 4. Authentication

- **Protect routes** with Clerk middleware
- **Check auth** in Server Components: `const { userId } = await auth()`
- **Store user ID** with user-generated content
- **Verify ownership** before modifying/deleting user data

### 5. Component Organization

- **Use shadcn/ui** for base components (Button, Card, Input, etc.)
- **Feature components** go in `app/[feature]/` directory
- **Shared components** go in `components/` (not ui/)
- **Always use `cn()`** for conditional/merged class names

### 6. Styling

- **Mobile-first** responsive design
- **Always consider dark mode**: use `dark:` variants
- **Use Tailwind design tokens** - avoid arbitrary values
- **Group related utilities** for readability

---

## Development Workflow

### Adding Features

1. **🚨 READ RELEVANT DOCS FIRST** - Use `read_file` tool to read the applicable `/docs/*.md` file(s) BEFORE writing any code
2. **Create schema** if database tables are needed
3. **Run migration**: `npm run drizzle-kit generate && npm run drizzle-kit push`
4. **Create components** (Server Components by default)
5. **Add auth checks** for protected features (per `docs/authentication.md`)
6. **Style with Tailwind** using mobile-first approach (per `docs/ui-components.md`)

**⚠️ Step 1 is MANDATORY - never skip reading the documentation.**

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

This copies the component into `components/ui/` for customization.

### Database Changes

```bash
# 1. Update schema in db/schema.ts
# 2. Generate migration
npm run drizzle-kit generate

# 3. Apply migration
npm run drizzle-kit push

# 4. (Optional) Open Drizzle Studio
npm run drizzle-kit studio
```

---

## Common Patterns

### Protected Server Component

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  
  // Fetch user-specific data
  const data = await db.select()
    .from(links)
    .where(eq(links.userId, userId));
  
  return <div>{/* Render data */}</div>;
}
```

### Server Action with Auth

```tsx
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';

export async function createLink(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  
  const url = formData.get('url') as string;
  
  const [link] = await db.insert(links)
    .values({ originalUrl: url, userId })
    .returning();
  
  return link;
}
```

### Client Component with Form

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CreateLinkForm() {
  const [url, setUrl] = useState('');
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Handle submission
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={url} 
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button type="submit">Create</Button>
    </form>
  );
}
```

---

## Environment Variables

Required in `.env.local`:

```bash
# Database
DATABASE_URL=your_neon_database_url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## Code Quality Standards

### Must Haves

- ✅ Explicit TypeScript types for all functions
- ✅ Error handling with try/catch for async operations
- ✅ Auth checks for protected routes/actions
- ✅ Loading and error states for async components
- ✅ Accessibility attributes (aria-label for icon buttons)
- ✅ Responsive design (mobile-first with breakpoints)
- ✅ Dark mode support for all UI

### Must Avoid

- ❌ Using `any` type
- ❌ Importing from `next/router` (use `next/navigation`)
- ❌ Hardcoded values - use environment variables
- ❌ Client Components when Server Components work
- ❌ Relative imports - use `@/` path alias
- ❌ Inline styles - use Tailwind utilities
- ❌ Missing error handling for database operations

---

## Testing Checklist

Before marking a feature complete:

- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] Responsive on mobile, tablet, desktop
- [ ] Dark mode works correctly
- [ ] Authentication works (if applicable)
- [ ] Database operations succeed
- [ ] Error states are handled
- [ ] Loading states are shown

---

## Final Reminder

<!-- BEGIN:final-reminder -->
**📖 DOCUMENTATION-FIRST DEVELOPMENT**

Every feature request follows this pattern:

```
1. User Request
   ↓
2. 🚨 READ /docs/*.md file(s) using read_file tool
   ↓
3. Implement following documented patterns
   ↓
4. Verify against documentation checklist
```

**The documentation files in `/docs/` are the source of truth.**

They contain:
- ✅ Tested patterns that work with this stack
- ✅ Security best practices
- ✅ Framework-specific requirements
- ✅ Project conventions

**Your training data may be outdated or incorrect for this project.**

Always defer to the `/docs/*.md` files.
<!-- END:final-reminder -->

---

**When in doubt, read the specific documentation file before asking.**
