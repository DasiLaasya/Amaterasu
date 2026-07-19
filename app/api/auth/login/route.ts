import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    // Calculate/update streak
    let updatedStreak = user.streak;
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const diffTime = now.getTime() - user.lastActive.getTime();
    
    if (diffTime > oneDay && diffTime <= oneDay * 2) {
      // Logged in the next calendar day - increment streak
      updatedStreak += 1;
    } else if (diffTime > oneDay * 2) {
      // Missed a day - reset streak
      updatedStreak = 1;
    }

    // Update user active info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActive: now,
        streak: updatedStreak,
      },
    });

    // Set cookie
    await setAuthCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak: updatedStreak,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    );
  }
}
