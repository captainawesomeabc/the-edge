'use client';

import React, { useState } from 'react';
import { Sparkles, Lock, Zap, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface UnlockBannerProps {
  onUnlock: () => void;
  onActivate: () => void;
}

export const UnlockBanner: React.FC<UnlockBannerProps> = ({ onUnlock, onActivate }) => {
  const [showActivate, setShowActivate] = useState(false);

  return (
    <div className="edge-float-in">
      <div className="paywall-banner rounded-2xl p-6 md:p-8">
        {/* Decorative glow */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Lock icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Lock size={20} className="text-purple-400" />
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-100 mb-2">
              Your personas had a <span className="edge-gradient-text">lot</span> to say.
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Unlock the full report — all 7 persona responses, keyword strategy, and complete go-to-market playbook.
            </p>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
            {[
              { icon: '👥', label: 'All 7 Personas', sub: 'Full feedback revealed' },
              { icon: '🎯', label: 'Keyword Strategy', sub: 'Primary, secondary, long-tail' },
              { icon: '📋', label: 'GTM Playbook', sub: 'Positioning, channels, messaging' },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-gray-900/40 border border-gray-800/50">
                <span className="text-xl">{item.icon}</span>
                <p className="text-xs font-semibold text-gray-300 mt-1">{item.label}</p>
                <p className="text-[0.6rem] text-gray-500">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="text-center">
            <div className="mb-3">
              <span className="text-3xl font-black text-white">$79</span>
              <span className="text-sm text-gray-500 ml-2">one-time</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Unlimited analyses. Forever. No subscription.</p>
            
            <button
              onClick={onUnlock}
              className="edge-btn-primary px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mx-auto"
            >
              <Zap size={16} />
              Unlock Full Report — $79
            </button>

            <p className="text-[0.6rem] text-gray-600 mt-3 flex items-center justify-center gap-1">
              <CheckCircle size={10} /> Secure payment via Stripe
            </p>
          </div>

          {/* Already purchased toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowActivate(!showActivate)}
              className="text-[0.65rem] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1 mx-auto"
            >
              Already purchased?
              {showActivate ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            
            {showActivate && (
              <div className="mt-3 edge-float-in">
                <button
                  onClick={onActivate}
                  className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                >
                  Click here to activate your purchase
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
