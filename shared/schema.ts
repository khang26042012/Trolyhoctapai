import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the messages table schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'user', 'assistant', or 'system'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  action: text("action"), // 'complete', 'concise', 'hint', or null
  imageData: text("image_data"), // base64 encoded image data
});

// Define the insert schema for messages
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

// Define zod schema for message object
export const messageSchema = z.object({
  id: z.number().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.date().optional(),
  action: z.enum(["complete", "concise", "hint"]).optional().nullable(),
  imageData: z.string().optional().nullable(),
});

// Define the type for inserting a message
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Define the type for a message retrieved from the database
export type Message = z.infer<typeof messageSchema>;
