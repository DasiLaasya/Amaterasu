import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // Check Supabase session first
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  let user: any = null;
  
  if (supabaseUser) {
    user = {
      id: supabaseUser.id,
      name: supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email,
      role: 'USER',
      avatarUrl: null,
      streak: 1,
    };
  } else {
    // Fallback to legacy mock auth session for testing
    user = await getCurrentUser();
  }

  if (!user) {
    redirect('/');
  }

  // Parse target exams IDs and fetch details
  let targetExamsList: { id: string; name: string; code: string }[] = [];
  if (user.targetExams) {
    try {
      const examIds = JSON.parse(user.targetExams) as string[];
      if (examIds.length > 0) {
        targetExamsList = await prisma.exam.findMany({
          where: { id: { in: examIds } },
          select: { id: true, name: true, code: true },
        });
      }
    } catch (e) {
      console.error('Error parsing target exams:', e);
    }
  }

  // Fetch recent notifications safely
  let notifications: any[] = [];
  try {
    const notificationsDb = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    notifications = notificationsDb.map((n: any) => ({
      id: n.id,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  } catch (e) {
    console.error('Error fetching notifications:', e);
  }

  // Create serializable user object
  const serializableUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    streak: user.streak,
  };

  return (
    <AppShell 
      user={serializableUser} 
      notifications={notifications} 
      targetExamsList={targetExamsList}
    >
      {children}
    </AppShell>
  );
}
