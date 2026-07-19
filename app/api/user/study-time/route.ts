import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId, seconds } = await request.json();

    if (!seconds || typeof seconds !== 'number') {
      return NextResponse.json({ error: 'seconds parameter must be a valid number' }, { status: 400 });
    }

    // Persist study session interval in relational StudyLog
    const studyLog = await prisma.studyLog.create({
      data: {
        userId: user.id,
        topicId: topicId || null,
        seconds,
      },
    });

    return NextResponse.json({ success: true, studyLog });
  } catch (error) {
    console.error('Study log heartbeat endpoint error:', error);
    return NextResponse.json({ error: 'Failed to record study heartbeat' }, { status: 500 });
  }
}
