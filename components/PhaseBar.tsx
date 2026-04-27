'use client';

import React from 'react';
import { Users, MessageSquare, BarChart3, CheckCircle } from 'lucide-react';
import type { AppPhase } from '@/types';

interface PhaseBarProps {
  phase: AppPhase;
  personaCount: number;
  feedbackCount: number;
}

const steps = [
  { key: 'building-panel', label: 'Building Panel', icon: Users },
  { key: 'gathering-feedback', label: 'Gathering Feedback', icon: MessageSquare },
  { key: 'synthesizing', label: 'Synthesizing', icon: BarChart3 },
  { key: 'complete', label: 'Complete', icon: CheckCircle },
] as const;

const phaseOrder = ['idle', 'building-panel', 'gathering-feedback', 'synthesizing', 'complete'];

export const PhaseBar: React.FC<PhaseBarProps> = ({ phase, personaCount, feedbackCount }) => {
  if (phase === 'idle') return null;

  const currentIndex = phaseOrder.indexOf(phase);

  return (
    <div className="edge-card rounded-xl p-4 edge-float-in">
      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const stepIndex = phaseOrder.indexOf(step.key);
          const isActive = step.key === phase;
          const isDone = currentIndex > stepIndex;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              {i > 0 && (
                <div className="flex-1 h-[2px] rounded-full mx-1">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isDone ? 'bg-gradient-to-r from-purple-500 to-cyan-400 w-full' :
                      isActive ? 'bg-purple-500/40 w-1/2 edge-shimmer' : 'bg-gray-700/30 w-full'
                    }`}
                  />
                </div>
              )}
              <div className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap px-2 py-1 rounded-lg transition-all duration-300 ${
                isActive ? 'text-purple-300 bg-purple-500/10' :
                isDone ? 'text-emerald-400' : 'text-gray-600'
              }`}>
                {isActive && <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />}
                {isDone && <CheckCircle size={13} className="text-emerald-400" />}
                {!isActive && !isDone && <Icon size={13} />}
                <span className="hidden md:inline">{step.label}</span>
                {isActive && step.key === 'building-panel' && personaCount > 0 && (
                  <span className="edge-badge bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">{personaCount}/7</span>
                )}
                {isActive && step.key === 'gathering-feedback' && (
                  <span className="edge-badge bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">{feedbackCount}/{personaCount}</span>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
