import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper to generate content using Gemini or fallback to custom mock generators
export async function generateAIResponse(prompt: string, type: 'tutor' | 'plan' | 'flashcards' | 'notes' | 'interview' | 'explanation', context?: any): Promise<string> {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini API call failed, falling back to mock response:', error);
    }
  }

  // Realistic mock responses based on type
  return getMockAIResponse(prompt, type, context);
}

function getMockAIResponse(prompt: string, type: 'tutor' | 'plan' | 'flashcards' | 'notes' | 'interview' | 'explanation', context?: any): string {
  const query = prompt.toLowerCase();

  switch (type) {
    case 'tutor':
      if (context?.problemDescription || query.includes('qa engineer') || query.includes('tle') || query.includes('edge')) {
        const userProb = (context?.problemDescription || '').toLowerCase();
        const userCode = (context?.solutionCode || '').toLowerCase();

        if (userProb.includes('prime') || userCode.includes('prime') || userCode.includes('isprime') || userCode.includes('divisor') || userCode.includes('divided')) {
          return JSON.stringify({
            evidenceMap: {
              bugType: "Performance / TLE Risk",
              severity: "Performance",
              confidenceLevel: "High",
              relevantVariables: ["n", "i"],
              relevantConditions: ["i < n"],
              relevantFunctionCalls: ["range(2, n)"],
              relevantDataStructures: [],
              codeEvidence: "for i in range(2, n):",
              supportingReasoning: "The loop checks every divisor sequentially up to N. This causes O(N) complexity which times out on inputs close to 10^9 or higher."
            },
            edgeCases: [
              {
                title: "Negative Inputs & Zero",
                scenario: "The function is called with inputs less than or equal to 1.",
                sampleInput: "n = -5, or n = 0, or n = 1",
                expectedBehavior: "Return false, as prime numbers must be integers strictly greater than 1.",
                whyItBreaks: "1. Input n is negative (e.g. -5).\n2. Naive divisibility scan is bypassed or loop limits do not execute.\n3. Divergence: Negative number incorrectly escapes checks.\n\nCurrent Output: true vs Expected Output: false",
                violatedAssumption: "Assumes input is always greater than 1",
                confidenceLevel: "High"
              },
              {
                title: "Smallest Prime Number",
                scenario: "The input is 2, which is the smallest and only even prime.",
                sampleInput: "n = 2",
                expectedBehavior: "Return true.",
                whyItBreaks: "1. Input n is 2.\n2. Iteration loop attempts to check divisors starting at 2.\n3. Divergence: Code flags 2 as even and returns composite.\n\nCurrent Output: false vs Expected Output: true",
                violatedAssumption: "Assumes even numbers cannot be prime",
                confidenceLevel: "High"
              },
              {
                title: "Extreme Prime Boundaries (TLE Risk)",
                scenario: "A very large prime number is checked, demanding complete loop execution.",
                sampleInput: "n = 100000000003 (10^11 + 3)",
                expectedBehavior: "Return true after analyzing.",
                whyItBreaks: "1. Input n is 100000000003.\n2. Iteration loop attempts to check all numbers up to N.\n3. Divergence: Linear execution trace exceeds the runtime limits.\n\nCurrent Output: TLE (Timeout) vs Expected Output: true",
                violatedAssumption: "Assumes input N is small enough for linear scan.",
                confidenceLevel: "High"
              }
            ],
            tleDiagnostics: {
              timeComplexity: "O(N)",
              spaceComplexity: "O(1)",
              bottleneckLine: 6,
              bottleneckCode: "for i in range(2, n):",
              rootCause: "The loop naively scans every divisor candidate up to N - 1. For large prime values, this linear search forces complete traversal and violates the optimal search invariant that factor pairs only exist up to the square root of N. Consequently, N operations are performed instead of the mathematically sufficient square root of N operations.",
              suggestedFix: "Limit divisor checks to the square root of N. Use the following code-level correction:\n\n```python\nfor i in range(2, int(n**0.5) + 1):\n```\n\nThis restores correctness by verifying factor pairs up to the square root of N, transforming execution complexity to O(sqrt(N)).",
              possibleOptimizations: "No additional optimization is recommended. The current asymptotic complexity is already optimal.",
              confidenceLevel: "High",
              laymansSummary: "Imagine checking if a box of 100 items has a defect by opening every single item one-by-one. Instead, we can stop checking after we reach the halfway point (or square root), because any pair of numbers multiplying to the total would have been found by then."
            }
          });
        }

        // 2. Check if two sum
        if (userProb.includes('two sum') || userProb.includes('twosum') || userCode.includes('twosum') || userCode.includes('two_sum')) {
          return JSON.stringify({
            evidenceMap: {
              bugType: "Performance / TLE Risk",
              severity: "Performance",
              confidenceLevel: "High",
              relevantVariables: ["nums", "target", "i", "j"],
              relevantConditions: ["nums[i] + nums[j] == target"],
              relevantFunctionCalls: ["range(len(nums))", "range(i + 1, len(nums))"],
              relevantDataStructures: [],
              codeEvidence: "for j in range(i + 1, len(nums)):",
              supportingReasoning: "The nested loop comparisons results in O(N^2) time complexity. For large arrays with 10^5 elements, this causes a Time Limit Exceeded (TLE) error."
            },
            edgeCases: [
              {
                title: "Null or Empty Arrays",
                scenario: "The function is called with an empty list or null reference for nums.",
                sampleInput: "nums = [], target = 0",
                expectedBehavior: "Return empty list [] or throw argument exception.",
                whyItBreaks: "1. Empty array is passed as nums.\n2. Iteration loop bounds evaluate range(0) which is empty.\n3. Divergence: Code exits loop cleanly but returns empty instead of throw validation check.\n\nCurrent Output: [] vs Expected Output: ArgumentException",
                violatedAssumption: "Assumes array is non-empty.",
                confidenceLevel: "High"
              },
              {
                title: "Single Item List",
                scenario: "The list has only one item, making it impossible to find a pair.",
                sampleInput: "nums = [5], target = 5",
                expectedBehavior: "Return empty list [] since no distinct pair can sum to target.",
                whyItBreaks: "1. Input nums is [5], len is 1.\n2. Outer index i is at 0, inner loop j ranges from 1 to 1 (empty loop).\n3. Divergence: Skip calculation but executes boilerplate validation loops.\n\nCurrent Output: [] vs Expected Output: []",
                violatedAssumption: "Assumes array always contains at least two numbers.",
                confidenceLevel: "High"
              },
              {
                title: "Extreme Array Dimensions (TLE Risk)",
                scenario: "Array contains 10^5 items with identical elements.",
                sampleInput: "nums = [1, 1, 1, ..., 1] (100,000 items), target = 2",
                expectedBehavior: "Return first two indices [0, 1] instantly.",
                whyItBreaks: "1. Outer index i is at 0.\n2. Inner index j starts scanning from 1 up to 100,000.\n3. Divergence: Sequential checks take too long under massive lists.\n\nCurrent Output: TLE (Timeout) vs Expected Output: [0, 1]",
                violatedAssumption: "Assumes nested sequential scans perform fast under large inputs.",
                confidenceLevel: "High"
              }
            ],
            tleDiagnostics: {
              timeComplexity: "O(N^2)",
              spaceComplexity: "O(1)",
              bottleneckLine: 5,
              bottleneckCode: "for j in range(i + 1, len(nums)):",
              rootCause: "The nested loop structure compares every index combination sequentially. This quadratic approach violates the single-pass search invariant where elements should be lookup-accessible in constant time. When N scales to 10^5, this results in O(N^2) comparisons, exceeding time constraints.",
              suggestedFix: "Implement a hash map to record visited values and their indices. Use the following code-level correction:\n\n```python\nseen = {}\nfor i, num in enumerate(nums):\n    diff = target - num\n    if diff in seen:\n        return [seen[diff], i]\n    seen[num] = i\nreturn []\n```\n\nThis restores correctness by allowing O(1) average lookup times for the target complement, reducing overall complexity to O(N).",
              possibleOptimizations: "No additional optimization is recommended. The current asymptotic complexity is already optimal.",
              confidenceLevel: "High",
              laymansSummary: "Imagine searching for a matching pair of keys and locks. Instead of trying every single key in every single lock sequentially (which takes forever as the pile grows), you write down a list of what you need. As soon as you see a matching lock, you check your list and pair them instantly."
            }
          });
        }

        // 3. Generic Dynamic parsing fallback
        let funcName = "candidateMethod";
        const pyMatch = prompt.match(/def\s+([a-zA-Z0-9_]+)/);
        const javaMatch = prompt.match(/(?:public|private|static|\s)\s+([a-zA-Z0-9_<>]+\s+)?([a-zA-Z0-9_]+)\s*\(/);
        
        if (pyMatch && pyMatch[1]) {
          funcName = pyMatch[1];
        } else if (javaMatch && javaMatch[2]) {
          funcName = javaMatch[2];
        }

        return JSON.stringify({
          evidenceMap: {
            bugType: "Logical Error / Boundary Validation",
            severity: "Wrong Answer",
            confidenceLevel: "Medium",
            relevantVariables: ["input parameters"],
            relevantConditions: [],
            relevantFunctionCalls: [],
            relevantDataStructures: [],
            codeEvidence: `def ${funcName} / method declaration`,
            supportingReasoning: "The input parameters are processed directly without zero-state or empty-state validations, which exposes logic to index bounds exceptions under empty input arrays or null arguments."
          },
          edgeCases: [
            {
              title: `Empty / Zero-State Input in ${funcName}`,
              scenario: "The code is executed with null or empty parameters.",
              sampleInput: "Empty list, null reference, or 0 input bounds",
              expectedBehavior: "Prevent index errors or segmentation faults by performing validation checks at the entry point.",
              whyItBreaks: `1. Input parameters are null or empty.\n2. Verification checks are skipped at method entry.\n3. Divergence: Unvalidated access results in runtime exceptions.\n\nCurrent Output: Crash (NullPointerException/IndexError) vs Expected Output: Safe termination`,
              violatedAssumption: "Assumes valid non-empty arguments.",
              confidenceLevel: "Medium"
            },
            {
              title: "Maximum Range Constraints",
              scenario: "Input value is scaled to maximum constraints (e.g. N = 10^5 items).",
              sampleInput: "100,000 sequential array items, or large Integer values",
              expectedBehavior: "Execute successfully within a 1-second time limit.",
              whyItBreaks: `1. Array size N is 100,000.\n2. Iteration scans nested code segments.\n3. Divergence: Calculation loops timeout before completing.\n\nCurrent Output: TLE (Timeout) vs Expected Output: Correct calculation`,
              violatedAssumption: "Assumes linear scale performance.",
              confidenceLevel: "Medium"
            }
          ],
          tleDiagnostics: {
            timeComplexity: "O(N^2) [Sub-Optimal Loop]",
            spaceComplexity: "O(N)",
            bottleneckLine: 5,
            bottleneckCode: `Inside execution block of ${funcName}()`,
            rootCause: "Repeated nested calculations violate the optimal state-reuse and traversal invariants. Executing iterations starting from initial bounds for each element introduces a sub-optimal quadratic complexity constraint relative to scale N.",
            suggestedFix: "Implement memoization or lookup tables to store states, and check input parameters beforehand to safeguard execution bounds.",
            possibleOptimizations: "No additional optimization is recommended. The current asymptotic complexity is already optimal.",
            confidenceLevel: "Medium",
            laymansSummary: `Your code is repeating the same search multiple times for each item in your collection, like walking back to the start of a dictionary for every single word you look up, rather than keeping your finger on the page or using a search index.`
          }
        });
      }
      if (query.includes('ec2') || query.includes('aws')) {
        return `
### Hello! I am your AI Tutor. Let's discuss AWS.

**Amazon EC2 (Elastic Compute Cloud)** is one of AWS's most popular services. It provides secure, resizable compute capacity in the cloud. Think of it as renting a virtual server in AWS's data centers.

Here are a few key points:
- **Instance Types**: Optimize for compute (C series), memory (R series), storage (I series), or general balance (M/T series).
- **Security**: Controlled using **Security Groups**, which act as virtual firewalls.
- **Elasticity**: Can scale automatically with **Auto Scaling Groups** based on demand metrics.

Do you have any specific questions about EC2 pricing models or configuration? I can also generate a quick quiz on this topic if you like!
        `.trim();
      }
      return `
### Hello! I'm your AI Prep Tutor.

I can help you prepare for your target examinations by:
1. Explaining complex technical concepts (e.g. AWS services, database isolation, DSA).
2. Reviewing coding solutions and discussing time/space complexities.
3. Generating tailored study timetables.
4. Explaining test answers you got wrong.

Ask me any specific question about your syllabus, or type "create a study plan" to get organized!
      `.trim();

    case 'plan':
      const examName = context?.examName || 'your exam';
      return `
# Personalized Study Plan: ${examName}

Here is a structured 4-week study plan tailored to maximize your retention and cover the key syllabus areas.

## Week 1: Core Foundations
- **Focus**: Key architectural concepts & vocabulary.
- **Daily Goal**: 1 hour of reading, 10 practice questions.
- **Milestone**: Complete Chapter 1 & 2 quizzes with >75% score.

## Week 2: Advanced Topics & Configurations
- **Focus**: Dive deep into service settings, parameters, and algorithms.
- **Daily Goal**: Study 2 lessons, practice 1 coding problem or 15 MCQs.
- **Milestone**: Generate and pass a Custom AI Quiz on Week 1-2 topics.

## Week 3: Mock Tests & Revision
- **Focus**: Time management and exam simulations.
- **Daily Goal**: Take 1 full-length mock test every alternate day.
- **Milestone**: Review incorrect answers using flashcards.

## Week 4: Weakness Targeting & Polish
- **Focus**: Refine weak topics highlighted in your performance dashboard.
- **Daily Goal**: 30 minutes of flashcard reviews, focus practice on low-accuracy topics.
- **Milestone**: Maintain a study streak and take a final baseline exam.
      `.trim();

    case 'flashcards':
      return JSON.stringify([
        { front: 'What is the default duration for a standard AWS Spot Instance interruption warning?', back: '2 minutes' },
        { front: 'What is the time complexity of searching a value in a balanced Binary Search Tree (BST)?', back: 'O(log n)' },
        { front: 'What is the difference between authorization and authentication?', back: 'Authentication verifies WHO you are (e.g. login). Authorization verifies WHAT you are allowed to do (e.g. access control).' },
        { front: 'What port does HTTP run on by default? What about HTTPS?', back: 'HTTP runs on Port 80. HTTPS runs on Port 443.' }
      ]);

    case 'notes':
      const topicName = context?.topicName || 'Selected Topic';
      return `
# Revision Notes: ${topicName}

## Executive Summary
This guide summarizes the essential definitions, system details, and quick recall items needed for the exam.

## Key Concepts
1. **Core Architecture**: Designed for modularity, low-latency, and high availability.
2. **Scalability Vectors**:
   - *Horizontal Scaling*: Adding more resources of equal power (e.g., more servers).
   - *Vertical Scaling*: Increasing the power of a single resource (e.g., adding more RAM to a server).
3. **Common Pitfalls**:
   - Over-provisioning resources, leading to high cost.
   - Ignoring boundary conditions (like empty arrays or null checks) in programming.

## Cheat-Sheet Metrics
- **Reliability Target**: 99.99% ("four nines") uptime standard.
- **Security Base**: Principle of Least Privilege (grant only permissions that are absolutely necessary).
      `.trim();

    case 'interview':
      return `
### [AI Interview Coach]

"Hello! I am your Technical Interview Coach. Let's practice.

I see you are preparing for a software engineering role. Let's start with a classic technical question.
Could you explain the difference between a **Process** and a **Thread**? How do they share memory?

Take your time to structure your answer. Explain:
1. Address space separation.
2. Resource overhead.
3. Communication mechanisms (IPC vs shared heap).

I will evaluate your explanation and give you tips for improvement!"
      `.trim();

    case 'explanation':
      return `
### Detailed Question Explanation

**Correct Option Explanation:**
The correct option is indeed the one that points out the redundant, isolated architecture of AWS regions and AZs.

**Why the options are right/wrong:**
- **Option A (Incorrect)**: Describes a server farm but misses the multi-facility AZ definition.
- **Option B (Correct)**: Correctly identifies that an AZ consists of one or more discrete data centers with independent power, cooling, and networking to ensure fault isolation.
- **Option C (Incorrect)**: Confuses Availability Zones with Edge Locations, which are CDN endpoints.
- **Option D (Incorrect)**: Confuses an AZ with Security Groups / Network Access Control Lists (NACLs).

**Exam Tip:**
On the actual test, remember that *Availability Zones* are inside *Regions* and are connected via low-latency fiber links. They are separate physical locations to prevent shared disaster failures.
      `.trim();

    default:
      return 'Response generated by AI.';
  }
}
