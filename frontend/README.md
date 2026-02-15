AI Interview Assistant

A React + TypeScript app that conducts an AI-style timed interview with a synchronized Interviewee tab and Interviewer dashboard. Fully responsive with data persistence and a friendly UX.

Features
- Resume upload (PDF preferred), extract Name/Email/Phone; prompt when missing
- Interview flow: 6 questions (2 easy/20s, 2 medium/60s, 2 hard/120s), one at a time
- Countdown with auto-submit; progress indicator and timing toasts
- Scoring and performance summary (local heuristic; pluggable AI scoring)
- Interviewer dashboard: list, search, sort, and candidate detail with Q&A history
- Persistence via redux-persist + localForage; Welcome Back modal on return
- Cross-tab theme sync and dark/light mode
- 100% responsive across mobile, tablet, and desktop (Tailwind)

Tech Stack
- React 18, TypeScript, Vite
- Redux Toolkit, redux-persist, localForage
- Tailwind CSS
- Router: React Router v6
- PDF parsing: pdfjs-dist via CDN
- Notifications: sonner

Getting Started
1. Install Node.js LTS (>=18)
2. Install deps:
```
npm install
```
3. Run dev server:
```
npm run dev
```
4. Open `http://localhost:5173`

If you cannot install globally, you can still view the source here; the app expects a standard Vite workflow.

Environment Variables (Optional AI)
Create `.env` and set your provider key to wire real AI question generation/scoring:
```
VITE_OPENAI_API_KEY=...
```
Then integrate calls in the interview slice or a dedicated service.

Build
```
npm run build && npm run preview
```

Deployment
- Vercel/Netlify: import the repo, set build command `npm run build`, output `dist`
- Ensure environment variables are configured if using AI

Notes
- This repo uses a CDN version of pdfjs-dist for simplicity. You can switch to an npm dependency for offline bundling.
- Scoring is heuristic by default to avoid API costs; replace with real AI as needed.

Screens
- Interviewee: resume upload, progress, timer, chat-like Q&A
- Interviewer: list with search/sort, detail page with transcript

License
MIT

