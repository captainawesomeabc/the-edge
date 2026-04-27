'use client';

import { useState } from 'react';
import { SynthesisReport as SynthesisReportType } from '@/types';

interface Props {
  report: SynthesisReportType;
}

type Tab = 'signals' | 'keywords' | 'gtm';

function SentimentCard({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl p-4">
      <p className="text-xs text-[#6b7280] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{count}</p>
      <div className="mt-2 h-1 bg-[#2a2a3a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs text-[#4b5563] mt-1">{pct}%</p>
    </div>
  );
}

function KeywordChip({ label, size }: { label: string; size: 'primary' | 'secondary' | 'tertiary' }) {
  const styles = {
    primary: 'text-sm px-3 py-1.5 bg-[#c8f060]/10 border-[#c8f060]/30 text-[#c8f060]',
    secondary: 'text-xs px-2.5 py-1 bg-[#60c8f0]/10 border-[#60c8f0]/25 text-[#60c8f0]',
    tertiary: 'text-xs px-2 py-0.5 bg-[#6b7280]/10 border-[#6b7280]/20 text-[#9ca3af]',
  };
  return (
    <span className={`rounded-full border font-medium ${styles[size]}`}>{label}</span>
  );
}

export default function SynthesisReport({ report }: Props) {
  const [tab, setTab] = useState<Tab>('signals');
  const { sentimentBreakdown, topSignals, keywords, gtm } = report;
  const total = Object.values(sentimentBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Synthesis Report</h2>
        <span className="text-xs text-[#c8f060] bg-[#c8f060]/10 border border-[#c8f060]/20 px-2.5 py-1 rounded-full">
          Ready
        </span>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-[#0a0a0f] rounded-lg">
        {(['signals', 'keywords', 'gtm'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
              tab === t ? 'bg-[#1a1a26] text-white shadow' : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            {t === 'signals' ? 'Signals' : t === 'keywords' ? 'Keywords' : 'Go-to-Market'}
          </button>
        ))}
      </div>

      {tab === 'signals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SentimentCard label="Positive" count={sentimentBreakdown.positive} total={total} color="#c8f060" />
            <SentimentCard label="Mixed" count={sentimentBreakdown.mixed} total={total} color="#f0a860" />
            <SentimentCard label="Skeptical" count={sentimentBreakdown.skeptical} total={total} color="#f060a0" />
            <SentimentCard label="Neutral" count={sentimentBreakdown.neutral} total={total} color="#6b7280" />
          </div>

          <div className="space-y-3">
            {topSignals.map((signal, i) => (
              <div key={i} className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-4 flex gap-4 items-start">
                <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{signal.icon}</span>
                <p
                  className="text-sm text-[#d1d5db] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: signal.text }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'keywords' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-white">Primary</h3>
              <span className="text-xs text-[#4b5563]">Lead with these in paid ads and SEO headlines</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.primary.map((kw) => <KeywordChip key={kw} label={kw} size="primary" />)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-white">Secondary</h3>
              <span className="text-xs text-[#4b5563]">Ad copy, meta descriptions, landing page body</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.secondary.map((kw) => <KeywordChip key={kw} label={kw} size="secondary" />)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-white">Long-tail</h3>
              <span className="text-xs text-[#4b5563]">Content marketing, blog posts, SEO depth</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.tertiary.map((kw) => <KeywordChip key={kw} label={kw} size="tertiary" />)}
            </div>
          </div>
        </div>
      )}

      {tab === 'gtm' && (
        <div className="space-y-4">
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
            <p className="text-xs text-[#c8f060] font-semibold mb-2 uppercase tracking-wider">Positioning</p>
            <p className="text-sm text-[#d1d5db] leading-relaxed">{gtm.positioning}</p>
          </div>

          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
            <p className="text-xs text-[#60c8f0] font-semibold mb-2 uppercase tracking-wider">Lead Segment</p>
            <p className="text-sm text-[#d1d5db] leading-relaxed">{gtm.targetSegment}</p>
          </div>

          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
            <p className="text-xs text-[#f0a860] font-semibold mb-2 uppercase tracking-wider">Channels</p>
            <p className="text-sm text-[#d1d5db] leading-relaxed">{gtm.channel}</p>
          </div>

          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
            <p className="text-xs text-[#c090f0] font-semibold mb-2 uppercase tracking-wider">Messaging Hooks</p>
            <ul className="space-y-2">
              {gtm.messaging.split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#d1d5db]">
                  <span className="text-[#c090f0] mt-0.5 flex-shrink-0">→</span>
                  <span className="leading-relaxed">{line.replace(/^Line \d+:\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
            <p className="text-xs text-[#f060a0] font-semibold mb-2 uppercase tracking-wider">Objections to Address</p>
            <ul className="space-y-2">
              {gtm.objections.split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#d1d5db]">
                  <span className="text-[#f060a0] mt-0.5 flex-shrink-0">!</span>
                  <span className="leading-relaxed">{line.replace(/^Line \d+:\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#c8f060]/5 border border-[#c8f060]/20 rounded-xl p-5">
            <p className="text-xs text-[#c8f060] font-semibold mb-2 uppercase tracking-wider">First Thing to Test</p>
            <p className="text-sm text-[#d1d5db] leading-relaxed">{gtm.testPriority}</p>
          </div>
        </div>
      )}
    </div>
  );
}
