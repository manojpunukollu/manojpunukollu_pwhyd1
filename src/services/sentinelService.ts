import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { collection, addDoc, getDocFromServer, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface ActionItem {
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: "MEDICAL" | "ENVIRONMENTAL" | "SECURITY" | "LOGISTICS" | "OTHER";
  action: string;
  verificationStatus: "VERIFIED" | "PENDING" | "UNVERIFIED";
  reasoning: string;
}

export interface SentinelResponse {
  summary: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  actions: ActionItem[];
  detectedContext: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export async function processUnstructuredInput(
  input: string,
  mediaData?: { data: string; mimeType: string }
): Promise<SentinelResponse> {
  // Try to get the API key from various possible locations
  // Vite's 'define' will replace these literal strings at build/dev time
  const apiKey = (process.env.GEMINI_API_KEY) || 
                 (process.env.VITE_GEMINI_API_KEY) || 
                 ((import.meta as any).env?.VITE_GEMINI_API_KEY) || 
                 "";
  
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Gemini API Key is missing. Please ensure GEMINI_API_KEY is set in your Settings > Secrets.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3.1-flash-lite-preview"; // Using the lite model for better free-tier compatibility

  const systemInstruction = `
    You are Sentinel AI, a high-precision life-saving intelligence engine.
    Your task is to analyze unstructured data (medical notes, emergency alerts, news, messy logs) and extract critical, actionable intelligence.
    
    Output MUST be valid JSON matching the schema.
    
    Risk Levels:
    - CRITICAL: Immediate threat to life or limb.
    - HIGH: Serious threat, urgent action required.
    - MEDIUM: Potential threat, requires monitoring or non-urgent action.
    - LOW: Minimal threat, routine handling.
    
    Categories:
    - MEDICAL: First aid, triage, clinical advice.
    - ENVIRONMENTAL: Weather, terrain, hazardous materials.
    - SECURITY: Threats, safe zones, perimeter.
    - LOGISTICS: Supply chain, transport, evacuation.
    - OTHER: General info.
    
    Be concise, clinical, and direct. Prioritize speed and accuracy.
  `;

  try {
    const contents: any[] = [{ text: input }];
    if (mediaData) {
      contents.push({
        inlineData: {
          mimeType: mediaData.mimeType,
          data: mediaData.data.includes(",") ? mediaData.data.split(",")[1] : mediaData.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts: contents },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
            detectedContext: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  priority: { type: Type.STRING, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
                  category: { type: Type.STRING, enum: ["MEDICAL", "ENVIRONMENTAL", "SECURITY", "LOGISTICS", "OTHER"] },
                  action: { type: Type.STRING },
                  verificationStatus: { type: Type.STRING, enum: ["VERIFIED", "PENDING", "UNVERIFIED"] },
                  reasoning: { type: Type.STRING }
                },
                required: ["priority", "category", "action", "verificationStatus", "reasoning"]
              }
            }
          },
          required: ["summary", "riskLevel", "actions", "detectedContext"]
        },
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from AI model.");
    }

    const result = JSON.parse(response.text) as SentinelResponse;

    // Save to Firestore if user is logged in
    if (auth.currentUser) {
      const path = 'reports';
      try {
        await addDoc(collection(db, path), {
          userId: auth.currentUser.uid,
          timestamp: new Date().toISOString(),
          input: input.substring(0, 5000), // Enforce limit
          summary: result.summary,
          riskLevel: result.riskLevel,
          detectedContext: result.detectedContext,
          actions: result.actions
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    return result;
  } catch (error: any) {
    console.error("Sentinel Analysis Error:", error);
    
    if (error.message?.includes("API key not valid") || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("The Gemini API key provided is invalid. Please check your key in Settings > Secrets.");
    }
    
    throw error;
  }
}
