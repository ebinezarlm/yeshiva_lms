import { storage } from "../../storage";
import { insertPlaylistSchema } from "@shared/schema";
import { z } from "zod";
import { authenticate, requireRole } from "../auth/middleware";

// Playlist routes will be added here
export function registerPlaylistRoutes(app: any) {
  // Get all playlists
  app.get("/api/playlists", authenticate, async (req: any, res: any) => {
    try {
      const playlists = await storage.getAllPlaylists();
      res.json(playlists);
    } catch (error) {
      console.error("Get playlists error:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  // Get playlist by ID
  app.get("/api/playlists/:id", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const playlist = await storage.getPlaylist(id);
      
      if (!playlist) {
        return res.status(404).json({
          error: "Playlist not found",
          message: "The requested playlist does not exist",
        });
      }
      
      res.json(playlist);
    } catch (error) {
      console.error("Get playlist error:", error);
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  // Create playlist (tutor or admin)
  app.post("/api/playlists", authenticate, requireRole("tutor", "admin"), async (req: any, res: any) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      
      // Set tutorId to current user if not provided
      if (!validatedData.tutorId) {
        validatedData.tutorId = req.user!.userId;
      }
      
      // Set tutorName to current user's name if not provided
      if (!validatedData.tutorName) {
        const user = await storage.getUser(req.user!.userId);
        validatedData.tutorName = user?.name || "Unknown Tutor";
      }
      
      const playlist = await storage.createPlaylist(validatedData);
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

  // Delete playlist (tutor or admin)
  app.delete("/api/playlists/:id", authenticate, requireRole("tutor", "admin"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deletePlaylist(id);
      if (!deleted) {
        return res.status(404).json({
          error: "Playlist not found",
          message: "The requested playlist does not exist",
        });
      }
      
      res.json({ message: "Playlist deleted successfully" });
    } catch (error) {
      console.error("Delete playlist error:", error);
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  // Get videos by playlist ID
  app.get("/api/playlists/:id/videos", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const videos = await storage.getVideosByPlaylistId(id);
      res.json(videos);
    } catch (error) {
      console.error("Get videos by playlist error:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });
}