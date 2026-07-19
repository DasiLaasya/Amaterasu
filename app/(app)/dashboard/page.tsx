'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Terminal, 
  Layers, 
  Cpu, 
  Copy, 
  Check, 
  Loader2, 
  Play, 
  FileCode,
  Flame,
  Zap,
  Info,
  Brain
} from 'lucide-react';
import styles from './page.module.css';

interface EdgeCase {
  title: string;
  scenario: string;
  sampleInput: string;
  expectedBehavior: string;
  whyItBreaks: string;
  violatedAssumption?: string;
  confidenceLevel?: 'High' | 'Medium' | 'Low';
}

interface EvidenceMap {
  bugType: string;
  severity: string;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  relevantVariables: string[];
  relevantConditions: string[];
  relevantFunctionCalls: string[];
  relevantDataStructures: string[];
  codeEvidence: string;
  supportingReasoning: string;
}

interface TLEDiagnostics {
  timeComplexity: string;
  spaceComplexity: string;
  bottleneckLine: number;
  bottleneckCode: string;
  rootCause: string;
  suggestedFix: string;
  possibleOptimizations?: string;
  confidenceLevel?: 'High' | 'Medium' | 'Low';
  laymansSummary?: string;
}

interface PredictionResult {
  evidenceMap?: EvidenceMap;
  edgeCases: EdgeCase[];
  tleDiagnostics: TLEDiagnostics;
}

const renderFormattedSuggestion = (text: string) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6' }}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const parseBackticks = (str: string) => {
          const parts = str.split(/`([^`]+)`/g);
          return parts.map((part, partIdx) => {
            if (partIdx % 2 !== 0) {
              return (
                <code 
                  key={partIdx} 
                  style={{ 
                    color: '#818cf8', 
                    background: 'var(--bg-base)', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(129, 140, 248, 0.1)',
                    wordBreak: 'break-all'
                  }}
                >
                  {part}
                </code>
              );
            }
            return part;
          });
        };

        const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberMatch) {
          const [, num, content] = numberMatch;
          return (
            <div 
              key={lineIdx} 
              style={{ 
                display: 'flex', 
                gap: '12px', 
                background: 'rgba(255,255,255,0.01)', 
                padding: '10px 14px', 
                borderRadius: '6px', 
                border: '1px solid rgba(255,255,255,0.02)',
                alignItems: 'flex-start'
              }}
            >
              <span style={{ 
                color: 'var(--primary)', 
                fontWeight: 700, 
                fontSize: '0.9rem',
                minWidth: '18px'
              }}>
                {num}.
              </span>
              <div style={{ flex: 1 }}>{parseBackticks(content)}</div>
            </div>
          );
        }

        return (
          <div key={lineIdx} style={{ padding: '2px 0' }}>
            {parseBackticks(trimmed)}
          </div>
        );
      })}
    </div>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'edgecases' | 'tle'>('workspace');
  const [language, setLanguage] = useState<'python' | 'java'>('python');
  
  // Inputs state
  const [problemDescription, setProblemDescription] = useState(
    `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`
  );
  const [solutionCode, setSolutionCode] = useState(
    `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Naive nested loops causing O(N^2) time complexity\n        for i in range(len(nums)):\n            for j in range(i + 1, len(nums)):\n                if nums[i] + nums[j] == target:\n                    return [i, j]\n        return []`
  );

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // History state
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const queryLogId = searchParams.get('id');

  const fetchHistory = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const payload = await res.json();
        setLogs(payload.history || []);
      }
    } catch (err) {
      console.error('Error fetching analysis history:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    const handleUpdate = () => {
      fetchHistory();
    };
    window.addEventListener('history-updated', handleUpdate);
    return () => window.removeEventListener('history-updated', handleUpdate);
  }, []);

  const handleSelectLog = (log: any) => {
    setSelectedLogId(log.id);
    setProblemDescription(log.problem_name);
    setSolutionCode(log.code_snippet);
    try {
      const parsedSummary = JSON.parse(log.diagnostic_summary);
      setResult(parsedSummary);
    } catch (err) {
      console.error('Error parsing saved diagnostic summary:', err);
    }
  };

  useEffect(() => {
    if (queryLogId && logs.length > 0) {
      const matchingLog = logs.find(l => l.id === queryLogId);
      if (matchingLog) {
        handleSelectLog(matchingLog);
      }
    }
  }, [queryLogId, logs]);

  const runAnalysis = async () => {
    if (!problemDescription.trim() || !solutionCode.trim() || analyzing) return;
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemDescription,
          solutionCode,
          language,
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        setResult(payload.data);

        // Save analysis to history table in background
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problem_name: problemDescription,
              code_snippet: solutionCode,
              bug_type: payload.data.evidenceMap?.bugType || 'Unknown',
              diagnostic_summary: JSON.stringify(payload.data)
            })
          });
          // Dispatch global custom event to notify AppShell sidebar
          window.dispatchEvent(new Event('history-updated'));
          fetchHistory();
        } catch (saveErr) {
          console.error('Error auto-saving analysis history:', saveErr);
        }

        // Automatically route to Edge cases tab to show feedback
        setActiveTab('edgecases');
      } else {
        const errPayload = await res.json();
        setError(errPayload.error || 'Failed to complete code static analysis.');
      }
    } catch (e) {
      setError('Connection timeout. Static analysis engine is currently offline.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyInput = (inputVal: string, idx: number) => {
    navigator.clipboard.writeText(inputVal);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to choose complexity badge color
  const getComplexityColor = (comp: string) => {
    const clean = comp.toLowerCase();
    if (clean.includes('o(1)') || clean.includes('o(log')) return '#10b981'; // Green
    if (clean.includes('o(n)') && !clean.includes('o(n^2)') && !clean.includes('o(n log')) return '#3b82f6'; // Blue
    if (clean.includes('o(n log')) return '#f59e0b'; // Orange
    return '#ef4444'; // Red for O(N^2) or higher
  };

  return (
    <div className="animate-fade-in">
      <style>{`
        .pred-container {
          max-width: 1400px;
          margin: 0 auto;
        }
        .pred-header {
          margin-bottom: 24px;
        }
        .pred-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pred-subtitle {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .pred-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.02);
        }
        .tab-btn-active {
          color: var(--primary);
          background: rgba(var(--primary-rgb), 0.08);
          border-color: rgba(var(--primary-rgb), 0.15);
        }
        .workspace-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .form-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .code-textarea {
          font-family: 'Courier New', Courier, monospace;
          background: var(--bg-base);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          font-size: 0.85rem;
          line-height: 1.5;
          resize: vertical;
          min-height: 320px;
          width: 100%;
        }
        .code-textarea:focus {
          outline: none;
          border-color: var(--primary);
        }
        .problem-textarea {
          background: var(--card-bg);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          font-size: 0.88rem;
          line-height: 1.5;
          resize: vertical;
          min-height: 160px;
          width: 100%;
        }
        .problem-textarea:focus {
          outline: none;
          border-color: var(--primary);
        }
        .select-lang {
          background: var(--card-bg);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.85rem;
          width: fit-content;
        }
        .complexity-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
        }
        .tle-box {
          border-left: 4px solid var(--accent);
          background: rgba(var(--accent-rgb), 0.03);
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="pred-container">
        <header className="pred-header">
          <h2 className="pred-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal className="logoPulse" size={24} style={{ color: 'var(--primary)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 300, fontSize: '1.3rem', letterSpacing: '0.25em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                A m a t e r a s u
              </span>
            </div>
          </h2>
          <p className="pred-subtitle">
            Bringing absolute diagnostic clarity to complex state spaces
          </p>
        </header>

        {/* Action tabs */}
        <div className="pred-tabs">
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`tab-btn ${activeTab === 'workspace' ? 'tab-btn-active' : ''}`}
          >
            <FileCode size={16} />
            <span>Solution Workspace</span>
          </button>
          <button 
            onClick={() => {
              if (!result) return;
              setActiveTab('edgecases');
            }}
            className={`tab-btn ${activeTab === 'edgecases' ? 'tab-btn-active' : ''}`}
            disabled={!result}
          >
            <Layers size={16} />
            <span>Edge-Case Generator ({result?.edgeCases.length || 0})</span>
          </button>
          <button 
            onClick={() => {
              if (!result) return;
              setActiveTab('tle');
            }}
            className={`tab-btn ${activeTab === 'tle' ? 'tab-btn-active' : ''}`}
            disabled={!result}
          >
            <Cpu size={16} />
            <span>TLE Complexity Diagnostics</span>
          </button>
        </div>

        {/* Tab 1: WORKSPACE */}
        {activeTab === 'workspace' && (
          <div className="workspace-grid">
            <div className="glass-card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Problem Spec</h3>
              
              <div className="form-group">
                <label className="form-label">Paste Problem Description</label>
                <textarea 
                  className="problem-textarea"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Paste LeetCode, CodeChef, or HackerRank problem description here..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Coding Language</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value as 'python' | 'java')}
                  className="select-lang"
                >
                  <option value="python">Python 3</option>
                  <option value="java">Java 17</option>
                </select>
              </div>

              {error && (
                <div className="callout-box callout-warning" style={{ margin: '16px 0 0 0', display: 'flex', alignItems: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-[#948979]"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Solution Editor</h3>
              
              <div className="form-group" style={{ flexGrow: 1 }}>
                <textarea 
                  className="code-textarea"
                  value={solutionCode}
                  onChange={(e) => setSolutionCode(e.target.value)}
                  placeholder="Paste your unoptimized or baseline candidate code here..."
                />
              </div>

              <button
                onClick={runAnalysis}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Compiling static execution trace...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Analyze Edge-Cases & TLE Risks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: EDGE-CASE GENERATOR */}
        {activeTab === 'edgecases' && result && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.04)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} style={{ color: 'var(--primary)' }} />
                <span>Boundary-Pushing Break Inputs</span>
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                These inputs represent structural limits, empty states, and extreme duplication constraints modeled to break unoptimized logic.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {result.edgeCases.map((ec, idx) => (
                <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ec.title}</h4>
                      {ec.confidenceLevel && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          background: ec.confidenceLevel === 'High' ? 'rgba(16, 185, 129, 0.15)' : ec.confidenceLevel === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: ec.confidenceLevel === 'High' ? '#10b981' : ec.confidenceLevel === 'Medium' ? '#f59e0b' : '#ef4444',
                          fontWeight: 600
                        }}>
                          {ec.confidenceLevel} Confidence
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopyInput(ec.sampleInput, idx)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.7rem', gap: '4px' }}
                    >
                      {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong>Scenario:</strong> {ec.scenario}
                  </div>
                  {ec.violatedAssumption && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--accent)' }}>Violated Assumption:</strong> {ec.violatedAssumption}
                    </div>
                  )}

                  <div style={{ background: 'var(--bg-base)', padding: '8px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#818cf8', wordBreak: 'break-all' }}>
                    {ec.sampleInput}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: 'auto' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>Expected:</span>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{ec.expectedBehavior}</p>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>Why it Breaks:</span>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                        {renderFormattedSuggestion(ec.whyItBreaks)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: TLE DIAGNOSTIC */}
        {activeTab === 'tle' && result && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Big-O gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Time Complexity Estimate</h4>
                  <span 
                    className="complexity-badge" 
                    style={{ background: getComplexityColor(result.tleDiagnostics.timeComplexity), fontSize: '1.2rem', marginTop: '6px' }}
                  >
                    {result.tleDiagnostics.timeComplexity}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', maxWidth: '160px' }}>
                  Scaling relative to input size N. Levels above $O(N \log N)$ risk TLE constraints.
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Space Complexity Estimate</h4>
                  <span 
                    className="complexity-badge" 
                    style={{ background: getComplexityColor(result.tleDiagnostics.spaceComplexity), fontSize: '1.2rem', marginTop: '6px' }}
                  >
                    {result.tleDiagnostics.spaceComplexity}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', maxWidth: '160px' }}>
                  Internal memory allocations. $O(1)$ is highly optimized auxiliary usage.
                </div>
              </div>
            </div>

            {/* Evidence-Based Analysis Map */}
            {result.evidenceMap && (
              <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)', background: 'rgba(var(--primary-rgb), 0.01)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} style={{ color: 'var(--primary)' }} />
                  <span>Evidence-Based Analysis Map</span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    background: result.evidenceMap.severity === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: result.evidenceMap.severity === 'Critical' ? '#ef4444' : '#f59e0b',
                    fontWeight: 600,
                    marginLeft: 'auto'
                  }}>
                    {result.evidenceMap.severity} Severity
                  </span>
                </h3>

                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div>
                    <strong>Bug Type:</strong> {result.evidenceMap.bugType} ({result.evidenceMap.confidenceLevel} Confidence)
                  </div>
                  {result.evidenceMap.relevantVariables && result.evidenceMap.relevantVariables.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <strong>Variables:</strong>
                      {result.evidenceMap.relevantVariables.map(v => <code key={v} style={{ color: '#818cf8', background: 'var(--bg-base)', padding: '2px 6px', borderRadius: '4px' }}>{v}</code>)}
                    </div>
                  )}
                  {result.evidenceMap.relevantConditions && result.evidenceMap.relevantConditions.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <strong>Conditions:</strong>
                      {result.evidenceMap.relevantConditions.map(c => <code key={c} style={{ color: '#818cf8', background: 'var(--bg-base)', padding: '2px 6px', borderRadius: '4px' }}>{c}</code>)}
                    </div>
                  )}
                  {result.evidenceMap.relevantDataStructures && result.evidenceMap.relevantDataStructures.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <strong>Data Structures:</strong>
                      {result.evidenceMap.relevantDataStructures.map(ds => <code key={ds} style={{ color: '#818cf8', background: 'var(--bg-base)', padding: '2px 6px', borderRadius: '4px' }}>{ds}</code>)}
                    </div>
                  )}
                  <div style={{ marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <strong>Code Evidence:</strong>
                    <pre style={{ background: 'var(--bg-base)', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', color: '#f87171', marginTop: '6px', fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {result.evidenceMap.codeEvidence}
                    </pre>
                  </div>
                  <div>
                    <strong>Reasoning:</strong>
                    <p style={{ marginTop: '4px', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                      {result.evidenceMap.supportingReasoning}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Line Bottleneck */}
            <div className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Critical Performance Bottleneck: Line {result.tleDiagnostics.bottleneckLine}</span>
                {result.tleDiagnostics.confidenceLevel && (
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    background: result.tleDiagnostics.confidenceLevel === 'High' ? 'rgba(16, 185, 129, 0.15)' : result.tleDiagnostics.confidenceLevel === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: result.tleDiagnostics.confidenceLevel === 'High' ? '#10b981' : result.tleDiagnostics.confidenceLevel === 'Medium' ? '#f59e0b' : '#ef4444',
                    fontWeight: 600,
                    marginLeft: 'auto'
                  }}>
                    {result.tleDiagnostics.confidenceLevel} Confidence
                  </span>
                )}
              </h3>
              
              <div style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#f87171', margin: '12px 0' }}>
                {result.tleDiagnostics.bottleneckCode}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Root Cause:</strong>
                <div style={{ marginTop: '6px' }}>
                  {renderFormattedSuggestion(result.tleDiagnostics.rootCause)}
                </div>
              </div>
            </div>

            {/* Suggested Fix */}
            <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} style={{ color: '#10b981' }} />
                <span>Suggested Fix</span>
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
                {renderFormattedSuggestion(result.tleDiagnostics.suggestedFix)}
              </div>
            </div>

            {/* Possible Optimizations */}
            {result.tleDiagnostics.possibleOptimizations && (
              <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} style={{ color: '#3b82f6' }} />
                  <span>Possible Optimizations</span>
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
                  {renderFormattedSuggestion(result.tleDiagnostics.possibleOptimizations)}
                </div>
              </div>
            )}

            {/* Layman's Summary */}
            {result.tleDiagnostics.laymansSummary && (
              <div className="glass-card" style={{ borderLeft: '4px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.03)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} style={{ color: '#8b5cf6' }} />
                  <span>Plain English Summary</span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px', fontStyle: 'italic' }}>
                  "{result.tleDiagnostics.laymansSummary}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Simplified Actionable Fix Strategy */}
        {result && (
          <div className="glass-card" style={{ marginTop: '24px', borderLeft: '4px solid var(--primary)', background: 'rgba(var(--primary-rgb), 0.02)', lineHeight: '1.6' }}>
            <h3 style={{ fontSize: '1.0rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: 'var(--primary)' }} />
              <span>Fix Strategy: What You Need to Tackle</span>
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '10px' }}>
              Based on the static analysis trace of your code, here is the simplified summary of what you need to focus on to resolve all edge-cases and performance bottlenecks:
            </p>

            <ul style={{ paddingLeft: '20px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <li style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Root Cause:</strong>
                <div style={{ marginTop: '4px' }}>
                  {renderFormattedSuggestion(result.tleDiagnostics.rootCause)}
                </div>
              </li>
              <li style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Suggested Fix:</strong>
                <div style={{ marginTop: '4px' }}>
                  {renderFormattedSuggestion(result.tleDiagnostics.suggestedFix)}
                </div>
              </li>
              {result.tleDiagnostics.possibleOptimizations && (
                <li style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Possible Optimizations:</strong>
                  <div style={{ marginTop: '4px' }}>
                    {renderFormattedSuggestion(result.tleDiagnostics.possibleOptimizations)}
                  </div>
                </li>
              )}
              <li style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Edge-Cases to Prevent:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px', listStyleType: 'disc', color: 'var(--text-muted)' }}>
                  {result.edgeCases.map((ec, ecIdx) => (
                    <li key={ecIdx}>
                      Guard against <strong>{ec.title}</strong>: inputs like <code>{ec.sampleInput}</code> {ec.violatedAssumption && `(Violated Assumption: ${ec.violatedAssumption})`}.
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Analogy to Guide You:</strong> {result.tleDiagnostics.laymansSummary || 'Avoid repetitive lookups and nested scans by keeping track of elements in memory.'}
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
