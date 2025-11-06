import { type User, type InsertUser, type Video, type InsertVideo, type Comment, type InsertComment, type Question, type InsertQuestion, type Playlist, type InsertPlaylist, type Subscription, type InsertSubscription, type WatchProgress, type InsertWatchProgress, type Role, type InsertRole, type Permission, type InsertPermission, type RolePermission, type InsertRolePermission, type UpdateRole, users, videos, comments, questions, playlists, subscriptions, watchProgress, roles, permissions, rolePermissions } from "@shared/schema";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";
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
    const [video] = await db
      .update(videos)
      .set(updateData)
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
}

export const storage = new DatabaseStorage();