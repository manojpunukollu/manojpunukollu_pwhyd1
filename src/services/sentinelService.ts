import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ActionItem {
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: "MEDICAL" | "ENVIRONMENTAL" | "SECURITY" | "LOGISTICS" | "OTHER";
  action: string;
  verificationStatus: "VERIFIED" | "PENDING" | "UNVERIFIED";
  reasoning: string;
}

export interface SentinelResponse {
  summary: string;
  actions: ActionItem[];
  riskLevel: "EXTREME" | "HIGH" | "MODERATE" | "LOW";
  detectedContext: string;
}

export async function processUnstructuredInput(
  input: string,
  imageData?: string
): Promise<SentinelResponse> {
  const model = "gemini-3.1-pro-preview";

  const systemInstruction = `
    You are Sentinel AI, a high-precision life-saving intelligence engine.
    Your task is to take messy, unstructured real-world inputs (text, descriptions of voice, traffic, weather, news, photos, or medical history) and convert them into structured, verified, and life-saving actions.

    Output MUST be in JSON format.
    Risk Levels: EXTREME, HIGH, MODERATE, LOW.
    Categories: MEDICAL, ENVIRONMENTAL, SECURITY, LOGISTICS, OTHER.
    Priorities: CRITICAL, HIGH, MEDIUM, LOW.
    Verification Status: VERIFIED (if logic is sound), PENDING (if more info needed), UNVERIFIED (if speculative).

    Always prioritize immediate physical safety.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "A brief, urgent summary of the situation." },
      riskLevel: { type: Type.STRING, enum: ["EXTREME", "HIGH", "MODERATE", "LOW"] },
      detectedContext: { type: Type.STRING, description: "What the AI understood from the messy input." },
      actions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            priority: { type: Type.STRING, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
            category: { type: Type.STRING, enum: ["MEDICAL", "ENVIRONMENTAL", "SECURITY", "LOGISTICS", "OTHER"] },
            action: { type: Type.STRING, description: "The specific action to take." },
            verificationStatus: { type: Type.STRING, enum: ["VERIFIED", "PENDING", "UNVERIFIED"] },
            reasoning: { type: Type.STRING, description: "Why this action is necessary." }
          },
          required: ["priority", "category", "action", "verificationStatus", "reasoning"]
        }
      }
    },
    required: ["summary", "riskLevel", "detectedContext", "actions"]
  };

  const contents: any[] = [{ text: input }];
  if (imageData) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData.split(",")[1]
      }
    });
  }

  const result = await ai.models.generateContent({
    model,
    contents: { parts: contents },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  return JSON.parse(result.text || "{}") as SentinelResponse;
}
