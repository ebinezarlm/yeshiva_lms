import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, insertCommentSchema, insertQuestionSchema, answerQuestionSchema, insertPlaylistSchema, insertSubscriptionSchema, insertWatchProgressSchema, signupSchema, loginSchema, updateUserRoleSchema, insertRoleSchema, updateRoleSchema, assignPermissionsSchema } from "@shared/schema";
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

  app.get("/api/users", authenticate, requireRole("admin"), async (req, res) => {
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

  app.put("/api/users/:id/role", authenticate, requireRole("admin"), async (req, res) => {
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

  app.delete("/api/users/:id", authenticate, requireRole("admin"), async (req, res) => {
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

  app.get("/api/roles", authenticate, async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      
      const existingRole = await storage.getRoleByName(validatedData.name);
      if (existingRole) {
        return res.status(409).json({
          error: "Role already exists",
          message: `A role with the name '${validatedData.name}' already exists`,
        });
      }

      const role = await storage.createRole(validatedData);
      res.status(201).json({
        message: "Role created successfully",
        role,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Create role error:", error);
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  app.get("/api/roles/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const role = await storage.getRole(id);
      
      if (!role) {
        return res.status(404).json({
          error: "Role not found",
          message: "The requested role does not exist",
        });
      }

      res.json(role);
    } catch (error) {
      console.error("Get role error:", error);
      res.status(500).json({ error: "Failed to fetch role" });
    }
  });

  app.put("/api/roles/:id", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateRoleSchema.parse(req.body);

      if (validatedData.name) {
        const existingRole = await storage.getRoleByName(validatedData.name);
        if (existingRole && existingRole.id !== id) {
          return res.status(409).json({
            error: "Role name conflict",
            message: `Another role with the name '${validatedData.name}' already exists`,
          });
        }
      }

      const role = await storage.updateRole(id, validatedData);
      if (!role) {
        return res.status(404).json({
          error: "Role not found",
          message: "The requested role does not exist",
        });
      }

      res.json({
        message: "Role updated successfully",
        role,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Update role error:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;

      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({
          error: "Role not found",
          message: "The requested role does not exist",
        });
      }

      const defaultRoles = ["superadmin", "admin", "tutor", "student"];
      if (defaultRoles.includes(role.name)) {
        return res.status(403).json({
          error: "Cannot delete default role",
          message: "Default system roles cannot be deleted",
        });
      }

      const deleted = await storage.deleteRole(id);
      if (!deleted) {
        return res.status(500).json({
          error: "Failed to delete role",
          message: "An error occurred while deleting the role",
        });
      }

      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Delete role error:", error);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  app.get("/api/permissions", authenticate, async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Get permissions error:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.post("/api/roles/:id/permissions", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPermissionSchema.parse(req.body);
      
      // Check if permission already exists for this role
      const existingPermission = await storage.getPermissionByRoleAndResource(id, validatedData.resource);
      if (existingPermission) {
        return res.status(409).json({
          error: "Permission already exists",
          message: `Permission for resource '${validatedData.resource}' already exists for this role`,
        });
      }

      const permission = await storage.createPermission({
        ...validatedData,
        roleId: id,
      });
      
      res.status(201).json({
        message: "Permission created successfully",
        permission,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Create permission error:", error);
      res.status(500).json({ error: "Failed to create permission" });
    }
  });

  app.get("/api/roles/:id/permissions", authenticate, async (req, res) => {
    try {
      const { id } = req.params;

      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({
          error: "Role not found",
          message: "The requested role does not exist",
        });
      }

      const permissions = await storage.getRolePermissions(id);
      res.json({
        role: role.name,
        permissions,
      });
    } catch (error) {
      console.error("Get role permissions error:", error);
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  app.delete("/api/roles/:id/permissions/:permissionId", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const { id, permissionId } = req.params;
      
      const deleted = await storage.deletePermission(permissionId);
      if (!deleted) {
        return res.status(404).json({
          error: "Permission not found",
          message: "The requested permission does not exist",
        });
      }

      res.json({ message: "Permission deleted successfully" });
    } catch (error) {
      console.error("Delete permission error:", error);
      res.status(500).json({ error: "Failed to delete permission" });
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

  app.post("/api/videos", authenticate, requireRole("tutor", "admin"), async (req, res) => {
    try {
      const validatedData = insertVideoSchema.parse(req.body);
      
      const video = await storage.createVideo({
        ...validatedData,
        tutorId: req.user!.userId,
      });
      
      res.status(201).json({
        message: "Video created successfully",
        video,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Create video error:", error);
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  app.post("/api/videos/upload", authenticate, requireRole("tutor", "admin"), upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
          message: "Please provide a video file",
        });
      }

      // In a real application, you would store the file path in the database
      // and return a URL to access the file
      res.json({
        message: "Video uploaded successfully",
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
      });
    } catch (error) {
      console.error("Upload video error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  app.patch("/api/videos/:id", authenticate, requireRole("tutor", "admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateVideoSchema.parse(req.body);
      
      // Check if video exists and belongs to user (or user is admin)
      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({
          error: "Video not found",
          message: "The requested video does not exist",
        });
      }

      // Allow admins to update any video
      if (req.user!.roleName !== 'admin' && video.tutorId !== req.user!.userId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only update your own videos",
        });
      }

      const updatedVideo = await storage.updateVideo(id, validatedData);
      res.json({
        message: "Video updated successfully",
        video: updatedVideo,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Update video error:", error);
      res.status(500).json({ error: "Failed to update video" });
    }
  });

  app.delete("/api/videos/:id", authenticate, requireRole("tutor", "admin"), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if video exists and belongs to user (or user is admin)
      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({
          error: "Video not found",
          message: "The requested video does not exist",
        });
      }

      // Allow admins to delete any video
      if (req.user!.roleName !== 'admin' && video.tutorId !== req.user!.userId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only delete your own videos",
        });
      }

      await storage.deleteVideo(id);
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Delete video error:", error);
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

  app.post("/api/playlists", authenticate, requireRole("tutor", "admin"), async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      
      const playlist = await storage.createPlaylist({
        ...validatedData,
        tutorId: req.user!.userId,
      });
      
      res.status(201).json({
        message: "Playlist created successfully",
        playlist,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Create playlist error:", error);
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });

  app.delete("/api/playlists/:id", authenticate, requireRole("tutor", "admin"), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if playlist exists and belongs to user (or user is admin)
      const playlist = await storage.getPlaylist(id);
      if (!playlist) {
        return res.status(404).json({
          error: "Playlist not found",
          message: "The requested playlist does not exist",
        });
      }

      // Allow admins to delete any playlist
      if (req.user!.roleName !== 'admin' && playlist.tutorId !== req.user!.userId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only delete your own playlists",
        });
      }

      await storage.deletePlaylist(id);
      res.json({ message: "Playlist deleted successfully" });
    } catch (error) {
      console.error("Delete playlist error:", error);
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  app.get("/api/questions", authenticate, requireRole("tutor", "admin"), async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Get questions error:", error);
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

  app.post("/api/questions/:id/answer", authenticate, requireRole("tutor", "admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = answerQuestionSchema.parse(req.body);
      
      // Check if question exists
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({
          error: "Question not found",
          message: "The requested question does not exist",
        });
      }

      // Allow admins to answer any question
      if (req.user!.roleName !== 'admin' && question.tutorId !== req.user!.userId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only answer questions on your own content",
        });
      }

      const answer = await storage.answerQuestion(id, validatedData.answer);
      res.json({
        message: "Question answered successfully",
        answer,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Answer question error:", error);
      res.status(500).json({ error: "Failed to answer question" });
    }
  });

  app.get("/api/subscriptions", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Get subscriptions error:", error);
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
      
      if (req.user!.email !== validatedData.studentEmail && !["admin", "superadmin"].includes(req.user!.roleName)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only create subscriptions for yourself",
        });
      }
      
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

  app.patch("/api/subscriptions/:id", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateSubscriptionSchema.parse(req.body);
      
      const subscription = await storage.updateSubscription(id, validatedData);
      if (!subscription) {
        return res.status(404).json({
          error: "Subscription not found",
          message: "The requested subscription does not exist",
        });
      }
      
      res.json({
        message: "Subscription updated successfully",
        subscription,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Update subscription error:", error);
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
      
      if (req.user!.email !== validatedData.studentEmail && !["admin", "superadmin"].includes(req.user!.roleName)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only update your own watch progress",
        });
      }
      
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
