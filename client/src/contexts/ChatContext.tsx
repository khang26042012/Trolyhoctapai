import React, { createContext, useContext, useReducer, useEffect } from "react";
import { Message } from "@shared/schema";
import { ActionType, ChatAction, ChatContextProps, ChatState } from "@/lib/types";
import { apiRequest, generateSystemPrompt } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Initial welcome message from the assistant
const initialMessage: Message = {
  role: "assistant",
  content: `
    <p>Xin chào! Tôi là trợ lý học tập AI bằng tiếng Việt. Tôi có thể giúp bạn:</p>
    <ul class="list-disc pl-5 mt-2">
      <li>Giải bài tập đầy đủ</li>
      <li>Giải bài tập rút gọn</li>
      <li>Gợi ý hướng làm bài</li>
      <li>Giải bài tập từ ảnh (dùng nút tải ảnh bên dưới)</li>
    </ul>
    <p class="mt-2">Hãy nhập bài tập của bạn hoặc tải ảnh lên để bắt đầu!</p>
  `,
  timestamp: new Date(),
};

// Initial state for chat context
const initialState: ChatState = {
  messages: [initialMessage],
  isLoading: false,
  isDarkMode: false, // Default to light mode per user request
  selectedAction: "complete", // Đặt "Giải đầy đủ" làm chế độ mặc định
};

// Create the chat context
const ChatContext = createContext<ChatContextProps | undefined>(undefined);

// Chat reducer to handle state updates
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload,
      };
    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [initialMessage],
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_DARK_MODE":
      return {
        ...state,
        isDarkMode: action.payload,
      };
    case "SET_SELECTED_ACTION":
      return {
        ...state,
        selectedAction: action.payload,
      };
    default:
      return state;
  }
}

// Chat provider component
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { toast } = useToast();

  // Effect to apply dark mode class to document
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", state.isDarkMode.toString());
  }, [state.isDarkMode]);
  
  // Effect to save messages to localStorage whenever they change
  useEffect(() => {
    // Don't save if only the initial welcome message exists
    if (state.messages.length > 1 || (state.messages.length === 1 && state.messages[0].role !== "assistant")) {
      localStorage.setItem("chatMessages", JSON.stringify(state.messages));
    }
  }, [state.messages]);

  // Effect to load saved state from localStorage on initial load
  useEffect(() => {
    try {
      // Load dark mode preference
      const savedDarkMode = localStorage.getItem("darkMode");
      if (savedDarkMode !== null) {
        dispatch({ type: "SET_DARK_MODE", payload: savedDarkMode === "true" });
      }
      
      // Load saved messages
      const savedMessages = localStorage.getItem("chatMessages");
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert ISO date strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        dispatch({ type: "SET_MESSAGES", payload: messagesWithDates });
      }
    } catch (error) {
      console.error("Error loading saved chat state:", error);
      // In case of error, just use the initial state
    }
  }, []);

  // Function to send a message to the AI
  const sendMessage = async (content: string, action: ActionType = state.selectedAction) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date(),
      action,
    };

    dispatch({ type: "ADD_MESSAGE", payload: userMessage });
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const systemPrompt = generateSystemPrompt(action);
      
      const response = await apiRequest<Message>("POST", "/api/chat", {
        message: content,
        systemPrompt,
        action,
      });

      dispatch({ type: "ADD_MESSAGE", payload: response });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Function to send an image to be analyzed by the AI
  const sendImage = async (imageData: string, userQuestion: string) => {
    const userMessage: Message = {
      role: "user",
      content: userQuestion,
      timestamp: new Date(),
      imageData,
      action: state.selectedAction,
    };

    dispatch({ type: "ADD_MESSAGE", payload: userMessage });
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const systemPrompt = generateSystemPrompt(state.selectedAction);
      
      const response = await apiRequest<Message>("POST", "/api/chat", {
        message: userQuestion,
        imageData,
        systemPrompt,
        action: state.selectedAction,
      });

      dispatch({ type: "ADD_MESSAGE", payload: response });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xử lý hình ảnh. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Function to clear all messages
  const clearMessages = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả tin nhắn?")) {
      dispatch({ type: "CLEAR_MESSAGES" });
      // Also clear from localStorage
      localStorage.removeItem("chatMessages");
    }
  };

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    dispatch({ type: "SET_DARK_MODE", payload: !state.isDarkMode });
  };

  // Function to set the selected action
  const setSelectedAction = (action: ActionType) => {
    dispatch({ type: "SET_SELECTED_ACTION", payload: action });
  };
  
  // Function to add practice questions directly to chat
  const sendPracticeQuestions = async (subject: string, grade: string, topic?: string) => {
    try {
      // System message to indicate loading practice questions
      const loadingMessage: Message = {
        role: "system" as const,
        content: `<p>Đang tạo bài tập luyện tập về môn ${subject} lớp ${grade}${topic ? ` chủ đề ${topic}` : ''}...</p>`,
        timestamp: new Date(),
      };
      
      dispatch({ type: "ADD_MESSAGE", payload: loadingMessage });
      dispatch({ type: "SET_LOADING", payload: true });
      
      // Fetch practice questions from API
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          grade,
          topic,
          count: 3,
          includeAnswers: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch practice questions");
      }
      
      const data = await response.json();
      
      // Remove loading message
      dispatch({ 
        type: "SET_MESSAGES", 
        payload: state.messages.filter(msg => msg !== loadingMessage) 
      });
      
      // Format practice questions as a chat message
      let practiceContent = `<div class="practice-questions">
        <h3 class="text-lg font-medium mb-2">Bài tập luyện tập môn ${subject} lớp ${grade}${topic ? ` - ${topic}` : ''}</h3>`;
      
      // Add each question with a collapsible answer
      data.questions.forEach((q: any, index: number) => {
        // Kiểm tra xem có phải câu hỏi trắc nghiệm không
        const isMultipleChoice = /[A-D]\./.test(q.question) || /[A-D]\)/.test(q.question);
        
        // Format câu hỏi
        let formattedQuestion = q.question;
        
        // Tạo tiêu đề có các chữ cái A, B, C, D nếu là câu hỏi trắc nghiệm
        let questionTitle = "";
        if (isMultipleChoice) {
          // Tìm các lựa chọn A, B, C, D
          const optionMatches = q.question.match(/([A-D]\.|\([A-D]\)|[A-D]\))/g);
          if (optionMatches && optionMatches.length > 0) {
            // Lấy các chữ cái A, B, C, D từ các phần so khớp
            const optionLetters = optionMatches.map(match => match.match(/[A-D]/)[0]);
            // Tạo chuỗi chữ cái (VD: "A B C D")
            questionTitle = optionLetters.join(' ');
          } else {
            questionTitle = "A B C D"; // Mặc định nếu không tìm thấy
          }
        } else {
          // Nếu không phải trắc nghiệm thì lấy tiêu đề từ nội dung câu hỏi
          questionTitle = q.question.replace(/<[^>]*>/g, '').substring(0, 100) + 
                         (q.question.replace(/<[^>]*>/g, '').length > 100 ? '...' : '');
        }
        
        practiceContent += `
          <div class="practice-question mb-4">
            <div class="font-medium practice-question-title">
              Câu ${index + 1}: ${isMultipleChoice ? questionTitle : questionTitle}
            </div>
            <div class="practice-question-content my-2">
              ${q.question}
            </div>
            <div class="practice-answer" data-practice-id="${index}">
              <button class="text-blue-600 dark:text-blue-400 text-sm font-medium cursor-pointer practice-toggle" 
                      onclick="this.parentElement.classList.toggle('show-answer');this.textContent=this.parentElement.classList.contains('show-answer')?'Ẩn lời giải':'Xem lời giải'">
                Xem lời giải
              </button>
              <div class="practice-answer-content hidden">
                <div class="mt-2 border-l-4 border-green-500 pl-3 py-2">
                  <div class="font-medium text-blue-600 dark:text-blue-400 mb-1 text-sm">Đáp án:</div>
                  <div class="text-green-700 dark:text-green-300">${q.answer || 'Không có đáp án'}</div>
                </div>
                ${q.explanation ? `
                <div class="mt-2 border-l-4 border-amber-500 pl-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-r">
                  <div class="font-medium text-amber-600 dark:text-amber-400 mb-1 text-sm">Giải thích:</div>
                  <div>${q.explanation}</div>
                </div>
                ` : ''}
                <div class="mt-2 border-l-4 border-blue-500 pl-3 py-2">
                  <div class="font-medium text-blue-600 dark:text-blue-400 mb-1 text-sm">Câu hỏi đầy đủ:</div>
                  <div>${q.question}</div>
                </div>
              </div>
            </div>
          </div>`;
      });
      
      practiceContent += `</div>`;
      
      // Add message with practice questions to chat
      const practiceMessage: Message = {
        role: "assistant" as const,
        content: practiceContent,
        timestamp: new Date(),
        action: state.selectedAction,
      };
      
      dispatch({ type: "ADD_MESSAGE", payload: practiceMessage });
    } catch (error) {
      console.error("Error sending practice questions:", error);
      
      // Add error message to chat
      const errorMessage: Message = {
        role: "system" as const,
        content: `<p class="text-red-500">Không thể tạo bài tập luyện tập. Vui lòng thử lại sau.</p>`,
        timestamp: new Date(),
      };
      
      dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const contextValue: ChatContextProps = {
    state,
    dispatch,
    sendMessage,
    sendImage,
    clearMessages,
    toggleDarkMode,
    setSelectedAction,
    sendPracticeQuestions, // Add the new function
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
}

// Hook to use the chat context
export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
