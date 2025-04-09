import express from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertMessageSchema, Message } from "@shared/schema";
import { generateAIResponse } from "./ai";
import { extractTextFromImage } from "./ocr";

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

  // Chat endpoint
  apiRouter.post("/chat", async (req, res) => {
    try {
      const { message, systemPrompt, action } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Generate AI response
      const aiResponse = await generateAIResponse(message, systemPrompt);
      
      // Save messages to storage
      const userMessage = {
        role: "user",
        content: message,
        action: action || null,
        timestamp: new Date(),
      };
      
      const assistantMessage = {
        role: "assistant",
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

  // OCR endpoint for text extraction
  apiRouter.post("/ocr/extract", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "Image is required" });
      }
      
      // Extract text from image
      const extractedText = await extractTextFromImage(image);
      
      return res.status(200).json({ text: extractedText });
    } catch (error) {
      console.error("Error in OCR extract endpoint:", error);
      return res.status(500).json({ error: "Failed to extract text from image" });
    }
  });

  // OCR endpoint for processing and getting AI response
  apiRouter.post("/ocr", async (req, res) => {
    try {
      const { imageData, extractedText, systemPrompt, action } = req.body;
      
      if (!extractedText) {
        return res.status(400).json({ error: "Extracted text is required" });
      }
      
      // Generate AI response
      const aiResponse = await generateAIResponse(extractedText, systemPrompt);
      
      // Save messages to storage
      const userMessage = {
        role: "user",
        content: extractedText,
        action: action || null,
        imageData,
        extractedText,
        timestamp: new Date(),
      };
      
      const assistantMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      
      await storage.saveMessage(userMessage);
      const savedAssistantMessage = await storage.saveMessage(assistantMessage);
      
      return res.status(200).json(savedAssistantMessage);
    } catch (error) {
      console.error("Error in OCR endpoint:", error);
      return res.status(500).json({ error: "Failed to process image and generate response" });
    }
  });

  // Register API routes
  app.use("/api", apiRouter);

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
