import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const portfolioItems = sqliteTable("portfolio_items", {
  kind: text("kind").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  deleted: integer("deleted").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.kind, table.slug] })]);
