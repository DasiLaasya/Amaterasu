'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Code, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';
import styles from '../app/(app)/coding/page.module.css';

interface Problem {
  id: string;
  text: string;
  difficulty: string;
  companyTags: string; // JSON string
  topic: {
    name: string;
    subject: {
      name: string;
    }
  }
}

interface CodingListProps {
  initialProblems: Problem[];
  completedProblemIds: string[];
}

export default function CodingList({ initialProblems, completedProblemIds }: CodingListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDiff, setActiveDiff] = useState('All');

  // Helper to parse company tags
  const getTags = (jsonStr: string): string[] => {
    try {
      return JSON.parse(jsonStr || '[]');
    } catch (e) {
      return [];
    }
  };

  const filteredProblems = initialProblems.filter(p => {
    const tags = getTags(p.companyTags);
    const matchesSearch = 
      p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDiff = 
      activeDiff === 'All' || 
      p.difficulty.toLowerCase() === activeDiff.toLowerCase();

    return matchesSearch && matchesDiff;
  });

  const diffBadgeClass = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return styles.diffEasy;
      case 'medium': return styles.diffMedium;
      case 'hard': return styles.diffHard;
      default: return '';
    }
  };

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <h2 className={styles.title}>Coding Practice Arena</h2>
        <p className={styles.desc}>Enhance your placement preparation. Solve coding challenges across array, search, and dynamic algorithms in JavaScript.</p>
      </header>

      {/* Filters bar */}
      <section className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search problems, topics, or companies..." 
            className="form-input styles.searchInput"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.difficultyFilters}>
          {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
            <button
              key={diff}
              onClick={() => setActiveDiff(diff)}
              className={`${styles.diffTab} ${activeDiff === diff ? styles.diffTabActive : ''}`}
            >
              {diff}
            </button>
          ))}
        </div>
      </section>

      {/* Problems table */}
      <section className="glass-card styles.tableCard">
        {filteredProblems.length > 0 ? (
          <table className={styles.problemsTable}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Status</th>
                <th>Challenge</th>
                <th>Topic</th>
                <th>Difficulty</th>
                <th>Target Companies</th>
                <th style={{ width: '100px' }} className={styles.actionCell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map(p => {
                const tags = getTags(p.companyTags);
                const isCompleted = completedProblemIds.includes(p.id);
                // Summarize challenge name (e.g. extracts first line or matches title)
                const challengeName = p.text.substring(0, 45) + (p.text.length > 45 ? '...' : '');

                return (
                  <tr key={p.id}>
                    <td>
                      {isCompleted ? (
                        <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                      ) : (
                        <Code size={18} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </td>
                    <td>
                      <Link href={`/coding/${p.id}`} className={styles.problemTitleLink}>
                        {challengeName}
                      </Link>
                    </td>
                    <td>{p.topic.name}</td>
                    <td>
                      <span className={`${styles.difficultyBadge} ${diffBadgeClass(p.difficulty)}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td>
                      <div className={styles.companyBadges}>
                        {tags.map(t => (
                          <span key={t} className={styles.companyBadge}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.actionCell}>
                      <Link href={`/coding/${p.id}`} className={`btn btn-primary ${styles.solveBtn}`}>
                        <span>Solve</span>
                        <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            No coding challenges found matching your filters.
          </div>
        )}
      </section>
    </div>
  );
}
