'use client';

import { useState } from 'react';

interface Props {
  onSubmit: (description: string) => void;
  isLoading: boolean;
}

const PERSONA_COLORS = [
  { bg: 'rgba(200,240,96,0.15)', text: '#b8d840' },
  { bg: 'rgba(96,200,240,0.15)', text: '#60c8f0' },
  { bg: 'rgba(240,168,96,0.15)', text: '#f0a860' },
];

export default function InputPanel({ onSubmit, isLoading }: Props) {
  const [mode, setMode] = useState<'text' | 'url'>('text');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) return;
    setImporting(true);
    setImportError('');
    setImportSuccess(false);

    try {
      const res = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setDescription(data.description);
      setMode('text');
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import URL');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = () => {
    const text = description.trim();
    if (!text || isLoading) return;
    onSubmit(text);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="flex justify-center gap-3 mb-4">
          {PERSONA_COLORS.map((c, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: c.bg, color: c.text, border: `1px solid ${c.text}30` }}
            >
              {['A', 'B', 'C'][i]}
            </div>
          ))}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Synthetic Audience Agent</h1>
        <p className="text-[#6b7280] text-sm">
          Simulate real audience reactions before you launch. Powered by Claude.
        </p>
      </div>

      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-6">
        <div className="flex gap-1 mb-5 p-1 bg-[#0a0a0f] rounded-lg">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'text'
                ? 'bg-[#1a1a26] text-white shadow'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            Describe it
          </button>
          <button
            onClick={() => setMode('url')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'url'
                ? 'bg-[#1a1a26] text-white shadow'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            Drop a URL
          </button>
        </div>

        {mode === 'text' ? (
          <>
            {importSuccess && (
              <div className="mb-3 px-3 py-2 bg-[#c8f060]/10 border border-[#c8f060]/30 rounded-lg text-xs text-[#c8f060] flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                URL imported — description extracted. Edit if needed.
              </div>
            )}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product... What does it do? Who's it for? What problem does it solve?"
              rows={6}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-[#e2e8f0] placeholder-[#4b5563] text-sm resize-none focus:outline-none focus:border-[#c8f060]/50 focus:ring-1 focus:ring-[#c8f060]/20 transition-colors"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-[#4b5563]">{description.length} characters</span>
              <button
                onClick={handleSubmit}
                disabled={!description.trim() || isLoading}
                className="px-6 py-2.5 bg-[#c8f060] text-black font-semibold text-sm rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4f570] active:bg-[#b8e050] transition-colors"
              >
                {isLoading ? 'Building panel...' : 'Run audience panel →'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                placeholder="https://your-product.com"
                className="flex-1 bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-[#e2e8f0] placeholder-[#4b5563] text-sm focus:outline-none focus:border-[#c8f060]/50 focus:ring-1 focus:ring-[#c8f060]/20 transition-colors"
              />
              <button
                onClick={handleImport}
                disabled={!url.trim() || importing}
                className="px-5 py-3 bg-[#1a1a26] border border-[#2a2a3a] text-white text-sm font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#c8f060]/40 transition-colors whitespace-nowrap"
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-[#c8f060] border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </span>
                ) : (
                  'Import'
                )}
              </button>
            </div>
            {importError && (
              <p className="mt-2 text-xs text-red-400">{importError}</p>
            )}
            <p className="mt-3 text-xs text-[#4b5563]">
              Claude will visit the URL and extract a product description. You can edit before running.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
