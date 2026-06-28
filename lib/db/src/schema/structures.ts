import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const structuresTable = pgTable("structures", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("other"),
  description: text("description"),
  capacity: integer("capacity").notNull().default(1),
  status: text("status").notNull().default("active"),
  openTime: text("open_time"),
  closeTime: text("close_time"),
  maxDurationMinutes: integer("max_duration_minutes"),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStructureSchema = createInsertSchema(structuresTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStructure = z.infer<typeof insertStructureSchema>;
export type Structure = typeof structuresTable.$inferSelect;
