'use client';

import React, { useState } from 'react';
import { Zap, Sparkles, Globe, FileText } from 'lucide-react';

interface InputPanelProps {
  onSubmit: (productDescription: string) => void;
  isRunning: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onSubmit, isRunning }) => {
  const [product, setProduct] = useState('');
  const canSubmit = product.trim().length > 10 && !isRunning;

  return (
    <div className="edge-hero-bg rounded-2xl p-6 md:p-8">
      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={28} className="text-purple-400" />
          <h1 className="text-3xl md:text-4xl font-black tracking-tight edge-gradient-text">
            Prova
          </h1>
        </div>
        <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">
          Synthetic Audience Intelligence
        </p>
        <p className="text-gray-500 text-xs mt-2 max-w-md mx-auto">
          Simulate how real people react to your product before you launch.
          7 AI personas. Honest feedback. Go-to-market strategy. In under a minute.
        </p>
      </div>

      {/* Input area */}
      <div className="edge-card rounded-xl p-5 space-y-4 max-w-2xl mx-auto">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
            <FileText size={14} className="text-purple-400" />
            What&apos;s your product?
          </label>
          <textarea
            className="w-full h-28 bg-gray-900/50 border border-gray-700/50 focus:border-purple-500 focus:outline-none transition-colors text-sm text-gray-200 placeholder:text-gray-600 rounded-lg p-3 resize-none"
            placeholder="Describe your product, paste a URL, or drop in your pitch... The more detail, the sharper the feedback."
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            disabled={isRunning}
          />
        </div>

        <button
          className={`edge-btn-primary w-full py-3 rounded-lg text-sm flex items-center justify-center gap-2 ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={() => canSubmit && onSubmit(product.trim())}
          disabled={!canSubmit}
        >
          {isRunning ? (
            <><span className="spinner" /> Analyzing...</>
          ) : (
            <><Zap size={16} /> Launch Audience Panel</>
          )}
        </button>

        {!isRunning && (
          <div className="flex items-center justify-center gap-4 text-[0.65rem] text-gray-500 font-medium">
            <span className="flex items-center gap-1"><Globe size={10} /> Works with any product</span>
            <span>•</span>
            <span>7 AI personas</span>
            <span>•</span>
            <span>~60 seconds</span>
          </div>
        )}
      </div>
    </div>
  );
};
