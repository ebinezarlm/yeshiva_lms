import { storage } from "../../storage";
import { insertUserSchema, insertTutorAdminMappingSchema, insertStudentTutorMappingSchema, updateUserRoleSchema } from "@shared/schema";
import { z } from "zod";
import { authenticate, requireRole } from "../auth/middleware";

// User routes will be added here
export function registerUserRoutes(app: any) {
  // Create user with hierarchy logic
  app.post("/api/users/hierarchy", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({
          error: "Email already registered",
          message: "An account with this email already exists",
        });
      }

      // Get role information
      const role = await storage.getRole(validatedData.roleId);
      if (!role) {
        return res.status(400).json({
          error: "Invalid role",
          message: "The specified role does not exist",
        });
      }

      // Create the user
      const user = await storage.createUser({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        roleId: validatedData.roleId,
        status: validatedData.status,
        createdBy: req.user!.userId, // Set the creator as the current user (admin)
      });

      // If creating a tutor, create mapping to admin
      if (role.name === "tutor") {
        try {
          await storage.createTutorAdminMapping({
            tutorId: user.id,
            adminId: req.user!.userId,
          });
        } catch (mappingError) {
          console.error("Failed to create tutor-admin mapping:", mappingError);
          // Continue even if mapping fails
        }
      }

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role.name,
          status: user.status,
          createdAt: user.createdAt,
          createdBy: user.createdBy,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Tutor creates student with hierarchy logic
  app.post("/api/users/tutor-student", authenticate, requireRole("tutor"), async (req: any, res: any) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({
          error: "Email already registered",
          message: "An account with this email already exists",
        });
      }

      // Ensure role is student
      const studentRole = await storage.getRoleByName("student");
      if (!studentRole) {
        return res.status(500).json({
          error: "Server error",
          message: "Student role not found in database",
        });
      }

      // Create the student user
      const user = await storage.createUser({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        roleId: studentRole.id,
        status: validatedData.status,
        createdBy: req.user!.userId, // Set the creator as the current user (tutor)
      });

      // Create mapping to tutor
      try {
        await storage.createStudentTutorMapping({
          studentId: user.id,
          tutorId: req.user!.userId,
        });
      } catch (mappingError) {
        console.error("Failed to create student-tutor mapping:", mappingError);
        // Continue even if mapping fails
      }

      res.status(201).json({
        message: "Student created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "student",
          status: user.status,
          createdAt: user.createdAt,
          createdBy: user.createdBy,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Create student error:", error);
      res.status(500).json({ error: "Failed to create student" });
    }
  });

  // Get users by creator ID
  app.get("/api/users/creator/:creatorId", authenticate, async (req: any, res: any) => {
    try {
      const { creatorId } = req.params;
      const users = await storage.getUsersByCreatorId(creatorId);
      res.json(users);
    } catch (error) {
      console.error("Get users by creator error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // User profile
  app.get("/api/users/profile", authenticate, async (req: any, res: any) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(500).json({
          error: "Server error",
          message: "User role not found",
        });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: role.name,
        status: user.status,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user role (admin only)
  app.put("/api/users/:id/role", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserRoleSchema.parse(req.body);
      
      // Get role by name
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
          role: role.name,
          status: user.status,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      console.error("Update user role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      if (id === req.user!.userId) {
        return res.status(400).json({
          error: "Cannot delete own account",
          message: "You cannot delete your own account",
        });
      }
      
      // Get the user to determine their role before deletion
      const userToDelete = await storage.getUser(id);
      if (!userToDelete) {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }
      
      // Get the user's role
      const role = await storage.getRole(userToDelete.roleId);
      
      // Track cascade deletion counts
      let tutorsDeleted = 0;
      let studentsDeleted = 0;
      
      // If the user is an admin, count tutors they created
      if (role && role.name === "admin") {
        const tutors = await storage.getTutorsByAdminId(id);
        tutorsDeleted = tutors.length;
        
        // Count students created by those tutors
        for (const tutor of tutors) {
          const students = await storage.getStudentsByTutorId(tutor.id);
          studentsDeleted += students.length;
        }
      }
      
      // If the user is a tutor, count students they created
      if (role && role.name === "tutor") {
        const students = await storage.getStudentsByTutorId(id);
        studentsDeleted = students.length;
      }
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }
      
      // Provide detailed response about what was deleted
      const response: any = { 
        message: "User deleted successfully" 
      };
      
      if (role) {
        if (role.name === "admin" && tutorsDeleted > 0) {
          response.message += `, including ${tutorsDeleted} tutors and ${studentsDeleted} students`;
          response.tutorsDeleted = tutorsDeleted;
          response.studentsDeleted = studentsDeleted;
        } else if (role.name === "tutor" && studentsDeleted > 0) {
          response.message += `, including ${studentsDeleted} students`;
          response.studentsDeleted = studentsDeleted;
        }
        response.deletedUserRole = role.name;
      }
      
      res.json(response);
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Get all tutors (admin only)
  app.get("/api/users/tutors", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const tutors = await storage.getAllTutors();
      res.json(tutors);
    } catch (error) {
      console.error("Get tutors error:", error);
      res.status(500).json({ error: "Failed to fetch tutors" });
    }
  });

  // Get all students (admin only)
  app.get("/api/users/students", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Get tutors created by a specific admin (admin only)
  app.get("/api/users/admin/:adminId/tutors", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { adminId } = req.params;
      const tutors = await storage.getTutorsByAdminId(adminId);
      res.json(tutors);
    } catch (error) {
      console.error("Get tutors by admin error:", error);
      res.status(500).json({ error: "Failed to fetch tutors" });
    }
  });

  // Get students assigned to a specific tutor (tutor or admin)
  app.get("/api/users/tutor/:tutorId/students", authenticate, requireRole("tutor", "admin"), async (req: any, res: any) => {
    try {
      const { tutorId } = req.params;
      const students = await storage.getStudentsByTutorId(tutorId);
      res.json(students);
    } catch (error) {
      console.error("Get students by tutor error:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Delete all students created by a tutor
  app.delete("/api/users/tutor/:tutorId/students", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { tutorId } = req.params;
      
      // Verify the tutor exists
      const tutor = await storage.getUser(tutorId);
      if (!tutor) {
        return res.status(404).json({
          error: "Tutor not found",
          message: "The specified tutor does not exist",
        });
      }
      
      // Get the tutor's role
      const role = await storage.getRole(tutor.roleId);
      if (!role || role.name !== "tutor") {
        return res.status(400).json({
          error: "Invalid tutor",
          message: "The specified user is not a tutor",
        });
      }
      
      // Delete all students created by this tutor
      const deletedCount = await storage.deleteStudentsByTutorId(tutorId);
      
      res.json({ 
        message: `Successfully deleted ${deletedCount} students`, 
        deletedCount 
      });
    } catch (error) {
      console.error("Delete students by tutor error:", error);
      res.status(500).json({ error: "Failed to delete students" });
    }
  });

  // Delete all tutors created by an admin
  app.delete("/api/users/admin/:adminId/tutors", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { adminId } = req.params;
      
      // Verify the admin exists
      const admin = await storage.getUser(adminId);
      if (!admin) {
        return res.status(404).json({
          error: "Admin not found",
          message: "The specified admin does not exist",
        });
      }
      
      // Get the admin's role
      const role = await storage.getRole(admin.roleId);
      if (!role || role.name !== "admin") {
        return res.status(400).json({
          error: "Invalid admin",
          message: "The specified user is not an admin",
        });
      }
      
      // Delete all tutors created by this admin
      const deletedCount = await storage.deleteTutorsByAdminId(adminId);
      
      res.json({ 
        message: `Successfully deleted ${deletedCount} tutors`, 
        deletedCount 
      });
    } catch (error) {
      console.error("Delete tutors by admin error:", error);
      res.status(500).json({ error: "Failed to delete tutors" });
    }
  });

  // Delete a tutor and all their students
  app.delete("/api/users/tutor/:id/cascade", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      // Verify the tutor exists
      const tutor = await storage.getUser(id);
      if (!tutor) {
        return res.status(404).json({
          error: "Tutor not found",
          message: "The specified tutor does not exist",
        });
      }
      
      // Get the tutor's role
      const role = await storage.getRole(tutor.roleId);
      if (!role || role.name !== "tutor") {
        return res.status(400).json({
          error: "Invalid tutor",
          message: "The specified user is not a tutor",
        });
      }
      
      // Delete all students created by this tutor
      const studentCount = await storage.deleteStudentsByTutorId(id);
      
      // Delete mappings
      await storage.deleteTutorAdminMappingsByTutorId(id);
      await storage.deleteStudentTutorMappingsByTutorId(id);
      
      // Delete the tutor
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({
          error: "Tutor not found",
          message: "The requested tutor does not exist",
        });
      }
      
      res.json({ 
        message: `Successfully deleted tutor and ${studentCount} students`, 
        tutorDeleted: 1,
        studentsDeleted: studentCount
      });
    } catch (error) {
      console.error("Cascade delete tutor error:", error);
      res.status(500).json({ error: "Failed to cascade delete tutor" });
    }
  });

  // Delete an admin and all their tutors (and those tutors' students)
  app.delete("/api/users/admin/:id/cascade", authenticate, requireRole("admin"), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      // Verify the admin exists
      const admin = await storage.getUser(id);
      if (!admin) {
        return res.status(404).json({
          error: "Admin not found",
          message: "The specified admin does not exist",
        });
      }
      
      // Get the admin's role
      const role = await storage.getRole(admin.roleId);
      if (!role || role.name !== "admin") {
        return res.status(400).json({
          error: "Invalid admin",
          message: "The specified user is not an admin",
        });
      }
      
      // Get all tutors created by this admin
      const tutors = await storage.getTutorsByAdminId(id);
      let totalStudentsDeleted = 0;
      
      // Delete all students created by each tutor
      for (const tutor of tutors) {
        const studentCount = await storage.deleteStudentsByTutorId(tutor.id);
        totalStudentsDeleted += studentCount;
        
        // Delete mappings for each tutor
        await storage.deleteTutorAdminMappingsByTutorId(tutor.id);
        await storage.deleteStudentTutorMappingsByTutorId(tutor.id);
      }
      
      // Delete all tutors created by this admin
      const tutorCount = await storage.deleteTutorsByAdminId(id);
      
      // Delete the admin
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({
          error: "Admin not found",
          message: "The requested admin does not exist",
        });
      }
      
      res.json({ 
        message: `Successfully deleted admin, ${tutorCount} tutors, and ${totalStudentsDeleted} students`, 
        adminDeleted: 1,
        tutorsDeleted: tutorCount,
        studentsDeleted: totalStudentsDeleted
      });
    } catch (error) {
      console.error("Cascade delete admin error:", error);
      res.status(500).json({ error: "Failed to cascade delete admin" });
    }
  });
}
