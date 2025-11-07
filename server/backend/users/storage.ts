import { db } from "../../db";
import { users, tutorAdminMappings, studentTutorMappings } from "@shared/schema";
import { eq, inArray, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { storage } from "../../storage";

export interface UserStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByEmail(email: string): Promise<any | undefined>;
  getAllUsers(): Promise<any[]>;
  createUser(userData: any): Promise<any>;
  updateUserRole(id: string, roleId: string): Promise<any | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsersByCreatorId(creatorId: string): Promise<any[]>;
  
  // User hierarchy methods
  getStudentsByTutorId(tutorId: string): Promise<any[]>;
  getTutorsByAdminId(adminId: string): Promise<any[]>;
  getAllTutors(): Promise<any[]>;
  getAllStudents(): Promise<any[]>;
  
  // Cascading deletion methods
  deleteStudentsByTutorId(tutorId: string): Promise<number>;
  deleteTutorsByAdminId(adminId: string): Promise<number>;
  deleteTutorAdminMappingsByTutorId(tutorId: string): Promise<number>;
  deleteStudentTutorMappingsByTutorId(tutorId: string): Promise<number>;
  deleteStudentTutorMappingsByStudentId(studentId: string): Promise<number>;
  
  // Tutor-Admin Mapping methods
  createTutorAdminMapping(mappingData: any): Promise<any>;
  getTutorAdminMapping(tutorId: string): Promise<any | undefined>;
  
  // Student-Tutor Mapping methods
  createStudentTutorMapping(mappingData: any): Promise<any>;
  getStudentTutorMapping(studentId: string): Promise<any | undefined>;
}

export class UserStorageImpl implements UserStorage {
  async getUser(id: string): Promise<any | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<any[]> {
    return await db.select().from(users);
  }

  async createUser(userData: any): Promise<any> {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        name: userData.name,
        email: userData.email,
        passwordHash,
        roleId: userData.roleId,
        status: userData.status,
        createdBy: userData.createdBy,
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, roleId: string): Promise<any | undefined> {
    const [user] = await db
      .update(users)
      .set({ roleId, updatedAt: sql`now()` })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    // First, check if this user is an admin or tutor and delete their related data
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }
    
    // Get the role of the user
    const role = await storage.getRole(user.roleId);
    if (!role) {
      // If we can't determine the role, just delete the user
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    }
    
    // If the user is an admin, delete all tutors they created
    if (role.name === "admin") {
      await this.deleteTutorsByAdminId(id);
    }
    
    // If the user is a tutor, delete all students they created and mappings
    if (role.name === "tutor") {
      await this.deleteStudentsByTutorId(id);
      await this.deleteTutorAdminMappingsByTutorId(id);
      await this.deleteStudentTutorMappingsByTutorId(id);
    }
    
    // If the user is a student, delete their mappings
    if (role.name === "student") {
      await this.deleteStudentTutorMappingsByStudentId(id);
    }
    
    // Finally, delete the user
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getUsersByCreatorId(creatorId: string): Promise<any[]> {
    return await db.select().from(users).where(eq(users.createdBy, creatorId));
  }
  
  async getStudentsByTutorId(tutorId: string): Promise<any[]> {
    // Get all students that are mapped to this tutor
    const mappings = await db.select().from(studentTutorMappings).where(eq(studentTutorMappings.tutorId, tutorId));
    const studentIds = mappings.map(mapping => mapping.studentId);
    
    if (studentIds.length === 0) {
      return [];
    }
    
    // Get the student users
    const students = await db.select().from(users).where(inArray(users.id, studentIds));
    return students;
  }
  
  async getTutorsByAdminId(adminId: string): Promise<any[]> {
    // Get all tutors that are mapped to this admin
    const mappings = await db.select().from(tutorAdminMappings).where(eq(tutorAdminMappings.adminId, adminId));
    const tutorIds = mappings.map(mapping => mapping.tutorId);
    
    if (tutorIds.length === 0) {
      return [];
    }
    
    // Get the tutor users
    const tutors = await db.select().from(users).where(inArray(users.id, tutorIds));
    return tutors;
  }
  
  async getAllTutors(): Promise<any[]> {
    // Get all users with tutor role
    const tutorRole = await storage.getRoleByName("tutor");
    if (!tutorRole) {
      return [];
    }
    
    return await db.select().from(users).where(eq(users.roleId, tutorRole.id));
  }
  
  async getAllStudents(): Promise<any[]> {
    // Get all users with student role
    const studentRole = await storage.getRoleByName("student");
    if (!studentRole) {
      return [];
    }
    
    return await db.select().from(users).where(eq(users.roleId, studentRole.id));
  }
  
  async deleteStudentsByTutorId(tutorId: string): Promise<number> {
    // Get all students that are mapped to this tutor
    const mappings = await db.select().from(studentTutorMappings).where(eq(studentTutorMappings.tutorId, tutorId));
    const studentIds = mappings.map(mapping => mapping.studentId);
    
    if (studentIds.length === 0) {
      return 0;
    }
    
    // Delete the student users
    const result = await db.delete(users).where(inArray(users.id, studentIds)).returning();
    return result.length;
  }
  
  async deleteTutorsByAdminId(adminId: string): Promise<number> {
    // Get all tutors that are mapped to this admin
    const mappings = await db.select().from(tutorAdminMappings).where(eq(tutorAdminMappings.adminId, adminId));
    const tutorIds = mappings.map(mapping => mapping.tutorId);
    
    if (tutorIds.length === 0) {
      return 0;
    }
    
    // Delete the tutor users
    const result = await db.delete(users).where(inArray(users.id, tutorIds)).returning();
    return result.length;
  }
  
  async deleteTutorAdminMappingsByTutorId(tutorId: string): Promise<number> {
    const result = await db.delete(tutorAdminMappings).where(eq(tutorAdminMappings.tutorId, tutorId));
    return result.rowCount ?? 0;
  }
  
  async deleteStudentTutorMappingsByTutorId(tutorId: string): Promise<number> {
    const result = await db.delete(studentTutorMappings).where(eq(studentTutorMappings.tutorId, tutorId));
    return result.rowCount ?? 0;
  }
  
  async deleteStudentTutorMappingsByStudentId(studentId: string): Promise<number> {
    const result = await db.delete(studentTutorMappings).where(eq(studentTutorMappings.studentId, studentId));
    return result.rowCount ?? 0;
  }
  
  async createTutorAdminMapping(mappingData: any): Promise<any> {
    const [mapping] = await db
      .insert(tutorAdminMappings)
      .values(mappingData)
      .returning();
    return mapping;
  }
  
  async getTutorAdminMapping(tutorId: string): Promise<any | undefined> {
    const [mapping] = await db.select().from(tutorAdminMappings).where(eq(tutorAdminMappings.tutorId, tutorId));
    return mapping || undefined;
  }
  
  async createStudentTutorMapping(mappingData: any): Promise<any> {
    const [mapping] = await db
      .insert(studentTutorMappings)
      .values(mappingData)
      .returning();
    return mapping;
  }
  
  async getStudentTutorMapping(studentId: string): Promise<any | undefined> {
    const [mapping] = await db.select().from(studentTutorMappings).where(eq(studentTutorMappings.studentId, studentId));
    return mapping || undefined;
  }
}

export const userStorage = new UserStorageImpl();