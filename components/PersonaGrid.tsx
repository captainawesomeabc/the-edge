'use client';

import { Persona } from '@/types';

const PERSONA_COLORS = [
  { bg: 'rgba(200,240,96,0.15)', text: '#b8d840' },
  { bg: 'rgba(96,200,240,0.15)', text: '#60c8f0' },
  { bg: 'rgba(240,168,96,0.15)', text: '#f0a860' },
  { bg: 'rgba(160,96,240,0.15)', text: '#c090f0' },
  { bg: 'rgba(96,240,160,0.15)', text: '#60f0a0' },
  { bg: 'rgba(240,96,160,0.15)', text: '#f060a0' },
  { bg: 'rgba(240,240,96,0.15)', text: '#d0d040' },
  { bg: 'rgba(96,160,240,0.15)', text: '#60a0f0' },
  { bg: 'rgba(240,136,96,0.15)', text: '#f08860' },
];

const sentimentColors: Record<string, string> = {
  positive: 'text-[#c8f060] bg-[#c8f060]/10 border-[#c8f060]/20',
  mixed: 'text-[#f0a860] bg-[#f0a860]/10 border-[#f0a860]/20',
  skeptical: 'text-[#f060a0] bg-[#f060a0]/10 border-[#f060a0]/20',
  neutral: 'text-[#6b7280] bg-[#6b7280]/10 border-[#6b7280]/20',
};

const archetypeColors: Record<string, string> = {
  'early adopter': 'text-[#60c8f0] bg-[#60c8f0]/10 border-[#60c8f0]/20',
  'skeptic': 'text-[#f060a0] bg-[#f060a0]/10 border-[#f060a0]/20',
  'mainstream': 'text-[#9ca3af] bg-[#9ca3af]/10 border-[#9ca3af]/20',
  'power user': 'text-[#c090f0] bg-[#c090f0]/10 border-[#c090f0]/20',
  'non-tech': 'text-[#f0a860] bg-[#f0a860]/10 border-[#f0a860]/20',
  'budget-conscious': 'text-[#60f0a0] bg-[#60f0a0]/10 border-[#60f0a0]/20',
  'enterprise': 'text-[#60a0f0] bg-[#60a0f0]/10 border-[#60a0f0]/20',
  'casual': 'text-[#d0d040] bg-[#d0d040]/10 border-[#d0d040]/20',
};

interface Props {
  personas: Persona[];
  isBuilding?: boolean;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function PersonaGrid({ personas, isBuilding }: Props) {
  if (isBuilding && personas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#6b7280]">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full bg-[#1a1a26] border border-[#2a2a3a] animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <p className="text-sm">Assembling your audience panel...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Audience Panel</h2>
        <span className="text-xs text-[#6b7280] bg-[#1a1a26] border border-[#2a2a3a] px-2.5 py-1 rounded-full">
          {personas.length} personas
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {personas.map((persona, i) => {
          const color = PERSONA_COLORS[i % PERSONA_COLORS.length];
          return (
            <div
              key={persona.id}
              className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-4 hover:border-[#3a3a4a] transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: color.bg, color: color.text, border: `1px solid ${color.text}30` }}
                >
                  {getInitials(persona.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{persona.name}</p>
                  <p className="text-xs text-[#6b7280] truncate">{persona.role}</p>
                  <p className="text-xs text-[#4b5563]">{persona.age} · {persona.location}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${sentimentColors[persona.likelyReaction] || sentimentColors.neutral}`}>
                  {persona.likelyReaction}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${archetypeColors[persona.archetype] || 'text-[#6b7280] bg-[#6b7280]/10 border-[#6b7280]/20'}`}>
                  {persona.archetype}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-[#4b5563] mb-0.5">Goal</p>
                  <p className="text-xs text-[#9ca3af] leading-relaxed line-clamp-2">{persona.goals}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4b5563] mb-0.5">Pain point</p>
                  <p className="text-xs text-[#9ca3af] leading-relaxed line-clamp-2">{persona.painPoints}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#2a2a3a] flex items-center justify-between">
                <span className="text-xs text-[#4b5563]">Tech</span>
                <div className="flex gap-1">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <div
                      key={level}
                      className={`w-5 h-1.5 rounded-full transition-colors ${
                        (level === 'low') ||
                        (level === 'medium' && (persona.techSavvy === 'medium' || persona.techSavvy === 'high')) ||
                        (level === 'high' && persona.techSavvy === 'high')
                          ? 'bg-[#c8f060]/60'
                          : 'bg-[#2a2a3a]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
