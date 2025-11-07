import { type User, type InsertUser, type Video, type InsertVideo, type Comment, type InsertComment, type Question, type InsertQuestion, type Playlist, type InsertPlaylist, type Subscription, type InsertSubscription, type WatchProgress, type InsertWatchProgress, type Role, type InsertRole, type Permission, type InsertPermission, type RolePermission, type InsertRolePermission, type UpdateRole, type TutorAdminMapping, type InsertTutorAdminMapping, type StudentTutorMapping, type InsertStudentTutorMapping, users, videos, comments, questions, playlists, subscriptions, watchProgress, roles, permissions, rolePermissions, tutorAdminMappings, studentTutorMappings } from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: UpdateRole): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;
  
  getPermission(id: string): Promise<Permission | undefined>;
  getPermissionByName(featureName: string): Promise<Permission | undefined>;
  getAllPermissions(): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  
  getRolePermission(roleId: string, permissionId: string): Promise<RolePermission | undefined>;
  getRolePermissions(roleId: string): Promise<Permission[]>;
  assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission>;
  revokePermissionFromRole(roleId: string, permissionId: string): Promise<boolean>;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: string, roleId: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsersByCreatorId(creatorId: string): Promise<User[]>;
  
  // User hierarchy methods
  getStudentsByTutorId(tutorId: string): Promise<User[]>;
  getTutorsByAdminId(adminId: string): Promise<User[]>;
  getAllTutors(): Promise<User[]>;
  getAllStudents(): Promise<User[]>;
  
  // Cascading deletion methods
  deleteStudentsByTutorId(tutorId: string): Promise<number>;
  deleteTutorsByAdminId(adminId: string): Promise<number>;
  deleteTutorAdminMappingsByTutorId(tutorId: string): Promise<number>;
  deleteStudentTutorMappingsByTutorId(tutorId: string): Promise<number>;
  deleteStudentTutorMappingsByStudentId(studentId: string): Promise<number>;
  
  getAllPlaylists(): Promise<Playlist[]>;
  getPlaylist(id: string): Promise<Playlist | undefined>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  deletePlaylist(id: string): Promise<boolean>;
  getVideosByPlaylistId(playlistId: string): Promise<Video[]>;
  
  getAllVideos(): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<boolean>;
  likeVideo(videoId: string): Promise<Video | undefined>;
  
  getCommentsByVideoId(videoId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  getAllQuestions(): Promise<Question[]>;
  getQuestionsByVideoId(videoId: string): Promise<Question[]>;
  getQuestionsByStudentEmail(email: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  answerQuestion(id: string, answer: string): Promise<Question | undefined>;
  
  getAllSubscriptions(): Promise<Subscription[]>;
  getSubscriptionsByEmail(email: string): Promise<Subscription[]>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  getWatchProgressByEmail(email: string): Promise<WatchProgress[]>;
  getWatchProgressByPlaylist(email: string, playlistId: string): Promise<WatchProgress[]>;
  upsertWatchProgress(progress: InsertWatchProgress): Promise<WatchProgress>;
  
  // Tutor-Admin Mapping methods
  createTutorAdminMapping(mapping: InsertTutorAdminMapping): Promise<TutorAdminMapping>;
  getTutorAdminMapping(tutorId: string): Promise<TutorAdminMapping | undefined>;
  
  // Student-Tutor Mapping methods
  createStudentTutorMapping(mapping: InsertStudentTutorMapping): Promise<StudentTutorMapping>;
  getStudentTutorMapping(studentId: string): Promise<StudentTutorMapping | undefined>;
  
  // Add missing permission methods
  getPermissionByRoleAndResource(roleId: string, resource: string): Promise<Permission | undefined>;
  deletePermission(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }

  async updateRole(id: string, updateRole: UpdateRole): Promise<Role | undefined> {
    const [role] = await db
      .update(roles)
      .set(updateRole)
      .where(eq(roles.id, id))
      .returning();
    return role || undefined;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async getPermissionByName(featureName: string): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.featureName, featureName));
    return permission || undefined;
  }

  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const [permission] = await db
      .insert(permissions)
      .values(insertPermission)
      .returning();
    return permission;
  }

  async getRolePermission(roleId: string, permissionId: string): Promise<RolePermission | undefined> {
    const [rolePermission] = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );
    return rolePermission || undefined;
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await db
      .select({
        id: permissions.id,
        featureName: permissions.featureName,
        description: permissions.description,
        createdAt: permissions.createdAt,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    return result;
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    const [rolePermission] = await db
      .insert(rolePermissions)
      .values({ roleId, permissionId })
      .returning();
    return rolePermission;
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    const result = await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const passwordHash = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        name: insertUser.name,
        email: insertUser.email,
        passwordHash,
        roleId: insertUser.roleId,
        status: insertUser.status,
        createdBy: insertUser.createdBy,
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, roleId: string): Promise<User | undefined> {
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
    const role = await this.getRole(user.roleId);
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

  async getAllPlaylists(): Promise<Playlist[]> {
    return await db.select().from(playlists);
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const [playlist] = await db
      .insert(playlists)
      .values(insertPlaylist)
      .returning();
    return playlist;
  }

  async deletePlaylist(id: string): Promise<boolean> {
    const result = await db.delete(playlists).where(eq(playlists.id, id)).returning();
    return result.length > 0;
  }

  async getVideosByPlaylistId(playlistId: string): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.playlistId, playlistId));
  }

  async getAllVideos(): Promise<Video[]> {
    return await db.select().from(videos);
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values(insertVideo)
      .returning();
    return video;
  }

  async updateVideo(id: string, updateData: Partial<InsertVideo>): Promise<Video | undefined> {
    // Handle tutorId null case by converting null to undefined
    const processedUpdateData: Partial<InsertVideo> = { ...updateData };
    if ('tutorId' in processedUpdateData && processedUpdateData.tutorId === null) {
      processedUpdateData.tutorId = undefined;
    }
    
    const [video] = await db
      .update(videos)
      .set(processedUpdateData)
      .where(eq(videos.id, id))
      .returning();
    return video || undefined;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const result = await db.delete(videos).where(eq(videos.id, id)).returning();
    return result.length > 0;
  }

  async likeVideo(videoId: string): Promise<Video | undefined> {
    const [video] = await db
      .update(videos)
      .set({ likes: sql`${videos.likes} + 1` })
      .where(eq(videos.id, videoId))
      .returning();
    return video || undefined;
  }

  async getCommentsByVideoId(videoId: string): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.videoId, videoId));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db.select().from(questions);
  }

  async getQuestionsByVideoId(videoId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.videoId, videoId));
  }

  async getQuestionsByStudentEmail(email: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.studentEmail, email));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async answerQuestion(id: string, answer: string): Promise<Question | undefined> {
    const [question] = await db
      .update(questions)
      .set({ answer, answeredAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return question || undefined;
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions);
  }

  async getSubscriptionsByEmail(email: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.studentEmail, email));
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription || undefined;
  }

  async getWatchProgressByEmail(email: string): Promise<WatchProgress[]> {
    return await db.select().from(watchProgress).where(eq(watchProgress.studentEmail, email));
  }

  async getWatchProgressByPlaylist(email: string, playlistId: string): Promise<WatchProgress[]> {
    return await db.select().from(watchProgress).where(
      and(
        eq(watchProgress.studentEmail, email),
        eq(watchProgress.playlistId, playlistId)
      )
    );
  }

  async upsertWatchProgress(insertProgress: InsertWatchProgress): Promise<WatchProgress> {
    const existing = await db.select().from(watchProgress).where(
      and(
        eq(watchProgress.studentEmail, insertProgress.studentEmail),
        eq(watchProgress.videoId, insertProgress.videoId)
      )
    );

    if (existing.length > 0) {
      const [progress] = await db
        .update(watchProgress)
        .set({ ...insertProgress, lastWatched: new Date() })
        .where(eq(watchProgress.id, existing[0].id))
        .returning();
      return progress;
    } else {
      const [progress] = await db
        .insert(watchProgress)
        .values(insertProgress)
        .returning();
      return progress;
    }
  }
  
  async createTutorAdminMapping(insertMapping: InsertTutorAdminMapping): Promise<TutorAdminMapping> {
    const [mapping] = await db
      .insert(tutorAdminMappings)
      .values(insertMapping)
      .returning();
    return mapping;
  }
  
  async getTutorAdminMapping(tutorId: string): Promise<TutorAdminMapping | undefined> {
    const [mapping] = await db.select().from(tutorAdminMappings).where(eq(tutorAdminMappings.tutorId, tutorId));
    return mapping || undefined;
  }
  
  async createStudentTutorMapping(insertMapping: InsertStudentTutorMapping): Promise<StudentTutorMapping> {
    const [mapping] = await db
      .insert(studentTutorMappings)
      .values(insertMapping)
      .returning();
    return mapping;
  }
  
  async getStudentTutorMapping(studentId: string): Promise<StudentTutorMapping | undefined> {
    const [mapping] = await db.select().from(studentTutorMappings).where(eq(studentTutorMappings.studentId, studentId));
    return mapping || undefined;
  }
  
  async getStudentsByTutorId(tutorId: string): Promise<User[]> {
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
  
  async getTutorsByAdminId(adminId: string): Promise<User[]> {
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
  
  async getAllTutors(): Promise<User[]> {
    // Get all users with tutor role
    const tutorRole = await this.getRoleByName("tutor");
    if (!tutorRole) {
      return [];
    }
    
    return await db.select().from(users).where(eq(users.roleId, tutorRole.id));
  }
  
  async getAllStudents(): Promise<User[]> {
    // Get all users with student role
    const studentRole = await this.getRoleByName("student");
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
  
  async getUsersByCreatorId(creatorId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.createdBy, creatorId));
  }
  
  async getPermissionByRoleAndResource(roleId: string, resource: string): Promise<Permission | undefined> {
    const [permission] = await db
      .select()
      .from(permissions)
      .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(permissions.featureName, resource)
        )
      );
    return permission ? permission.permissions : undefined;
  }
  
  async deletePermission(id: string): Promise<boolean> {
    const result = await db.delete(permissions).where(eq(permissions.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();