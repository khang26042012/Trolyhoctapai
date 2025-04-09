import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize the Google Generative AI client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  
  // Create a new instance with API key
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
    
    // For image-based prompts, use the multimodal model (1.5 pro)
    if (imageData) {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro", // Using newer model for multimodal content
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
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

      // Create a chat session
      const chat = model.startChat({
        history: [],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      // Generate content with text and image
      const result = await chat.sendMessage([promptText, imagePart]);
      const responseText = result.response.text();
      
      // Process the response to ensure compatibility with HTML rendering
      return processResponse(responseText);
    } 
    // For text-only prompts, use the text model
    else {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro", // Using newer model for better results
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      // Combine system prompt with user prompt if available
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;

      // Create a chat session
      const chat = model.startChat({
        history: [],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      // Generate content with just text
      const result = await chat.sendMessage(fullPrompt);
      const responseText = result.response.text();

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

// List of difficult scientific/academic terms in Vietnamese that might need explanation
const difficultTerms = [
  // Math terms
  { term: "hiện tượng cảm ứng từ", pattern: /\b(hiện\s*tượng\s*cảm\s*ứng\s*từ)\b/gi },
  { term: "nguyên hàm", pattern: /\b(nguyên\s*hàm)\b/gi },
  { term: "tích phân", pattern: /\b(tích\s*phân)\b/gi },
  { term: "đạo hàm", pattern: /\b(đạo\s*hàm)\b/gi },
  { term: "vi phân", pattern: /\b(vi\s*phân)\b/gi },
  { term: "hàm số", pattern: /\b(hàm\s*số)\b/gi },
  { term: "phương trình vi phân", pattern: /\b(phương\s*trình\s*vi\s*phân)\b/gi },
  { term: "chuỗi số", pattern: /\b(chuỗi\s*số)\b/gi },
  { term: "số phức", pattern: /\b(số\s*phức)\b/gi },
  { term: "lý thuyết tập hợp", pattern: /\b(lý\s*thuyết\s*tập\s*hợp)\b/gi },
  
  // Physics terms
  { term: "động lượng", pattern: /\b(động\s*lượng)\b/gi },
  { term: "điện từ trường", pattern: /\b(điện\s*từ\s*trường)\b/gi },
  { term: "quang học", pattern: /\b(quang\s*học)\b/gi },
  { term: "cơ học lượng tử", pattern: /\b(cơ\s*học\s*lượng\s*tử)\b/gi },
  { term: "thuyết tương đối", pattern: /\b(thuyết\s*tương\s*đối)\b/gi },
  { term: "nhiệt động học", pattern: /\b(nhiệt\s*động\s*học)\b/gi },
  { term: "điện dung", pattern: /\b(điện\s*dung)\b/gi },
  
  // Chemistry terms
  { term: "phản ứng oxy hóa khử", pattern: /\b(phản\s*ứng\s*oxy\s*hóa\s*khử)\b/gi },
  { term: "nguyên tố", pattern: /\b(nguyên\s*tố)\b/gi },
  { term: "phân tử", pattern: /\b(phân\s*tử)\b/gi },
  { term: "liên kết hóa học", pattern: /\b(liên\s*kết\s*hóa\s*học)\b/gi },
  { term: "hợp chất hữu cơ", pattern: /\b(hợp\s*chất\s*hữu\s*cơ)\b/gi },
  
  // Biology terms
  { term: "quang hợp", pattern: /\b(quang\s*hợp)\b/gi },
  { term: "tế bào", pattern: /\b(tế\s*bào)\b/gi },
  { term: "ADN", pattern: /\b(ADN|adn)\b/gi },
  { term: "ARN", pattern: /\b(ARN|arn)\b/gi },
  { term: "đột biến gen", pattern: /\b(đột\s*biến\s*gen)\b/gi },
  { term: "protein", pattern: /\b(protein)\b/gi },
];

/**
 * Process the AI response to ensure it's properly formatted for display
 * - Convert line breaks to <br> tags
 * - Ensure LaTeX is properly formatted
 * - Handle other formatting needs
 * - Add term explanation functionality
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

  // Process list markers before splitting paragraphs
  // Find paragraphs that look like lists (consecutive lines starting with * or -)
  const listPattern = /^(?:\s*[\*\-]\s+.+\n?)+$/gm;
  processed = processed.replace(listPattern, (listBlock) => {
    // Convert each list item to HTML
    const htmlList = listBlock
      .split('\n')
      .filter(line => /^\s*[\*\-]\s+.+/.test(line)) // Keep only valid list items
      .map(line => {
        const content = line.replace(/^\s*[\*\-]\s+/, '');
        return `<li>${content}</li>`;
      })
      .join('');
    
    return `<ul>${htmlList}</ul>`;
  });

  // Convert line breaks to <br> tags and wrap paragraphs with <p> tags
  // But don't wrap HTML elements that should be at block level
  const paragraphs = processed.split("\n\n").map(para => {
    // Skip wrapping for HTML block elements
    if (para.trim().startsWith("<ul") || 
        para.trim().startsWith("<ol") ||
        para.trim().startsWith("<div") ||
        para.trim().startsWith("<h") ||
        para.trim().startsWith("<table")) {
      return para;
    }
    let wrappedPara = `<p>${para.replace(/\n/g, "<br>")}</p>`;
    
    // Add explanation tooltips for difficult terms
    difficultTerms.forEach(({ term, pattern }) => {
      wrappedPara = wrappedPara.replace(pattern, (match) => {
        return `<span class="term-explanation" data-term="${term}">${match}</span>`;
      });
    });
    
    return wrappedPara;
  });

  return paragraphs.join("\n\n");
}
