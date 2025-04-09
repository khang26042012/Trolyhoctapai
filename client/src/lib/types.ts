import { Message } from "@shared/schema";

// Action types for the selected action by the user
export type ActionType = "complete" | "concise" | "hint" | null;

// Chat context state interface
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isDarkMode: boolean;
  selectedAction: ActionType;
}

// Chat context actions
export type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DARK_MODE"; payload: boolean }
  | { type: "SET_SELECTED_ACTION"; payload: ActionType };

// Props for the ChatContext provider
export interface ChatContextProps {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (content: string, action?: ActionType) => Promise<void>;
  sendImage: (imageData: string, extractedText: string) => Promise<void>;
  clearMessages: () => void;
  toggleDarkMode: () => void;
  setSelectedAction: (action: ActionType) => void;
  sendPracticeQuestions: (subject: string, grade: string, topic?: string) => Promise<void>;
}
