import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  isProcessing: boolean;
  extractedText?: string;
  onSendImage: () => void;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  isProcessing,
  onSendImage,
}: ImagePreviewModalProps) {
  // Local state for user-entered text about the image
  const [userText, setUserText] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Xác nhận hình ảnh</DialogTitle>
          <DialogDescription>
            Hãy nhập câu hỏi hoặc yêu cầu về bài tập trong hình ảnh này.
          </DialogDescription>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="max-h-60 rounded border border-gray-300 dark:border-gray-600"
            />
          )}
          <div className="w-full space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Câu hỏi của bạn:
            </p>
            <Textarea
              placeholder="Vui lòng giải bài tập trong hình ảnh này..."
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg min-h-20"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
            />
          </div>
          <div className="flex space-x-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                // Update parent component state with user text
                window.localStorage.setItem('userImageText', userText);
                onSendImage();
              }}
              disabled={isProcessing}
            >
              Gửi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
