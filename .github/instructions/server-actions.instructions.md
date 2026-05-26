---
description: Read this before implementing or modifying server actions for data mutations in this project.
---

# Server Actions Guidelines

## Core Principles

**All data mutations in this application MUST be performed via server actions.**

**Server actions MUST NOT throw errors.** Instead, return an object with either:
- `{ success: true, data: ... }` for successful operations
- `{ success: false, error: string }` for errors

## File Structure

- Server action files MUST be named `actions.ts`
- Server actions MUST be colocated in the same directory as the component that calls them

Example:
```
app/
  dashboard/
    components/
      LinkForm.tsx        # Client component
    actions.ts            # Server actions for this feature
```

## Implementation Rules

### 1. Client Component Calls

Server actions MUST be called from client components. Mark components with `"use client"` directive.

```tsx
"use client";

import { createLink } from "./actions";

export function LinkForm() {
  async function handleSubmit(data: CreateLinkInput) {
    const result = await createLink(data);
    if (!result.success) {
      // Handle error
      console.error(result.error);
      return;
    }
    // Handle success with result.data
  }
  // ...
}
```

### 2. Type Safety

**DO NOT use the `FormData` TypeScript type for server action parameters.**

Define explicit TypeScript interfaces or types for all data passed to server actions:

```tsx
// ❌ WRONG
export async function createLink(formData: FormData) { }

// ✅ CORRECT
interface CreateLinkInput {
  originalUrl: string;
  userId: string;
}

export async function createLink(data: CreateLinkInput) { }
```

### 3. Validation with Zod

ALL data received by server actions MUST be validated using Zod schemas:

```tsx
"use server";

import { z } from "zod";

const createLinkSchema = z.object({
  originalUrl: z.string().url(),
  userId: z.string().min(1),
});

export async function createLink(data: unknown) {
  const result = createLinkSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "Invalid input data" };
  }
  // Continue with result.data
}
```

### 4. Authentication Check

ALL server actions MUST check for a logged-in user BEFORE performing any database operations:

```tsx
"use server";

import { auth } from "@clerk/nextjs/server";

export async function createLink(data: CreateLinkInput) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  // Proceed with database operations
}
```

### 5. Database Operations

Server actions MUST NOT contain direct Drizzle queries. Instead:

- Use helper functions from the `/data` directory
- Helper functions wrap Drizzle queries for reusability and consistency

```tsx
// ❌ WRONG - Direct Drizzle query in server action
export async function createLink(data: CreateLinkInput) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };
  
  await db.insert(links).values({
    originalUrl: data.originalUrl,
    userId,
  });
}

// ✅ CORRECT - Use helper function
import { insertLink } from "@/data/links";

export async function createLink(data: CreateLinkInput) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };
  
  const result = createLinkSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "Invalid input data" };
  }
  
  const link = await insertLink({
    originalUrl: result.data.originalUrl,
    userId,
  });
  
  return { success: true, data: link };
}
```

## Complete Example

```tsx
// app/dashboard/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { insertLink } from "@/data/links";

const createLinkSchema = z.object({
  originalUrl: z.string().url("Must be a valid URL"),
});

type CreateLinkResult =
  | { success: true; data: Link }
  | { success: false; error: string };

export async function createLink(data: unknown): Promise<CreateLinkResult> {
  // 1. Auth check
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  // 2. Validate input
  const result = createLinkSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "Invalid URL provided" };
  }
  
  // 3. Database operation via helper
  try {
    const link = await insertLink({
      originalUrl: result.data.originalUrl,
      userId,
    });
    return { success: true, data: link };
  } catch (error) {
    return { success: false, error: "Failed to create link" };
  }
}
```

## Checklist

Before committing server actions, verify:

- [ ] File is named `actions.ts` and colocated with component
- [ ] Called from a client component (`"use client"`)
- [ ] Uses explicit TypeScript types (not `FormData`)
- [ ] All inputs validated with Zod
- [ ] Authentication check performed first
- [ ] Database operations use helper functions from `/data`
- [ ] No direct Drizzle queries in the action
- [ ] Returns `{ success: true, data }` or `{ success: false, error }` (never throws)
