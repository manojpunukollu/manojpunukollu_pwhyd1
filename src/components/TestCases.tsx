import React from 'react';
import { Beaker, FileText, Image as ImageIcon, Music, Video } from 'lucide-react';

interface TestCase {
  id: string;
  label: string;
  icon: React.ReactNode;
  input: string;
  mediaUrl?: string;
  mimeType?: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'text-emergency',
    label: 'Text: Mass Casualty Incident',
    icon: <FileText className="w-4 h-4" />,
    input: "URGENT: Reports of a building collapse at 5th and Main. Multiple people trapped. Dust cloud making visibility zero. Fire reported on 3rd floor. Emergency services are 10 mins away."
  },
  {
    id: 'image-medical',
    label: 'Image: Medical Symptom',
    icon: <ImageIcon className="w-4 h-4" />,
    input: "Analyzing this patient's skin condition. Patient reports high fever and rapid heart rate. What are the immediate life-saving steps?",
    mediaUrl: "https://picsum.photos/seed/medical/800/600",
    mimeType: "image/jpeg"
  },
  {
    id: 'audio-distress',
    label: 'Audio: Distress Call',
    icon: <Music className="w-4 h-4" />,
    input: "Transcribe and analyze this emergency call. Background noise suggests heavy rain and wind. Caller sounds panicked.",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Placeholder for audio test
    mimeType: "audio/mpeg"
  },
  {
    id: 'video-traffic',
    label: 'Video: Traffic Accident',
    icon: <Video className="w-4 h-4" />,
    input: "Analyze this traffic camera footage. Identify the risk level and necessary logistics for clearing the intersection.",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Placeholder for video test
    mimeType: "video/mp4"
  }
];

interface TestCasesProps {
  onSelect: (input: string, mediaUrl?: string, mimeType?: string) => void;
}

export const TestCases: React.FC<TestCasesProps> = ({ onSelect }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/40 mb-2">
        <Beaker className="w-4 h-4" />
        <span className="text-[10px] uppercase tracking-widest font-medium">Intelligence Test Suite</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TEST_CASES.map((tc) => (
          <button
            key={tc.id}
            onClick={() => onSelect(tc.input, tc.mediaUrl, tc.mimeType)}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
          >
            <div className="p-2 rounded bg-white/5 group-hover:bg-white/10 text-white/60 group-hover:text-white transition-colors">
              {tc.icon}
            </div>
            <span className="text-xs font-medium text-white/80 group-hover:text-white">{tc.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
