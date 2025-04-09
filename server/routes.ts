import express from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertMessageSchema, Message } from "@shared/schema";
import { generateAIResponse } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create API router
  const apiRouter = express.Router();
  
  // Configure multer for memory storage (for file uploads)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });

  // Chat endpoint (supports both text and image)
  apiRouter.post("/chat", async (req, res) => {
    try {
      const { message, systemPrompt, action, imageData } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Generate AI response with or without image
      const aiResponse = await generateAIResponse(message, systemPrompt, imageData);
      
      // Save messages to storage
      const userMessage = {
        role: "user" as const,
        content: message,
        action: action || null,
        imageData: imageData || null,
        timestamp: new Date(),
      };
      
      const assistantMessage = {
        role: "assistant" as const,
        content: aiResponse,
        timestamp: new Date(),
      };
      
      await storage.saveMessage(userMessage);
      const savedAssistantMessage = await storage.saveMessage(assistantMessage);
      
      return res.status(200).json(savedAssistantMessage);
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      return res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Register API routes
  app.use("/api", apiRouter);

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
