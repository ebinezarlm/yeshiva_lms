import { storage } from "../../storage";
import { insertVideoSchema, updateVideoSchema, insertCommentSchema, insertQuestionSchema, answerQuestionSchema } from "@shared/schema";
import { z } from "zod";
import { authenticate, requireRole } from "../auth/middleware";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../../../public/uploads");
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

// Video routes will be added here
export function registerVideoRoutes(app: any) {
  // Get all videos
  app.get("/api/videos", authenticate, async (req: any, res: any) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      console.error("Get videos error:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // Get video by ID
  app.get("/api/videos/:id", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({
          error: "Video not found",
          message: "The requested video does not exist",
        });
      }
      
      res.json(video);
    } catch (error) {
      console.error("Get video error:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  // Create video (tutor only)
  app.post("/api/videos", authenticate, requireRole("tutor"), upload.single('video'), async (req: any, res: any) => {
    try {
      // Parse the form data (excluding file)
      const formData = JSON.parse(req.body.data);
      const validatedData = insertVideoSchema.parse(formData);
      
      // Add video URL if file was uploaded
      if (req.file) {
        validatedData.videoUrl = `/uploads/${req.file.filename}`;
      }
      
      const video = await storage.createVideo(validatedData);
      res.status(201).json({
        message: "Video uploaded successfully",
        video,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Upload video error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  // Update video (tutor only)
  app.put("/api/videos/:id", authenticate, requireRole("tutor"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const validatedData = updateVideoSchema.parse(req.body);
      
      // Handle tutorId null case by converting null to undefined
      const processedUpdateData: any = { ...validatedData };
      if ('tutorId' in processedUpdateData && processedUpdateData.tutorId === null) {
        processedUpdateData.tutorId = undefined;
      }
      
      const video = await storage.updateVideo(id, processedUpdateData);
      if (!video) {
        return res.status(404).json({
          error: "Video not found",
          message: "The requested video does not exist",
        });
      }
      
      res.json({
        message: "Video updated successfully",
        video,
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

  // Delete video (tutor only)
  app.delete("/api/videos/:id", authenticate, requireRole("tutor"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteVideo(id);
      if (!deleted) {
        return res.status(404).json({
          error: "Video not found",
          message: "The requested video does not exist",
        });
      }
      
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Delete video error:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Like video
  app.post("/api/videos/:id/like", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      const video = await storage.likeVideo(id);
      if (!video) {
        return res.status(404).json({
          error: "Video not found",
          message: "The requested video does not exist",
        });
      }
      
      res.json({
        message: "Video liked successfully",
        likes: video.likes,
      });
    } catch (error) {
      console.error("Like video error:", error);
      res.status(500).json({ error: "Failed to like video" });
    }
  });

  // Get comments by video ID
  app.get("/api/videos/:id/comments", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const comments = await storage.getCommentsByVideoId(id);
      res.json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Create comment
  app.post("/api/videos/:id/comments", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        videoId: id,
        username: req.user?.name || "Anonymous",
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json({
        message: "Comment added successfully",
        comment,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Create comment error:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Get questions by video ID
  app.get("/api/videos/:id/questions", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const questions = await storage.getQuestionsByVideoId(id);
      res.json(questions);
    } catch (error) {
      console.error("Get questions error:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Create question
  app.post("/api/videos/:id/questions", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const validatedData = insertQuestionSchema.parse({
        ...req.body,
        videoId: id,
        studentEmail: req.user?.email || "",
        studentName: req.user?.name || "",
      });
      
      const question = await storage.createQuestion(validatedData);
      res.status(201).json({
        message: "Question submitted successfully",
        question,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Create question error:", error);
      res.status(500).json({ error: "Failed to submit question" });
    }
  });

  // Answer question (tutor only)
  app.put("/api/questions/:id/answer", authenticate, requireRole("tutor"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const validatedData = answerQuestionSchema.parse(req.body);
      
      const question = await storage.answerQuestion(id, validatedData.answer);
      if (!question) {
        return res.status(404).json({
          error: "Question not found",
          message: "The requested question does not exist",
        });
      }
      
      res.json({
        message: "Question answered successfully",
        question,
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
}