import fs from 'fs';
import path from 'path';

interface RAGChunk {
  sourceFile: string;
  sourceTitle: string;
  content: string;
  score?: number;
}

// Global cache of document chunks
let chunksCache: RAGChunk[] | null = null;

function getAllFilesRecursive(dirPath: string): string[] {
  let results: string[] = [];
  try {
    const list = fs.readdirSync(dirPath);
    list.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFilesRecursive(fullPath));
      } else if (file.endsWith('.md')) {
        results.push(fullPath);
      }
    });
  } catch (e) {
    console.error('Recursive scan error:', e);
  }
  return results;
}

function loadKnowledgeBase(): RAGChunk[] {
  if (chunksCache) return chunksCache;

  const kbPath = path.join(process.cwd(), 'knowledge_base');
  const loadedChunks: RAGChunk[] = [];

  try {
    if (!fs.existsSync(kbPath)) {
      return [];
    }

    const files = getAllFilesRecursive(kbPath);

    for (const fullPath of files) {
      const relativeFile = path.relative(kbPath, fullPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Parse file title from first header
      const titleMatch = content.match(/^# (.*)/);
      const sourceTitle = titleMatch ? titleMatch[1] : path.basename(fullPath);

      // Split file into logical sections by H2 or H3 headers
      const sections = content.split(/(?=^## )/gm);

      for (const section of sections) {
        const trimmed = section.trim();
        if (trimmed.length > 50) {
          loadedChunks.push({
            sourceFile: relativeFile,
            sourceTitle,
            content: trimmed,
          });
        }
      }
    }

    chunksCache = loadedChunks;
    return loadedChunks;
  } catch (error) {
    console.error('Failed to load local RAG knowledge base:', error);
    return [];
  }
}

// Retrieve relevant context chunks matching query keywords
export function retrieveGroundedContext(query: string, limit = 2): string {
  const allChunks = loadKnowledgeBase();
  if (allChunks.length === 0) return '';

  // Tokenize query into alphanumeric words, ignoring small words
  const queryTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 3);

  if (queryTokens.length === 0) return '';

  const scoredChunks = allChunks.map(chunk => {
    let score = 0;
    const chunkText = chunk.content.toLowerCase();

    // Simple TF-IDF overlap score
    queryTokens.forEach(token => {
      const regex = new RegExp('\\b' + token + '\\b', 'g');
      const matches = chunkText.match(regex);
      if (matches) {
        score += matches.length;
      }
    });

    return { ...chunk, score };
  });

  // Filter out zero scores and sort by descending overlap score
  const matches = scoredChunks
    .filter(c => c.score && c.score > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);

  if (matches.length === 0) return '';

  // Format retrieved sections into prompt context string
  return matches
    .map(m => `[SOURCE: ${m.sourceTitle} (${m.sourceFile})]\n${m.content}\n---`)
    .join('\n\n');
}
