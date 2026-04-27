import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/claude';
import { Persona } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { productDescription, panelSize = 7 } = await req.json();

    if (!productDescription) {
      return NextResponse.json({ error: 'productDescription is required' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are a market research expert who creates highly realistic synthetic user personas. You deeply understand human psychology, demographics, and behavioral archetypes. Return ONLY valid JSON with no markdown fences, no preamble, no commentary.`,
      messages: [
        {
          role: 'user',
          content: `Create ${panelSize} diverse synthetic user personas who might encounter this product:

"""
${productDescription}
"""

Return ONLY a JSON array. Each object must follow this exact shape:
{
  "name": "First Last",
  "age": number between 22 and 72,
  "role": "job title or life role",
  "location": "City, State abbreviation",
  "techSavvy": "low" | "medium" | "high",
  "archetype": one of: "early adopter" | "skeptic" | "mainstream" | "power user" | "non-tech" | "budget-conscious" | "enterprise" | "casual",
  "goals": "one sentence — their goal that is directly relevant to this product",
  "painPoints": "one sentence — their pain point that is directly relevant to this product",
  "likelyReaction": "positive" | "mixed" | "skeptical" | "neutral"
}

Diversity requirements — the panel MUST include:
- A range of ages: at least one under 30, at least one over 55
- At least one person with low tech literacy
- At least one skeptic archetype
- At least one power user or early adopter
- Gender diversity across the panel
- Geographic diversity (not all major cities)
- At least one non-professional (student, retiree, caregiver, etc.)
- A mix of income/role levels

Make every persona specific and believable. Their goals and pain points must connect directly to this specific product — not be generic. No two personas should feel like the same person.`,
        },
      ],
    });

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const personasRaw: Omit<Persona, 'id'>[] = JSON.parse(cleaned);

    const personas: Persona[] = personasRaw.map((p, i) => ({
      ...p,
      id: `persona-${i}-${Date.now()}`,
    }));

    return NextResponse.json({ personas });
  } catch (err) {
    console.error('generate-personas error:', err);
    return NextResponse.json({ error: 'Failed to generate personas' }, { status: 500 });
  }
}
