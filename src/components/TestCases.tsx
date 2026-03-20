import React from 'react';
import { Beaker, FileText, Image as ImageIcon, Music, Video, ShieldAlert, Wind, Truck, HelpCircle } from 'lucide-react';

interface TestCase {
  id: string;
  label: string;
  icon: React.ReactNode;
  input: string;
  mediaUrl?: string;
  mimeType?: string;
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'med-complex',
    label: 'Conflicting Medical',
    icon: <Beaker className="w-4 h-4" />,
    description: 'Patient with multiple allergies and conflicting symptoms in a remote area.',
    input: "Patient 45yo male, found collapsed. History of severe peanut allergy but also carries insulin. Smells of almonds? Breathing is shallow. No epi-pen found. We are 40 miles from the nearest clinic in heavy snow. Heart rate 110 and dropping. Skin is cold and clammy."
  },
  {
    id: 'env-vague',
    label: 'Vague Env Threat',
    icon: <Wind className="w-4 h-4" />,
    description: 'Ambiguous weather reports and sensory data from a field team.',
    input: "Team Delta reporting strange yellow haze coming from the valley. Birds have stopped singing. Wind is shifting North-East towards the primary camp. Local sensors showing 'Error 404' but the air feels 'heavy' and metallic. Should we evacuate or hunker down?"
  },
  {
    id: 'sec-high-stress',
    label: 'High-Stress Security',
    icon: <ShieldAlert className="w-4 h-4" />,
    description: 'Fragmented, high-urgency security alert with missing context.',
    input: "CODE RED. Perimeter breached at Sector 7. Camera 4 is down. Multiple shadows moving towards the server room. We have 3 unarmed staff in the breakroom. Comms are flickering. I think they have... wait, what is that? *static*"
  },
  {
    id: 'log-remote',
    label: 'Remote Logistics',
    icon: <Truck className="w-4 h-4" />,
    description: 'Supply chain failure in a disaster zone with limited resources.',
    input: "Relief convoy stuck at Bridge 12. Water supplies contaminated by flood. We have 500 people waiting at the drop zone. Fuel is at 10%. GPS is unreliable. Need alternative route for the 5-ton trucks. Soil is becoming mud."
  },
  {
    id: 'mixed-media',
    label: 'Multimodal Edge Case',
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'Vague text combined with a visual symptom or scene.',
    input: "Found this in the basement. It's leaking. Is it dangerous? There's a weird smell like rotten eggs. My eyes are stinging.",
    mediaUrl: "https://picsum.photos/seed/hazard/800/600",
    mimeType: "image/jpeg"
  }
];

interface TestCasesProps {
  onSelect: (input: string, mediaUrl?: string, mimeType?: string) => void;
}

export const TestCases: React.FC<TestCasesProps> = ({ onSelect }) => {
  return (
    <section className="space-y-4" aria-labelledby="test-cases-heading">
      <div className="flex items-center justify-between px-1">
        <h2 id="test-cases-heading" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
          <Beaker className="w-3 h-3" aria-hidden="true" />
          Intelligence Test Suite
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEST_CASES.map((tc) => (
          <button
            key={tc.id}
            onClick={() => onSelect(tc.input, tc.mediaUrl, tc.mimeType)}
            className="group text-left p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all flex flex-col gap-2"
            aria-label={`Simulate scenario: ${tc.label}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-emerald-500/10 transition-colors text-emerald-500">
                {tc.icon}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-500 transition-colors">
                {tc.label}
              </span>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed">
              {tc.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
