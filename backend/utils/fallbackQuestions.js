const RAW_FALLBACK_CODING_QUESTIONS = {
  Arrays: {
    easy: [
      {
        title: "Two Sum Indices",
        description: "Given an integer array nums and an integer target, return the indices of the two numbers that add up to target. Exactly one valid answer exists.",
        input_format: "First line: n target. Second line: n integers.",
        output_format: "Two space-separated indices in increasing order.",
        constraints: ["2 <= n <= 10^5", "-10^9 <= nums[i], target <= 10^9"],
        function_signature: "def solve():",
        test_cases: [
          { input: "4 9\n2 7 11 15", output: "0 1" },
          { input: "3 6\n3 2 4", output: "1 2" },
          { input: "2 6\n3 3", output: "0 1" }
        ]
      },
      {
        title: "Best Time to Buy and Sell Stock",
        description: "You are given daily stock prices. Choose one day to buy and one later day to sell to maximize profit. If no profit is possible, output 0.",
        input_format: "First line: n. Second line: n integers representing prices.",
        output_format: "Maximum possible profit as an integer.",
        constraints: ["1 <= n <= 2 * 10^5", "0 <= prices[i] <= 10^4"],
        function_signature: "def solve():",
        test_cases: [
          { input: "6\n7 1 5 3 6 4", output: "5" },
          { input: "5\n7 6 4 3 1", output: "0" },
          { input: "5\n2 1 2 1 0", output: "1" }
        ]
      },
      {
        title: "Contains Duplicate",
        description: "Given an integer array, determine if any value appears at least twice.",
        input_format: "First line: n. Second line: n integers.",
        output_format: "Print true or false.",
        constraints: ["1 <= n <= 2 * 10^5", "-10^9 <= nums[i] <= 10^9"],
        function_signature: "def solve():",
        test_cases: [
          { input: "4\n1 2 3 1", output: "true" },
          { input: "4\n1 2 3 4", output: "false" },
          { input: "5\n1 1 1 3 3", output: "true" }
        ]
      }
    ],
    medium: [
      {
        title: "Product of Array Except Self",
        description: "Given an array nums, return an array answer where answer[i] equals the product of all elements except nums[i]. Do not use division.",
        input_format: "First line: n. Second line: n integers.",
        output_format: "n space-separated integers.",
        constraints: ["2 <= n <= 10^5", "-30 <= nums[i] <= 30"],
        function_signature: "def solve():",
        test_cases: [
          { input: "4\n1 2 3 4", output: "24 12 8 6" },
          { input: "5\n-1 1 0 -3 3", output: "0 0 9 0 0" },
          { input: "3\n2 3 4", output: "12 8 6" }
        ]
      },
      {
        title: "Maximum Subarray",
        description: "Given an integer array, find the contiguous subarray with the largest sum and print that sum.",
        input_format: "First line: n. Second line: n integers.",
        output_format: "Maximum subarray sum.",
        constraints: ["1 <= n <= 2 * 10^5", "-10^4 <= nums[i] <= 10^4"],
        function_signature: "def solve():",
        test_cases: [
          { input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6" },
          { input: "1\n1", output: "1" },
          { input: "5\n5 4 -1 7 8", output: "23" }
        ]
      },
      {
        title: "Merge Intervals",
        description: "Given a list of intervals, merge all overlapping intervals and print the merged intervals sorted by start time.",
        input_format: "First line: n. Next n lines: start end.",
        output_format: "Print merged intervals line by line as start end.",
        constraints: ["1 <= n <= 10^5", "0 <= start <= end <= 10^9"],
        function_signature: "def solve():",
        test_cases: [
          { input: "4\n1 3\n2 6\n8 10\n15 18", output: "1 6\n8 10\n15 18" },
          { input: "2\n1 4\n4 5", output: "1 5" },
          { input: "3\n1 2\n3 4\n5 6", output: "1 2\n3 4\n5 6" }
        ]
      }
    ],
    hard: [
      {
        title: "Trapping Rain Water",
        description: "Given elevation heights, compute how much rain water can be trapped after raining.",
        input_format: "First line: n. Second line: n integers.",
        output_format: "Single integer total trapped water.",
        constraints: ["1 <= n <= 2 * 10^5", "0 <= height[i] <= 10^5"],
        function_signature: "def solve():",
        test_cases: [
          { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", output: "6" },
          { input: "6\n4 2 0 3 2 5", output: "9" },
          { input: "3\n1 2 3", output: "0" }
        ]
      },
      {
        title: "First Missing Positive",
        description: "Find the smallest missing positive integer from an unsorted integer array.",
        input_format: "First line: n. Second line: n integers.",
        output_format: "Smallest missing positive integer.",
        constraints: ["1 <= n <= 2 * 10^5", "-2^31 <= nums[i] <= 2^31-1"],
        function_signature: "def solve():",
        test_cases: [
          { input: "3\n1 2 0", output: "3" },
          { input: "4\n3 4 -1 1", output: "2" },
          { input: "5\n7 8 9 11 12", output: "1" }
        ]
      }
    ]
  },
  Strings: {
    easy: [
      {
        title: "Valid Anagram",
        description: "Given strings s and t, print true if t is an anagram of s, otherwise false.",
        input_format: "Two lines: string s, string t.",
        output_format: "Print true or false.",
        constraints: ["1 <= |s|, |t| <= 10^5", "Strings contain lowercase English letters"],
        function_signature: "def solve():",
        test_cases: [
          { input: "anagram\nnagaram", output: "true" },
          { input: "rat\ncar", output: "false" },
          { input: "listen\nsilent", output: "true" }
        ]
      },
      {
        title: "Longest Common Prefix",
        description: "Given an array of strings, find the longest common prefix shared by all strings.",
        input_format: "First line: n. Next n lines: strings.",
        output_format: "Longest common prefix string (empty if none).",
        constraints: ["1 <= n <= 2000", "0 <= |strs[i]| <= 200"],
        function_signature: "def solve():",
        test_cases: [
          { input: "3\nflower\nflow\nflight", output: "fl" },
          { input: "3\ndog\nracecar\ncar", output: "" },
          { input: "2\ninterview\ninternal", output: "inter" }
        ]
      }
    ],
    medium: [
      {
        title: "Longest Substring Without Repeating Characters",
        description: "Given a string s, find the length of the longest substring without repeating characters.",
        input_format: "Single line string s.",
        output_format: "Single integer length.",
        constraints: ["0 <= |s| <= 2 * 10^5"],
        function_signature: "def solve():",
        test_cases: [
          { input: "abcabcbb", output: "3" },
          { input: "bbbbb", output: "1" },
          { input: "pwwkew", output: "3" }
        ]
      },
      {
        title: "Group Anagrams",
        description: "Given an array of strings, group anagrams together. Print each group on a new line with words sorted lexicographically.",
        input_format: "First line: n. Next n lines: strings.",
        output_format: "Each line contains one anagram group sorted and joined by a space.",
        constraints: ["1 <= n <= 10^4", "0 <= |strs[i]| <= 100"],
        function_signature: "def solve():",
        test_cases: [
          { input: "6\neat\ntea\ntan\nate\nnat\nbat", output: "ate eat tea\nbat\nnat tan" },
          { input: "1\na", output: "a" },
          { input: "2\n\n", output: "" }
        ]
      }
    ],
    hard: [
      {
        title: "Minimum Window Substring",
        description: "Given strings s and t, return the smallest substring in s containing all characters of t including multiplicity. If impossible, return empty string.",
        input_format: "Two lines: s and t.",
        output_format: "Smallest valid window string or empty string.",
        constraints: ["1 <= |s|, |t| <= 10^5"],
        function_signature: "def solve():",
        test_cases: [
          { input: "ADOBECODEBANC\nABC", output: "BANC" },
          { input: "a\naa", output: "" },
          { input: "aa\naa", output: "aa" }
        ]
      }
    ]
  },
  Trees: {
    easy: [
      {
        title: "Maximum Depth of Binary Tree",
        description: "Given level-order traversal of a binary tree using -1 for null, return the maximum depth.",
        input_format: "First line: n. Second line: n integers in level order with -1 as null.",
        output_format: "Single integer depth.",
        constraints: ["0 <= n <= 10^5"],
        function_signature: "def solve():",
        test_cases: [
          { input: "7\n3 9 20 -1 -1 15 7", output: "3" },
          { input: "1\n1", output: "1" },
          { input: "0\n", output: "0" }
        ]
      }
    ],
    medium: [
      {
        title: "Binary Tree Level Order Traversal",
        description: "Given level-order serialization of a binary tree with -1 as null, print nodes level by level.",
        input_format: "First line: n. Second line: n integers in level order.",
        output_format: "Each level on a new line with space-separated values.",
        constraints: ["0 <= n <= 10^5"],
        function_signature: "def solve():",
        test_cases: [
          { input: "7\n3 9 20 -1 -1 15 7", output: "3\n9 20\n15 7" },
          { input: "1\n1", output: "1" },
          { input: "3\n1 -1 2", output: "1\n2" }
        ]
      }
    ],
    hard: [
      {
        title: "Serialize and Deserialize Binary Tree",
        description: "Implement serialization and deserialization for a binary tree using level order notation with # for nulls.",
        input_format: "A single line serialization string.",
        output_format: "Print the serialization after deserialize-serialize round-trip.",
        constraints: ["Tree nodes <= 10^4"],
        function_signature: "def solve():",
        test_cases: [
          { input: "1,2,3,#,#,4,5", output: "1,2,3,#,#,4,5" },
          { input: "", output: "" },
          { input: "1,#,2,#,3", output: "1,#,2,#,3" }
        ]
      }
    ]
  },
  Graphs: {
    easy: [
      {
        title: "Number of Connected Components",
        description: "Given an undirected graph with n nodes and m edges, count connected components.",
        input_format: "First line: n m. Next m lines: u v (0-indexed).",
        output_format: "Single integer component count.",
        constraints: ["1 <= n <= 10^5", "0 <= m <= 2 * 10^5"],
        function_signature: "def solve():",
        test_cases: [
          { input: "5 3\n0 1\n1 2\n3 4", output: "2" },
          { input: "4 0", output: "4" },
          { input: "3 2\n0 1\n1 2", output: "1" }
        ]
      }
    ],
    medium: [
      {
        title: "Course Schedule",
        description: "Given numCourses and prerequisite pairs, determine if all courses can be finished.",
        input_format: "First line: n m. Next m lines: a b meaning b must be done before a.",
        output_format: "Print true if all courses can be completed, else false.",
        constraints: ["1 <= n <= 10^5", "0 <= m <= 2 * 10^5"],
        function_signature: "def solve():",
        test_cases: [
          { input: "2 1\n1 0", output: "true" },
          { input: "2 2\n1 0\n0 1", output: "false" },
          { input: "4 3\n1 0\n2 0\n3 1", output: "true" }
        ]
      }
    ],
    hard: [
      {
        title: "Network Delay Time",
        description: "Given directed weighted edges, n nodes, and a source k, find time for all nodes to receive the signal. Return -1 if impossible.",
        input_format: "First line: n m k. Next m lines: u v w.",
        output_format: "Single integer minimum time or -1.",
        constraints: ["1 <= n <= 10^5", "1 <= m <= 2 * 10^5", "0 <= w <= 10^6"],
        function_signature: "def solve():",
        test_cases: [
          { input: "4 3 2\n2 1 1\n2 3 1\n3 4 1", output: "2" },
          { input: "2 1 1\n1 2 1", output: "1" },
          { input: "2 1 2\n1 2 1", output: "-1" }
        ]
      }
    ]
  },
  "Dynamic Programming": {
    easy: [
      {
        title: "Climbing Stairs",
        description: "You can climb 1 or 2 steps at a time. Given n, return total distinct ways to reach the top.",
        input_format: "Single integer n.",
        output_format: "Single integer ways.",
        constraints: ["1 <= n <= 45"],
        function_signature: "def solve():",
        test_cases: [
          { input: "2", output: "2" },
          { input: "3", output: "3" },
          { input: "5", output: "8" }
        ]
      }
    ],
    medium: [
      {
        title: "Coin Change",
        description: "Given coin denominations and an amount, return minimum number of coins required to make the amount, or -1 if not possible.",
        input_format: "First line: n amount. Second line: n integers for coin values.",
        output_format: "Single integer minimum coins.",
        constraints: ["1 <= n <= 100", "0 <= amount <= 10^4"],
        function_signature: "def solve():",
        test_cases: [
          { input: "3 11\n1 2 5", output: "3" },
          { input: "1 3\n2", output: "-1" },
          { input: "1 0\n1", output: "0" }
        ]
      }
    ],
    hard: [
      {
        title: "Longest Increasing Subsequence",
        description: "Given an integer array, return the length of the longest strictly increasing subsequence.",
        input_format: "First line: n. Second line: n integers.",
        output_format: "Single integer LIS length.",
        constraints: ["1 <= n <= 2 * 10^5", "-10^9 <= nums[i] <= 10^9"],
        function_signature: "def solve():",
        test_cases: [
          { input: "8\n10 9 2 5 3 7 101 18", output: "4" },
          { input: "6\n0 1 0 3 2 3", output: "4" },
          { input: "7\n7 7 7 7 7 7 7", output: "1" }
        ]
      }
    ]
  }
};

const DEFAULT_TOPIC = "Arrays";
const DEFAULT_DIFFICULTY = "easy";

function normalizeTopicKey(topic = "") {
  const normalized = String(topic || "").trim().toLowerCase();
  const keys = Object.keys(RAW_FALLBACK_CODING_QUESTIONS);
  const exact = keys.find((key) => key.toLowerCase() === normalized);
  if (exact) return exact;

  const aliasMap = {
    array: "Arrays",
    arrays: "Arrays",
    string: "Strings",
    strings: "Strings",
    tree: "Trees",
    trees: "Trees",
    graph: "Graphs",
    graphs: "Graphs",
    dp: "Dynamic Programming",
    "dynamic programming": "Dynamic Programming",
    "dynamic-programming": "Dynamic Programming"
  };

  return aliasMap[normalized] || DEFAULT_TOPIC;
}

function normalizeConstraintList(constraints) {
  if (Array.isArray(constraints)) return constraints.map(String);
  if (typeof constraints === "string" && constraints.trim()) return [constraints.trim()];
  return [];
}

function normalizeFallbackCodingQuestion(rawQuestion, topic = DEFAULT_TOPIC, difficulty = DEFAULT_DIFFICULTY) {
  const defaultPool = RAW_FALLBACK_CODING_QUESTIONS[DEFAULT_TOPIC][DEFAULT_DIFFICULTY] || [];
  const safeQuestion = rawQuestion || defaultPool[0];
  // Ensure test cases exist; provide defaults if missing
  const visibleCases = Array.isArray(safeQuestion.test_cases) && safeQuestion.test_cases.length > 0
    ? safeQuestion.test_cases
    : [
        { input: "1", output: "1" },
        { input: "2", output: "2" },
        { input: "0", output: "0" }
      ];

  return {
    title: safeQuestion.title,
    description: safeQuestion.description,
    question: safeQuestion.description,
    type: "coding",
    difficulty: String(difficulty || DEFAULT_DIFFICULTY).toLowerCase(),
    topic: topic || DEFAULT_TOPIC,
    domain: "Data Structures & Algorithms",
    timeLimit: 180,
    isCoding: true,
    input_format: safeQuestion.input_format,
    output_format: safeQuestion.output_format,
    function_signature: safeQuestion.function_signature,
    inputFormat: safeQuestion.input_format,
    outputFormat: safeQuestion.output_format,
    constraints: normalizeConstraintList(safeQuestion.constraints),
    examples: (visibleCases && visibleCases.length > 0)
      ? visibleCases.slice(0, Math.min(2, visibleCases.length)).map((testCase) => ({
          input: String(testCase.input ?? ""),
          output: String(testCase.output ?? ""),
          explanation: "Deterministic fallback example"
        }))
      : [
          { input: "Example 1", output: "Output 1", explanation: "" },
          { input: "Example 2", output: "Output 2", explanation: "" }
        ],
    test_cases: (visibleCases && visibleCases.length > 0)
      ? visibleCases.map((testCase, index) => ({
          input: String(testCase.input ?? ""),
          output: String(testCase.output ?? ""),
          isHidden: index >= 2
        }))
      : [
          { input: "1", output: "1", isHidden: false },
          { input: "2", output: "2", isHidden: false },
          { input: "0", output: "0", isHidden: true }
        ],
    testCases: (visibleCases && visibleCases.length > 0)
      ? visibleCases.map((testCase, index) => ({
          input: String(testCase.input ?? ""),
          expected: String(testCase.output ?? ""),
          isHidden: index >= 2,
          description: index < 2 ? "Visible fallback test case" : "Hidden fallback test case"
        }))
      : [
          { input: "1", expected: "1", isHidden: false, description: "Visible fallback test case" },
          { input: "2", expected: "2", isHidden: false, description: "Visible fallback test case" },
          { input: "0", expected: "0", isHidden: true, description: "Hidden fallback test case" }
        ],
    hiddenTestCases: (visibleCases && visibleCases.length > 0)
      ? visibleCases
          .filter((_, index) => index >= 2)
          .map((testCase) => ({
            input: String(testCase.input ?? ""),
            expected: String(testCase.output ?? ""),
            isHidden: true,
            description: "Hidden fallback test case"
          }))
      : [
          { input: "0", expected: "0", isHidden: true, description: "Hidden fallback test case" }
        ],
    tags: [topic || DEFAULT_TOPIC, "Fallback"],
    expectedApproach: "Read all test cases, solve each deterministically, and print one line per test case.",
    expectedComplexity: {
      time: "O(t)",
      space: "O(1)"
    }
  };
}

function getFallbackCodingQuestion(topic = DEFAULT_TOPIC, difficulty = DEFAULT_DIFFICULTY) {
  const selected = getFallbackCodingQuestions({ topic, difficulty, count: 1 });
  return selected[0];
}

function getFallbackCodingQuestions({ topic = DEFAULT_TOPIC, difficulty = DEFAULT_DIFFICULTY, count = 1, excludeTitles = [] } = {}) {
  const topicKey = normalizeTopicKey(topic);
  const topicBucket = RAW_FALLBACK_CODING_QUESTIONS[topicKey] || RAW_FALLBACK_CODING_QUESTIONS[DEFAULT_TOPIC];
  const difficultyKey = String(difficulty || DEFAULT_DIFFICULTY).toLowerCase();
  const pool = Array.isArray(topicBucket[difficultyKey]) && topicBucket[difficultyKey].length > 0
    ? topicBucket[difficultyKey]
    : (topicBucket[DEFAULT_DIFFICULTY] || RAW_FALLBACK_CODING_QUESTIONS[DEFAULT_TOPIC][DEFAULT_DIFFICULTY] || []);

  const excluded = new Set((excludeTitles || []).map((item) => String(item || "").toLowerCase()));
  const filteredPool = pool.filter((q) => !excluded.has(String(q?.title || "").toLowerCase()));
  const sourcePool = filteredPool.length > 0 ? filteredPool : pool;
  const requiredCount = Math.max(1, Number(count || 1));
  const offset = Date.now() % Math.max(1, sourcePool.length);

  const selected = [];
  for (let i = 0; i < requiredCount; i += 1) {
    const candidate = sourcePool[(offset + i) % sourcePool.length];
    if (candidate) {
      selected.push(normalizeFallbackCodingQuestion(candidate, topicKey, difficultyKey));
    }
  }

  return selected;
}

module.exports = {
  RAW_FALLBACK_CODING_QUESTIONS,
  getFallbackCodingQuestion,
  getFallbackCodingQuestions,
  normalizeTopicKey,
  normalizeFallbackCodingQuestion
};
