import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  // For text-only prompts, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent("Write a hello world program in JavaScript.");
  const response = await result.response;
  const text = response.text();
  console.log(text);
}

run().catch(console.error);

// For multimodal prompts (text+images), use the gemini-pro-vision model
async function fileToGenerativePart(path, mimeType) {
  // Skip implementation for example
  return "";
}

async function runVision() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const imageParts = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: "...base64 encoded image data..."
      }
    }
  ];

  const prompt = "Describe what's in this image";

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}
