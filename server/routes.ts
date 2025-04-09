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
      
      // Cải thiện prompt để yêu cầu Gemini tạo câu hỏi có cấu trúc JSON rõ ràng
      const practicePrompt = `Hãy tạo ${count} câu hỏi trắc nghiệm hoặc tự luận chất lượng cao về môn ${subject} lớp ${grade}${topic ? ` với chủ đề ${topic}` : ''}.

Yêu cầu về câu hỏi:
1. Nội dung phải đúng kiến thức môn ${subject} lớp ${grade}
2. Câu hỏi phải rõ ràng, dễ hiểu và đúng ngữ pháp
3. Đảm bảo độ khó phù hợp với học sinh lớp ${grade}
4. Đa dạng về dạng câu hỏi (trắc nghiệm, tự luận, điền khuyết, etc.)
5. Định dạng câu hỏi rõ ràng, có thể kèm theo công thức toán học nếu cần
${includeAnswers ? '6. Đáp án phải đúng, và có giải thích chi tiết, rõ ràng' : ''}

Trả về câu hỏi CHÍNH XÁC theo định dạng JSON sau:
[
  {
    "question": "Nội dung câu hỏi với định dạng HTML (có thể dùng <p>, <strong>, <em>, <ul>, <li>)",
    "answer": "${includeAnswers ? 'Đáp án đúng với định dạng HTML' : ''}",
    "explanation": "${includeAnswers ? 'Giải thích chi tiết với định dạng HTML' : ''}"
  },
  ...
]

QUAN TRỌNG: Chỉ trả về đúng định dạng JSON yêu cầu, không thêm bất kỳ văn bản giới thiệu hoặc kết luận nào khác.`;

      // Cải thiện system prompt để định hướng AI tạo câu hỏi chất lượng cao và đúng định dạng
      const systemPrompt = `Bạn là giáo viên chuyên môn hàng đầu về môn ${subject}, với nhiều năm kinh nghiệm dạy học sinh lớp ${grade}.
Nhiệm vụ của bạn là tạo các câu hỏi chất lượng cao để học sinh luyện tập.
Hãy đảm bảo câu hỏi đúng kiến thức chương trình, phù hợp với độ tuổi, và giúp học sinh hiểu sâu hơn về môn học.
Câu trả lời của bạn PHẢI đúng định dạng JSON theo yêu cầu, không được thêm văn bản giới thiệu hoặc kết luận khác.`;

      // Generate questions using AI
      const aiResponse = await generateAIResponse(practicePrompt, systemPrompt);
      
      try {
        // Tìm và trích xuất phần JSON từ phản hồi AI
        const jsonPattern = /\[\s*\{\s*"question"[\s\S]*\}\s*\]/;
        const match = aiResponse.match(jsonPattern);
        
        if (!match) {
          console.error("No JSON pattern found in response");
          return res.status(500).json({ 
            error: "Không thể tạo câu hỏi theo định dạng yêu cầu", 
            rawResponse: aiResponse 
          });
        }
        
        const jsonStr = match[0];
        const questions: PracticeQuestion[] = JSON.parse(jsonStr);
        
        if (!Array.isArray(questions) || questions.length === 0) {
          console.error("Empty or invalid questions array");
          return res.status(500).json({ 
            error: "Kết quả trả về không hợp lệ", 
            rawResponse: aiResponse 
          });
        }
        
        return res.status(200).json({ questions });
      } catch (parseError) {
        console.error("Error parsing AI response as questions:", parseError);
        // Log response for debugging
        console.error("AI response:", aiResponse);
        
        // Thử phương pháp khác để trích xuất JSON
        try {
          // Tìm vị trí của dấu [ đầu tiên và dấu ] cuối cùng
          const startIdx = aiResponse.indexOf('[');
          const endIdx = aiResponse.lastIndexOf(']');
          
          if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
            const jsonStr = aiResponse.substring(startIdx, endIdx + 1);
            const questions: PracticeQuestion[] = JSON.parse(jsonStr);
            
            if (Array.isArray(questions) && questions.length > 0) {
              return res.status(200).json({ questions });
            }
          }
        } catch (secondAttemptError) {
          console.error("Second attempt also failed:", secondAttemptError);
        }
        
        return res.status(500).json({ 
          error: "Không thể phân tích kết quả từ AI. Vui lòng thử lại.", 
          rawResponse: aiResponse 
        });
      }
    } catch (error) {
      console.error("Error in practice questions endpoint:", error);
      return res.status(500).json({ error: "Không thể tạo câu hỏi luyện tập. Vui lòng thử lại sau." });
    }
  });

  // Register API routes
  app.use("/api", apiRouter);

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
