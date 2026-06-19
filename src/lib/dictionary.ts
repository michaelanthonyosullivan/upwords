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
      if (!node.children[char]) node.children[char] = { children: {} };
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
// commonWordSet is now the curated list used for all validation
let commonWordSet = new Set<string>();
// fullWordSet kept for AI and Trie-based prefix lookups
let fullWordSet = new Set<string>();

export async function loadDictionary(onProgress?: (progress: number) => void): Promise<Trie> {
  if (dictionaryInstance && isLoaded) return dictionaryInstance;

  if (isLoading) {
    while (isLoading) await new Promise(r => setTimeout(r, 50));
    return dictionaryInstance!;
  }

  isLoading = true;
  try {
    // Load common words (curated everyday English – no proper nouns) in parallel with full dict
    const [dictResponse, commonResponse] = await Promise.all([
      fetch('/dictionary.txt'),
      fetch('/common_words.txt')
    ]);

    if (!dictResponse.ok) throw new Error(`Dictionary load failed: ${dictResponse.status}`);
    if (!commonResponse.ok) throw new Error(`Common words load failed: ${commonResponse.status}`);

    // 1. Build common word set (used for game validation)
    const commonText = await commonResponse.text();
    const tempCommon = new Set<string>();
    for (const w of commonText.split('\n')) {
      const clean = w.trim().toUpperCase();
      if (clean.length >= 2 && clean.length <= 15) tempCommon.add(clean);
    }
    commonWordSet = tempCommon;

    // 2. Build full dictionary trie (used for AI move generation via prefix search)
    const text = await dictResponse.text();
    const words = text.split('\n');
    const trie = new Trie();
    const tempFull = new Set<string>();
    const total = words.length;
    let lastReport = 0;

    for (let i = 0; i < total; i++) {
      const word = words[i].trim().toUpperCase();
      if (word.length >= 2) {
        trie.insert(word);
        tempFull.add(word);
      }
      if (onProgress && i - lastReport > 15000) {
        onProgress(Math.round((i / total) * 100));
        lastReport = i;
        await new Promise(r => setTimeout(r, 0));
      }
    }

    dictionaryInstance = trie;
    fullWordSet = tempFull;
    isLoaded = true;
    if (onProgress) onProgress(100);
    console.log(`Dictionary loaded: ${fullWordSet.size} full / ${commonWordSet.size} common words.`);
    return trie;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    const fallback = new Trie();
    const words = ['UPWORDS','GAME','PLAY','WORD','BOARD','TILES','STACK',
                   'HELLO','WORLD','CAT','BAT','CAB','COAT','DOG','THE','AND','FOR',
                   'ARE','BUT','NOT','YOU','ALL','CAN','HER','WAS','ONE','OUR'];
    words.forEach(w => { fallback.insert(w); fullWordSet.add(w); commonWordSet.add(w); });
    dictionaryInstance = fallback;
    isLoaded = true;
    return fallback;
  } finally {
    isLoading = false;
  }
}

/** Validates a word for gameplay — uses the curated common-English set */
export function isValidWord(word: string): boolean {
  const clean = word.trim().toUpperCase();
  // Primary: check curated common dictionary
  if (commonWordSet.size > 0) return commonWordSet.has(clean);
  // Fallback: full dictionary if common set somehow not loaded
  return fullWordSet.has(clean);
}

export function isCommonWord(word: string): boolean {
  return commonWordSet.has(word.trim().toUpperCase());
}

export function getWordSet(): Set<string> { return fullWordSet; }
export function getCommonWordSet(): Set<string> { return commonWordSet; }
export function getTrieRoot(): TrieNode | null {
  return dictionaryInstance ? dictionaryInstance.root : null;
}
