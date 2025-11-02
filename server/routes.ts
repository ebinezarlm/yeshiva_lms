import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, insertCommentSchema, insertQuestionSchema, answerQuestionSchema, insertPlaylistSchema, insertSubscriptionSchema, insertWatchProgressSchema, signupSchema, loginSchema, updateUserRoleSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { fileTypeFromFile } from "file-type";
import bcrypt from "bcryptjs";
import { generateTokens, verifyRefreshToken, generateAccessToken } from "./auth/jwt";
import { authenticate, requireRole, optionalAuth } from "./auth/middleware";

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
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({
          error: "Email already registered",
          message: "An account with this email already exists",
        });
      }

      const role = await storage.getRoleByName("student");
      if (!role) {
        return res.status(500).json({
          error: "Server error",
          message: "Student role not found in database",
        });
      }

      const user = await storage.createUser({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        roleId: role.id,
        status: "active",
      });

      const tokens = generateTokens(user, role);

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role.name,
          status: user.status,
        },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Email or password is incorrect",
        });
      }

      if (user.status !== "active") {
        return res.status(403).json({
          error: "Account inactive",
          message: "Your account has been suspended or deactivated",
        });
      }

      const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Email or password is incorrect",
        });
      }

      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(500).json({
          error: "Server error",
          message: "User role not found",
        });
      }

      const tokens = generateTokens(user, role);

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role.name,
          status: user.status,
        },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          error: "Missing refresh token",
          message: "Refresh token is required",
        });
      }

      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(401).json({
          error: "Invalid token",
          message: "Refresh token is invalid or expired",
        });
      }

      const user = await storage.getUser(payload.userId);
      if (!user || user.status !== "active") {
        return res.status(401).json({
          error: "Invalid user",
          message: "User not found or inactive",
        });
      }

      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(500).json({
          error: "Server error",
          message: "User role not found",
        });
      }

      const accessToken = generateAccessToken(user, role);

      res.json({
        accessToken,
        message: "Token refreshed successfully",
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  });

  app.post("/api/auth/logout", authenticate, async (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/users/profile", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      const role = await storage.getRole(user.roleId);
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: role?.name,
        status: user.status,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/users", authenticate, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const roles = await storage.getAllRoles();
      
      const roleMap = Object.fromEntries(roles.map(r => [r.id, r.name]));
      
      const usersWithRoles = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleMap[user.roleId],
        status: user.status,
        createdAt: user.createdAt,
      }));

      res.json(usersWithRoles);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id/role", authenticate, requireRole("superadmin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserRoleSchema.parse(req.body);
      
      const role = await storage.getRoleByName(validatedData.roleName);
      if (!role) {
        return res.status(400).json({
          error: "Invalid role",
          message: "The specified role does not exist",
        });
      }
      
      const user = await storage.updateUserRole(id, role.id);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }
      
      res.json({
        message: "User role updated successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role?.name,
          status: user.status,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Update role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.delete("/api/users/:id", authenticate, requireRole("superadmin"), async (req, res) => {
    try {
      const { id } = req.params;
      
      if (id === req.user!.userId) {
        return res.status(400).json({
          error: "Cannot delete own account",
          message: "You cannot delete your own account",
        });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.post("/api/videos", authenticate, requireRole("tutor", "admin", "superadmin"), async (req, res) => {
    try {
      const validatedData = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid video data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create video" });
      }
    }
  });

  app.post("/api/videos/upload", authenticate, requireRole("tutor", "admin", "superadmin"), upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No video file provided" });
        return;
      }

      const fileType = await fileTypeFromFile(req.file.path);
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      
      if (!fileType || !allowedTypes.includes(fileType.mime)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Failed to delete uploaded file:", unlinkError);
        }
        res.status(400).json({ 
          error: "Invalid file signature. File must be a valid video file (MP4, WebM, OGG, or QuickTime)." 
        });
        return;
      }

      const { title, description, category, playlistId } = req.body;

      if (!title || !description || !category) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Failed to delete uploaded file:", unlinkError);
        }
        res.status(400).json({ error: "Missing required fields: title, description, or category" });
        return;
      }

      const videoUrl = `/uploads/${req.file.filename}`;

      const validatedData = insertVideoSchema.parse({
        title,
        description,
        videoUrl,
        category,
        playlistId: playlistId || null,
      });

      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Failed to delete uploaded file:", unlinkError);
        }
      }
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid video data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to upload video" });
      }
    }
  });

  app.patch("/api/videos/:id", authenticate, requireRole("tutor", "admin", "superadmin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertVideoSchema.partial().parse(req.body);
      const video = await storage.updateVideo(id, validatedData);
      
      if (!video) {
        res.status(404).json({ error: "Video not found" });
        return;
      }
      
      res.status(200).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid video data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update video" });
      }
    }
  });

  app.delete("/api/videos/:id", authenticate, requireRole("tutor", "admin", "superadmin"), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteVideo(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Video not found" });
        return;
      }
      
      res.status(200).json({ message: "Video deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  app.post("/api/videos/:id/like", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const video = await storage.likeVideo(id);
      
      if (!video) {
        res.status(404).json({ error: "Video not found" });
        return;
      }
      
      res.status(200).json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to like video" });
    }
  });

  app.get("/api/videos/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getCommentsByVideoId(id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/videos/:id/comments", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        videoId: id,
      });
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid comment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create comment" });
      }
    }
  });

  app.get("/api/playlists", async (req, res) => {
    try {
      const playlists = await storage.getAllPlaylists();
      const playlistsWithVideos = await Promise.all(
        playlists.map(async (playlist) => {
          const videos = await storage.getVideosByPlaylistId(playlist.id);
          return { ...playlist, videos };
        })
      );
      res.json(playlistsWithVideos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.post("/api/playlists", authenticate, requireRole("tutor", "admin", "superadmin"), async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      res.status(201).json(playlist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid playlist data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create playlist" });
      }
    }
  });

  app.delete("/api/playlists/:id", authenticate, requireRole("tutor", "admin", "superadmin"), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePlaylist(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Playlist not found" });
        return;
      }
      
      res.status(200).json({ message: "Playlist deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  app.get("/api/questions", authenticate, requireRole("tutor", "admin", "superadmin"), async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/student/:email", authenticate, async (req, res) => {
    try {
      const { email } = req.params;
      
      if (req.user!.email !== email && !["admin", "superadmin"].includes(req.user!.roleName)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only view your own questions",
        });
      }
      
      const questions = await storage.getQuestionsByStudentEmail(email);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student questions" });
    }
  });

  app.post("/api/questions", authenticate, async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid question data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create question" });
      }
    }
  });

  app.get("/api/videos/:id/questions", async (req, res) => {
    try {
      const { id } = req.params;
      const questions = await storage.getQuestionsByVideoId(id);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions/:id/answer", authenticate, requireRole("tutor", "admin", "superadmin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = answerQuestionSchema.parse(req.body);
      const question = await storage.answerQuestion(id, validatedData.answer);
      
      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }
      
      res.status(200).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid answer data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to answer question" });
      }
    }
  });

  app.get("/api/subscriptions", authenticate, requireRole("admin", "superadmin"), async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscriptions/student/:email", authenticate, async (req, res) => {
    try {
      const { email } = req.params;
      
      if (req.user!.email !== email && !["admin", "superadmin"].includes(req.user!.roleName)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only view your own subscriptions",
        });
      }
      
      const subscriptions = await storage.getSubscriptionsByEmail(email);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", authenticate, async (req, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid subscription data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create subscription" });
      }
    }
  });

  app.patch("/api/subscriptions/:id", authenticate, requireRole("admin", "superadmin"), async (req, res) => {
    try {
      const { id } = req.params;
      const subscription = await storage.updateSubscription(id, req.body);
      
      if (!subscription) {
        res.status(404).json({ error: "Subscription not found" });
        return;
      }
      
      res.status(200).json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  app.get("/api/watch-progress/student/:email", authenticate, async (req, res) => {
    try {
      const { email } = req.params;
      
      if (req.user!.email !== email && !["admin", "superadmin"].includes(req.user!.roleName)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only view your own watch progress",
        });
      }
      
      const progress = await storage.getWatchProgressByEmail(email);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch watch progress" });
    }
  });

  app.get("/api/watch-progress/student/:email/playlist/:playlistId", authenticate, async (req, res) => {
    try {
      const { email, playlistId } = req.params;
      
      if (req.user!.email !== email && !["admin", "superadmin"].includes(req.user!.roleName)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only view your own watch progress",
        });
      }
      
      const progress = await storage.getWatchProgressByPlaylist(email, playlistId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlist progress" });
    }
  });

  app.post("/api/watch-progress", authenticate, async (req, res) => {
    try {
      const validatedData = insertWatchProgressSchema.parse(req.body);
      const progress = await storage.upsertWatchProgress(validatedData);
      res.status(200).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid progress data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to save watch progress" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
