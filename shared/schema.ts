import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Playlist name is required"),
  description: z.string().optional(),
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url").notNull(),
  category: text("category").notNull(),
  likes: integer("likes").notNull().default(0),
  playlistId: varchar("playlist_id"),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  likes: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  videoUrl: z.string().url("Must be a valid URL"),
  category: z.string().min(1, "Category is required"),
  playlistId: z.string().optional(),
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull(),
  username: text("username").notNull().default("Anonymous"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
}).extend({
  videoId: z.string(),
  username: z.string().min(1, "Username is required"),
  text: z.string().min(1, "Comment text is required"),
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull(),
  text: text("text").notNull(),
  answer: text("answer"),
  answeredAt: timestamp("answered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  answeredAt: true,
  answer: true,
}).extend({
  videoId: z.string(),
  text: z.string().min(1, "Question text is required"),
});

export const answerQuestionSchema = z.object({
  answer: z.string().min(1, "Answer text is required"),
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type AnswerQuestion = z.infer<typeof answerQuestionSchema>;
export type Question = typeof questions.$inferSelect;
