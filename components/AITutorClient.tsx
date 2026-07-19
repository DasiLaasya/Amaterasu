'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  Bot, 
  Send, 
  Loader2, 
  Plus,
  Compass,
  FileText,
  UserCheck
} from 'lucide-react';
import styles from '../app/(app)/ai-tutor/page.module.css';

interface Exam {
  id: string;
  name: string;
  code: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: string; // JSON string
  createdAt: string;
}

interface AITutorClientProps {
  targetExamsList: Exam[];
  chatSessions: ChatSession[];
}

export default function AITutorClient({ targetExamsList, chatSessions: initialChatSessions }: AITutorClientProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'planner' | 'interview'>('chat');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(initialChatSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialChatSessions.length > 0 ? initialChatSessions[0].id : null
  );

  // Chat message logs
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>(() => {
    if (initialChatSessions.length > 0) {
      try {
        return JSON.parse(initialChatSessions[0].messages);
      } catch (e) {}
    }
    return [
      { role: 'model', content: "Hello! I am your AI Exam Coach. How can I help you prepare today? Ask me to explain a concept or generate a quiz!" }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Planner states
  const [selectedExamId, setSelectedExamId] = useState(targetExamsList.length > 0 ? targetExamsList[0].id : '');
  const [timeline, setTimeline] = useState('1 month');
  const [studyHours, setStudyHours] = useState('2 hours');
  const [planMarkdown, setPlanMarkdown] = useState('');
  const [plannerLoading, setPlannerLoading] = useState(false);

  // Interview state
  const [interviewMessages, setInterviewMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: "Hello! I am your Technical Interview Coach. Let's practice. I see you are preparing for technical placement exams. Let's start with a classic technical question. Could you explain the difference between a Process and a Thread? How do they share memory? Take your time to reply." }
  ]);
  const [interviewInput, setInterviewInput] = useState('');
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Handler: Change active Chat Session
  const handleSelectSession = (sId: string) => {
    setActiveSessionId(sId);
    const session = chatSessions.find(s => s.id === sId);
    if (session) {
      try {
        setChatMessages(JSON.parse(session.messages));
      } catch (e) {
        setChatMessages([]);
      }
    }
  };

  // Handler: Reset to New Chat session
  const handleNewChat = () => {
    setActiveSessionId(null);
    setChatMessages([
      { role: 'model', content: "Hello! I am your AI Exam Coach. How can I help you prepare today? Ask me to explain a concept or generate a quiz!" }
    ]);
  };

  // Dynamic prompt executor for quick action buttons
  const triggerChatWithPrompt = async (promptText: string) => {
    if (chatLoading) return;
    const userMessage = { role: 'user' as const, content: promptText };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.slice(-6),
          sessionId: activeSessionId,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        
        if (!activeSessionId) {
          setActiveSessionId(result.sessionId);
          const newSessionItem = {
            id: result.sessionId,
            title: promptText.substring(0, 30) + '...',
            messages: JSON.stringify([...updatedMessages, { role: 'model', content: result.response }]),
            createdAt: new Date().toISOString(),
          };
          setChatSessions(prev => [newSessionItem, ...prev]);
        } else {
          setChatSessions(prev => prev.map(s => 
            s.id === activeSessionId 
              ? { ...s, messages: JSON.stringify([...updatedMessages, { role: 'model', content: result.response }]) }
              : s
          ));
        }

        setChatMessages(prev => [...prev, { role: 'model', content: result.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'model', content: 'AI Tutor is currently busy. Try again shortly.' }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'model', content: 'Connection failed.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuickAction = (actionType: string) => {
    let prompt = '';
    switch (actionType) {
      case 'simple': prompt = "Explain the last concept in simple, ELI5 (Explain Like I'm 5) terms using analogies."; break;
      case 'detail': prompt = "Deep dive into the last concept in granular detail, explaining all parameters and architecture."; break;
      case 'example': prompt = "Provide a practical, real-world scenario and a code example showing this concept in action."; break;
      case 'flashcards': prompt = "Generate revision flashcards for this topic directly in the chat."; break;
      case 'quiz': prompt = "Generate a quick practice quiz of 3 questions based on our discussion."; break;
      case 'notes': prompt = "Generate a quick revision cheat sheet note for this concept."; break;
      case 'interview': prompt = "How is this concept typically asked in technical placement interviews? Provide example Q&As."; break;
      case 'exam': prompt = "How is this concept tested in the official certification exam? Provide a scenario-based practice question."; break;
      case 'related': prompt = "What are the closely related topics I should learn next?"; break;
      default: return;
    }
    triggerChatWithPrompt(prompt);
  };

  // Handler: AI Chat Submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const promptText = chatInput;
    setChatInput('');
    await triggerChatWithPrompt(promptText);
  };

  // Handler: Generate Study Plan
  const handleGeneratePlan = async () => {
    if (!selectedExamId || plannerLoading) return;
    setPlannerLoading(true);
    setPlanMarkdown('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'plan',
          examId: selectedExamId,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setPlanMarkdown(result.plan);
      } else {
        setPlanMarkdown('# Error\nFailed to compile study plan. Please verify target exam selections.');
      }
    } catch (e) {
      console.error(e);
      setPlanMarkdown('# Error\nServer connection failed.');
    } finally {
      setPlannerLoading(false);
    }
  };

  // Handler: AI Interview Coach Submit
  const handleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewInput.trim() || interviewLoading) return;

    const userMessage = { role: 'user' as const, content: interviewInput };
    const updatedMessages = [...interviewMessages, userMessage];
    setInterviewMessages(updatedMessages);
    setInterviewInput('');
    setInterviewLoading(true);

    try {
      const prompt = `
You are a technical interviewer for software engineering roles.
Here is the chat history:
${updatedMessages.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n')}

Evaluate the candidate's answer. Give a short, helpful feedback (praising correct concepts, politely pointing out any gaps), then ask the NEXT question about coding, data structures, or system design. Keep it concise.
      `.trim();

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        setInterviewMessages(prev => [...prev, { role: 'model', content: payload.response }]);
      } else {
        setInterviewMessages(prev => [...prev, { role: 'model', content: 'Connection timed out.' }]);
      }
    } catch (e) {
      setInterviewMessages(prev => [...prev, { role: 'model', content: 'AI coach is offline.' }]);
    } finally {
      setInterviewLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header className={styles.hubHeader}>
        <h2 className={styles.hubTitle}>AI Study Companion</h2>
        <p className={styles.hubDesc}>Deploy dynamic study planners, practice mock interviews, and resolve technical doubts with our generative exam agent.</p>
      </header>

      {/* Tabs list */}
      <div className={styles.tabsList}>
        <button 
          onClick={() => setActiveTab('chat')} 
          className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabBtnActive : ''}`}
        >
          <MessageSquare size={16} />
          <span>Interactive AI Tutor</span>
        </button>
        <button 
          onClick={() => setActiveTab('planner')} 
          className={`${styles.tabBtn} ${activeTab === 'planner' ? styles.tabBtnActive : ''}`}
        >
          <Calendar size={16} />
          <span>Personalized Study Planner</span>
        </button>
        <button 
          onClick={() => setActiveTab('interview')} 
          className={`${styles.tabBtn} ${activeTab === 'interview' ? styles.tabBtnActive : ''}`}
        >
          <UserCheck size={16} />
          <span>Technical Interview Coach</span>
        </button>
      </div>

      {/* Tab 1: AI TUTOR CHAT */}
      {activeTab === 'chat' && (
        <section className={styles.chatWorkspace}>
          {/* Chat Sidebar History */}
          <div className={styles.chatSidebar}>
            <button 
              onClick={handleNewChat}
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '12px', fontSize: '0.85rem' }}
            >
              <Plus size={14} />
              <span>New Conversation</span>
            </button>
            <span className={styles.sidebarTitle}>Recent Conversations</span>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {chatSessions.length > 0 ? (
                chatSessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`${styles.sessionLink} ${activeSessionId === session.id ? styles.sessionLinkActive : ''}`}
                  >
                    {session.title}
                  </button>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', fontStyle: 'italic', marginTop: '20px' }}>
                  No past conversations
                </div>
              )}
            </div>
          </div>

          {/* Chat main panel */}
          <div className={styles.chatPanel}>
            <div className={styles.chatMessages}>
              {chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`${styles.chatBubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleModel}`}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(msg.content) }} />
                  
                  {msg.role === 'model' && index === chatMessages.length - 1 && !chatLoading && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <button type="button" onClick={() => handleQuickAction('simple')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Explain Simpler</button>
                      <button type="button" onClick={() => handleQuickAction('detail')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Explain in Detail</button>
                      <button type="button" onClick={() => handleQuickAction('example')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Give Example</button>
                      <button type="button" onClick={() => handleQuickAction('flashcards')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Generate Flashcards</button>
                      <button type="button" onClick={() => handleQuickAction('quiz')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Generate Quiz</button>
                      <button type="button" onClick={() => handleQuickAction('notes')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Generate Notes</button>
                      <button type="button" onClick={() => handleQuickAction('interview')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Interview Q&A</button>
                      <button type="button" onClick={() => handleQuickAction('exam')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Exam Scenario</button>
                      <button type="button" onClick={() => handleQuickAction('related')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Related Topics</button>
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className={`${styles.chatBubble} ${styles.bubbleModel}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>AI Tutor is compiling response...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className={styles.chatInputWrapper}>
              <input 
                type="text" 
                placeholder="Ask me to explain any concept, write sample code, or build a practice quiz..."
                className="form-input styles.chatInput"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={chatLoading || !chatInput.trim()}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Tab 2: STUDY PLANNER */}
      {activeTab === 'planner' && (
        <section className={styles.plannerLayout}>
          <div className={styles.plannerSidebar}>
            <div className="input-group">
              <label className="input-label">Select Target Exam</label>
              <select 
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className={styles.selectInput}
              >
                {targetExamsList.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Study Duration</label>
              <select 
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className={styles.selectInput}
              >
                <option value="2 weeks">2 Weeks (Express)</option>
                <option value="1 month">1 Month (Balanced)</option>
                <option value="3 months">3 Months (Comprehensive)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Study hours per day</label>
              <select 
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                className={styles.selectInput}
              >
                <option value="1 hour">1 Hour / day</option>
                <option value="2 hours">2 Hours / day</option>
                <option value="4 hours">4 Hours / day (Intense)</option>
              </select>
            </div>

            <button
              onClick={handleGeneratePlan}
              className="btn btn-primary generateBtn"
              disabled={plannerLoading || !selectedExamId}
            >
              {plannerLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate AI Plan</span>
                </>
              )}
            </button>
          </div>

          <div className={styles.planViewer}>
            {planMarkdown ? (
              <article className="glass-card styles.proseCard prose">
                <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(planMarkdown) }} />
              </article>
            ) : (
              <div className={styles.emptyState}>
                <Compass size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <div className={styles.emptyTitle}>Personalized Study Calendar</div>
                <p className={styles.emptyDesc}>Choose a target exam on the left, define your timeline parameters, and let AI structure your custom week-by-week calendar.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: INTERVIEW COACH */}
      {activeTab === 'interview' && (
        <section className={styles.chatPanel} style={{ height: '520px' }}>
          <div className={styles.chatMessages}>
            {interviewMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`${styles.chatBubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleModel}`}
              >
                <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(msg.content) }} />
              </div>
            ))}
            {interviewLoading && (
              <div className={`${styles.chatBubble} ${styles.bubbleModel}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Interviewer is evaluating response...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleInterviewSubmit} className={styles.chatInputWrapper}>
            <input 
              type="text" 
              placeholder="Type your response here..."
              className="form-input styles.chatInput"
              value={interviewInput}
              onChange={(e) => setInterviewInput(e.target.value)}
              disabled={interviewLoading}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={interviewLoading || !interviewInput.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      )}
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
