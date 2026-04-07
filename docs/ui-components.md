# UI Components Guidelines

## Overview

This project uses **shadcn/ui** exclusively for all user interface components. Custom UI components should NOT be created.

---

## Core Rules

### ❌ DO NOT

- **Create custom UI components** from scratch
- **Build custom buttons, inputs, cards, dialogs, etc.**
- **Write custom Radix UI implementations**
- **Copy component code** from other sources

### ✅ ALWAYS DO

- **Use shadcn/ui components** from `@/components/ui`
- **Add new shadcn components** via CLI when needed
- **Compose shadcn components** to build features
- **Customize through Tailwind classes** and props

---

## Adding New Components

When you need a component that doesn't exist in `components/ui/`:

```bash
npx shadcn@latest add [component-name]
```

**Available components include:**
- `button`, `input`, `card`, `dialog`, `dropdown-menu`
- `select`, `checkbox`, `radio-group`, `switch`, `slider`
- `tabs`, `accordion`, `alert`, `badge`, `avatar`
- `table`, `form`, `label`, `textarea`, `tooltip`
- And many more at [ui.shadcn.com](https://ui.shadcn.com)

---

## Usage Patterns

### Basic Component Import

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

### Composing Features

Build feature-specific components by **composing** shadcn components:

```tsx
// ✅ CORRECT: Compose shadcn components
export function LinkCard({ link }: { link: Link }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{link.shortCode}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{link.originalUrl}</p>
        <Button>Copy</Button>
      </CardContent>
    </Card>
  );
}
```

```tsx
// ❌ WRONG: Custom component from scratch
export function CustomCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {children}
    </div>
  );
}
```

---

## Customization

### Styling via Props

shadcn components accept `variant`, `size`, and other props:

```tsx
<Button variant="outline" size="sm">Click</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost" size="icon">
  <TrashIcon />
</Button>
```

### Additional Classes

Use `className` for one-off customization:

```tsx
<Button className="w-full mt-4">Full Width Button</Button>
<Card className="hover:shadow-lg transition-shadow">
  {/* content */}
</Card>
```

### Using `cn()` utility

Merge classes conditionally with the `cn()` helper:

```tsx
import { cn } from '@/lib/utils';

<Button className={cn(
  "w-full",
  isLoading && "opacity-50 cursor-not-allowed"
)}>
  Submit
</Button>
```

---

## Component Location

- **shadcn/ui components**: `components/ui/` (auto-generated)
- **Feature components**: `app/[feature]/` (compose shadcn components)
- **Shared composed components**: `components/` (NOT in ui/ folder)

---

## Common Components

| Component | Use Case | Import Path |
|-----------|----------|-------------|
| Button | Actions, links, submissions | `@/components/ui/button` |
| Card | Content containers | `@/components/ui/card` |
| Input | Text fields | `@/components/ui/input` |
| Dialog | Modals, confirmations | `@/components/ui/dialog` |
| Form | Form handling with validation | `@/components/ui/form` |
| Toast | Notifications | `@/components/ui/toast` |
| Badge | Status indicators | `@/components/ui/badge` |
| Dropdown Menu | Context menus | `@/components/ui/dropdown-menu` |

---

## Checklist

Before creating a new component:

- [ ] Check if a shadcn component exists for this use case
- [ ] Install via `npx shadcn@latest add [name]` if missing
- [ ] Import from `@/components/ui/[name]`
- [ ] Compose multiple shadcn components if needed
- [ ] Use `className` and props for customization
- [ ] Never build UI primitives from scratch

---

## Resources

- **shadcn/ui docs**: [ui.shadcn.com](https://ui.shadcn.com)
- **Component browser**: [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)
- **Radix UI** (underlying library): [radix-ui.com](https://www.radix-ui.com)
