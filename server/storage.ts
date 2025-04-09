import { 
  Message,
  messages,
  insertMessageSchema,
  type InsertMessage
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  saveMessage(message: Partial<Message>): Promise<Message>;
  getMessages(): Promise<Message[]>;
  clearMessages(): Promise<void>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private messages: Map<number, Message>;
  private currentId: number;

  constructor() {
    this.messages = new Map();
    this.currentId = 1;
  }

  async saveMessage(messageData: Partial<Message>): Promise<Message> {
    // Validate the message data
    try {
      // Parse the message data through the insert schema
      const validData = insertMessageSchema.parse({
        role: messageData.role,
        content: messageData.content,
        action: messageData.action,
        imageData: messageData.imageData,
        extractedText: messageData.extractedText,
      });

      const id = this.currentId++;
      const timestamp = messageData.timestamp || new Date();
      
      // Create the full message
      const message: Message = {
        id,
        ...validData,
        timestamp,
      };

      // Save to memory
      this.messages.set(id, message);
      return message;
    } catch (error) {
      console.error("Error validating message data:", error);
      throw new Error("Invalid message data");
    }
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });
  }

  async clearMessages(): Promise<void> {
    this.messages.clear();
  }
}

// Create and export the storage instance
export const storage = new MemStorage();
