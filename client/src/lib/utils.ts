import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Setup dayjs to use Vietnamese locale and timezone
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

// Utility function to combine Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date to Vietnamese time format (HH:mm)
export function formatVietnamTime(date: Date | string | number | undefined): string {
  if (!date) return "";
  return dayjs(date).format("HH:mm");
}

// Auto-resize a textarea element
export function autoResizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

// Extract LaTeX from a string and wrap in appropriate delimiters
export function processLatexInText(text: string): string {
  // Match inline LaTeX: $...$
  let processed = text.replace(/\$([^$]+)\$/g, "\\($1\\)");
  
  // Match block LaTeX: $$...$$
  processed = processed.replace(/\$\$([^$]+)\$\$/g, "\\[$1\\]");
  
  return processed;
}

// Generate a system prompt based on the selected action
export function generateSystemPrompt(action: string | null | undefined): string {
  const basePrompt = "Bạn là trợ lý học tập AI bằng tiếng Việt. Hãy trả lời câu hỏi của người dùng một cách chính xác, đầy đủ và dễ hiểu. Sử dụng định dạng LaTeX cho các công thức toán học khi cần thiết. ";
  
  switch (action) {
    case "complete":
      return basePrompt + "Hãy giải bài tập đầy đủ với các bước chi tiết và giải thích rõ ràng.";
    case "concise":
      return basePrompt + "Hãy giải bài tập một cách ngắn gọn, tập trung vào các bước chính và đáp án.";
    case "hint":
      return basePrompt + "Chỉ đưa ra gợi ý để người dùng tự giải bài tập, không đưa ra đáp án hoặc lời giải đầy đủ.";
    default:
      return basePrompt + "Trả lời dựa trên kiến thức của bạn về các môn học ở mọi cấp độ.";
  }
}

// API request function
export async function apiRequest<T>(
  method: string,
  url: string,
  data?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText || response.statusText}`);
  }

  return response.json() as Promise<T>;
}
