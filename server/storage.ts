import { type File, type InsertFile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getFile(id: string): Promise<File | undefined>;
  getFileByShareId(shareId: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: string): Promise<void>;
  getExpiredFiles(): Promise<File[]>;
}

export class MemStorage implements IStorage {
  private files: Map<string, File>;

  constructor() {
    this.files = new Map();
  }

  async getFile(id: string): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFileByShareId(shareId: string): Promise<File | undefined> {
    return Array.from(this.files.values()).find(
      (file) => file.shareId === shareId,
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = { 
      ...insertFile, 
      id,
      createdAt: new Date()
    };
    this.files.set(id, file);
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    this.files.delete(id);
  }

  async getExpiredFiles(): Promise<File[]> {
    const now = new Date();
    return Array.from(this.files.values()).filter(
      (file) => file.expiresAt < now,
    );
  }
}

export const storage = new MemStorage();
