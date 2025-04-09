import React, { useState } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatHeader } from "@/components/layout/ChatHeader";
import { ChatContainer } from "@/components/layout/ChatContainer";
import { ActionButtons } from "@/components/layout/ActionButtons";
import { ChatInput } from "@/components/layout/ChatInput";
import { AboutModal } from "@/components/modals/AboutModal";
import { ImagePreviewModal } from "@/components/modals/ImagePreviewModal";
import { apiRequest } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { sendImage } = useChatContext();
  const { toast } = useToast();
  
  // Modal states
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  
  // Image processing states
  const [imageUrl, setImageUrl] = useState("");
  const [extractedText, setExtractedText] = useState("");
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
      setIsProcessingImage(true);
      setExtractedText("");
      
      // Convert the file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        // Send the image to the server for OCR processing
        try {
          const response = await apiRequest<{ text: string }>(
            "POST",
            "/api/ocr/extract",
            { image: base64Image }
          );
          
          setExtractedText(response.text);
        } catch (error) {
          console.error("OCR processing error:", error);
          toast({
            title: "Lỗi trích xuất văn bản",
            description: "Không thể trích xuất văn bản từ hình ảnh. Vui lòng thử lại với ảnh rõ hơn.",
            variant: "destructive",
          });
        } finally {
          setIsProcessingImage(false);
        }
      };
    } catch (error) {
      console.error("Image processing error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xử lý hình ảnh. Vui lòng thử lại.",
        variant: "destructive",
      });
      setIsProcessingImage(false);
    }
  };
  
  // Handle sending the image with extracted text
  const handleSendImage = () => {
    if (imageUrl && extractedText) {
      sendImage(imageUrl, extractedText);
      closeImagePreview();
    }
  };
  
  // Close the image preview modal
  const closeImagePreview = () => {
    setIsImagePreviewOpen(false);
    setImageUrl("");
    setExtractedText("");
    setIsProcessingImage(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <ChatHeader onAboutOpen={() => setIsAboutOpen(true)} />
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
        extractedText={extractedText}
        onSendImage={handleSendImage}
      />
    </div>
  );
}
