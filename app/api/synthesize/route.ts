import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/claude';
import { Persona, PersonaFeedback } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const {
      productDescription,
      personas,
      feedbacks,
    }: {
      productDescription: string;
      personas: Persona[];
      feedbacks: PersonaFeedback[];
    } = await req.json();

    if (!productDescription || !personas?.length || !feedbacks?.length) {
      return NextResponse.json({ error: 'productDescription, personas, and feedbacks are required' }, { status: 400 });
    }

    const feedbackSummary = personas
      .map((p, i) => {
        const f = feedbacks[i];
        if (!f) return null;
        return `${p.name} (${p.role}, age ${p.age}, ${p.techSavvy} tech literacy):
- Reaction: ${f.reaction}
- Would use: ${f.wouldUse}
- Top concern: ${f.topConcern}
- Top appeal: ${f.topAppeal}
- Sentiment: ${f.sentiment}
- Keywords they'd search: ${f.keywords.join(', ')}`;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are a senior go-to-market strategist with deep experience in product launches, audience research, and growth marketing. You synthesize qualitative panel data into clear, actionable strategy. Return ONLY valid JSON with no markdown fences.`,
      messages: [
        {
          role: 'user',
          content: `Product:
"""
${productDescription}
"""

Panel feedback (${feedbacks.length} respondents):
${feedbackSummary}

Synthesize this panel into a strategic report. Return ONLY valid JSON:

{
  "sentimentBreakdown": {
    "positive": number,
    "mixed": number,
    "skeptical": number,
    "neutral": number
  },
  "topSignals": [
    {
      "icon": "single emoji that represents this signal",
      "text": "1 to 2 sentence insight from the panel. Wrap key terms or phrases in <strong> tags."
    }
  ],
  "keywords": {
    "primary": ["3 to 4 highest-priority search terms — lead with these in paid ads and SEO headlines"],
    "secondary": ["4 to 6 supporting terms — use in ad copy, meta descriptions, and landing page body"],
    "tertiary": ["4 to 6 long-tail terms — use for content marketing, blog posts, and SEO depth"]
  },
  "gtm": {
    "positioning": "2 to 3 sentences on how to position this product based on what the panel responded to most strongly",
    "targetSegment": "Who to lead with in the first wave of marketing — the warmest segment from the panel, described specifically, and why they are the beachhead",
    "channel": "Top 2 to 3 channels where this audience actually lives, with a brief rationale for each based on panel demographics",
    "messaging": "Line 1: first specific messaging hook\\nLine 2: second specific messaging hook\\nLine 3: third specific messaging hook\\nLine 4: fourth specific messaging hook",
    "objections": "Line 1: first key objection to address upfront in marketing\\nLine 2: second key objection\\nLine 3: third key objection",
    "testPriority": "1 to 2 sentences describing the single most important thing to test first in order to validate or invalidate the core thesis"
  }
}

The topSignals array must contain exactly 5 signals.`,
        },
      ],
    });

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const report = JSON.parse(cleaned);

    return NextResponse.json({ report });
  } catch (err) {
    console.error('synthesize error:', err);
    return NextResponse.json({ error: 'Failed to synthesize report' }, { status: 500 });
  }
}
