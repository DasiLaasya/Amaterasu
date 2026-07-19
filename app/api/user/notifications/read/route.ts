import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating notifications' },
      { status: 500 }
    );
  }
}
