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
  isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  selectedAction: null,
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

  // Effect to load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode !== null) {
      dispatch({ type: "SET_DARK_MODE", payload: savedDarkMode === "true" });
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

  // Function to send an image to be processed by OCR
  const sendImage = async (imageData: string, extractedText: string) => {
    const userMessage: Message = {
      role: "user",
      content: extractedText,
      timestamp: new Date(),
      imageData,
      extractedText,
      action: state.selectedAction,
    };

    dispatch({ type: "ADD_MESSAGE", payload: userMessage });
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const systemPrompt = generateSystemPrompt(state.selectedAction);
      
      const response = await apiRequest<Message>("POST", "/api/ocr", {
        imageData,
        extractedText,
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

  const contextValue: ChatContextProps = {
    state,
    dispatch,
    sendMessage,
    sendImage,
    clearMessages,
    toggleDarkMode,
    setSelectedAction,
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
