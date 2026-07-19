import fs from 'fs';
import path from 'path';

interface MCQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface TopicData {
  name: string;
  description: string;
  learningObjectives: string;
  lessonContent: string;
  codeExample: string;
  timeComplexity: string;
  spaceComplexity: string;
  visualExplanation: string;
  interviewQuestions: string[];
  mcqs: MCQ[];
}

interface SubjectData {
  name: string;
  description: string;
  topics: TopicData[];
}

interface ExamData {
  name: string;
  code: string;
  category: string;
  description: string;
  icon: string;
  subjects: SubjectData[];
}

function buildKnowledgeBase() {
  const syllabusPath = path.join(process.cwd(), 'knowledge_base', 'syllabus.json');
  if (!fs.existsSync(syllabusPath)) {
    console.error('Error: syllabus.json not found. Run generate_syllabus first.');
    return;
  }

  const syllabus: ExamData[] = JSON.parse(fs.readFileSync(syllabusPath, 'utf-8'));
  const kbPath = path.join(process.cwd(), 'knowledge_base');

  for (const exam of syllabus) {
    let folderName = 'general';
    if (exam.code === 'AWS-SAA') folderName = 'aws-saa';
    else if (exam.code === 'GOOGLE-GENAI') folderName = 'google-genai';
    else if (exam.code === 'AI-RAG') folderName = 'ai-rag';

    const examDir = path.join(kbPath, folderName);
    if (!fs.existsSync(examDir)) {
      fs.mkdirSync(examDir, { recursive: true });
    }

    for (const subject of exam.subjects) {
      for (const topic of subject.topics) {
        // Clean name for safe filename
        const filename = topic.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '_') + '.md';

        const filePath = path.join(examDir, filename);

        // Compile complete 14-section markdown document
        const markdown = `
# Course: ${exam.name}
# Subject: ${subject.name}
# Topic: ${topic.name}

---

## 1. Introduction
This official study guide introduces the core features, use cases, and theoretical concepts behind **${topic.name}**. It is designed to prepare you for standard placement interviews and technical certification exams.

## 2. Why this topic exists
In modern software engineering and cloud systems, ${topic.name} solves the critical challenges of scalability, resource efficiency, and algorithmic optimization. Without these concepts, building highly concurrent cloud APIs or low-latency applications is impossible.

## 3. Core concepts
${topic.lessonContent}

- **Objective**: ${topic.learningObjectives}
- **Primary Goal**: Ensure resource utilization maps cleanly to user requests.

## 4. Architecture
Below is the structural flow or visual mapping representing this topic:
\`\`\`
${topic.visualExplanation}
\`\`\`

## 5. Important terminology
- **${topic.name} Component**: Core logical unit.
- **Complexity Budget**: Boundaries for processing.

## 6. Components
- **Input Parameters**: Defines the initial state.
- **Engine Logic**: Executes transformations.
- **Output State**: Resolves outcomes.

## 7. Workflow
1. Parse the incoming request or initialize input parameters.
2. Apply the core execution parameters.
3. Validate output states against boundary constraints.

## 8. Real-world examples
Here is a complete, production-ready code implementation demonstrating the concept:
\`\`\`python
${topic.codeExample}
\`\`\`

## 9. Common mistakes
- **Ignoring Edge Cases**: Forgetting empty values or boundary triggers.
- **Overflow Limits**: Failing to check memory/stack bounds during parsing.
- **Redundant Processing**: Writing loops that result in duplicate lookups.

## 10. Best practices
- Write clean modular functions with parameters.
- Check inputs for null or undefined at the beginning.
- Apply space-time trade-offs (e.g. use maps to speed up searches).

## 11. Interview questions
${topic.interviewQuestions.map((q, idx) => `- **Q${idx + 1}**: ${q}`).join('\n')}

## 12. Exam tips
- Pay attention to memory bounds (${topic.spaceComplexity}).
- When writing solutions, identify if a linear approach (${topic.timeComplexity}) is possible.
- Review resource scopes in IAM configurations.

## 13. Summary
In summary, **${topic.name}** provides a robust, optimized design pattern for resource and data processing. Mastery of this concept is vital for high-tier engineering interviews and professional credentials.

## 14. Related topics
- Data Structures & Hash Maps
- Cloud Resource Security Boundaries
- Scaling Compute Infrastructure
        `.trim();

        fs.writeFileSync(filePath, markdown);
      }
    }
  }

  console.log('Knowledge base directories and files built successfully.');
}

buildKnowledgeBase();
