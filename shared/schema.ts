import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").optional(),
  description: z.string().optional(),
});

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type Role = typeof roles.$inferSelect;

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  featureName: text("feature_name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
}).extend({
  featureName: z.string().min(1, "Feature name is required"),
  description: z.string().optional(),
});

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull(),
  permissionId: varchar("permission_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
}).extend({
  roleId: z.string().min(1, "Role ID is required"),
  permissionId: z.string().min(1, "Permission ID is required"),
});

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string()).min(1, "At least one permission is required"),
});

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type AssignPermissions = z.infer<typeof assignPermissionsSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roleId: varchar("role_id").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().min(1, "Role is required"),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Must be a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserRoleSchema = z.object({
  roleName: z.enum(["superadmin", "admin", "tutor", "student"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  tutorName: text("tutor_name").notNull().default("Unknown Tutor"),
  category: text("category").notNull().default("General"),
  thumbnail: text("thumbnail"),
  isPublic: integer("is_public").notNull().default(1),
  videoCount: integer("video_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  videoCount: true,
  viewCount: true,
}).extend({
  name: z.string().min(1, "Playlist name is required"),
  description: z.string().optional(),
  tutorName: z.string().default("Unknown Tutor"),
  category: z.string().default("General"),
  thumbnail: z.string().optional(),
  isPublic: z.number().default(1),
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url").notNull(),
  category: text("category").notNull(),
  duration: text("duration").default("0:00"),
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
  duration: z.string().optional(),
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
  studentEmail: text("student_email").notNull(),
  studentName: text("student_name").notNull(),
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
  videoId: z.string().min(1, "Video is required"),
  studentEmail: z.string().email("Valid email required"),
  studentName: z.string().min(1, "Student name is required"),
  text: z.string().min(5, "Question must be at least 5 characters"),
});

export const answerQuestionSchema = z.object({
  answer: z.string().min(1, "Answer text is required"),
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type AnswerQuestion = z.infer<typeof answerQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentEmail: text("student_email").notNull(),
  studentName: text("student_name").notNull(),
  playlistId: varchar("playlist_id").notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"),
  amountPaid: integer("amount_paid").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
}).extend({
  studentEmail: z.string().email("Must be a valid email"),
  studentName: z.string().min(1, "Student name is required"),
  playlistId: z.string().min(1, "Playlist ID is required"),
  startDate: z.date().optional(),
  endDate: z.date(),
  status: z.enum(["active", "expired"]).default("active"),
  amountPaid: z.number().min(0, "Amount must be positive"),
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export const watchProgress = pgTable("watch_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentEmail: text("student_email").notNull(),
  videoId: varchar("video_id").notNull(),
  playlistId: varchar("playlist_id").notNull(),
  progress: integer("progress").notNull().default(0),
  completed: integer("completed").notNull().default(0),
  lastWatched: timestamp("last_watched").notNull().defaultNow(),
});

export const insertWatchProgressSchema = createInsertSchema(watchProgress).omit({
  id: true,
}).extend({
  studentEmail: z.string().email(),
  videoId: z.string(),
  playlistId: z.string(),
  progress: z.number().min(0).max(100),
  completed: z.number().min(0).max(1),
});

export type InsertWatchProgress = z.infer<typeof insertWatchProgressSchema>;
export type WatchProgress = typeof watchProgress.$inferSelect;