import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatarUrl, targetExams } = await request.json();
    const updateData: any = {};

    if (name) updateData.name = name;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    if (targetExams !== undefined) {
      if (Array.isArray(targetExams)) {
        updateData.targetExams = JSON.stringify(targetExams);
      } else {
        return NextResponse.json({ error: 'targetExams must be an array' }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
        targetExams: updatedUser.targetExams,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating profile' },
      { status: 500 }
    );
  }
}
