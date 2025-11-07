import { db } from "../../db";
import { courses, categories } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface CourseStorage {
  // Course methods
  getAllCourses(): Promise<any[]>;
  getCourse(id: string): Promise<any | undefined>;
  createCourse(courseData: any): Promise<any>;
  updateCourse(id: string, courseData: any): Promise<any | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  
  // Category methods
  getAllCategories(): Promise<any[]>;
  getCategory(id: string): Promise<any | undefined>;
  getCategoryByName(name: string): Promise<any | undefined>;
  createCategory(categoryData: any): Promise<any>;
  updateCategory(id: string, categoryData: any): Promise<any | undefined>;
  deleteCategory(id: string): Promise<boolean>;
}

export class CourseStorageImpl implements CourseStorage {
  // Course methods
  async getAllCourses(): Promise<any[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: string): Promise<any | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(courseData: any): Promise<any> {
    const [course] = await db
      .insert(courses)
      .values(courseData)
      .returning();
    return course;
  }

  async updateCourse(id: string, courseData: any): Promise<any | undefined> {
    const [course] = await db
      .update(courses)
      .set({ ...courseData, updated_at: sql`now()` })
      .where(eq(courses.id, id))
      .returning();
    return course || undefined;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Category methods
  async getAllCategories(): Promise<any[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: string): Promise<any | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryByName(name: string): Promise<any | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category || undefined;
  }

  async createCategory(categoryData: any): Promise<any> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateCategory(id: string, categoryData: any): Promise<any | undefined> {
    const [category] = await db
      .update(categories)
      .set({ ...categoryData, updated_at: sql`now()` })
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const courseStorage = new CourseStorageImpl();