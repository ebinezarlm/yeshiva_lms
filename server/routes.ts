import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, updateVideoSchema, insertCommentSchema, insertQuestionSchema, answerQuestionSchema, insertPlaylistSchema, insertSubscriptionSchema, updateSubscriptionSchema, insertWatchProgressSchema, signupSchema, loginSchema, insertRoleSchema, updateRoleSchema, assignPermissionsSchema, insertUserSchema, insertTutorAdminMappingSchema, insertStudentTutorMappingSchema, insertPermissionSchema, type InsertVideo } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { fileTypeFromFile } from "file-type";
import bcrypt from "bcryptjs";
import { generateTokens, verifyRefreshToken, generateAccessToken } from "./backend/auth/jwt";
import { authenticate, requireRole } from "./backend/auth/middleware";
import { registerUserRoutes } from "./backend/users/routes";
import { registerCourseRoutes } from "./backend/courses/routes";
import { registerVideoRoutes } from "./backend/videos/routes";
import { registerAuthRoutes } from "./backend/auth/routes";
import { registerPlaylistRoutes } from "./backend/playlists/routes";
import { registerSubscriptionRoutes } from "./backend/subscriptions/routes";
import { registerWatchProgressRoutes } from "./backend/watch-progress/routes";
import { registerRoleRoutes } from "./backend/roles/routes";
import { registerPermissionRoutes } from "./backend/permissions/routes";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
      const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
      const ext = allowedExtensions.includes(sanitizedExt) ? sanitizedExt : '.mp4';
      cb(null, `video-${uniqueSuffix}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    
    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files (MP4, WebM, OGG, MOV) are allowed.'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register component routes
  registerUserRoutes(app);
  registerCourseRoutes(app);
  registerVideoRoutes(app);
  registerAuthRoutes(app);
  registerPlaylistRoutes(app);
  registerSubscriptionRoutes(app);
  registerWatchProgressRoutes(app);
  registerRoleRoutes(app);
  registerPermissionRoutes(app);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadsDir));

  return createServer(app);
}