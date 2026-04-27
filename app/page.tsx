'use client';

import { useState, useCallback } from 'react';
import { AppPhase, Persona, PersonaFeedback, SynthesisReport } from '@/types';
import PhaseBar from '@/components/PhaseBar';
import InputPanel from '@/components/InputPanel';
import PersonaGrid from '@/components/PersonaGrid';
import FeedbackStream from '@/components/FeedbackStream';
import SynthesisReportComponent from '@/components/SynthesisReport';

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('idle');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [feedbacks, setFeedbacks] = useState<PersonaFeedback[]>([]);
  const [report, setReport] = useState<SynthesisReport | null>(null);
  const [error, setError] = useState('');
  const [skippedCount, setSkippedCount] = useState(0);
  const [productDescription, setProductDescription] = useState('');

  const reset = useCallback(() => {
    setPhase('idle');
    setPersonas([]);
    setFeedbacks([]);
    setReport(null);
    setError('');
    setSkippedCount(0);
    setProductDescription('');
  }, []);

  const run = useCallback(async (description: string) => {
    setProductDescription(description);
    setError('');
    setPersonas([]);
    setFeedbacks([]);
    setReport(null);
    setSkippedCount(0);

    // Phase 1: generate personas
    setPhase('building-panel');
    let generatedPersonas: Persona[] = [];

    try {
      const res = await fetch('/api/generate-personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDescription: description, panelSize: 7 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate personas');
      generatedPersonas = data.personas;
      setPersonas(generatedPersonas);
      setPhase('panel-ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build panel');
      setPhase('error');
      return;
    }

    // Small pause so user can see the panel before feedback starts
    await new Promise((r) => setTimeout(r, 600));

    // Phase 2: gather feedback sequentially
    setPhase('gathering-feedback');
    const collectedFeedbacks: PersonaFeedback[] = [];
    let skipped = 0;

    for (const persona of generatedPersonas) {
      try {
        const res = await fetch('/api/get-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ persona, productDescription: description }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get feedback');
        collectedFeedbacks.push(data.feedback);
        setFeedbacks((prev) => [...prev, data.feedback]);
      } catch (err) {
        console.warn(`Skipped persona ${persona.name}:`, err);
        skipped++;
        setSkippedCount((n) => n + 1);
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    if (collectedFeedbacks.length === 0) {
      setError('All persona feedback calls failed. Please try again.');
      setPhase('error');
      return;
    }

    // Phase 3: synthesize
    setPhase('synthesizing');

    try {
      const personasWithFeedback = generatedPersonas.filter((p) =>
        collectedFeedbacks.some((f) => f.personaId === p.id)
      );

      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: description,
          personas: personasWithFeedback,
          feedbacks: collectedFeedbacks,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to synthesize');
      setReport(data.report);
      setPhase('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to synthesize report');
      setPhase('error');
    }
  }, []);

  const isLoading = ['building-panel', 'panel-ready', 'gathering-feedback', 'synthesizing'].includes(phase);

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {phase === 'idle' ? (
          <InputPanel onSubmit={run} isLoading={isLoading} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <PhaseBar phase={phase} />
              <button
                onClick={reset}
                className="text-xs text-[#6b7280] hover:text-[#9ca3af] border border-[#2a2a3a] hover:border-[#3a3a4a] px-3 py-1.5 rounded-lg transition-colors"
              >
                ← New product
              </button>
            </div>

            {productDescription && (
              <div className="mb-6 bg-[#12121a] border border-[#2a2a3a] rounded-xl px-4 py-3">
                <p className="text-xs text-[#4b5563] mb-1">Product</p>
                <p className="text-sm text-[#9ca3af] line-clamp-2">{productDescription}</p>
              </div>
            )}

            {phase === 'error' && (
              <div className="mb-6 bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-4 flex items-start gap-3">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-red-400 font-medium">Something went wrong</p>
                  <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
                  <button
                    onClick={() => run(productDescription)}
                    className="mt-2 text-xs text-red-400 underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {personas.length > 0 && (
                <PersonaGrid personas={personas} isBuilding={phase === 'building-panel'} />
              )}
              {phase === 'building-panel' && personas.length === 0 && (
                <PersonaGrid personas={[]} isBuilding />
              )}

              {(feedbacks.length > 0 || phase === 'gathering-feedback') && (
                <FeedbackStream
                  personas={personas}
                  feedbacks={feedbacks}
                  isGathering={phase === 'gathering-feedback'}
                  skippedCount={skippedCount}
                />
              )}

              {report && phase === 'complete' && (
                <SynthesisReportComponent report={report} />
              )}

              {phase === 'synthesizing' && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#6b7280]">
                  <div className="w-8 h-8 border-2 border-[#c8f060] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Synthesizing insights from {feedbacks.length} respondents...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
