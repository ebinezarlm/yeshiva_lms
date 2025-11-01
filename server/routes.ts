import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, insertCommentSchema, insertQuestionSchema, answerQuestionSchema, insertPlaylistSchema, insertSubscriptionSchema, insertWatchProgressSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { fileTypeFromFile } from "file-type";

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
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.post("/api/videos", async (req, res) => {
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

  app.post("/api/videos/upload", upload.single('video'), async (req, res) => {
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

  app.patch("/api/videos/:id", async (req, res) => {
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

  app.delete("/api/videos/:id", async (req, res) => {
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

  app.post("/api/videos/:id/like", async (req, res) => {
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

  app.post("/api/videos/:id/comments", async (req, res) => {
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

  app.post("/api/playlists", async (req, res) => {
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

  app.delete("/api/playlists/:id", async (req, res) => {
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

  // Admin-only endpoint - restricted to prevent data exposure
  // In production, this should verify admin role from authenticated session
  app.get("/api/questions", async (req, res) => {
    try {
      // TODO: Add admin role check here when implementing real authentication
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Student-specific questions endpoint
  // NOTE: In production with real auth, this should:
  // 1. Extract the authenticated user's email from the session (not path param)
  // 2. Verify the session email matches the requested email parameter
  // 3. Return 403 Forbidden if there's a mismatch
  // Current mock auth limitation: trusts the email parameter
  app.get("/api/questions/student/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const questions = await storage.getQuestionsByStudentEmail(email);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student questions" });
    }
  });

  app.post("/api/questions", async (req, res) => {
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

  app.post("/api/questions/:id/answer", async (req, res) => {
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

  app.get("/api/subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscriptions/student/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const subscriptions = await storage.getSubscriptionsByEmail(email);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
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

  app.patch("/api/subscriptions/:id", async (req, res) => {
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

  app.get("/api/watch-progress/student/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const progress = await storage.getWatchProgressByEmail(email);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch watch progress" });
    }
  });

  app.get("/api/watch-progress/student/:email/playlist/:playlistId", async (req, res) => {
    try {
      const { email, playlistId } = req.params;
      const progress = await storage.getWatchProgressByPlaylist(email, playlistId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlist progress" });
    }
  });

  app.post("/api/watch-progress", async (req, res) => {
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
