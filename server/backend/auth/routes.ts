import { storage } from "../../storage";
import { signupSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { generateTokens, verifyRefreshToken } from "./jwt";
import { authenticate, requireRole } from "../auth/middleware";

// Auth routes will be added here
export function registerAuthRoutes(app: any) {
  // Signup route
  app.post("/api/auth/signup", async (req: any, res: any) => {
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

  // Login route
  app.post("/api/auth/login", async (req: any, res: any) => {
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

      // Note: Password validation should be handled in storage layer
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

  // Refresh token route
  app.post("/api/auth/refresh", async (req: any, res: any) => {
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

      const tokens = generateTokens(user, role);

      res.json({
        message: "Token refreshed successfully",
        ...tokens,
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  });
}