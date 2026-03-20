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

export interface HistoryItem extends SentinelResponse {
  id: string;
  timestamp: string;
  input: string;
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
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, mediaData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze input via server");
    }

    const result = await response.json() as SentinelResponse;

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
    throw error;
  }
}
