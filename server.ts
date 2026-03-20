import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_INSTRUCTION = `
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

// Initialize AI client once
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://picsum.photos"],
        "connect-src": ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.run.app"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Vite
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", global: true, timestamp: new Date().toISOString() });
  });

  // Server-side Gemini Analysis (Protects API Key)
  app.post("/api/analyze", async (req, res) => {
    const { input, mediaData } = req.body;

    if (!ai) {
      return res.status(500).json({ error: "Gemini API Key is not configured on the server." });
    }

    // Input Validation
    const trimmedInput = (input || "").trim();
    if (!trimmedInput && !mediaData) {
      return res.status(400).json({ error: "Input or media data is required." });
    }

    if (trimmedInput.length > 5000) {
      return res.status(400).json({ error: "Input text exceeds 5000 character limit." });
    }

    if (mediaData && mediaData.data && mediaData.data.length > 7 * 1024 * 1024) { // ~5MB base64
      return res.status(400).json({ error: "Media data exceeds size limit." });
    }

    try {
      const model = "gemini-3.1-flash-lite-preview";

      const contents: any[] = [{ text: trimmedInput || "Analyze the provided media." }];
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
          systemInstruction: SYSTEM_INSTRUCTION,
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

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Server-side Analysis Error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze input" });
    }
  });

  // Hardened Proxy (SSRF Protection)
  app.get("/api/proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).send("URL is required");

    try {
      const parsedUrl = new URL(url);
      
      // Block internal/private IPs to prevent SSRF
      const blockedHosts = ["localhost", "127.0.0.1", "metadata.google.internal", "169.254.169.254"];
      if (blockedHosts.some(host => parsedUrl.hostname.includes(host))) {
        return res.status(403).send("Access to internal hosts is forbidden");
      }

      // Only allow common media protocols
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).send("Only HTTP/HTTPS protocols are allowed");
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type");
      
      // Only proxy images or common media
      if (contentType && !contentType.startsWith("image/") && !contentType.startsWith("application/pdf")) {
        return res.status(400).send("Only images and PDFs are allowed via proxy");
      }
      
      res.setHeader("Content-Type", contentType || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(buffer);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).send("Failed to fetch media safely");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
