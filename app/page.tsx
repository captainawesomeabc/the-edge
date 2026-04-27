'use client';

import React, { useState, useRef, useCallback } from 'react';
import { InputPanel } from '@/components/InputPanel';
import { PhaseBar } from '@/components/PhaseBar';
import { PersonaGrid } from '@/components/PersonaGrid';
import { SynthesisReportView } from '@/components/SynthesisReport';
import type { Persona, PersonaFeedback, SynthesisReport, AppPhase } from '@/types';

async function apiFetch(endpoint: string, body: any) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('idle');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [feedbacks, setFeedbacks] = useState<PersonaFeedback[]>([]);
  const [report, setReport] = useState<SynthesisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = true;
    setPhase('idle');
    setPersonas([]);
    setFeedbacks([]);
    setReport(null);
    setError(null);
    setActiveFeedbackId(null);
    setTimeout(() => { abortRef.current = false; }, 100);
  }, []);

  const runPipeline = useCallback(async (productDescription: string) => {
    abortRef.current = false;
    setPhase('building-panel');
    setPersonas([]);
    setFeedbacks([]);
    setReport(null);
    setError(null);

    try {
      // Phase 1: Generate personas
      const { personas: generatedPersonas } = await apiFetch('/api/generate-personas', {
        productDescription,
        panelSize: 7,
      });
      if (abortRef.current) return;
      setPersonas(generatedPersonas);

      // Phase 2: Gather feedback
      setPhase('gathering-feedback');
      const allFeedbacks: PersonaFeedback[] = [];

      for (const persona of generatedPersonas) {
        if (abortRef.current) return;
        setActiveFeedbackId(persona.id);
        const { feedback } = await apiFetch('/api/get-feedback', { persona, productDescription });
        if (abortRef.current) return;
        allFeedbacks.push(feedback);
        setFeedbacks([...allFeedbacks]);
      }
      setActiveFeedbackId(null);

      // Phase 3: Synthesize
      if (abortRef.current) return;
      setPhase('synthesizing');
      const { report: synthesisReport } = await apiFetch('/api/synthesize', {
        productDescription,
        personas: generatedPersonas,
        feedbacks: allFeedbacks,
      });
      if (abortRef.current) return;
      setReport(synthesisReport);
      setPhase('complete');
    } catch (err) {
      if (abortRef.current) return;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setPhase('error');
    }
  }, []);

  const isRunning = phase === 'building-panel' || phase === 'gathering-feedback' || phase === 'synthesizing';

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto space-y-5 pb-20">
      <InputPanel onSubmit={runPipeline} isRunning={isRunning} />

      {phase !== 'idle' && <PhaseBar phase={phase} personaCount={personas.length} feedbackCount={feedbacks.length} />}

      {error && (
        <div className="edge-card rounded-xl p-4" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <p className="text-sm text-red-400"><span className="font-semibold">Error:</span> {error}</p>
        </div>
      )}

      <PersonaGrid personas={personas} feedbacks={feedbacks} activeFeedbackId={activeFeedbackId} />

      {report && <SynthesisReportView report={report} />}

      {(phase === 'complete' || phase === 'error') && (
        <div className="flex justify-center">
          <button
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-500 hover:text-purple-400 border border-gray-700 hover:border-purple-500/30 rounded-lg transition-all"
            onClick={reset}
          >
            ↺ Run Another Panel
          </button>
        </div>
      )}
    </main>
  );
}
