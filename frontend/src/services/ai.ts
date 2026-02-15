export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedQuestion {
  id: string;
  text: string;
  difficulty: Difficulty;
  seconds: number;
}

export interface ScoreResult {
  score: number;
  summary: string;
  perQuestion?: number[];
}

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

function fallbackQuestions(): GeneratedQuestion[] {
  return [
    { id: crypto.randomUUID(), text: 'Explain useEffect vs useLayoutEffect.', difficulty: 'easy', seconds: 20 },
    { id: crypto.randomUUID(), text: 'What is the event loop in Node.js?', difficulty: 'easy', seconds: 20 },
    { id: crypto.randomUUID(), text: 'How would you reduce unnecessary React re-renders in lists?', difficulty: 'medium', seconds: 60 },
    { id: crypto.randomUUID(), text: 'Design authentication for a multi-tenant SaaS.', difficulty: 'medium', seconds: 60 },
    { id: crypto.randomUUID(), text: 'Discuss SSR vs CSR trade-offs and when to choose each.', difficulty: 'hard', seconds: 120 },
    { id: crypto.randomUUID(), text: 'Scale a realtime chat system to 1M users.', difficulty: 'hard', seconds: 120 }
  ];
}

export async function generateQuestions(role: string = 'Full Stack React/Node'): Promise<GeneratedQuestion[]> {
  if (!OPENAI_KEY) return fallbackQuestions();
  try {
    const sys = `Generate 6 interview questions for a ${role} role:
    - 2 easy (20s), 2 medium (60s), 2 hard (120s)
    - Return strictly as JSON array of { text, difficulty, seconds }`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: 'Output JSON only.' }
        ],
        temperature: 0.7
      })
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim?.() || '';
    const parsed = JSON.parse(text);
    const mapped: GeneratedQuestion[] = parsed.map((q: any) => ({
      id: crypto.randomUUID(),
      text: String(q.text),
      difficulty: (q.difficulty || 'easy') as Difficulty,
      seconds: Number(q.seconds) || (q.difficulty==='easy'?20:q.difficulty==='medium'?60:120)
    }));
    return mapped;
  } catch {
    return fallbackQuestions();
  }
}

export async function scoreAnswers(questions: { text: string; difficulty: Difficulty }[], answers: string[]): Promise<ScoreResult> {
  if (!OPENAI_KEY) {
    // Heuristic fallback: word-count-based scoring
    const per = answers.map((a, i) => {
      const base = questions[i]?.difficulty === 'easy' ? 10 : questions[i]?.difficulty === 'medium' ? 20 : 35;
      const lengthBonus = Math.min(35, Math.floor((a || '').split(/\s+/).length / 3));
      return Math.min(100, base + lengthBonus);
    });
    const total = per.reduce((s, n) => s + n, 0);
    const max = questions.reduce((s, q) => s + (q.difficulty === 'easy' ? 45 : q.difficulty === 'medium' ? 55 : 70), 0);
    const final = Math.round((total / Math.max(1, max)) * 100);
    const summary = final >= 75 ? 'Strong performance' : final >= 50 ? 'Decent performance' : 'Needs improvement';
    return { score: final, summary, perQuestion: per };
  }
  try {
    const prompt = JSON.stringify({ questions, answers });
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Score each answer from 0-100. Return JSON { perQuestion:number[], score:number (0-100), summary:string }' },
          { role: 'user', content: prompt }
        ],
        temperature: 0
      })
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim?.() || '';
    const parsed = JSON.parse(content);
    return {
      score: Number(parsed.score) || 0,
      summary: String(parsed.summary || 'Summary unavailable'),
      perQuestion: Array.isArray(parsed.perQuestion) ? parsed.perQuestion.map((n: any) => Number(n)||0) : undefined
    };
  } catch {
    // Fallback to heuristic if AI call fails
    return scoreAnswers(questions, answers);
  }
}


