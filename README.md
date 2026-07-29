# TRACE

TRACE is an AI-powered evidence correlation and investigation platform. It lets you explore fictional cases made up of scattered evidence — people, documents, emails, locations, and events — and trace the hidden connections between them.

**"Follow the evidence. Uncover the connections."**

## Features

- **Investigation Graph** — interactive node-based graph of entities and relationships (drag, zoom, filter, search)
- **Entity Inspector** — detailed view of any selected entity, with confidence scores and AI-generated hypotheses
- **Timeline** — chronological view of case events, with anomaly detection for contradictions
- **Evidence View** — browse documents, emails, and images, each broken into extracted entities
- **Trace** — the signature feature: select a lead and watch the app trace a chain of connections across the graph
- **AI Analysis** — case summaries, pattern detection, and a simple Q&A interface
- **Anomaly Center** — a dedicated view of timeline, identity, and relationship inconsistencies
- **Case Creator** — build new investigation cases without hand-writing data files

## Tech Stack

- Next.js + TypeScript
- Tailwind CSS
- Framer Motion
- React Flow (graph visualization)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

No API keys required — the app runs entirely on structured mock case data.

## Project Status

Built incrementally in phases:

- [x] Phase 1 — App shell & onboarding
- [x] Phase 2 — Investigation graph
- [x] Phase 3 — Entity inspector
- [ ] Phase 4 — Timeline
- [ ] Phase 5 — Evidence view
- [ ] Phase 6 — Trace feature
- [ ] Phase 7 — AI analysis
- [ ] Phase 8 — Anomaly center & multi-case support
- [ ] Phase 9 — Case creator

## Data Model

Cases, evidence, entities, relationships, timeline events, and anomalies are all defined as typed objects in `/data`, making it easy to add new investigation cases.
