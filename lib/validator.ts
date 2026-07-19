export function validateLesson(content: string): { valid: boolean; reason?: string } {
  if (!content || content.length < 500) {
    return { valid: false, reason: 'Content is too short or empty.' };
  }

  // 1. Verify all 17 section headers are present in order
  const requiredHeaders = [
    '# 1 Introduction',
    '# 2 Why this topic exists',
    '# 3 Intuition',
    '# 4 Real-world Analogy',
    '# 5 Technical Explanation',
    '# 6 Architecture',
    '# 7 Workflow',
    '# 8 Real-world Examples',
    '# 9 Code Examples',
    '# 10 Advantages',
    '# 11 Limitations',
    '# 12 Comparison Table',
    '# 13 Common Mistakes',
    '# 14 Interview Questions',
    '# 15 Exam Tips',
    '# 16 Key Takeaways',
    '# 17 One Page Revision Notes'
  ];

  for (const header of requiredHeaders) {
    if (!content.includes(header)) {
      return { valid: false, reason: `Missing mandatory section header: "${header}"` };
    }
  }

  // Check header sequence order
  let lastIndex = -1;
  for (const header of requiredHeaders) {
    const index = content.indexOf(header);
    if (index < lastIndex) {
      return { valid: false, reason: `Headers are out of sequence order: "${header}" appeared too early.` };
    }
    lastIndex = index;
  }

  // 2. Scan for placeholder patterns or hallucinations
  const placeholderPatterns = [
    /lorem ipsum/i,
    /insert code here/i,
    /placeholder/i,
    /TODO/i,
    /generic software engineering/i
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(content)) {
      return { valid: false, reason: `Detected placeholder content matching pattern: ${pattern.toString()}` };
    }
  }

  return { valid: true };
}

export function validateFlashcards(cards: any[]): { valid: boolean; reason?: string } {
  if (!Array.isArray(cards)) {
    return { valid: false, reason: 'Flashcards output is not a valid JSON array.' };
  }

  if (cards.length !== 50) {
    return { valid: false, reason: `Expected exactly 50 cards, but received ${cards.length}.` };
  }

  // Category counters
  const counts: Record<string, number> = {
    CONCEPT: 0,
    DEFINITION: 0,
    SCENARIO: 0,
    FILL_IN_BLANK: 0,
    TRUE_FALSE: 0
  };

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (!card.category || !card.front || !card.back || !card.explanation) {
      return { valid: false, reason: `Card at index ${i} is missing front, back, explanation, or category.` };
    }

    if (!card.front.startsWith('**Front:**')) {
      return { valid: false, reason: `Card at index ${i} front does not start with "**Front:**"` };
    }

    if (!card.back.startsWith('**Back:**')) {
      return { valid: false, reason: `Card at index ${i} back does not start with "**Back:**"` };
    }

    if (counts[card.category] === undefined) {
      return { valid: false, reason: `Card at index ${i} has an invalid category: "${card.category}".` };
    }

    counts[card.category]++;
  }

  // Verify splits
  for (const [category, count] of Object.entries(counts)) {
    if (count !== 10) {
      return { valid: false, reason: `Category "${category}" does not have exactly 10 cards (found ${count}).` };
    }
  }

  return { valid: true };
}

export function validateQuiz(questions: any[]): { valid: boolean; reason?: string } {
  if (!Array.isArray(questions)) {
    return { valid: false, reason: 'Quiz output is not a valid JSON array.' };
  }

  if (questions.length < 30) {
    return { valid: false, reason: `Expected at least 30 quiz questions, but received ${questions.length}.` };
  }

  const counts: Record<string, number> = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0
  };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.difficulty || !q.type || !q.question || !q.options || q.correctIndex === undefined || !q.explanation) {
      return { valid: false, reason: `Question at index ${i} is missing structural properties.` };
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      return { valid: false, reason: `Question at index ${i} options must be an array of at least 2 entries.` };
    }

    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      return { valid: false, reason: `Question at index ${i} correctIndex ${q.correctIndex} is out of bounds.` };
    }

    const diffUpper = q.difficulty.toUpperCase();
    if (counts[diffUpper] === undefined) {
      return { valid: false, reason: `Question at index ${i} has invalid difficulty: "${q.difficulty}".` };
    }
    counts[diffUpper]++;
  }

  // Verify difficulty splits (expecting at least 10 of each difficulty)
  for (const [diff, count] of Object.entries(counts)) {
    if (count < 10) {
      return { valid: false, reason: `Difficulty "${diff}" does not have at least 10 questions (found ${count}).` };
    }
  }

  return { valid: true };
}
