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
 * @returns The AI-generated response
 */
export async function generateAIResponse(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    // Include the system prompt in the conversation history if provided
    const chat = model.startChat({
      history: systemPrompt
        ? [
            {
              role: "user",
              parts: [{ text: "Bạn là ai?" }],
            },
            {
              role: "model",
              parts: [{ text: systemPrompt }],
            },
          ]
        : [],
      generationConfig: {
        maxOutputTokens: 8192,
      },
    });

    // Send the user's message to the AI
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const responseText = response.text();

    // Process the response to ensure compatibility with HTML rendering
    // Convert any LaTeX to compatible format, etc.
    const processedResponse = processResponse(responseText);

    return processedResponse;
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
