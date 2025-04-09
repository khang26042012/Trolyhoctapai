import express from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertMessageSchema, Message } from "@shared/schema";
import { generateAIResponse } from "./ai";

// Interface cho đề luyện tập
interface PracticeQuestion {
  question: string;
  answer?: string; // Có thể không có đáp án nếu là câu hỏi tự luận
  explanation?: string; // Giải thích đáp án (tùy chọn)
}

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
        action: action || null, // Lưu lại action để hiển thị ở phía client
      };
      
      await storage.saveMessage(userMessage);
      const savedAssistantMessage = await storage.saveMessage(assistantMessage);
      
      return res.status(200).json(savedAssistantMessage);
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      return res.status(500).json({ error: "Failed to generate response" });
    }
  });
  
  // Term explanation endpoint
  apiRouter.post("/explain", async (req, res) => {
    try {
      const { term, systemPrompt } = req.body;
      
      if (!term) {
        return res.status(400).json({ error: "Term is required" });
      }
      
      // Generate explanation for the term
      const explanation = await generateAIResponse(
        `Giải thích thuật ngữ: "${term}"`, 
        systemPrompt
      );
      
      return res.status(200).json({ explanation });
    } catch (error) {
      console.error("Error in explain endpoint:", error);
      return res.status(500).json({ error: "Failed to generate explanation" });
    }
  });

  // Generate practice questions endpoint
  apiRouter.post("/practice", async (req, res) => {
    try {
      const { subject, grade, topic, count = 3, includeAnswers = true } = req.body;
      
      if (!subject || !grade) {
        return res.status(400).json({ error: "Subject and grade are required" });
      }
      
      // Tạo prompt để yêu cầu Gemini tạo câu hỏi
      const practicePrompt = `Hãy tạo ${count} câu hỏi trắc nghiệm hoặc tự luận về môn ${subject} lớp ${grade}${topic ? ` với chủ đề ${topic}` : ''}.
      
Mỗi câu hỏi cần bao gồm:
- Nội dung câu hỏi rõ ràng, ngắn gọn
${includeAnswers ? '- Kèm theo đáp án đúng\n- Giải thích ngắn gọn lý do tại sao đáp án là đúng' : ''}

Trả về câu hỏi dưới định dạng JSON như sau:
[
  {
    "question": "Nội dung câu hỏi",
    "answer": "Đáp án đúng (nếu là trắc nghiệm) hoặc hướng dẫn đáp án (nếu là tự luận)",
    "explanation": "Giải thích ngắn gọn cho đáp án"
  },
  ...
]

Lưu ý: Tạo câu hỏi phù hợp với trình độ lớp ${grade}, đảm bảo đúng kiến thức và độ khó phù hợp.`;

      // Sử dụng system prompt để định hướng AI tạo câu hỏi chất lượng cao
      const systemPrompt = `Bạn là một giáo viên giỏi chuyên môn ${subject}. 
Nhiệm vụ của bạn là tạo các câu hỏi chất lượng cao để học sinh lớp ${grade} luyện tập. 
Hãy đảm bảo rằng các câu hỏi đều đúng kiến thức, phù hợp với chương trình, 
có tính thực tiễn cao và giúp học sinh hiểu sâu hơn về môn học.`;

      // Generate questions using AI
      const aiResponse = await generateAIResponse(practicePrompt, systemPrompt);
      
      // Try to parse the response as JSON
      try {
        // Tìm dữ liệu JSON trong phản hồi của AI
        const jsonMatch = aiResponse.match(/\[\s*\{.*\}\s*\]/s);
        let questions: PracticeQuestion[] = [];
        
        if (jsonMatch) {
          // Nếu có định dạng JSON, cố gắng parse
          questions = JSON.parse(jsonMatch[0]);
        } else {
          // Nếu không phải JSON, trả về lỗi
          return res.status(500).json({ 
            error: "Failed to generate properly formatted questions",
            rawResponse: aiResponse
          });
        }
        
        return res.status(200).json({ questions });
      } catch (parseError) {
        console.error("Error parsing AI response as questions:", parseError);
        // Trả về response gốc nếu parse lỗi để xử lý ở phía client
        return res.status(500).json({ 
          error: "Failed to parse questions", 
          rawResponse: aiResponse 
        });
      }
    } catch (error) {
      console.error("Error in practice questions endpoint:", error);
      return res.status(500).json({ error: "Failed to generate practice questions" });
    }
  });

  // Register API routes
  app.use("/api", apiRouter);

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
