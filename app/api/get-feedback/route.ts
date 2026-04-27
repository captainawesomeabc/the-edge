import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { persona, productDescription } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are roleplaying as a realistic synthetic user giving honest feedback on a product. Stay completely in character. Speak as that person would — with their vocabulary, concerns, and frame of reference. No corporate speak. No marketing language. Return ONLY valid JSON.',
        },
        {
          role: 'user',
          content: `You are ${persona.name}, ${persona.age} years old, ${persona.role} from ${persona.location}.
Tech literacy: ${persona.techSavvy}. Archetype: ${persona.archetype}.
Your goal: ${persona.goals}
Your primary pain point: ${persona.painPoints}
Your likely reaction going in: ${persona.likelyReaction}

You just heard about this product for the first time:

"""${productDescription}"""

Respond exactly as this real person would — candid, specific to your background, unfiltered. Return ONLY valid JSON with this shape:

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

    const raw = completion.choices[0].message.content || '{}';
    const feedback = JSON.parse(raw);
    feedback.personaId = persona.id;

    return NextResponse.json({ feedback });
  } catch (error: any) {
    console.error('Get feedback error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get feedback' }, { status: 500 });
  }
}
