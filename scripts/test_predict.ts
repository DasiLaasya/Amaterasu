import { generateAIResponse } from '../lib/gemini';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function runTest() {
  const problemDescription = `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`;
  const solutionCode = `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Naive nested loops causing O(N^2) time complexity\n        for i in range(len(nums)):\n            for j in range(i + 1, len(nums)):\n                if nums[i] + nums[j] == target:\n                    return [i, j]\n        return []`;
  const language = 'python';

  const enginePrompt = `
You are a Senior Automated QA Engineer and static analysis compiler tool. Your only job is to rigorously break candidate code.

When provided a problem description and a block of Python or Java code:
- Actively trace the execution to find edge-cases the developer likely missed.
- Generate exact sample input values representing these edge cases (e.g., an array with 10^5 items all containing identical values, or maximum constraints).
- Provide an analytical breakdown mapping out how the execution time will scale relative to input size N, identifying the exact line number causing potential Time Limit Exceeded (TLE) vulnerabilities. Do NOT generate generic placeholder summaries or fake code structures.

You must return a valid JSON object matching the following structure:
{
  "edgeCases": [
    {
      "title": "e.g. Empty Input or Null Array",
      "scenario": "Explain the scenario in detail",
      "sampleInput": "Provide the exact input e.g. nums = []",
      "expectedBehavior": "Explain correct behavior",
      "whyItBreaks": "Detail how the input crashes or misbehaves in the candidate code"
    }
  ],
  "tleDiagnostics": {
    "timeComplexity": "e.g. O(N^2)",
    "spaceComplexity": "e.g. O(1)",
    "bottleneckLine": 5,
    "bottleneckCode": "e.g. for i in range(len(nums)):",
    "analysis": "Trace analysis demonstrating scaling relative to size N",
    "optimizationSuggestion": "Clear, executable description of how to refactor this unoptimized block"
  }
}

Context:
- Problem Description: ${problemDescription}
- Code Language: ${language}
- Solution Code:
${solutionCode}

Do not wrap the JSON output in markdown codeblocks. Return only raw JSON.
`.trim();

  try {
    console.log("Calling Gemini API...");
    const responseText = await generateAIResponse(enginePrompt, 'tutor', { topicName: 'TLE Predictor' });
    console.log("=== RAW GEMINI RESPONSE ===");
    console.log(responseText);
    console.log("===========================");

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    console.log("=== CLEANED RESPONSE ===");
    console.log(cleanJson);
    console.log("===========================");

    const parsed = JSON.parse(cleanJson);
    console.log("Parsed JSON successfully!", parsed);
  } catch (e: any) {
    console.error("Failed to execute or parse:", e);
  }
}

runTest();
