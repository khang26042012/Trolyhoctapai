import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";

interface QuickPracticeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickPracticeDialog({
  isOpen,
  onOpenChange,
}: QuickPracticeDialogProps) {
  const { sendPracticeQuestions } = useChatContext();
  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState("10");
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Danh sách môn học
  const subjects = [
    "Toán", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", 
    "Lịch sử", "Địa lý", "Tiếng Anh", "Giáo dục công dân"
  ];
  
  // Danh sách lớp
  const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  
  const handleSendPracticeQuestions = async () => {
    setIsLoading(true);
    
    try {
      await sendPracticeQuestions(subject, grade, topic.trim() || undefined);
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending practice questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo bài tập luyện tập</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="subject">Môn học</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
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
                    <SelectItem key={g} value={g}>Lớp {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="topic">Chủ đề (tùy chọn)</Label>
            <Input
              id="topic"
              placeholder="Ví dụ: Hàm số, Phương trình bậc 2..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSendPracticeQuestions}
            disabled={isLoading || !subject || !grade}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo bài tập"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}