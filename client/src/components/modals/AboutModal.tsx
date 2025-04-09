import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Giới thiệu về Trợ Lý Học Tập AI</DialogTitle>
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
        <DialogDescription className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Trợ Lý Học Tập AI là một công cụ hỗ trợ học tập thông minh bằng tiếng Việt, được phát triển để giúp học sinh và sinh viên giải quyết các bài tập một cách hiệu quả.
          </p>
          <p>
            Ứng dụng sử dụng Google Gemini Pro - một trong những mô hình AI mạnh mẽ nhất hiện nay kết hợp với công nghệ nhận diện hình ảnh OCR để xử lý bài tập từ văn bản và hình ảnh.
          </p>
          <h4 className="font-bold mt-4">Tính năng chính:</h4>
          <ul className="list-disc pl-5">
            <li>Giải bài tập đầy đủ với các bước chi tiết</li>
            <li>Giải bài tập rút gọn cho những ai cần đáp án nhanh</li>
            <li>Gợi ý hướng làm để phát triển tư duy</li>
            <li>Giải bài tập từ hình ảnh bằng công nghệ OCR</li>
          </ul>
          <p className="mt-4">Mọi góp ý vui lòng liên hệ qua email: support@trolyhoctap.ai</p>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
