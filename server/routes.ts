import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPhotoSessionSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Save photo session
  app.post("/api/photo-sessions", async (req, res) => {
    try {
      const validatedData = insertPhotoSessionSchema.parse(req.body);
      const session = await storage.createPhotoSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error("Error creating photo session:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create photo session" });
      }
    }
  });

  // Get photo session
  app.get("/api/photo-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid session ID" });
        return;
      }

      const session = await storage.getPhotoSession(id);
      if (!session) {
        res.status(404).json({ error: "Photo session not found" });
        return;
      }

      res.json(session);
    } catch (error) {
      console.error("Error fetching photo session:", error);
      res.status(500).json({ error: "Failed to fetch photo session" });
    }
  });

  // Upload topper image
  app.post("/api/upload-topper", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // Convert buffer to base64
      const base64Data = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

      res.json({ imageData: dataUrl });
    } catch (error) {
      console.error("Error uploading topper image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
