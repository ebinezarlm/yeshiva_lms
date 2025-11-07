import { storage } from "../../storage";
import { insertWatchProgressSchema } from "@shared/schema";
import { z } from "zod";
import { authenticate } from "../auth/middleware";

// Watch progress routes will be added here
export function registerWatchProgressRoutes(app: any) {
  // Get watch progress by email
  app.get("/api/watch-progress/:email", authenticate, async (req: any, res: any) => {
    try {
      const { email } = req.params;
      
      // Only allow users to get their own watch progress
      if (req.user?.email !== email) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only view your own watch progress",
        });
      }
      
      const progress = await storage.getWatchProgressByEmail(email);
      res.json(progress);
    } catch (error) {
      console.error("Get watch progress error:", error);
      res.status(500).json({ error: "Failed to fetch watch progress" });
    }
  });

  // Get watch progress by playlist
  app.get("/api/watch-progress/:email/playlist/:playlistId", authenticate, async (req: any, res: any) => {
    try {
      const { email, playlistId } = req.params;
      
      // Only allow users to get their own watch progress
      if (req.user?.email !== email) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only view your own watch progress",
        });
      }
      
      const progress = await storage.getWatchProgressByPlaylist(email, playlistId);
      res.json(progress);
    } catch (error) {
      console.error("Get watch progress by playlist error:", error);
      res.status(500).json({ error: "Failed to fetch watch progress" });
    }
  });

  // Upsert watch progress
  app.post("/api/watch-progress", authenticate, async (req: any, res: any) => {
    try {
      const validatedData = insertWatchProgressSchema.parse({
        ...req.body,
        studentEmail: req.user?.email || "",
      });
      
      const progress = await storage.upsertWatchProgress(validatedData);
      res.json({
        message: "Watch progress updated successfully",
        progress,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Upsert watch progress error:", error);
      res.status(500).json({ error: "Failed to update watch progress" });
    }
  });
}