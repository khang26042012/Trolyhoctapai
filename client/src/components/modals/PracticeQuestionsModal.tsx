import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Interface cho câu hỏi luyện tập
interface PracticeQuestion {
  question: string;
  answer?: string;
  explanation?: string;
}

interface PracticeQuestionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PracticeQuestionsModal({
  isOpen,
  onOpenChange,
}: PracticeQuestionsModalProps) {
  // State quản lý dữ liệu nhập
  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState("10");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(3);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  
  // State quản lý kết quả và quá trình tải
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Danh sách môn học
  const subjects = [
    "Toán", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", 
    "Lịch sử", "Địa lý", "Tiếng Anh", "Giáo dục công dân"
  ];
  
  // Danh sách lớp
  const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  
  // Hàm xử lý tạo câu hỏi
  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          grade,
          topic: topic.trim() || undefined,
          count,
          includeAnswers,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Đã xảy ra lỗi khi tạo câu hỏi.");
        return;
      }
      
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error generating practice questions:", error);
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset form khi đóng modal
  const handleClose = () => {
    // Chờ một chút trước khi reset để tránh hiệu ứng giật
    setTimeout(() => {
      setQuestions([]);
      setError(null);
    }, 300);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Tạo đề luyện tập</DialogTitle>
          <DialogDescription>
            Chọn môn học và cấp độ để tạo đề luyện tập phù hợp.
          </DialogDescription>
        </DialogHeader>
        
        {/* Form tạo đề */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="subject">Môn học</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn môn học" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="grade">Lớp</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
                    Lớp {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="topic">Chủ đề (tùy chọn)</Label>
            <Input
              id="topic"
              placeholder="Ví dụ: Hàm số, Phương trình bậc 2, Nguyên hàm..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="count">Số lượng câu hỏi</Label>
            <Select 
              value={count.toString()} 
              onValueChange={(val) => setCount(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Số câu hỏi" />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 7, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} câu
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 justify-start">
            <input
              type="checkbox"
              id="includeAnswers"
              className="h-4 w-4"
              checked={includeAnswers}
              onChange={(e) => setIncludeAnswers(e.target.checked)}
            />
            <Label htmlFor="includeAnswers" className="text-sm cursor-pointer">
              Bao gồm đáp án và giải thích
            </Label>
          </div>
        </div>
        
        {/* Nút tạo đề */}
        <div className="flex justify-center">
          <Button
            onClick={handleGenerateQuestions}
            disabled={isLoading || !subject || !grade}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo đề...
              </>
            ) : (
              "Tạo đề luyện tập"
            )}
          </Button>
        </div>
        
        {/* Hiển thị lỗi */}
        {error && (
          <div className="text-red-500 text-center">
            {error}
          </div>
        )}
        
        {/* Hiển thị kết quả */}
        {questions.length > 0 && (
          <div className="mt-4 border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-lg font-medium mb-2">
              Đề luyện tập {subject} Lớp {grade}
              {topic && ` - ${topic}`}
            </h3>
            
            <Accordion type="single" collapsible className="w-full">
              {questions.map((q, index) => (
                <AccordionItem key={index} value={index.toString()}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">
                      Câu {index + 1}: {q.question.length > 100 ? q.question.substring(0, 100) + "..." : q.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <div dangerouslySetInnerHTML={{ __html: q.question }} />
                      
                      {includeAnswers && q.answer && (
                        <div className="mt-2">
                          <div className="font-medium text-blue-600 dark:text-blue-400">
                            Đáp án:
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: q.answer }} />
                        </div>
                      )}
                      
                      {includeAnswers && q.explanation && (
                        <div className="mt-2">
                          <div className="font-medium text-green-600 dark:text-green-400">
                            Giải thích:
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}