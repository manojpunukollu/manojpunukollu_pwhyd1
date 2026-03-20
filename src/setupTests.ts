import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock process.env
process.env.GEMINI_API_KEY = 'test-key';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

let mockUser: any = null;
const mockAuth = {
  get currentUser() { return mockUser; },
  onAuthStateChanged: vi.fn((cb) => {
    cb(mockUser);
    return () => {};
  }),
};

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(mockUser);
    return () => {};
  }),
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  getDocFromServer: vi.fn(),
}));

// Mock Gemini SDK
const mockGenerateContent = vi.fn(async () => ({
  text: JSON.stringify({
    summary: 'Test summary',
    riskLevel: 'LOW',
    actions: [],
    detectedContext: 'Test context',
  }),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
  Modality: { AUDIO: 'AUDIO' },
  Type: { OBJECT: 'OBJECT', STRING: 'STRING', NUMBER: 'NUMBER', ARRAY: 'ARRAY' },
  ThinkingLevel: { LOW: 'LOW', HIGH: 'HIGH' },
}));

export const __setMockUser = (user: any) => { mockUser = user; };
export { mockGenerateContent };
