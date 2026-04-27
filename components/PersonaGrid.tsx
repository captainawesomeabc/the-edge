'use client';

import React from 'react';
import { MapPin, Cpu, ThumbsUp, ThumbsDown, AlertTriangle, Heart, Lock } from 'lucide-react';
import type { Persona, PersonaFeedback } from '@/types';

interface PersonaGridProps {
  personas: Persona[];
  feedbacks: PersonaFeedback[];
  activeFeedbackId: string | null;
  isPaid: boolean;
}

const FREE_PERSONA_COUNT = 2;

const archetypeStyles: Record<string, { bg: string; text: string }> = {
  'early adopter': { bg: 'bg-purple-500/15', text: 'text-purple-300' },
  'skeptic': { bg: 'bg-red-500/15', text: 'text-red-300' },
  'mainstream': { bg: 'bg-blue-500/15', text: 'text-blue-300' },
  'power user': { bg: 'bg-cyan-500/15', text: 'text-cyan-300' },
  'non-tech': { bg: 'bg-amber-500/15', text: 'text-amber-300' },
  'budget-conscious': { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
  'enterprise': { bg: 'bg-indigo-500/15', text: 'text-indigo-300' },
  'casual': { bg: 'bg-gray-500/15', text: 'text-gray-300' },
};

const sentimentConfig: Record<string, { emoji: string }> = {
  positive: { emoji: '🟢' },
  mixed: { emoji: '🟡' },
  skeptical: { emoji: '🔴' },
  neutral: { emoji: '⚪' },
};

export const PersonaGrid: React.FC<PersonaGridProps> = ({ personas, feedbacks, activeFeedbackId, isPaid }) => {
  if (personas.length === 0) return null;

  return (
    <div className="space-y-4 edge-float-in">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2">
          <span className="text-lg">👥</span> Audience Panel
        </h2>
        <span className="edge-badge bg-gray-800 text-gray-500 px-2 py-1 rounded">
          {feedbacks.length}/{personas.length} responded
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {personas.map((p, idx) => {
          const fb = feedbacks.find((f) => f.personaId === p.id);
          const isActive = activeFeedbackId === p.id;
          const style = archetypeStyles[p.archetype] || { bg: 'bg-gray-500/15', text: 'text-gray-300' };
          const sent = fb ? sentimentConfig[fb.sentiment] || sentimentConfig.neutral : null;
          const isLocked = !isPaid && idx >= FREE_PERSONA_COUNT && fb;

          return (
            <div
              key={p.id}
              className={`edge-card rounded-xl p-4 edge-float-in relative overflow-hidden ${
                isActive ? 'edge-card-active' : fb ? 'edge-card-done' : ''
              } ${isLocked ? 'paywall-locked' : ''}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Header — always visible */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm text-gray-200">{p.name}<span className="text-gray-500 font-normal">, {p.age}</span></h3>
                  <p className="text-xs text-gray-500">{p.role}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`edge-badge ${style.bg} ${style.text} px-1.5 py-0.5 rounded`}>
                    {p.archetype}
                  </span>
                  {sent && !isLocked && <span className="text-sm">{sent.emoji}</span>}
                </div>
              </div>

              {/* Meta — always visible */}
              <div className="flex items-center gap-3 text-[0.65rem] text-gray-600 mb-2">
                <span className="flex items-center gap-1"><MapPin size={9} /> {p.location}</span>
                <span className="flex items-center gap-1"><Cpu size={9} /> {p.techSavvy}</span>
              </div>

              {/* Feedback — blurred if locked */}
              {fb && !isLocked && (
                <div className="mt-2 pt-3 border-t border-gray-700/30 space-y-2">
                  <p className="text-xs text-gray-400 italic leading-relaxed">&quot;{fb.reaction}&quot;</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-start gap-1.5">
                      <Heart size={10} className="text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-[0.65rem] text-gray-500 leading-tight">{fb.topAppeal}</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle size={10} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-[0.65rem] text-gray-500 leading-tight">{fb.topConcern}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {fb.wouldUse ? (
                      <span className="flex items-center gap-1 text-[0.6rem] text-emerald-400"><ThumbsUp size={9} /> Would use</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[0.6rem] text-red-400"><ThumbsDown size={9} /> Would pass</span>
                    )}
                    <span className="text-gray-700">|</span>
                    <div className="flex flex-wrap gap-1">
                      {fb.keywords.map((kw, ki) => (
                        <span key={ki} className="edge-tag bg-gray-800/50 text-gray-500">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Locked overlay for personas 3-7 */}
              {isLocked && (
                <div className="paywall-blur-overlay">
                  <div className="paywall-blur-content">
                    <p className="text-xs text-gray-400 italic leading-relaxed">This persona had detailed feedback about your product...</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="h-3 bg-gray-700/30 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-700/30 rounded w-2/3"></div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <div className="h-4 bg-gray-700/20 rounded w-16"></div>
                      <div className="h-4 bg-gray-700/20 rounded w-12"></div>
                      <div className="h-4 bg-gray-700/20 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="paywall-lock-badge">
                    <Lock size={10} />
                    <span>Unlock to reveal</span>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {isActive && !fb && (
                <div className="mt-3 pt-3 border-t border-purple-500/10 flex items-center gap-2 text-xs text-purple-300/60">
                  <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5, borderTopColor: '#a78bfa' }} />
                  <span>Gathering thoughts...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
