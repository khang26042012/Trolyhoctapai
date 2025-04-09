import React from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Info, Trash2, Moon, Sun, BookOpen } from "lucide-react";

interface ChatHeaderProps {
  onAboutOpen: () => void;
  onPracticeOpen: () => void;
}

export function ChatHeader({ onAboutOpen, onPracticeOpen }: ChatHeaderProps) {
  const { clearMessages, toggleDarkMode, state } = useChatContext();
  const { isDarkMode } = state;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
          AI
        </div>
        <h1 className="text-lg font-bold">Trợ Lý Học Tập AI</h1>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPracticeOpen}
          title="Tạo đề luyện tập"
          aria-label="Tạo đề luyện tập tự động"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <BookOpen className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAboutOpen}
          title="Giới thiệu"
          aria-label="Giới thiệu về website"
        >
          <Info className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearMessages}
          title="Xóa tất cả"
          aria-label="Xóa tất cả tin nhắn"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title={isDarkMode ? "Chế độ sáng" : "Chế độ tối"}
          aria-label={isDarkMode ? "Bật chế độ sáng" : "Bật chế độ tối"}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}
