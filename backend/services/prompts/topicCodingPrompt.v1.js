// Topic-specific coding problem generation prompt
// This generates LeetCode-style problems based on specific DSA topics

const version = 'topicCoding.v1';

// Topic-specific problem patterns
const TOPIC_PATTERNS = {
  // Arrays & Strings
  'arrays': 'array manipulation, two pointers, sliding window, prefix sums',
  'strings': 'string manipulation, pattern matching, palindromes, anagrams',

  // Dynamic Programming
  'dp': 'dynamic programming with optimal substructure, memoization, tabulation. Classic DP patterns like knapsack, LCS, LIS, coin change',
  'dynamic-programming': 'dynamic programming with state transitions, recurrence relations. Problems involving subsequences, partitions, or optimization',

  // Trees
  'trees': 'binary tree traversals, BST operations, tree construction, tree properties',
  'binary-trees': 'binary tree DFS/BFS, path sums, tree serialization, LCA',
  'bst': 'binary search tree insertion, deletion, search, validation, successor/predecessor',

  // Graphs
  'graphs': 'graph traversal (DFS/BFS), shortest path, cycle detection, topological sort',
  'graph-algorithms': 'Dijkstra, BFS shortest path, connected components, bipartite checking',

  // Sorting & Searching
  'sorting': 'sorting algorithms, custom comparators, merge sort applications',
  'searching': 'binary search variants, rotated arrays, peak finding, search space reduction',
  'binary-search': 'binary search on answer, lower/upper bound, search in rotated array',

  // Data Structures
  'stacks': 'stack-based problems, monotonic stack, expression evaluation, balanced parentheses',
  'queues': 'queue operations, BFS applications, sliding window maximum',
  'heaps': 'heap operations, k-th largest, merge k sorted, top k frequent',
  'hash-maps': 'hash map for counting, two sum patterns, subarray sums',
  'linked-lists': 'linked list operations, reversal, cycle detection, merge lists',

  // Advanced
  'recursion': 'recursive problem solving, backtracking, divide and conquer',
  'backtracking': 'N-queens, permutations, combinations, sudoku solver',
  'greedy': 'greedy algorithms, activity selection, interval scheduling, huffman coding',
  'bit-manipulation': 'bitwise operations, XOR tricks, counting bits, power of two'
};

const buildTopicCodingQuestionPrompt = ({ topic, difficulty = 'medium', count = 1 }) => {
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '-');
  const topicPattern = TOPIC_PATTERNS[normalizedTopic] || `${topic} related algorithmic problems`;

  const difficultyGuide = {
    easy: 'Simple, direct application. Small input (n ≤ 1000).',
    medium: 'Requires insight or combination of techniques. Input up to 10^5.',
    hard: 'Complex, multiple techniques needed. Input up to 10^6.'
  };

  return `Generate ${count} ${difficulty.toUpperCase()} coding problem for "${topic}".

TOPIC: ${topicPattern}
DIFFICULTY: ${difficultyGuide[difficulty] || difficultyGuide.medium}

Return ONLY this JSON structure (no markdown):
{
  "questions": [{
    "title": "Short title",
    "description": "Problem description (50-100 words)",
    "input_format": "First line: N. Second line: N integers.",
    "output_format": "Single integer/line output",
    "constraints": ["1 <= n <= 10^5"],
    "function_signature": "def solve():",
    "test_cases": [
      {"input": "3\\n1 2 3", "output": "6"},
      {"input": "5\\n1 2 3 4 5", "output": "15"}
    ]
  }]
}

RULES:
1. Problem MUST require "${topic}" knowledge
2. Keep descriptions concise
3. Include at least 2 deterministic test cases
4. Make input/output unambiguous
5. Generate test cases strictly based on the problem logic
6. Each test case must include correct expected output
7. Do NOT generate random outputs`;
};

const schema = {
  requiredKeys: ['questions']
};

module.exports = {
  version,
  buildTopicCodingQuestionPrompt,
  TOPIC_PATTERNS,
  schema
};
