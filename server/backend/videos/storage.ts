import { db } from "../../db";
import { videos, comments, questions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface VideoStorage {
  getAllVideos(): Promise<any[]>;
  getVideo(id: string): Promise<any | undefined>;
  createVideo(videoData: any): Promise<any>;
  updateVideo(id: string, videoData: any): Promise<any | undefined>;
  deleteVideo(id: string): Promise<boolean>;
  likeVideo(videoId: string): Promise<any | undefined>;
  
  getCommentsByVideoId(videoId: string): Promise<any[]>;
  createComment(commentData: any): Promise<any>;
  
  getQuestionsByVideoId(videoId: string): Promise<any[]>;
  createQuestion(questionData: any): Promise<any>;
  answerQuestion(id: string, answer: string): Promise<any | undefined>;
}

export class VideoStorageImpl implements VideoStorage {
  async getAllVideos(): Promise<any[]> {
    return await db.select().from(videos);
  }

  async getVideo(id: string): Promise<any | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async createVideo(videoData: any): Promise<any> {
    const [video] = await db
      .insert(videos)
      .values(videoData)
      .returning();
    return video;
  }

  async updateVideo(id: string, videoData: any): Promise<any | undefined> {
    // Handle tutorId null case by converting null to undefined
    const processedUpdateData: any = { ...videoData };
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

  async likeVideo(videoId: string): Promise<any | undefined> {
    const [video] = await db
      .update(videos)
      .set({ likes: sql`${videos.likes} + 1` })
      .where(eq(videos.id, videoId))
      .returning();
    return video || undefined;
  }

  async getCommentsByVideoId(videoId: string): Promise<any[]> {
    return await db.select().from(comments).where(eq(comments.videoId, videoId));
  }

  async createComment(commentData: any): Promise<any> {
    const [comment] = await db
      .insert(comments)
      .values(commentData)
      .returning();
    return comment;
  }

  async getQuestionsByVideoId(videoId: string): Promise<any[]> {
    return await db.select().from(questions).where(eq(questions.videoId, videoId));
  }

  async createQuestion(questionData: any): Promise<any> {
    const [question] = await db
      .insert(questions)
      .values(questionData)
      .returning();
    return question;
  }

  async answerQuestion(id: string, answer: string): Promise<any | undefined> {
    const [question] = await db
      .update(questions)
      .set({ answer, answeredAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return question || undefined;
  }
}

export const videoStorage = new VideoStorageImpl();