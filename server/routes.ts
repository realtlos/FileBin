import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { insertFileSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { z } from "zod";

const uploadRequestSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().positive(),
  expiration: z.enum(["1h", "1d", "1w"]),
});

const fileUpdateSchema = z.object({
  objectPath: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  expiration: z.enum(["1h", "1d", "1w"]),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files publicly
  app.get("/files/:shareId", async (req, res) => {
    try {
      const file = await storage.getFileByShareId(req.params.shareId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Check if file has expired
      if (new Date() > file.expiresAt) {
        await storage.deleteFile(file.id);
        return res.status(404).json({ error: "File has expired" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(file.objectPath);
      
      // Set download headers
      res.set({
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Type': file.mimeType,
      });
      
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving file:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get upload URL for file
  app.post("/api/upload-url", async (req, res) => {
    try {
      const validatedData = uploadRequestSchema.parse(req.body);
      
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      return res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Complete file upload and save metadata
  app.post("/api/files", async (req, res) => {
    try {
      const validatedData = fileUpdateSchema.parse(req.body);
      
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(validatedData.objectPath);
      
      // Generate unique share ID
      const shareId = randomBytes(16).toString('hex');
      
      // Calculate expiration date
      const now = new Date();
      const expiresAt = new Date();
      
      switch (validatedData.expiration) {
        case "1h":
          expiresAt.setHours(now.getHours() + 1);
          break;
        case "1d":
          expiresAt.setDate(now.getDate() + 1);
          break;
        case "1w":
          expiresAt.setDate(now.getDate() + 7);
          break;
      }
      
      const fileData = {
        filename: validatedData.filename,
        originalName: validatedData.originalName,
        mimeType: validatedData.mimeType,
        size: validatedData.size,
        objectPath: normalizedPath,
        shareId,
        expiresAt,
      };
      
      const file = await storage.createFile(fileData);
      
      res.json({
        id: file.id,
        shareId: file.shareId,
        shareUrl: `${req.protocol}://${req.get('host')}/files/${file.shareId}`,
        filename: file.originalName,
        size: file.size,
        expiresAt: file.expiresAt,
      });
    } catch (error) {
      console.error("Error saving file:", error);
      return res.status(500).json({ error: "Failed to save file" });
    }
  });

  // Cleanup expired files endpoint (can be called by a cron job)
  app.post("/api/cleanup", async (req, res) => {
    try {
      const expiredFiles = await storage.getExpiredFiles();
      let cleanedCount = 0;
      
      for (const file of expiredFiles) {
        try {
          const objectStorageService = new ObjectStorageService();
          const objectFile = await objectStorageService.getObjectEntityFile(file.objectPath);
          await objectFile.delete();
          await storage.deleteFile(file.id);
          cleanedCount++;
        } catch (error) {
          console.error(`Error cleaning up file ${file.id}:`, error);
        }
      }
      
      res.json({ cleaned: cleanedCount });
    } catch (error) {
      console.error("Error during cleanup:", error);
      res.status(500).json({ error: "Cleanup failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
