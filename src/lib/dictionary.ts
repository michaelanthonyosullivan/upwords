export interface TrieNode {
  children: { [char: string]: TrieNode };
  isWord?: boolean;
}

export class Trie {
  root: TrieNode = { children: {} };

  insert(word: string) {
    let node = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!node.children[char]) {
        node.children[char] = { children: {} };
      }
      node = node.children[char];
    }
    node.isWord = true;
  }

  has(word: string): boolean {
    let node = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return !!node.isWord;
  }
}

let dictionaryInstance: Trie | null = null;
let isLoaded = false;
let isLoading = false;
let wordSet = new Set<string>();
let commonWordSet = new Set<string>();

export async function loadDictionary(onProgress?: (progress: number) => void): Promise<Trie> {
  if (dictionaryInstance && isLoaded) {
    return dictionaryInstance;
  }

  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return dictionaryInstance!;
  }

  isLoading = true;
  try {
    console.log('Loading dictionary and common words list...');
    
    // Fetch both files in parallel
    const [dictResponse, commonResponse] = await Promise.all([
      fetch('/dictionary.txt'),
      fetch('/common_words.txt')
    ]);

    if (!dictResponse.ok) {
      throw new Error(`Failed to load dictionary: status ${dictResponse.status}`);
    }
    if (!commonResponse.ok) {
      throw new Error(`Failed to load common words list: status ${commonResponse.status}`);
    }

    // 1. Process common words
    const commonText = await commonResponse.text();
    const commonWords = commonText.split('\n');
    const tempCommonSet = new Set<string>();
    for (const w of commonWords) {
      const clean = w.trim().toUpperCase();
      if (clean.length >= 2) {
        tempCommonSet.add(clean);
      }
    }
    commonWordSet = tempCommonSet;
    console.log(`Loaded ${commonWordSet.size} common words.`);

    // 2. Process full dictionary
    const text = await dictResponse.text();
    const words = text.split('\n');
    const trie = new Trie();
    const tempWordSet = new Set<string>();

    const totalWords = words.length;
    let lastReport = 0;

    for (let i = 0; i < totalWords; i++) {
      const word = words[i].trim().toUpperCase();
      if (word.length >= 2) {
        trie.insert(word);
        tempWordSet.add(word);
      }

      if (onProgress && i - lastReport > 15000) {
        onProgress(Math.round((i / totalWords) * 100));
        lastReport = i;
        await new Promise(resolve => setTimeout(resolve, 0)); // yield
      }
    }

    dictionaryInstance = trie;
    wordSet = tempWordSet;
    isLoaded = true;
    if (onProgress) onProgress(100);
    console.log(`Dictionary loaded successfully: ${tempWordSet.size} words.`);
    return trie;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    // Fallback
    const fallbackTrie = new Trie();
    const fallbackWords = ['UPWORDS', 'GAME', 'PLAY', 'WORD', 'BOARD', 'TILES', 'BEVEL', 'STACK', 'THREE', 'PLAYER', 'HELLO', 'WORLD', 'WORDS', 'CAT', 'BAT', 'CAB', 'COAT', 'DOG'];
    fallbackWords.forEach(w => {
      fallbackTrie.insert(w);
      wordSet.add(w);
      commonWordSet.add(w);
    });
    dictionaryInstance = fallbackTrie;
    isLoaded = true;
    return fallbackTrie;
  } finally {
    isLoading = false;
  }
}

export function isValidWord(word: string): boolean {
  const cleanWord = word.trim().toUpperCase();
  return wordSet.has(cleanWord);
}

export function isCommonWord(word: string): boolean {
  const cleanWord = word.trim().toUpperCase();
  return commonWordSet.has(cleanWord);
}

export function getWordSet(): Set<string> {
  return wordSet;
}

export function getCommonWordSet(): Set<string> {
  return commonWordSet;
}

export function getTrieRoot(): TrieNode | null {
  return dictionaryInstance ? dictionaryInstance.root : null;
}
