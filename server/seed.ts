import { storage } from "./storage";

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
