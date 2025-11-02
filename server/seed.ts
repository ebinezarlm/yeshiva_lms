import { storage } from "./storage";
import type { InsertPermission } from "@shared/schema";

async function seed() {
  try {
    console.log("Starting database seed...");

    const roleNames = ["superadmin", "admin", "tutor", "student"] as const;
    const roleDescriptions = {
      superadmin: "Super Administrator with full system access and permission management",
      admin: "Administrator with platform management capabilities",
      tutor: "Instructor who can create and manage educational content",
      student: "Learner who can access courses and track progress",
    };

    console.log("Creating roles...");
    const roles: Record<string, any> = {};
    
    for (const roleName of roleNames) {
      const existingRole = await storage.getRoleByName(roleName);
      if (existingRole) {
        console.log(`Role ${roleName} already exists`);
        roles[roleName] = existingRole;
      } else {
        const role = await storage.createRole({
          name: roleName,
          description: roleDescriptions[roleName],
        });
        roles[roleName] = role;
        console.log(`Created role: ${roleName}`);
      }
    }

    console.log("Creating permissions...");
    const permissionDefinitions: InsertPermission[] = [
      { featureName: "Dashboard", description: "View dashboard overview and analytics" },
      { featureName: "Users", description: "Manage user accounts and profiles" },
      { featureName: "Reports", description: "Generate and view reports" },
      { featureName: "Payments", description: "Manage payments and transactions" },
      { featureName: "Settings", description: "Configure platform settings" },
      { featureName: "Upload Videos", description: "Upload and manage video content" },
      { featureName: "Manage Playlists", description: "Create and manage playlists" },
      { featureName: "View Comments", description: "View and respond to comments" },
      { featureName: "Earnings", description: "View earnings and revenue" },
      { featureName: "Explore", description: "Browse available courses" },
      { featureName: "My Courses", description: "View enrolled courses" },
      { featureName: "Subscriptions", description: "Manage course subscriptions" },
      { featureName: "Profile", description: "Manage user profile" },
      { featureName: "Access Control", description: "Manage role permissions" },
    ];

    const permissions: Record<string, any> = {};
    for (const permDef of permissionDefinitions) {
      const existingPerm = await storage.getPermissionByName(permDef.featureName);
      if (existingPerm) {
        console.log(`Permission ${permDef.featureName} already exists`);
        permissions[permDef.featureName] = existingPerm;
      } else {
        const perm = await storage.createPermission(permDef);
        permissions[permDef.featureName] = perm;
        console.log(`Created permission: ${permDef.featureName}`);
      }
    }

    console.log("Assigning permissions to roles...");
    const rolePermissionMap: Record<string, string[]> = {
      superadmin: [
        "Dashboard", "Users", "Reports", "Payments", "Settings",
        "Upload Videos", "Manage Playlists", "View Comments", "Earnings",
        "Explore", "My Courses", "Subscriptions", "Profile", "Access Control"
      ],
      admin: ["Dashboard", "Users", "Reports", "Payments", "Settings"],
      tutor: ["Upload Videos", "Manage Playlists", "View Comments", "Earnings", "Profile"],
      student: ["Explore", "My Courses", "Subscriptions", "Profile"],
    };

    for (const [roleName, permNames] of Object.entries(rolePermissionMap)) {
      const role = roles[roleName];
      for (const permName of permNames) {
        const permission = permissions[permName];
        if (role && permission) {
          const existing = await storage.getRolePermission(role.id, permission.id);
          if (!existing) {
            await storage.assignPermissionToRole(role.id, permission.id);
            console.log(`Assigned ${permName} to ${roleName}`);
          }
        }
      }
    }

    console.log("Creating test users...");
    const testUsers = [
      {
        name: "Super Admin User",
        email: "superadmin@lms.com",
        password: "password123",
        roleId: roles.superadmin.id,
        status: "active" as const,
      },
      {
        name: "Admin User",
        email: "admin@lms.com",
        password: "password123",
        roleId: roles.admin.id,
        status: "active" as const,
      },
      {
        name: "Tutor User",
        email: "tutor@lms.com",
        password: "password123",
        roleId: roles.tutor.id,
        status: "active" as const,
      },
      {
        name: "Student User",
        email: "student@lms.com",
        password: "password123",
        roleId: roles.student.id,
        status: "active" as const,
      },
    ];

    for (const userData of testUsers) {
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        console.log(`User ${userData.email} already exists`);
      } else {
        await storage.createUser(userData);
        console.log(`Created user: ${userData.email}`);
      }
    }

    console.log("Database seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
