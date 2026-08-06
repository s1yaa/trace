# TRACE

TRACE is an immersive, noir-themed digital investigation game. Step into the shoes of an investigator, comb through logs, documents, emails, and financial records, map the connections on an interactive graph, and spend your hard-earned leads to trace hidden paths to the truth.

**"FOLLOW THE EVIDENCE. UNCOVER THE CONNECTIONS."**

---

## Features

- **Investigation Graph** — Interactive, node-based graph visualization of all entities (people, devices, organizations, locations) and their relationships. Filter by type, search, zoom, and select nodes to trace connections.
- **Case Notes** — Inspect any entity to see detailed logs, aliases, risk scores, and investigator notes. Includes actions to view related evidence files or submit an arrest warrant.
- **Evidence Files** — Access the raw file archive (emails, network logs, ICANN domain WHOIS details, university backup tapes, keycard logs). Review details and run target traces from here.
- **Trace** — Spend 3 discoverable leads to automatically search and visually reveal the shortest paths of connection between key evidence and suspects.
- **Timeline Strip** — A chronological strip at the bottom of the workspace outlining case timeline events. Select events to highlight them in the graph, and click anomaly badges to investigate timeline and behavior contradictions.
- **Arrest Warrant & Accusation Mechanic** — Accuse a suspect when you are confident. Be careful: a wrong arrest costs leads, adds a cooldown penalty, and advances the clock by a day. A correct accusation solves the case, revealing the full typewriter monologue of the resolution.
- **Field Guide** — A lightweight, contextual guided-start overlay in noir partner voice. Shows 3-4 dismissible callouts pointing you to key panels, replayable at any time via the `?` icon button in the header.
- **Subtle Idle Hints** — If you get stuck, a soft, pulse animation will draw your eye to undiscovered nodes on the graph after 8 seconds of inactivity.

---

## Tech Stack

- **Framework**: Next.js (App Router, Client Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Custom CSS Variables (cinematic dark void theme)
- **Graphing**: React Flow
- **Animations**: Framer Motion
- **Icons**: Lucide React

---

## Getting Started

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 

*No database or API keys are required. The game runs entirely client-side using structured case data.*
