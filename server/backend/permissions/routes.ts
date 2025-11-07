import { storage } from "../../storage";
import { insertPermissionSchema, assignPermissionsSchema } from "@shared/schema";
import { z } from "zod";
import { authenticate, requireRole } from "../auth/middleware";

// Permission routes will be added here
export function registerPermissionRoutes(app: any) {
  // Get all permissions (authenticated users)
  app.get("/api/permissions", authenticate, async (req: any, res: any) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Get permissions error:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  // Create permission (admin only)
  app.post("/api/permissions", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const validatedData = insertPermissionSchema.parse(req.body);
      
      const existingPermission = await storage.getPermissionByName(validatedData.featureName);
      if (existingPermission) {
        return res.status(409).json({
          error: "Permission already exists",
          message: `A permission with the feature name '${validatedData.featureName}' already exists`,
        });
      }

      const permission = await storage.createPermission(validatedData);
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

  // Get role permissions
  app.get("/api/roles/:id/permissions", authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const permissions = await storage.getRolePermissions(id);
      res.json(permissions);
    } catch (error) {
      console.error("Get role permissions error:", error);
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  // Assign permissions to role (admin only)
  app.post("/api/roles/:id/permissions", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { id: roleId } = req.params;
      const validatedData = assignPermissionsSchema.parse(req.body);
      
      // Check if role exists
      const role = await storage.getRole(roleId);
      if (!role) {
        return res.status(404).json({
          error: "Role not found",
          message: "The specified role does not exist",
        });
      }
      
      // Assign each permission to the role
      const assignments = [];
      for (const permissionId of validatedData.permissionIds) {
        // Check if permission exists
        const permission = await storage.getPermission(permissionId);
        if (!permission) {
          return res.status(404).json({
            error: "Permission not found",
            message: `Permission with ID '${permissionId}' does not exist`,
          });
        }
        
        // Check if assignment already exists
        const existingAssignment = await storage.getRolePermission(roleId, permissionId);
        if (existingAssignment) {
          continue; // Skip if already assigned
        }
        
        const assignment = await storage.assignPermissionToRole(roleId, permissionId);
        assignments.push(assignment);
      }
      
      res.status(201).json({
        message: "Permissions assigned successfully",
        assignments,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Assign permissions error:", error);
      res.status(500).json({ error: "Failed to assign permissions" });
    }
  });

  // Revoke permission from role (admin only)
  app.delete("/api/roles/:roleId/permissions/:permissionId", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { roleId, permissionId } = req.params;
      
      // Check if role exists
      const role = await storage.getRole(roleId);
      if (!role) {
        return res.status(404).json({
          error: "Role not found",
          message: "The specified role does not exist",
        });
      }
      
      // Check if permission exists
      const permission = await storage.getPermission(permissionId);
      if (!permission) {
        return res.status(404).json({
          error: "Permission not found",
          message: "The specified permission does not exist",
        });
      }
      
      const revoked = await storage.revokePermissionFromRole(roleId, permissionId);
      if (!revoked) {
        return res.status(404).json({
          error: "Permission not assigned",
          message: "The specified permission is not assigned to this role",
        });
      }
      
      res.json({ message: "Permission revoked successfully" });
    } catch (error) {
      console.error("Revoke permission error:", error);
      res.status(500).json({ error: "Failed to revoke permission" });
    }
  });
}