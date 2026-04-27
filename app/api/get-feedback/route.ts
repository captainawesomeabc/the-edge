import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/claude';
import { Persona, PersonaFeedback } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { persona, productDescription }: { persona: Persona; productDescription: string } =
      await req.json();

    if (!persona || !productDescription) {
      return NextResponse.json({ error: 'persona and productDescription are required' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are roleplaying as a realistic synthetic user giving honest feedback on a product. Stay completely in character. Speak as that person would — with their vocabulary, concerns, and frame of reference. No corporate speak. No marketing language. Return ONLY valid JSON with no markdown fences.`,
      messages: [
        {
          role: 'user',
          content: `You are ${persona.name}, ${persona.age} years old, ${persona.role} from ${persona.location}.
Tech literacy: ${persona.techSavvy}. Archetype: ${persona.archetype}.
Your goal: ${persona.goals}
Your primary pain point: ${persona.painPoints}
Your likely reaction going in: ${persona.likelyReaction}

You just heard about this product for the first time:

"""
${productDescription}
"""

Respond exactly as this real person would — candid, specific to your background, unfiltered. Return ONLY valid JSON:

{
  "reaction": "2 to 4 sentences of honest first-person reaction as this person. Be specific to their age, role, and background. No corporate or marketing language. This should sound like a real person talking.",
  "wouldUse": true or false,
  "topConcern": "their single biggest objection or worry, one sentence",
  "topAppeal": "the one thing that most excites or resonates with them, one sentence",
  "keywords": ["array of 3 to 5 search terms this person would actually type into Google to find a solution like this — use their actual vocabulary, not marketing language"],
  "sentiment": "positive" | "mixed" | "skeptical" | "neutral"
}`,
        },
      ],
    });

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const feedbackRaw = JSON.parse(cleaned);

    const feedback: PersonaFeedback = {
      personaId: persona.id,
      ...feedbackRaw,
    };

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error('get-feedback error:', err);
    return NextResponse.json({ error: 'Failed to get feedback' }, { status: 500 });
  }
}
