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
import { Loader2, X } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  isProcessing: boolean;
  extractedText: string;
  onSendImage: () => void;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  isProcessing,
  extractedText,
  onSendImage,
}: ImagePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Xác nhận hình ảnh</DialogTitle>
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
              {isProcessing ? "Đang trích xuất văn bản..." : "Nội dung trích xuất:"}
            </p>
            <div className={`w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-h-40 overflow-y-auto ${extractedText ? "border border-green-500" : ""}`}>
              {isProcessing ? (
                <div className="flex justify-center items-center py-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <p className="text-gray-800 dark:text-gray-200">{extractedText || "Không thể trích xuất văn bản. Vui lòng thử lại với ảnh rõ hơn."}</p>
              )}
            </div>
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
              onClick={onSendImage}
              disabled={isProcessing || !extractedText}
            >
              Gửi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
