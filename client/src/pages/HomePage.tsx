import React, { useState } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatHeader } from "@/components/layout/ChatHeader";
import { ChatContainer } from "@/components/layout/ChatContainer";
import { ActionButtons } from "@/components/layout/ActionButtons";
import { ChatInput } from "@/components/layout/ChatInput";
import { AboutModal } from "@/components/modals/AboutModal";
import { ImagePreviewModal } from "@/components/modals/ImagePreviewModal";
import { QuickPracticeDialog } from "@/components/modals/QuickPracticeDialog";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { sendImage } = useChatContext();
  const { toast } = useToast();
  
  // Modal states
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  
  // Image processing states
  const [imageUrl, setImageUrl] = useState("");
  const [imageData, setImageData] = useState("");
  const [userText, setUserText] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  // Handle image upload
  const handleImageUpload = async (file: File) => {
    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn một tệp hình ảnh.",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước tệp không được vượt quá 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create a preview URL
      const fileUrl = URL.createObjectURL(file);
      setImageUrl(fileUrl);
      setIsImagePreviewOpen(true);
      setIsProcessingImage(false); // No processing needed
      setUserText("");
      
      // Convert the file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        setImageData(base64Image);
      };
    } catch (error) {
      console.error("Image processing error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xử lý hình ảnh. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };
  
  // Handle sending the image with user text
  const handleSendImage = () => {
    if (imageUrl && imageData) {
      // Get the user text from localStorage (set by the modal)
      const storedUserText = window.localStorage.getItem('userImageText') || "";
      sendImage(imageData, storedUserText || "Vui lòng giải bài tập trong hình ảnh này.");
      // Clear localStorage after using it
      window.localStorage.removeItem('userImageText');
      closeImagePreview();
    }
  };
  
  // Close the image preview modal
  const closeImagePreview = () => {
    setIsImagePreviewOpen(false);
    setImageUrl("");
    setImageData("");
    setUserText("");
    setIsProcessingImage(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <ChatHeader 
        onAboutOpen={() => setIsAboutOpen(true)} 
        onPracticeOpen={() => setIsPracticeOpen(true)}
      />
      <ChatContainer />
      <ActionButtons />
      <ChatInput onImageUpload={handleImageUpload} />
      
      {/* Modals */}
      <AboutModal 
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
      <ImagePreviewModal
        isOpen={isImagePreviewOpen}
        onClose={closeImagePreview}
        imageUrl={imageUrl}
        isProcessing={isProcessingImage}
        onSendImage={handleSendImage}
      />
      <QuickPracticeDialog
        isOpen={isPracticeOpen}
        onOpenChange={setIsPracticeOpen}
      />
    </div>
  );
}
