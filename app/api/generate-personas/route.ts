import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { productDescription, panelSize = 7 } = await req.json();

    if (!productDescription) {
      return NextResponse.json({ error: 'Product description is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a market research expert who creates highly realistic synthetic user personas. You deeply understand human psychology, demographics, and behavioral archetypes. Return ONLY valid JSON.',
        },
        {
          role: 'user',
          content: `Create ${panelSize} diverse synthetic user personas who might encounter this product:

"""${productDescription}"""

Return a JSON object with a key "personas" containing an array. Each object must follow this exact shape:
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

    const raw = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(raw);
    const personas = (parsed.personas || parsed).map((p: any, i: number) => ({
      ...p,
      id: `persona-${i}`,
    }));

    return NextResponse.json({ personas });
  } catch (error: any) {
    console.error('Generate personas error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate personas' }, { status: 500 });
  }
}
