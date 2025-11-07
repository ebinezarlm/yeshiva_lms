import { storage } from "../../storage";
import { insertSubscriptionSchema, updateSubscriptionSchema } from "@shared/schema";
import { z } from "zod";
import { authenticate, requireRole } from "../auth/middleware";

// Subscription routes will be added here
export function registerSubscriptionRoutes(app: any) {
  // Get all subscriptions (admin only)
  app.get("/api/subscriptions", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Get subscriptions error:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Get subscriptions by email
  app.get("/api/subscriptions/email/:email", authenticate, async (req: any, res: any) => {
    try {
      const { email } = req.params;
      
      // Only allow users to get their own subscriptions
      if (req.user?.email !== email) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only view your own subscriptions",
        });
      }
      
      const subscriptions = await storage.getSubscriptionsByEmail(email);
      res.json(subscriptions);
    } catch (error) {
      console.error("Get subscriptions by email error:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Get subscription by ID
  app.get("/api/subscriptions/:id", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getSubscription(id);
      
      if (!subscription) {
        return res.status(404).json({
          error: "Subscription not found",
          message: "The requested subscription does not exist",
        });
      }
      
      // Only allow users to get their own subscriptions
      if (req.user?.email !== subscription.studentEmail) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only view your own subscriptions",
        });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Create subscription
  app.post("/api/subscriptions", authenticate, async (req: any, res: any) => {
    try {
      const validatedData = insertSubscriptionSchema.parse({
        ...req.body,
        studentEmail: req.user?.email || "",
        studentName: req.user?.email?.split('@')[0] || "",
      });
      
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json({
        message: "Subscription created successfully",
        subscription,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Create subscription error:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Update subscription (admin only)
  app.put("/api/subscriptions/:id", authenticate, requireRole("admin"), async (req: any, res: any) => {
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
}