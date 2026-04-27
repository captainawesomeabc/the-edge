'use client';

import { useEffect, useRef } from 'react';
import { Persona, PersonaFeedback } from '@/types';

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

const sentimentConfig = {
  positive: { label: 'Positive', classes: 'text-[#c8f060] bg-[#c8f060]/10 border-[#c8f060]/20' },
  mixed: { label: 'Mixed', classes: 'text-[#f0a860] bg-[#f0a860]/10 border-[#f0a860]/20' },
  skeptical: { label: 'Skeptical', classes: 'text-[#f060a0] bg-[#f060a0]/10 border-[#f060a0]/20' },
  neutral: { label: 'Neutral', classes: 'text-[#6b7280] bg-[#6b7280]/10 border-[#6b7280]/20' },
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface FeedbackItemProps {
  persona: Persona;
  feedback: PersonaFeedback;
  colorIndex: number;
}

function FeedbackItem({ persona, feedback, colorIndex }: FeedbackItemProps) {
  const color = PERSONA_COLORS[colorIndex % PERSONA_COLORS.length];
  const sentiment = sentimentConfig[feedback.sentiment] ?? sentimentConfig.neutral;

  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5 animate-fade-in">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: color.bg, color: color.text, border: `1px solid ${color.text}30` }}
        >
          {getInitials(persona.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-white text-sm">{persona.name}</p>
              <p className="text-xs text-[#6b7280]">{persona.role} · {persona.age} · {persona.location}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ${sentiment.classes}`}>
              {sentiment.label}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-[#d1d5db] leading-relaxed mb-4">&ldquo;{feedback.reaction}&rdquo;</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <div className="bg-[#1a0a0a] border border-[#f060a0]/15 rounded-lg px-3 py-2">
          <p className="text-xs text-[#f060a0] mb-1 font-medium">Top concern</p>
          <p className="text-xs text-[#d1d5db]">{feedback.topConcern}</p>
        </div>
        <div className="bg-[#0a101a] border border-[#60c8f0]/15 rounded-lg px-3 py-2">
          <p className="text-xs text-[#60c8f0] mb-1 font-medium">Top appeal</p>
          <p className="text-xs text-[#d1d5db]">{feedback.topAppeal}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[#4b5563]">Keywords:</span>
        {feedback.keywords.map((kw, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full bg-[#60f0a0]/10 border border-[#60f0a0]/20 text-[#60f0a0]"
          >
            {kw}
          </span>
        ))}
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border font-medium ${feedback.wouldUse ? 'text-[#c8f060] bg-[#c8f060]/10 border-[#c8f060]/20' : 'text-[#6b7280] bg-[#6b7280]/10 border-[#6b7280]/20'}`}>
          {feedback.wouldUse ? 'Would use' : 'Would not use'}
        </span>
      </div>
    </div>
  );
}

interface Props {
  personas: Persona[];
  feedbacks: PersonaFeedback[];
  isGathering: boolean;
  skippedCount?: number;
}

export default function FeedbackStream({ personas, feedbacks, isGathering, skippedCount = 0 }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedbacks.length]);

  const personaMap = new Map(personas.map((p) => [p.id, p]));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Audience Feedback</h2>
        <div className="flex items-center gap-2">
          {isGathering && (
            <span className="flex items-center gap-1.5 text-xs text-[#c8f060]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8f060] animate-pulse" />
              Gathering...
            </span>
          )}
          <span className="text-xs text-[#6b7280] bg-[#1a1a26] border border-[#2a2a3a] px-2.5 py-1 rounded-full">
            {feedbacks.length} / {personas.length}
          </span>
        </div>
      </div>

      {skippedCount > 0 && (
        <div className="mb-3 px-3 py-2 bg-[#f0a860]/10 border border-[#f0a860]/20 rounded-lg text-xs text-[#f0a860]">
          {skippedCount} persona{skippedCount > 1 ? 's' : ''} skipped due to API errors.
        </div>
      )}

      <div className="space-y-3">
        {feedbacks.map((feedback) => {
          const persona = personaMap.get(feedback.personaId);
          if (!persona) return null;
          const colorIndex = personas.findIndex((p) => p.id === feedback.personaId);
          return (
            <FeedbackItem
              key={feedback.personaId}
              persona={persona}
              feedback={feedback}
              colorIndex={colorIndex}
            />
          );
        })}

        {isGathering && feedbacks.length < personas.length && (
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#2a2a3a]" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-[#2a2a3a] rounded w-1/3" />
                <div className="h-2 bg-[#2a2a3a] rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-[#2a2a3a] rounded w-full" />
              <div className="h-3 bg-[#2a2a3a] rounded w-3/4" />
            </div>
          </div>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
