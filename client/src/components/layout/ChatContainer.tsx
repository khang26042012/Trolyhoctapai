import React, { useEffect, useRef } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { Message } from "@shared/schema";
import { formatVietnamTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatContainer() {
  const { state } = useChatContext();
  const { messages, isLoading } = state;
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom when new messages are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Process LaTeX equations when messages change
  useEffect(() => {
    // If MathJax is available, typeset the content
    if (window.MathJax) {
      window.MathJax.typesetPromise?.();
    }
  }, [messages]);

  return (
    <main
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
    >
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-start space-x-2 mb-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              AI
            </div>
          </div>
          <div className="flex flex-col max-w-[85%] sm:max-w-[70%]">
            <div className="bg-blue-100 dark:bg-blue-900 text-gray-800 dark:text-white p-3 rounded-lg rounded-tl-none">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "flex-row-reverse" : ""} items-start ${isUser ? "space-x-reverse" : ""} space-x-2 mb-4`}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold">
            Bạn
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            AI
          </div>
        )}
      </div>
      <div
        className={`flex flex-col ${isUser ? "items-end" : ""} max-w-[85%] sm:max-w-[70%]`}
      >
        <div
          className={`${
            isUser
              ? "bg-gray-200 dark:bg-gray-700"
              : "bg-blue-100 dark:bg-blue-900 text-gray-800 dark:text-white"
          } p-3 rounded-lg ${isUser ? "rounded-tr-none" : "rounded-tl-none"}`}
        >
          {message.imageData && (
            <div className="mb-2">
              <img
                src={message.imageData}
                alt="Uploaded"
                className="max-h-60 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
          )}
          
          {/* Use dangerouslySetInnerHTML to render HTML content (including LaTeX) */}
          <div dangerouslySetInnerHTML={{ __html: message.content }} />
        </div>
        <span
          className={`text-xs text-gray-500 mt-1 ${isUser ? "mr-1" : "ml-1"}`}
        >
          {formatVietnamTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
