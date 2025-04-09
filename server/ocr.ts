import { createWorker } from "tesseract.js";

/**
 * Extract text from an image using Tesseract OCR
 * @param imageData Base64 encoded image data
 * @returns The extracted text
 */
export async function extractTextFromImage(imageData: string): Promise<string> {
  try {
    // Create a Tesseract worker
    const worker = await createWorker({
      logger: process.env.NODE_ENV === 'development',
    });

    // Load the Vietnamese language pack (if not already downloaded)
    await worker.loadLanguage("vie+eng");
    await worker.initialize("vie+eng");
    
    // Set recognition parameters for better results with formulas
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/=(){}[]<>.,;:!?'\"\\|&^%$#@~`_",
      preserve_interword_spaces: "1",
    });

    // Perform OCR on the image
    const { data } = await worker.recognize(imageData);
    
    // Terminate the worker to free up resources
    await worker.terminate();

    // Process the extracted text if needed
    let extractedText = data.text.trim();
    
    // If text is too short or empty, return appropriate message
    if (!extractedText || extractedText.length < 3) {
      return "Không thể trích xuất văn bản từ hình ảnh này. Vui lòng thử lại với ảnh rõ hơn.";
    }

    return extractedText;
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error(`Failed to extract text from image: ${(error as Error).message}`);
  }
}
