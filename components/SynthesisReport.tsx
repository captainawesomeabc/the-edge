'use client';

import React from 'react';
import { TrendingUp, Search, Crosshair, Megaphone, ShieldAlert, FlaskConical, Sparkles } from 'lucide-react';
import type { SynthesisReport } from '@/types';

interface SynthesisReportProps {
  report: SynthesisReport;
}

const sentimentColors: Record<string, { bar: string; label: string }> = {
  positive: { bar: 'bg-emerald-500', label: '😊 Positive' },
  mixed: { bar: 'bg-amber-500', label: '🤔 Mixed' },
  skeptical: { bar: 'bg-red-500', label: '😐 Skeptical' },
  neutral: { bar: 'bg-gray-500', label: '😶 Neutral' },
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="space-y-2">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-400">
      {icon} {title}
    </h3>
    {children}
  </div>
);

export const SynthesisReportView: React.FC<SynthesisReportProps> = ({ report }) => {
  const sb = report.sentimentBreakdown;
  const total = Number(sb.positive) + Number(sb.mixed) + Number(sb.skeptical) + Number(sb.neutral);

  return (
    <div className="space-y-4 edge-float-in">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400" />
          <span className="edge-gradient-text">Go-to-Market Report</span>
        </h2>
      </div>

      {/* Sentiment Breakdown */}
      <div className="edge-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Panel Sentiment</h3>
        <div className="edge-sentiment-bar flex mb-3">
          {Object.entries(report.sentimentBreakdown).map(([key, val]) => {
            const numVal = Number(val);
            const pct = total > 0 ? (numVal / total) * 100 : 0;
            if (pct === 0) return null;
            const cfg = sentimentColors[key] || sentimentColors.neutral;
            return (
              <div key={key} className={`${cfg.bar} first:rounded-l-full last:rounded-r-full`} style={{ width: `${pct}%` }} />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(report.sentimentBreakdown).map(([key, val]) => {
            const numVal = Number(val);
            if (numVal === 0) return null;
            const cfg = sentimentColors[key] || sentimentColors.neutral;
            const pct = total > 0 ? Math.round((numVal / total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${cfg.bar}`} />
                <span>{cfg.label} <span className="font-mono text-gray-300">{pct}%</span></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Signals */}
      <div className="edge-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-cyan-400" /> Key Signals
        </h3>
        <div className="space-y-3">
          {report.topSignals.map((sig, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-lg shrink-0">{sig.icon}</span>
              <span className="text-gray-400 leading-relaxed text-xs" dangerouslySetInnerHTML={{ __html: sig.text }} />
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Strategy */}
      <div className="edge-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <Search size={14} className="text-purple-400" /> Keyword Strategy
        </h3>
        <div className="space-y-4">
          {([
            { tier: 'primary' as const, label: 'Primary — Ads + SEO Headlines', icon: '🎯', color: 'bg-purple-500/20 text-purple-300 border border-purple-500/20' },
            { tier: 'secondary' as const, label: 'Secondary — Ad Copy + Meta', icon: '📌', color: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20' },
            { tier: 'tertiary' as const, label: 'Long-tail — Content + Blog', icon: '📝', color: 'bg-gray-800/50 text-gray-400 border border-gray-700/30' },
          ]).map(({ tier, label, icon, color }) => (
            <div key={tier}>
              <p className="text-[0.65rem] font-semibold uppercase text-gray-600 mb-2 tracking-wider">
                {icon} {label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {report.keywords[tier].map((kw, ki) => (
                  <span key={ki} className={`edge-tag ${color}`}>{kw}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GTM Strategy */}
      <div className="edge-card rounded-xl p-5 space-y-5">
        <h3 className="text-sm font-semibold edge-gradient-text flex items-center gap-2">
          <Sparkles size={14} /> Go-to-Market Strategy
        </h3>

        <Section icon={<Crosshair size={13} className="text-purple-400" />} title="Positioning">
          <p className="text-xs text-gray-400 leading-relaxed">{report.gtm.positioning}</p>
        </Section>

        <Section icon={<Crosshair size={13} className="text-cyan-400" />} title="Target Segment">
          <p className="text-xs text-gray-400 leading-relaxed">{report.gtm.targetSegment}</p>
        </Section>

        <Section icon={<Megaphone size={13} className="text-amber-400" />} title="Channels">
          <p className="text-xs text-gray-400 leading-relaxed">{report.gtm.channel}</p>
        </Section>

        <Section icon={<Megaphone size={13} className="text-purple-400" />} title="Messaging Hooks">
          <div className="space-y-1.5">
            {report.gtm.messaging.split('\\n').filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="text-purple-400 shrink-0 mt-0.5">→</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<ShieldAlert size={13} className="text-red-400" />} title="Objections to Address">
          <div className="space-y-1.5">
            {report.gtm.objections.split('\\n').filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<FlaskConical size={13} className="text-emerald-400" />} title="Test Priority">
          <p className="text-xs text-gray-400 leading-relaxed">{report.gtm.testPriority}</p>
        </Section>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-[0.6rem] text-gray-700 font-medium tracking-wider uppercase">
          Generated by Prova — Synthetic Audience Intelligence
        </p>
      </div>
    </div>
  );
};
