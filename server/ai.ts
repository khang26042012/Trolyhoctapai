import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Generate an AI response using Google's Gemini Pro model
 * @param prompt The user's message/question
 * @param systemPrompt The system prompt that guides the AI's behavior
 * @param imageData Optional base64 image data to include with the prompt
 * @returns The AI-generated response
 */
export async function generateAIResponse(
  prompt: string,
  systemPrompt?: string,
  imageData?: string
): Promise<string> {
  try {
    const genAI = getGeminiClient();
    
    // For image-based prompts, use the multimodal model
    if (imageData) {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro-vision", // Using vision model for images
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      // Create image part from the base64 data
      const imageDataClean = imageData.replace(/^data:image\/\w+;base64,/, "");
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageDataClean
        }
      };

      // Create prompt text with the system prompt if available
      const promptText = systemPrompt 
        ? `${systemPrompt}\n\n${prompt || "Vui lòng giải bài tập trong hình ảnh này."}`
        : (prompt || "Vui lòng giải bài tập trong hình ảnh này.");

      // Generate content with text and image
      const result = await model.generateContent([promptText, imagePart]);
      const response = await result.response;
      const responseText = response.text();
      
      // Process the response to ensure compatibility with HTML rendering
      return processResponse(responseText);
    } 
    // For text-only prompts, use the text model
    else {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro", // Using standard text model
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      // Combine system prompt with user prompt if available
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;

      // Generate content with just text
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const responseText = response.text();

      // Process the response to ensure compatibility with HTML rendering
      return processResponse(responseText);
    }
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error(
      `Failed to generate AI response: ${(error as Error).message}`
    );
  }
}

/**
 * Process the AI response to ensure it's properly formatted for display
 * - Convert line breaks to <br> tags
 * - Ensure LaTeX is properly formatted
 * - Handle any other formatting needs
 */
function processResponse(text: string): string {
  // Basic processing
  let processed = text
    // Replace four or more newlines with three (to avoid excessive spacing)
    .replace(/\n{4,}/g, "\n\n\n")
    // Make sure all LaTeX is properly formatted for MathJax
    .replace(/\$([^$]+)\$/g, "\\($1\\)")
    .replace(/\$\$([^$]+)\$\$/g, "\\[$1\\]");

  // Convert mentions of common mathematical/physical constants to LaTeX
  processed = processed
    .replace(/\b(sin|cos|tan|log|ln)\b/g, "\\($1\\)")
    .replace(/\b(π|theta|alpha|beta|gamma|delta)\b/g, "\\($1\\)");

  // Convert line breaks to <br> tags and wrap paragraphs with <p> tags
  // This is a simplified approach, a more robust HTML parser would be better
  const paragraphs = processed.split("\n\n").map(para => {
    if (para.trim().startsWith("<")) {
      // Assume it's already HTML, don't wrap in <p>
      return para;
    }
    return `<p>${para.replace(/\n/g, "<br>")}</p>`;
  });

  return paragraphs.join("\n\n");
}
