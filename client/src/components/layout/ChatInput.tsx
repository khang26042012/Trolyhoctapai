import React, { useRef, useState, useEffect } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Send, X } from "lucide-react";
import { autoResizeTextarea } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ChatInputProps {
  onImageUpload: (file: File) => void;
}

export function ChatInput({ onImageUpload }: ChatInputProps) {
  const { sendMessage, state } = useChatContext();
  const { isLoading, selectedAction } = state;
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      autoResizeTextarea(textareaRef.current);
    }
  };

  // Handle message submission
  const handleSubmit = async () => {
    if (input.trim() && !isLoading) {
      await sendMessage(input.trim());
      setInput("");
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Handle Enter key press (submit on Enter, but allow Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Open file input dialog
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
      <div className="max-w-4xl mx-auto relative">
        <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition">
          {/* Image Upload Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={handleImageClick}
            disabled={isLoading}
            title="Tải ảnh lên"
            aria-label="Tải ảnh lên"
          >
            <Image className="h-5 w-5" />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </Button>

          {/* Text Input */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập bài tập của bạn ở đây..."
            disabled={isLoading}
            className="block w-full px-3 py-2 bg-transparent border-0 resize-none focus:ring-0 focus:outline-none dark:text-white min-h-[40px] max-h-[200px]"
            rows={1}
          />

          {/* Send Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Gửi"
            aria-label="Gửi tin nhắn"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
