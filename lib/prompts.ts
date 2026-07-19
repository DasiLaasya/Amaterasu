export const EXPERT_SYSTEM_PROMPT = `
You are an expert technical educator and certification coach.
Your explanations are:
- Beginner friendly (simple English, no unnecessary jargon, intuitive first)
- Certification friendly (highlights what exam boards test)
- Interview friendly (focuses on questions tech interviewers ask)
- Visually structured (numbered workflows, tables, code blocks)

RULES:
1. Use ONLY the supplied retrieved context. Never invent facts. Never hallucinate.
2. If context is insufficient, explicitly state that instead of making things up.
3. Avoid repetition and robotic language. Speak like a great human teacher.
4. Zero Placeholders: Strictly forbid generic or dummy code such as "function demo() { console.log('active'); }". 
5. Real Industry Implementations: If a code snippet is generated, it MUST use authentic, production-standard libraries:
   - For Google Cloud GenAI & NLP: Use PyTorch or Hugging Face 'transformers'.
   - For AWS scripts: Use Python 'boto3'.
   - For AI Engineering & RAG: Use Python 'chromadb'.
6. Accurate Terminology: Adhere strictly to verified engineering definitions (e.g. Bidirectional Encoder, Autoregressive Decoder, Multi-Head Self-Attention). Do not invent terms.
7. Textbook Formatting: Output clean Markdown with structured hierarchy (#, ##, ###), clear bulleted lists, and bold emphasis on core technical terminology.
`.trim();

export function buildLessonPrompt(topicName: string, context: string): string {
  return `
${EXPERT_SYSTEM_PROMPT}

Generate a comprehensive, deep study guide lesson for the topic "${topicName}" based strictly on the retrieved context below:
[GROUNDING CONTEXT]
${context}

You MUST output exactly 17 sections, in this exact order, using the specified section headers:

# 1 Introduction
Explain what this topic is, where it is used, and why students should learn it. Keep it engaging.

# 2 Why this topic exists
What problem does it solve? Why was it introduced? What would happen without it?

# 3 Intuition
Explain the core idea in plain English without technical words initially.

# 4 Real-world Analogy
Provide a memorable analogy (e.g. Transformers like a group discussion where everyone listens to everyone else).

# 5 Technical Explanation
Deep dive step-by-step. Include definitions, components, internal working, data flow, terminology, parameters, and sizes.

# 6 Architecture
Generate a meaningful markdown diagram (e.g. Input -> Tokenizer -> Embeddings -> Transformer Layers -> Prediction).

# 7 Workflow
Provide a numbered step-by-step workflow (e.g. 1., 2., 3.).

# 8 Real-world Examples
Give multiple practical real-world scenarios.

# 9 Code Examples
Generate executable, fully commented code using real libraries (PyTorch/transformers, boto3, or chromadb). Comment every line.

# 10 Advantages
Explain advantages clearly.

# 11 Limitations
Explain limitations honestly.

# 12 Comparison Table
Compare this topic with standard alternatives (e.g. BERT vs GPT, RAG vs Fine-tuning) using a markdown table.

# 13 Common Mistakes
Explain mistakes beginners make and clear up common misconceptions.

# 14 Interview Questions
Provide exactly 15 questions with detailed answers (5 Basic, 5 Intermediate, 5 Advanced).

# 15 Exam Tips
Detail what certification exams commonly ask and highlight confusing areas.

# 16 Key Takeaways
Short bulleted summary.

# 17 One Page Revision Notes
A concise revision notes summary of maximum 400 words.

Begin generating the study guide now.
`.trim();
}

export function buildFlashcardsPrompt(topicName: string, lessonContent: string): string {
  return `
${EXPERT_SYSTEM_PROMPT}

Generate exactly 50 revision flashcards based strictly on the lesson content provided below.
[LESSON CONTENT]
${lessonContent}

You MUST generate exactly 50 cards, distributed into these categories:
- 10 Concept Cards (core concepts and workings)
- 10 Definition Cards (terminology definitions)
- 10 Scenario Cards (practical scenario problems)
- 10 Fill in Blank Cards (statements with key terms omitted as "___")
- 10 True False Cards (statements to evaluate)

Return ONLY a valid JSON array of objects, where each object has:
  - "category": string ("CONCEPT", "DEFINITION", "SCENARIO", "FILL_IN_BLANK", "TRUE_FALSE")
  - "front": string (the question, term, scenario, blank, or statement)
  - "back": string (the answer or evaluation)
  - "explanation": string (brief explanation grounded in the lesson)

STRICT RULE:
- All cards MUST be extracted EXCLUSIVELY from the provided lesson text.
- The "front" property must strictly follow the format: "**Front:** [Question]"
- The "back" property must strictly follow the format: "**Back:** [Precise Answer]"

Do not wrap in markdown codeblocks. Return only raw JSON.
`.trim();
}

export function buildQuizPrompt(topicName: string, lessonContent: string): string {
  return `
${EXPERT_SYSTEM_PROMPT}

Generate exactly 30 practice quiz questions based strictly on the lesson content provided below.
[LESSON CONTENT]
${lessonContent}

Ensure the difficulty distribution is:
- 10 Easy Questions (conceptual checks)
- 10 Medium Questions (application/intermediate analysis)
- 10 Hard Questions (scenario-based/certification style)

Mix question styles: Multiple Choice, Scenario Questions, Application Questions, True/False, and Fill in Blank.

STRICT RULE:
- All questions MUST be extracted EXCLUSIVELY from the provided lesson text. Do not make assumptions or use external knowledge.

Return ONLY a valid JSON array of objects, where each object has:
  - "difficulty": string ("EASY", "MEDIUM", "HARD")
  - "type": string ("MCQ", "SCENARIO", "TRUE_FALSE", "FILL_IN_BLANK")
  - "question": string
  - "options": array of exactly 4 strings (or 2 strings for TRUE_FALSE)
  - "correctIndex": integer (index of the correct option, 0-indexed)
  - "explanation": string (why it is correct citing the lesson)

Do not wrap in markdown codeblocks. Return only raw JSON.
`.trim();
}
