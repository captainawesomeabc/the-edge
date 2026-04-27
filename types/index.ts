export type Sentiment = 'positive' | 'mixed' | 'skeptical' | 'neutral';
export type TechLevel = 'low' | 'medium' | 'high';
export type Archetype = 'early adopter' | 'skeptic' | 'mainstream' | 'power user' | 'non-tech' | 'budget-conscious' | 'enterprise' | 'casual';

export interface Persona {
  id: string;
  name: string;
  age: number;
  role: string;
  location: string;
  techSavvy: TechLevel;
  archetype: Archetype;
  goals: string;
  painPoints: string;
  likelyReaction: Sentiment;
}

export interface PersonaFeedback {
  personaId: string;
  reaction: string;
  wouldUse: boolean;
  topConcern: string;
  topAppeal: string;
  keywords: string[];
  sentiment: Sentiment;
}

export interface Signal {
  icon: string;
  text: string;
}

export interface Keywords {
  primary: string[];
  secondary: string[];
  tertiary: string[];
}

export interface GTMPlan {
  positioning: string;
  targetSegment: string;
  channel: string;
  messaging: string;
  objections: string;
  testPriority: string;
}

export interface SynthesisReport {
  sentimentBreakdown: {
    positive: number;
    mixed: number;
    skeptical: number;
    neutral: number;
  };
  topSignals: Signal[];
  keywords: Keywords;
  gtm: GTMPlan;
}

export type AppPhase = 'idle' | 'building-panel' | 'gathering-feedback' | 'synthesizing' | 'complete' | 'error';
