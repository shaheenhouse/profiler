import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateDesign, isGeminiConfigured } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'AI is not configured. Please add GEMINI_API_KEY to your environment variables.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { prompt, width, height, referenceImage } = body;

    if (!prompt || !width || !height) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, width, height' },
        { status: 400 }
      );
    }

    const designJSON = await generateDesign(prompt, width, height, referenceImage);

    return NextResponse.json({ designJSON });
  } catch (error: any) {
    console.error('AI design generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate design' },
      { status: 500 }
    );
  }
}
