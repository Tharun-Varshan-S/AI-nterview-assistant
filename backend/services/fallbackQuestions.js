const {
  getFallbackCodingQuestion,
  getFallbackCodingQuestions,
  RAW_FALLBACK_CODING_QUESTIONS,
  normalizeTopicKey,
} = require('../utils/fallbackQuestions');

const THEORETICAL_BANK = {
  Arrays: {
    theoretical: [
      'How does contiguous memory layout in arrays influence cache behavior and algorithm performance?',
      'When would you prefer dynamic arrays over linked structures despite costly mid-array insertions?',
    ],
    practical: [
      'Design an approach to detect duplicates in a million-element array under tight memory limits.',
      'How would you compute prefix sums to answer repeated range-sum queries efficiently?',
    ],
    scenario: [
      'Your API latency spiked after sorting request payload arrays repeatedly. How would you diagnose and optimize it?',
      'A bug appears only for large arrays during merge logic. What edge cases would you test first and why?',
    ],
  },
  Strings: {
    theoretical: [
      'Explain why string immutability exists in many languages and how it impacts performance-sensitive code.',
      'What are the tradeoffs between character arrays, StringBuilder-style buffers, and immutable strings?',
    ],
    practical: [
      'How would you implement an efficient anagram checker for large inputs with mixed character sets?',
      'Describe a robust method to find the longest unique-character substring in linear time.',
    ],
    scenario: [
      'Search indexing is slow because of repeated substring extraction. How would you redesign this pipeline?',
      'Usernames must support Unicode safely. What normalization and validation approach would you adopt?',
    ],
  },
  'Database Transactions & ACID Properties': {
    theoretical: [
      'How do isolation levels impact consistency and throughput in transactional databases?',
      'Why can eventual consistency be acceptable in some systems but not in payment workflows?',
    ],
    practical: [
      'How would you implement idempotent payment processing with retries using transactions?',
      'Design a transaction strategy for order placement that updates inventory, payment, and invoice records safely.',
    ],
    scenario: [
      'A production incident caused double charges after timeout retries. What transaction and locking changes would you introduce?',
      'Deadlocks increased after a schema migration. How would you triage and fix without downtime?',
    ],
  },
  'Microservices Architecture Principles': {
    theoretical: [
      'Compare orchestration vs choreography for microservices and when each model fits better.',
      'How do bounded contexts reduce coupling and improve service ownership?',
    ],
    practical: [
      'Design inter-service communication for checkout, inventory, and payment with failure handling.',
      'How would you implement distributed tracing and correlation IDs across services?',
    ],
    scenario: [
      'A downstream service is unstable and cascading failures are occurring. What resilience patterns would you apply first?',
      'A monolith is being decomposed and data ownership is unclear. What migration sequence would you propose?',
    ],
  },
  'Git Version Control': {
    theoretical: [
      'What is the difference between rebase and merge in collaborative workflows?',
      'Why does rewriting public history create risk and how do teams prevent it?',
    ],
    practical: [
      'How would you recover a commit lost after an accidental hard reset?',
      'Describe a clean strategy to split a large feature branch into reviewable pull requests.',
    ],
    scenario: [
      'Your branch diverged heavily from main and release is today. How would you resolve safely?',
      'A teammate force-pushed and broke shared history. What exact recovery process would you follow?',
    ],
  },
  General: {
    theoretical: [
      'How do time and space complexity tradeoffs influence architecture decisions in real systems?',
      'What makes an API design maintainable over multiple product iterations?',
    ],
    practical: [
      'How would you structure logging, metrics, and alerts for a new backend service?',
      'Design a validation pipeline for user-generated data entering your platform.',
    ],
    scenario: [
      'Production error rates increased after deployment. Walk through your incident response steps.',
      'A feature request conflicts with current system boundaries. How would you redesign incrementally?',
    ],
  },
};

const DIFFICULTY_BY_TYPE = {
  theoretical: 'easy',
  practical: 'medium',
  scenario: 'hard',
};

function resolveTheoryTopic(topic = 'General') {
  const normalized = String(topic || '').trim().toLowerCase();
  const keys = Object.keys(THEORETICAL_BANK);
  const exact = keys.find((key) => key.toLowerCase() === normalized);
  if (exact) return exact;

  const codingTopic = normalizeTopicKey(topic);
  if (THEORETICAL_BANK[codingTopic]) return codingTopic;

  return 'General';
}

function mapQuestion(question, topic, type = 'theoretical', difficulty = null) {
  return {
    question,
    type: 'theoretical',
    questionCategory: type,
    difficulty: difficulty || DIFFICULTY_BY_TYPE[type] || 'medium',
    topic,
    expectedAnswer: 'Answer should include core concept, reasoning, and at least one practical implication.',
  };
}

function getFallbackTheoreticalQuestion(topic = 'General', difficulty = 'medium', options = {}) {
  const resolvedTopic = resolveTheoryTopic(topic);
  const preferredType = options?.type || 'theoretical';
  const excluded = new Set((options?.excludeQuestions || []).map((item) => String(item || '').toLowerCase()));
  const bucket = THEORETICAL_BANK[resolvedTopic] || THEORETICAL_BANK.General;

  const searchOrder = [preferredType, 'theoretical', 'practical', 'scenario'];
  for (const type of searchOrder) {
    const pool = Array.isArray(bucket[type]) ? bucket[type] : [];
    const found = pool.find((q) => !excluded.has(String(q).toLowerCase()));
    if (found) {
      return mapQuestion(found, resolvedTopic, type, difficulty);
    }
  }

  const fallbackQuestion = THEORETICAL_BANK.General.theoretical[0];
  return mapQuestion(fallbackQuestion, 'General', 'theoretical', difficulty);
}

function getFallbackTheoreticalQuestions({ topics = [], count = 6, composition = null, excludeQuestions = [] } = {}) {
  const resolvedTopics = (Array.isArray(topics) && topics.length > 0 ? topics : ['General']).map((t) => resolveTheoryTopic(t));
  const used = new Set((excludeQuestions || []).map((item) => String(item || '').toLowerCase()));
  const desiredComposition = composition || [
    { type: 'theoretical', count: 2 },
    { type: 'practical', count: 2 },
    { type: 'scenario', count: 2 },
  ];

  const results = [];
  let topicCursor = 0;

  for (const block of desiredComposition) {
    for (let i = 0; i < block.count; i += 1) {
      const topic = resolvedTopics[topicCursor % resolvedTopics.length];
      topicCursor += 1;
      const next = getFallbackTheoreticalQuestion(topic, DIFFICULTY_BY_TYPE[block.type], {
        type: block.type,
        excludeQuestions: Array.from(used),
      });
      used.add(String(next.question).toLowerCase());
      results.push(next);
      if (results.length >= count) return results;
    }
  }

  while (results.length < count) {
    const topic = resolvedTopics[topicCursor % resolvedTopics.length];
    topicCursor += 1;
    const next = getFallbackTheoreticalQuestion(topic, 'medium', { excludeQuestions: Array.from(used) });
    used.add(String(next.question).toLowerCase());
    results.push(next);
  }

  return results;
}

function getAvailableTopics() {
  return Object.keys(RAW_FALLBACK_CODING_QUESTIONS);
}

module.exports = {
  getFallbackCodingQuestion,
  getFallbackCodingQuestions,
  getFallbackTheoreticalQuestion,
  getFallbackTheoreticalQuestions,
  getAvailableTopics,
  codingQuestions: RAW_FALLBACK_CODING_QUESTIONS,
  theoreticalQuestions: THEORETICAL_BANK,
};
