import { pgTable, integer, text, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

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

// Export TypeScript types for use in components and server actions
export type Link = InferSelectModel<typeof links>;
export type NewLink = InferInsertModel<typeof links>;
