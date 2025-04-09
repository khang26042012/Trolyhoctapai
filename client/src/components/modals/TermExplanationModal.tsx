import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/utils";

interface TermExplanationModalProps {
  term: string;
  children: React.ReactNode;
}

export function TermExplanationModal({ term, children }: TermExplanationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchExplanation = async () => {
    if (explanation) return; // Don't fetch again if already have explanation
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      const systemPrompt = "Bạn là một trợ lý giáo dục giỏi về giải thích ngắn gọn các thuật ngữ. " + 
        "Hãy giải thích thuật ngữ này một cách ngắn gọn (dưới 100 từ), rõ ràng và dễ hiểu cho học sinh. " +
        "Đưa ra ví dụ minh họa nếu cần. Chỉ giải thích thuật ngữ, không thêm thông tin khác.";
      
      const response = await apiRequest<{ explanation: string }>(
        "POST", 
        "/api/explain", 
        {
          term,
          systemPrompt,
        }
      );
      
      setExplanation(response.explanation);
    } catch (error) {
      console.error("Error fetching explanation:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchExplanation();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <span className="cursor-help border-b border-dotted border-blue-500 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          {children}
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{term}</DialogTitle>
          <DialogDescription>
            Giải thích đơn giản về thuật ngữ này.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          {isLoading && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-500">Đang tìm giải thích...</span>
            </div>
          )}
          
          {hasError && (
            <div className="text-center text-red-500 py-4">
              <p>Không thể tìm được giải thích. Vui lòng thử lại sau.</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setHasError(false);
                  fetchExplanation();
                }}
              >
                Thử lại
              </Button>
            </div>
          )}
          
          {!isLoading && !hasError && explanation && (
            <div 
              className="prose dark:prose-invert" 
              dangerouslySetInnerHTML={{ __html: explanation }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}