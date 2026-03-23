import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Photo sessions for storing user photo data
export const photoSessions = pgTable("photo_sessions", {
  id: serial("id").primaryKey(),
  frameType: text("frame_type").notNull(), // '1cut', '2cut', '4cut'
  topperType: text("topper_type").notNull(), // 'emoji' or 'upload'
  topperData: text("topper_data").notNull(), // emoji character or file path
  photos: text("photos").array().notNull(), // array of base64 photo data
  finalText: text("final_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPhotoSessionSchema = createInsertSchema(photoSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPhotoSession = z.infer<typeof insertPhotoSessionSchema>;
export type PhotoSession = typeof photoSessions.$inferSelect;
