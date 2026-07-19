'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Play, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Lightbulb, 
  Sparkles,
  Bot
} from 'lucide-react';
import styles from '../app/(app)/coding/[id]/page.module.css';

interface Problem {
  id: string;
  text: string;
  difficulty: string;
  codeTemplate: string | null;
  explanation: string | null;
  editorial: string | null;
  companyTags: string; // JSON string
  topicId: string;
}

interface TestResult {
  input: string;
  expected: string;
  actual: any;
  passed: boolean;
  error?: string;
}

interface CodingWorkspaceProps {
  problem: Problem;
  dsaGuide?: string;
}

export default function CodingWorkspace({ problem, dsaGuide = '' }: CodingWorkspaceProps) {
  const router = useRouter();
  
  // Navigation / Tabs - default to Concept Hub if guide exists
  const [activeTab, setActiveTab] = useState<'desc' | 'dsaHub' | 'hints' | 'editorial'>(
    dsaGuide ? 'dsaHub' : 'desc'
  );
  
  // Template helper
  const getTemplateForLanguage = (templateStr: string | null, lang: string): string => {
    if (!templateStr) return '';
    try {
      const parsed = JSON.parse(templateStr);
      if (parsed[lang]) return parsed[lang];
      return templateStr;
    } catch (e) {
      return templateStr;
    }
  };

  // Code Editor state
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(() => getTemplateForLanguage(problem.codeTemplate, 'javascript'));

  // Compiler Console state
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [compilePassed, setCompilePassed] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Parse company tags
  const tags: string[] = JSON.parse(problem.companyTags || '[]');

  // Restore active draft if available (auto-save in client state)
  useEffect(() => {
    const saved = localStorage.getItem(`code_draft_${problem.id}_${language}`);
    if (saved) {
      setCode(saved);
    } else {
      setCode(getTemplateForLanguage(problem.codeTemplate, language));
    }
  }, [problem.id, language]);

  const handleCodeChange = (val: string) => {
    setCode(val);
    localStorage.setItem(`code_draft_${problem.id}_${language}`, val);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setHasRun(false);
  };

  // Compiler request
  const runCode = async () => {
    if (running) return;
    setRunning(true);
    setHasRun(false);

    try {
      const res = await fetch('/api/coding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: problem.id,
          submittedCode: code,
          language,
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        setCompilePassed(payload.passed);
        setTestResults(payload.results);
        setHasRun(true);
        // Refresh layout context to update checkmarks
        router.refresh();
      } else {
        const payload = await res.json();
        setTestResults([{
          input: 'Global Sandbox',
          expected: 'Success',
          actual: null,
          passed: false,
          error: payload.error || 'Compilation Error',
        }]);
        setCompilePassed(false);
        setHasRun(true);
      }
    } catch (e) {
      console.error(e);
      setCompilePassed(false);
      setHasRun(true);
    } finally {
      setRunning(false);
    }
  };

  const diffBadgeClass = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return styles.diffEasy;
      case 'medium': return styles.diffMedium;
      case 'hard': return styles.diffHard;
      default: return '';
    }
  };

  // Formatter for templates to show HTML lists properly
  const formatText = (text: string) => {
    return text.replace(/\n/g, '<br />');
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>
      {/* Left Column: Description & Syllabus Details */}
      <section className={styles.descColumn}>
        <Link href="/coding" className="btn btn-secondary btn-icon backBtn" title="Return to Problems">
          <ArrowLeft size={16} />
        </Link>

        <div className={styles.titleHeader}>
          <h3 className={styles.title}>Coding Challenge</h3>
          <span className={`${styles.difficultyBadge} ${diffBadgeClass(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.companyBadges}>
            {tags.map(t => (
              <span key={t} className={styles.companyBadge}>{t}</span>
            ))}
          </div>
        </div>

        <div className={styles.tabsList}>
          {dsaGuide && (
            <button 
              onClick={() => setActiveTab('dsaHub')}
              className={`${styles.tabBtn} ${activeTab === 'dsaHub' ? styles.tabBtnActive : ''}`}
            >
              DSA Concept Hub
            </button>
          )}
          <button 
            onClick={() => setActiveTab('desc')}
            className={`${styles.tabBtn} ${activeTab === 'desc' ? styles.tabBtnActive : ''}`}
          >
            Description
          </button>
          <button 
            onClick={() => setActiveTab('hints')}
            className={`${styles.tabBtn} ${activeTab === 'hints' ? styles.tabBtnActive : ''}`}
          >
            Hints
          </button>
          <button 
            onClick={() => setActiveTab('editorial')}
            className={`${styles.tabBtn} ${activeTab === 'editorial' ? styles.tabBtnActive : ''}`}
          >
            Editorial Solution
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'dsaHub' && dsaGuide && (
            <div style={{ color: 'var(--text-secondary)' }}>
              <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(dsaGuide) }} />
              
              <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '0.95rem', fontWeight: 600 }}>Curated External Practice Links:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <a href="https://leetcode.com/problemset/all/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}>
                    <span>🏆</span><span>LeetCode Arena</span>
                  </a>
                  <a href="https://www.geeksforgeeks.org/explore/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}>
                    <span>🎓</span><span>GeeksforGeeks Hub</span>
                  </a>
                  <a href="https://neetcode.io/practice" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}>
                    <span>💻</span><span>NeetCode Practice</span>
                  </a>
                  <a href="https://takeuforward.org/strivers-a2z-dsa-course-sheet-instructions/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}>
                    <span>🚀</span><span>Strivers A2Z Sheet</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'desc' && (
            <div style={{ color: 'var(--text-secondary)' }}>
              <p dangerouslySetInnerHTML={{ __html: formatText(problem.text) }} />
              
              {problem.explanation && (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '0.95rem' }}>Implementation Note:</h4>
                  <p style={{ fontSize: '0.85rem' }}>{problem.explanation}</p>
                </div>
              )}

              <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '0.95rem', fontWeight: 600 }}>Curated External Practice Links:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <a href="https://leetcode.com/problemset/all/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}>
                    <span>🏆</span><span>LeetCode Arena</span>
                  </a>
                  <a href="https://www.geeksforgeeks.org/explore/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}>
                    <span>🎓</span><span>GeeksforGeeks Hub</span>
                  </a>
                  <a href="https://neetcode.io/practice" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}>
                    <span>💻</span><span>NeetCode Practice</span>
                  </a>
                  <a href="https://takeuforward.org/strivers-a2z-dsa-course-sheet-instructions/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}>
                    <span>🚀</span><span>Strivers A2Z Sheet</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hints' && (
            <div style={{ color: 'var(--text-secondary)' }}>
              <ul style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li>
                  <strong style={{ color: 'var(--primary)' }}>Hint 1:</strong> Think about space-time tradeoffs. A brute force nested loop takes $O(n^2)$ time. Can you do it in $O(n)$ by storing values you've already traversed?
                </li>
                <li>
                  <strong style={{ color: 'var(--primary)' }}>Hint 2:</strong> Use a Map structure. For each number, calculate its difference from the target. Is that difference already in the map?
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'editorial' && (
            <div style={{ color: 'var(--text-secondary)' }}>
              {problem.editorial ? (
                <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(problem.editorial) }} />
              ) : (
                <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  No editorial solution configured for this challenge. Attempt solving it!
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Code Editor & Compiler Output Console */}
      <section className={styles.editorColumn}>
        {/* Monospace Code Editor */}
        <div className={styles.editorCard}>
          <div className={styles.editorHeader}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignSelf: 'center', gap: '6px' }}>
              <Terminal size={14} />
              <span>Workspace</span>
            </span>
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={styles.languageSelect}
            >
              <option value="javascript">JavaScript (ES6)</option>
              <option value="java">Java (JDK 21 Emulator)</option>
              <option value="python" disabled>Python 3 (Mocked)</option>
              <option value="cpp" disabled>C++ (Mocked)</option>
            </select>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className={styles.editorTextarea}
            spellCheck={false}
            placeholder="// Write code here"
          />
        </div>

        {/* Compiler output Console */}
        <div className={styles.consoleCard}>
          <div className={styles.consoleHeader}>
            <span className={styles.consoleTitle}>Test Case Output Console</span>
            <div className={styles.consoleActions}>
              <button 
                onClick={runCode}
                className="btn btn-primary consoleBtn"
                disabled={running}
              >
                {running ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    <span>Run & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={styles.consoleBody}>
            {!hasRun && !running && (
              <div className={styles.consoleEmpty}>
                Write a function and click "Run & Submit" to compile and run your code against active test cases.
              </div>
            )}

            {running && (
              <div className={styles.compilingText}>
                <Loader2 size={14} className="animate-spin" />
                <span>Running sandboxed test scripts...</span>
              </div>
            )}

            {hasRun && (
              <div>
                {compilePassed ? (
                  <div className={styles.successBanner}>
                    <CheckCircle2 size={18} />
                    <span>Success! All test cases passed. Mastery points added.</span>
                  </div>
                ) : (
                  <div className={styles.failedBanner}>
                    <AlertTriangle size={18} />
                    <span>Failed. Some test cases returned incorrect outputs or threw errors.</span>
                  </div>
                )}

                <div className={styles.testCasesWrapper}>
                  {testResults.map((tr, index) => (
                    <div key={index} className={styles.testCaseRow}>
                      <div className={styles.testCaseHeader}>
                        <span>Test Case {index + 1}</span>
                        <span className={tr.passed ? styles.textPass : styles.textFail}>
                          {tr.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>

                      {tr.error ? (
                        <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                          <strong>Error:</strong> {tr.error}
                        </div>
                      ) : (
                        <>
                          <div className={styles.testCaseData}>
                            <span className={styles.dataLabel}>Input Parameters:</span>
                            <span>{tr.input}</span>
                          </div>
                          <div className={styles.testCaseData}>
                            <span className={styles.dataLabel}>Expected Output:</span>
                            <span>{tr.expected}</span>
                          </div>
                          <div className={styles.testCaseData}>
                            <span className={styles.dataLabel}>Sandbox Returned:</span>
                            <span className={tr.passed ? styles.textPass : styles.textFail}>
                              {JSON.stringify(tr.actual)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Simple Helper to map basic Markdown syntax to HTML
function formatMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';
  let html = markdown;
  html = html.replace(/^\s*>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/```javascript([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/```python([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/^\s*-\s*(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  html = html.replace(/\n\n/g, '<br/>');
  return html;
}
