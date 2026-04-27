'use client';

import { AppPhase } from '@/types';

interface Props {
  phase: AppPhase;
}

const phases = [
  { id: 1, label: 'Input', activeIn: ['idle'] },
  { id: 2, label: 'Panel', activeIn: ['building-panel'], doneAfter: ['panel-ready', 'gathering-feedback', 'synthesizing', 'complete'] },
  { id: 3, label: 'Feedback', activeIn: ['gathering-feedback'], doneAfter: ['synthesizing', 'complete'] },
  { id: 4, label: 'Synthesis', activeIn: ['synthesizing'], doneAfter: ['complete'] },
];

export default function PhaseBar({ phase }: Props) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {phases.map((p, i) => {
        const isActive = p.activeIn.includes(phase);
        const isDone = p.doneAfter?.includes(phase);
        const isIdle = phase === 'idle' && p.id === 1;

        return (
          <div key={p.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isDone
                    ? 'bg-[#c8f060] text-black'
                    : isActive
                    ? 'bg-[#c8f060]/20 border border-[#c8f060] text-[#c8f060] ring-2 ring-[#c8f060]/30'
                    : isIdle
                    ? 'bg-[#c8f060]/20 border border-[#c8f060] text-[#c8f060]'
                    : 'bg-[#2a2a3a] text-[#6b7280]'
                }`}
              >
                {isDone ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  p.id
                )}
              </div>
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  isDone || isActive || isIdle ? 'text-[#e2e8f0]' : 'text-[#6b7280]'
                }`}
              >
                {p.label}
              </span>
              {isActive && (
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1 h-1 rounded-full bg-[#c8f060] animate-bounce"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </span>
              )}
            </div>
            {i < phases.length - 1 && (
              <div className={`w-8 h-px transition-colors duration-300 ${isDone ? 'bg-[#c8f060]/40' : 'bg-[#2a2a3a]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
