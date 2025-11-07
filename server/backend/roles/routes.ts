import { storage } from "../../storage";
import { insertRoleSchema, updateRoleSchema } from "@shared/schema";
import { z } from "zod";
import { authenticate, requireRole } from "../auth/middleware";

// Role routes will be added here
export function registerRoleRoutes(app: any) {
  // Get all roles (authenticated users)
  app.get("/api/roles", authenticate, async (req: any, res: any) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  // Create role (admin only)
  app.post("/api/roles", authenticate, requireRole("admin"), async (req: any, res: any) => {
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

  // Get role by ID (authenticated users)
  app.get("/api/roles/:id", authenticate, async (req: any, res: any) => {
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

  // Update role (admin only)
  app.put("/api/roles/:id", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const validatedData = updateRoleSchema.parse(req.body);
      
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

  // Delete role (admin only)
  app.delete("/api/roles/:id", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteRole(id);
      if (!deleted) {
        return res.status(404).json({
          error: "Role not found",
          message: "The requested role does not exist",
        });
      }

      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Delete role error:", error);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });
}