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
      
      // Đơn giản hóa prompt để tạo câu hỏi có cấu trúc dễ phân tích
      const practicePrompt = `Hãy tạo ${count} câu hỏi luyện tập chất lượng cao về môn ${subject} lớp ${grade}${topic ? ` với chủ đề ${topic}` : ''}.

Yêu cầu cụ thể:
- Nội dung phải đúng kiến thức của môn ${subject} lớp ${grade}
- Câu hỏi phải rõ ràng, dễ hiểu và phù hợp với học sinh lớp ${grade}
- Đa dạng về loại câu hỏi (trắc nghiệm, tự luận, điền khuyết, etc.)
- Có thể sử dụng công thức toán học khi cần thiết

Định dạng câu hỏi:
===
Câu 1: [Nội dung câu hỏi]
${includeAnswers ? 'Đáp án: [Đáp án cho câu hỏi]\nGiải thích: [Giải thích chi tiết lý do đáp án đúng]' : ''}

Câu 2: [Nội dung câu hỏi]
${includeAnswers ? 'Đáp án: [Đáp án cho câu hỏi]\nGiải thích: [Giải thích chi tiết lý do đáp án đúng]' : ''}

Câu 3: [Nội dung câu hỏi]
${includeAnswers ? 'Đáp án: [Đáp án cho câu hỏi]\nGiải thích: [Giải thích chi tiết lý do đáp án đúng]' : ''}
===

Lưu ý: Hãy tuân thủ đúng định dạng trên và điền nội dung thực tế cho mỗi câu hỏi.`;

      // Đơn giản hóa system prompt để định hướng AI tạo câu hỏi chất lượng cao và dễ phân tích
      const systemPrompt = `Bạn là giáo viên chuyên môn hàng đầu về môn ${subject}, với nhiều năm kinh nghiệm dạy học sinh lớp ${grade}.
Nhiệm vụ của bạn là tạo các câu hỏi luyện tập chất lượng cao cho học sinh.
Hãy đảm bảo câu hỏi đúng kiến thức chương trình, phù hợp với độ tuổi, và theo đúng định dạng yêu cầu.
KHÔNG thêm bất kỳ thông tin nào ngoài các câu hỏi theo đúng định dạng đã chỉ định.`;

      // Generate questions using AI
      const aiResponse = await generateAIResponse(practicePrompt, systemPrompt);
      
      // Phân tích phản hồi AI để trích xuất dữ liệu câu hỏi
      try {
        // Chiến lược 1: Xử lý phản hồi như văn bản thuần túy và tạo câu hỏi thủ công
        if (aiResponse) {
          // Nếu không phân tích được JSON, tạo câu hỏi thủ công từ phản hồi
          const textToHtml = (text: string) => {
            // Chuyển đổi xuống dòng thành thẻ p
            return text
              .split('\n\n')
              .filter(line => line.trim().length > 0)
              .map(para => `<p>${para.trim()}</p>`)
              .join('');
          };
          
          // Phân tích phản hồi để tìm các phần tử câu hỏi
          const paragraphs = aiResponse.split('\n\n')
            .filter(p => p.trim().length > 0);
          
          // Lọc các đoạn văn có khả năng là câu hỏi
          const questions: PracticeQuestion[] = [];
          
          // Tìm câu hỏi bằng nhiều cách
          // Phương pháp 1: Thử phân tích JSON đúng chuẩn
          try {
            const jsonPattern = /\[\s*\{\s*"question"[\s\S]*\}\s*\]/;
            const match = aiResponse.match(jsonPattern);
            
            if (match) {
              const jsonStr = match[0];
              const parsedQuestions = JSON.parse(jsonStr);
              
              if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                return res.status(200).json({ questions: parsedQuestions });
              }
            }
          } catch (err) {
            console.log("Could not parse JSON pattern directly");
          }
          
          // Phương pháp 2: Tìm [ và ] đầu và cuối
          try {
            const startIdx = aiResponse.indexOf('[');
            const endIdx = aiResponse.lastIndexOf(']');
            
            if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
              const jsonStr = aiResponse.substring(startIdx, endIdx + 1);
              const parsedQuestions = JSON.parse(jsonStr);
              
              if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                return res.status(200).json({ questions: parsedQuestions });
              }
            }
          } catch (err) {
            console.log("Could not extract JSON by brackets");
          }
          
          // Phương pháp 3: Tìm câu theo cấu trúc có phần mở đầu là "Câu <số>:"
          try {
            const questionRegex = /Câu (\d+):([\s\S]*?)(?=Câu \d+:|$)/g;
            const matches = [...aiResponse.matchAll(questionRegex)];
            
            if (matches.length > 0) {
              for (const match of matches) {
                // Phân tích nội dung câu hỏi
                const content = match[2].trim();
                let question = content;
                let answer = '';
                let explanation = '';
                
                // Tìm phần đáp án và giải thích
                const answerMatch = content.match(/Đáp án:?([\s\S]*?)(?=Giải thích|$)/i);
                const explanationMatch = content.match(/Giải thích:?([\s\S]*?)$/i);
                
                if (answerMatch) {
                  answer = answerMatch[1].trim();
                  question = question.replace(/Đáp án:?([\s\S]*?)(?=Giải thích|$)/i, '');
                }
                
                if (explanationMatch) {
                  explanation = explanationMatch[1].trim();
                  question = question.replace(/Giải thích:?([\s\S]*?)$/i, '');
                }
                
                questions.push({
                  question: textToHtml(question.trim()),
                  answer: textToHtml(answer),
                  explanation: textToHtml(explanation)
                });
              }
              
              if (questions.length > 0) {
                return res.status(200).json({ questions });
              }
            }
          } catch (err) {
            console.log("Could not extract by regex pattern");
          }
          
          // Phương pháp 4: Tạo câu hỏi từ đoạn văn ban đầu nếu các cách trên đều thất bại
          const question: PracticeQuestion = {
            question: `<p>Dưới đây là nội dung bài tập về ${subject} lớp ${grade}:</p>` + 
                      textToHtml(aiResponse),
            answer: includeAnswers ? "<p>Vui lòng xem giải thích bên dưới</p>" : "",
            explanation: includeAnswers ? "<p>AI không tạo được câu trả lời theo định dạng yêu cầu. Bạn có thể dùng chức năng chính của ứng dụng để hỏi trực tiếp về bài tập này.</p>" : ""
          };
          
          return res.status(200).json({ questions: [question] });
        }
        
        // Nếu không có dữ liệu trả về lỗi
        return res.status(500).json({ 
          error: "Không thể tạo câu hỏi. Vui lòng thử lại.", 
          rawResponse: aiResponse
        });
      } catch (error) {
        console.error("Error processing AI response:", error);
        return res.status(500).json({ 
          error: "Có lỗi xảy ra khi xử lý phản hồi từ AI. Vui lòng thử lại.", 
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
