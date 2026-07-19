import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting SaaS production database seeding...');

  // 1. Clean existing database tables
  await prisma.studyLog.deleteMany({});
  await prisma.vectorChunk.deleteMany({});
  await prisma.testSessionAnswer.deleteMany({});
  await prisma.testSession.deleteMany({});
  await prisma.mockTest.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.flashcard.deleteMany({});
  await prisma.revisionNote.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.questionOption.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.userProgress.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database tables cleared.');

  // 2. Create Users with ZERO progress & EMPTY states
  const studentPassword = await bcrypt.hash('student123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@examprep.com',
      passwordHash: studentPassword,
      name: 'Jane Doe',
      role: 'STUDENT',
      targetExams: '[]', // Empty initially
      streak: 0,
      lastActive: new Date(),
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@examprep.com',
      passwordHash: adminPassword,
      name: 'Instructor Admin',
      role: 'ADMIN',
      targetExams: '[]', // Empty initially
      streak: 0,
      lastActive: new Date(),
    },
  });

  console.log('Seeded Student & Admin users with clean state.');

  // 3. Load syllabus data from JSON
  const syllabusPath = path.join(process.cwd(), 'knowledge_base', 'syllabus.json');
  if (!fs.existsSync(syllabusPath)) {
    throw new Error('Syllabus database file not found. Run "npx tsx scripts/generate_syllabus.ts" first.');
  }

  const syllabus = JSON.parse(fs.readFileSync(syllabusPath, 'utf-8'));

  for (const examData of syllabus) {
    console.log(`Creating Exam: ${examData.name} (${examData.code})`);
    
    const exam = await prisma.exam.create({
      data: {
        name: examData.name,
        code: examData.code,
        category: examData.category,
        description: examData.description,
        icon: examData.icon,
      },
    });

    const mockTestQuestionIds: string[] = [];

    for (const subjectData of examData.subjects) {
      const subject = await prisma.subject.create({
        data: {
          name: subjectData.name,
          description: subjectData.description,
          examId: exam.id,
        },
      });

      for (const topicData of subjectData.topics) {
        const topic = await prisma.topic.create({
          data: {
            name: topicData.name,
            description: topicData.description,
            subjectId: subject.id,
          },
        });

        // 4. Create Lessons dynamically
        const lesson = await prisma.lesson.create({
          data: {
            title: `Mastering ${topicData.name}`,
            content: topicData.lessonContent,
            type: 'TEXT',
            order: 1,
            topicId: topic.id,
          },
        });

        // 5. Create MCQs and Options
        for (const mcq of topicData.mcqs) {
          const question = await prisma.question.create({
            data: {
              text: mcq.question,
              type: 'MCQ',
              difficulty: 'MEDIUM',
              explanation: mcq.explanation,
              topicId: topic.id,
            },
          });

          mockTestQuestionIds.push(question.id);

          await prisma.questionOption.createMany({
            data: mcq.options.map((opt: string, optIdx: number) => ({
              text: opt,
              isCorrect: optIdx === mcq.correctIndex,
              questionId: question.id,
            })),
          });
        }

        // 6. Create Coding Problem if it exists
        if (topicData.coding) {
          const codingQ = await prisma.question.create({
            data: {
              text: topicData.coding.text,
              type: 'CODING',
              difficulty: topicData.coding.difficulty.toUpperCase(),
              codeTemplate: topicData.coding.codeTemplate,
              explanation: topicData.coding.explanation,
              editorial: topicData.coding.editorial,
              testCases: topicData.coding.testCases,
              companyTags: topicData.coding.companyTags,
              topicId: topic.id,
            },
          });
        }

        // 7. Seed VectorChunks for RAG
        // Main lesson chunk
        await prisma.vectorChunk.create({
          data: {
            docId: lesson.id,
            sourceName: examData.name,
            title: topicData.name,
            content: `Topic: ${topicData.name}\nObjectives: ${topicData.learningObjectives}\n\n${topicData.lessonContent}\n\nCode Example:\n${topicData.codeExample}`,
            vectorJson: JSON.stringify(generateMockVector()),
          },
        });

        // Complexity & Visuals chunk
        await prisma.vectorChunk.create({
          data: {
            docId: topic.id,
            sourceName: examData.name,
            title: `${topicData.name} - Complexity & visual flow`,
            content: `Topic Complexity & Visual Explanation of ${topicData.name}\n\nVisual Flow:\n${topicData.visualExplanation}\n\n${topicData.timeComplexity}\n${topicData.spaceComplexity}`,
            vectorJson: JSON.stringify(generateMockVector()),
          },
        });

        // Interview questions chunk
        await prisma.vectorChunk.create({
          data: {
            docId: topic.id,
            sourceName: examData.name,
            title: `${topicData.name} - Common Interview Questions`,
            content: `Interview questions for topic: ${topicData.name}\n\n${topicData.interviewQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`,
            vectorJson: JSON.stringify(generateMockVector()),
          },
        });
      }
    }

    // 8. Create Mock Tests for this exam (using seeded questions)
    if (mockTestQuestionIds.length > 0) {
      await prisma.mockTest.create({
        data: {
          title: `${examData.name} Mock Practice Exam`,
          description: `Evaluate your readiness for ${examData.name}. Full length dynamic mock test.`,
          duration: 30,
          examId: exam.id,
          questionsJson: JSON.stringify(mockTestQuestionIds.slice(0, 10)), // take first 10 questions
        },
      });
    }
  }

  console.log('Database seeding successfully finished!');
}

// Helper to generate a 128-dimensional mock unit vector for cosine similarity fallback
function generateMockVector(): number[] {
  const vec = Array.from({ length: 128 }, () => Math.random() - 0.5);
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map(v => v / (magnitude || 1));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
