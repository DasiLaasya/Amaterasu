import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Calculate study streak dynamically from StudyLogs
    const allStudyLogs = await prisma.studyLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const uniqueDates = Array.from(
      new Set(allStudyLogs.map((log: any) => log.createdAt.toISOString().split('T')[0]))
    );

    let streak = 0;
    let checkDate = new Date();

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today is empty, check if yesterday was completed before breaking
        if (streak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = checkDate.toISOString().split('T')[0];
          if (uniqueDates.includes(yesterdayStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    // Update user streak in the database if it changed
    if (streak !== user.streak) {
      await prisma.user.update({
        where: { id: user.id },
        data: { streak },
      });
    }

    // 2. Get completed test sessions & coding attempts
    const completedSessions = await prisma.testSession.findMany({
      where: { userId: user.id, status: 'COMPLETED' },
      include: {
        answers: {
          include: {
            question: {
              include: {
                topic: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 3. Aggregate metrics by Topic
    const topicStats: Record<string, { total: number; correct: number; name: string; subjectName: string }> = {};
    let totalQuestionsAnswered = 0;
    let totalCorrectAnswers = 0;

    completedSessions.forEach(session => {
      session.answers.forEach(ans => {
        totalQuestionsAnswered++;
        if (ans.isCorrect) totalCorrectAnswers++;

        const topic = ans.question.topic;
        if (!topicStats[topic.id]) {
          topicStats[topic.id] = {
            total: 0,
            correct: 0,
            name: topic.name,
            subjectName: topic.subject.name,
          };
        }

        topicStats[topic.id].total++;
        if (ans.isCorrect) {
          topicStats[topic.id].correct++;
        }
      });
    });

    const weakTopics: { id: string; name: string; accuracy: number; subjectName: string }[] = [];
    const strongTopics: { id: string; name: string; accuracy: number; subjectName: string }[] = [];

    Object.entries(topicStats).forEach(([topicId, stats]) => {
      const accuracy = Math.round((stats.correct / stats.total) * 100);
      const data = { id: topicId, name: stats.name, accuracy, subjectName: stats.subjectName };
      if (accuracy < 60) {
        weakTopics.push(data);
      } else if (accuracy >= 80) {
        strongTopics.push(data);
      }
    });

    weakTopics.sort((a, b) => a.accuracy - b.accuracy);
    strongTopics.sort((a, b) => b.accuracy - a.accuracy);

    // 4. Calculate study effort last 7 days dynamically
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyLogs = await prisma.studyLog.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyHours: Record<string, number> = {};

    // Initialize map of last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      dailyHours[dayName] = 0;
    }

    weeklyLogs.forEach(log => {
      const dayName = daysOfWeek[log.createdAt.getDay()];
      if (dailyHours[dayName] !== undefined) {
        dailyHours[dayName] += log.seconds / 3600;
      }
    });

    const weeklyTrend = Object.entries(dailyHours).map(([day, hours]) => ({
      day,
      hours: parseFloat(hours.toFixed(1)),
    }));

    const weeklyStudyHours = weeklyTrend.reduce((sum, d) => sum + d.hours, 0);

    // 5. Dynamic leaderboard generation based on study logs, streaks, and quiz completion
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        streak: true,
        avatarUrl: true,
        studyLogs: { select: { seconds: true } },
        testSessions: { where: { status: 'COMPLETED' }, select: { id: true } },
      },
    });

    const rankedUsers = allUsers.map(u => {
      const totalStudySecs = u.studyLogs.reduce((sum, log) => sum + log.seconds, 0);
      const points = (u.testSessions.length * 100) + Math.round(totalStudySecs / 60) + (u.streak * 50);
      return {
        id: u.id,
        name: u.name,
        streak: u.streak,
        avatarUrl: u.avatarUrl,
        points,
      };
    });

    // Sort by descending score
    rankedUsers.sort((a, b) => b.points - a.points);

    const leaderboard = rankedUsers.slice(0, 5).map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      streak: u.streak,
      avatarUrl: u.avatarUrl,
      isCurrentUser: u.id === user.id,
    }));

    // Check if current user is not in top 5, append them at bottom
    const userInLeaderboard = leaderboard.some(u => u.isCurrentUser);
    if (!userInLeaderboard) {
      const userRankIdx = rankedUsers.findIndex(u => u.id === user.id);
      if (userRankIdx !== -1) {
        const u = rankedUsers[userRankIdx];
        leaderboard.push({
          rank: userRankIdx + 1,
          name: u.name,
          streak: u.streak,
          avatarUrl: u.avatarUrl,
          isCurrentUser: true,
        });
      }
    }

    // 6. Recommended next topic
    let recommendedTopic = null;
    let targetExamsList: string[] = [];
    if (user.targetExams) {
      try {
        targetExamsList = JSON.parse(user.targetExams);
      } catch (e) {}
    }

    if (targetExamsList.length > 0) {
      const targetTopics = await prisma.topic.findMany({
        where: {
          subject: {
            examId: { in: targetExamsList },
          },
        },
        include: {
          subject: true,
        },
      });

      if (targetTopics.length > 0) {
        // Recommend weak topic first
        if (weakTopics.length > 0) {
          const weakestTopicId = weakTopics[0].id;
          const found = targetTopics.find(t => t.id === weakestTopicId);
          if (found) {
            recommendedTopic = {
              id: found.id,
              name: found.name,
              subjectName: found.subject.name,
              reason: 'Needs improvement (accuracy below 60%)',
            };
          }
        }

        // Recommend untested topic next
        if (!recommendedTopic) {
          const untestedTopic = targetTopics.find(topic => !topicStats[topic.id]);
          if (untestedTopic) {
            recommendedTopic = {
              id: untestedTopic.id,
              name: untestedTopic.name,
              subjectName: untestedTopic.subject.name,
              reason: 'Unexplored (start learning this topic)',
            };
          }
        }

        // Fallback to first topic
        if (!recommendedTopic) {
          recommendedTopic = {
            id: targetTopics[0].id,
            name: targetTopics[0].name,
            subjectName: targetTopics[0].subject.name,
            reason: 'Next in sequence',
          };
        }
      }
    }

    // 7. Recent mock test evaluations
    const mockTests = await prisma.mockTest.findMany({
      where: { id: { in: completedSessions.map(s => s.mockTestId) } },
    });

    const recentTests = completedSessions.map(session => {
      const mt = mockTests.find(t => t.id === session.mockTestId);
      const sessAnsCorrect = session.answers.filter(a => a.isCorrect).length;
      return {
        id: session.id,
        title: mt ? mt.title : 'Mock Practice Exam',
        score: session.score,
        accuracy: session.answers.length > 0 ? Math.round((sessAnsCorrect / session.answers.length) * 100) : 0,
        completedAt: session.completedAt?.toISOString() || new Date().toISOString(),
      };
    });

    const overallAccuracy = totalQuestionsAnswered > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
      : 0;

    return NextResponse.json({
      streak,
      studyHoursThisWeek: parseFloat(weeklyStudyHours.toFixed(1)),
      overallAccuracy,
      totalQuizzesAttempted: completedSessions.length,
      weakTopics: weakTopics.slice(0, 3),
      strongTopics: strongTopics.slice(0, 3),
      leaderboard,
      recommendedTopic,
      weeklyTrend,
      recentTests: recentTests.slice(0, 3),
    });
  } catch (error) {
    console.error('Dynamic analytics fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while loading analytics' },
      { status: 500 }
    );
  }
}
