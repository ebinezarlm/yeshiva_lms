import { type User, type InsertUser, type Video, type InsertVideo, type Comment, type InsertComment, type Question, type InsertQuestion, users, videos, comments, questions } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  createQuestion(question: InsertQuestion): Promise<Question>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }
}

export const storage = new DatabaseStorage();
