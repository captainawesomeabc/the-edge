import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are a product analyst. Your only job is to extract what a product IS from a webpage — not to analyze the website, critique the copy, or describe the page design. Return only a plain-text product description suitable as input for audience research. No bullets, no headers, no markdown, no preamble.`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
      messages: [
        {
          role: 'user',
          content: `Visit this URL and extract a clear, factual description of the product or service being offered: ${url}

Write 3-5 sentences covering: what it is, who it's for, what problem it solves, and any key differentiators or features. Write it as a product brief, not a website summary. Do not mention the website design, navigation, page structure, or anything about the site itself. Only describe the product.`,
        },
      ],
    });

    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    if (!textContent) {
      return NextResponse.json({ error: 'Could not extract product description' }, { status: 500 });
    }

    return NextResponse.json({ description: textContent });
  } catch (err) {
    console.error('import-url error:', err);
    return NextResponse.json({ error: 'Failed to import URL' }, { status: 500 });
  }
}
