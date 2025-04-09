import React, { useEffect, useRef, useState } from "react";
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
    const mathJax = (window as any).MathJax;
    if (mathJax) {
      mathJax.typesetPromise?.();
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
              <div className="flex flex-col">
                {state.selectedAction && (
                  <div className={`text-xs mb-1.5 px-1.5 py-0.5 rounded inline-block ${
                    state.selectedAction === "complete" 
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                      : state.selectedAction === "concise"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  }`}>
                    <span className="font-semibold">Chế độ:</span> {state.selectedAction === "complete" ? "Giải đầy đủ" : 
                      state.selectedAction === "concise" ? "Giải rút gọn" : 
                      state.selectedAction === "hint" ? "Gợi ý" : ""}
                  </div>
                )}
                <div className="flex items-center">
                  <div className="typing-indicator mr-1">đang viết</div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75 mx-0.5"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                </div>
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
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Hỗ trợ hiển thị giải thích từ vựng mà không cần dùng TermExplanationModal
  // Đơn giản hóa bằng cách thêm tooltip thay vì modal
  useEffect(() => {
    // Skip processing for user messages
    if (isUser || !contentRef.current) return;
    
    // Find all term explanation elements
    const termElements = contentRef.current.querySelectorAll('.term-explanation');
    
    // Process each one
    termElements.forEach(el => {
      const term = el.getAttribute('data-term');
      if (!term) return;
      
      // Add styling and tooltip functionality directly 
      el.classList.add(
        'cursor-help',
        'border-b',
        'border-dotted',
        'border-blue-500', 
        'text-blue-600', 
        'dark:text-blue-400', 
        'hover:text-blue-800', 
        'dark:hover:text-blue-300',
        'relative'
      );
      
      // Biến để theo dõi trạng thái giải thích
      let explanationPopup: HTMLDivElement | null = null;
      
      // Add tooltip behavior
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Xóa popup trước đó nếu có
        if (explanationPopup) {
          explanationPopup.remove();
          explanationPopup = null;
        }
        
        // Tạo popup giải thích
        explanationPopup = document.createElement('div');
        explanationPopup.className = 
          'term-explanation-popup absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ' +
          'rounded-lg shadow-lg p-3 max-w-sm text-sm';
        
        // Vị trí của popup (mặc định là bên dưới phần tử)
        const rect = el.getBoundingClientRect();
        explanationPopup.style.position = 'fixed';
        explanationPopup.style.top = `${rect.bottom + window.scrollY + 8}px`;
        explanationPopup.style.left = `${rect.left + window.scrollX}px`;
        explanationPopup.style.maxWidth = '300px';
        
        // Thêm tiêu đề
        const titleEl = document.createElement('div');
        titleEl.className = 'font-bold text-blue-600 dark:text-blue-400 mb-2 flex justify-between items-center';
        titleEl.innerHTML = `<span>${term}</span>`;
        
        // Nút đóng
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.className = 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-lg font-bold';
        closeButton.onclick = () => {
          if (explanationPopup) {
            explanationPopup.remove();
            explanationPopup = null;
          }
        };
        titleEl.appendChild(closeButton);
        
        explanationPopup.appendChild(titleEl);
        
        // Thêm nội dung loading
        const contentEl = document.createElement('div');
        contentEl.className = 'text-gray-700 dark:text-gray-300';
        contentEl.innerHTML = 'Đang tải giải thích...';
        explanationPopup.appendChild(contentEl);
        
        // Thêm vào body
        document.body.appendChild(explanationPopup);
        
        // Khiến popup đóng khi click ra ngoài
        const handleClickOutside = (event: MouseEvent) => {
          if (explanationPopup && !explanationPopup.contains(event.target as Node) && !el.contains(event.target as Node)) {
            explanationPopup.remove();
            explanationPopup = null;
            document.removeEventListener('click', handleClickOutside);
          }
        };
        
        // Set timeout để tránh đóng ngay lập tức
        setTimeout(() => {
          document.addEventListener('click', handleClickOutside);
        }, 100);
        
        try {
          const response = await fetch('/api/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              term,
              systemPrompt: "Giải thích ngắn gọn thuật ngữ này (dưới 100 từ)"
            })
          });
          
          if (response.ok && explanationPopup) {
            const data = await response.json();
            contentEl.innerHTML = data.explanation;
          } else if (explanationPopup) {
            contentEl.innerHTML = `Không thể tìm giải thích cho "${term}"`;
          }
        } catch (error) {
          console.error('Error fetching explanation:', error);
          if (explanationPopup) {
            contentEl.innerHTML = `Lỗi khi tìm giải thích cho "${term}"`;
          }
        }
      });
    });
  }, [isUser, message.content]);

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
          
          {/* Use dangerouslySetInnerHTML to render HTML content with ref to access for post-processing */}
          <div 
            ref={contentRef}
            className="message-content" 
            dangerouslySetInnerHTML={{ __html: message.content }} 
          />
        </div>
        <div className={`flex text-xs mt-1 ${isUser ? "justify-end" : "justify-start"}`}>
          <span className={`text-gray-500 ${isUser ? "mr-1" : "ml-1"}`}>
            {formatVietnamTime(message.timestamp)}
          </span>
          
          {/* Hiển thị nhãn chế độ nếu là tin nhắn AI và có action */}
          {!isUser && message.action && (
            <span className={`ml-3 px-1.5 py-0.5 rounded text-xs ${
              message.action === "complete" 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                : message.action === "concise"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
            }`}>
              <span className="font-semibold">Chế độ:</span> {message.action === "complete" ? "Giải đầy đủ" : 
               message.action === "concise" ? "Giải rút gọn" : "Gợi ý"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
