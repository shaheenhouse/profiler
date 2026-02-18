import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractResumeData, isGeminiConfigured } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'AI is not configured. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { content, contentType, base64Data } = body;

    if (!contentType) {
      return NextResponse.json(
        { error: 'Missing required field: contentType (text, image, or pdf)' },
        { status: 400 }
      );
    }

    if (contentType === 'text' && !content) {
      return NextResponse.json(
        { error: 'Missing required field: content (resume text)' },
        { status: 400 }
      );
    }

    if ((contentType === 'image' || contentType === 'pdf') && !base64Data) {
      return NextResponse.json(
        { error: 'Missing required field: base64Data (file data)' },
        { status: 400 }
      );
    }

    const resumeData = await extractResumeData(content || '', contentType, base64Data);

    return NextResponse.json({ resumeData: JSON.parse(resumeData) });
  } catch (error: any) {
    console.error('AI resume extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract resume data' },
      { status: 500 }
    );
  }
}
