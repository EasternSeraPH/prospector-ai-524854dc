
## AI Prospecting Assistant — Build Plan

A clean, responsive React app with two tabs: an AI chat assistant (designed for AWS Bedrock) and a recurrent jobs dashboard (designed for n8n webhooks). No mock data, fully empty initial states, and all backend functions stubbed and ready to wire up.

### Layout & Navigation
- Top navigation bar with app name/logo on the left and two tabs: **Chat Assistant** and **Recurrent Jobs**.
- Persistent state across tab switches: chat history, draft input, jobs list, filters, and search query are preserved.
- Fully responsive — stacked navigation on mobile, condensed control bar, and adaptive card grid.

### Tab 1 — Chat Assistant
- Full-height chat layout: scrollable message history fills the viewport; sticky composer at the bottom with a textarea and **Send** button (Enter to send, Shift+Enter for newline).
- Empty initial state — no hardcoded welcome message. A subtle empty illustration + microcopy ("Ask me to find your next prospects…") shown only when there are zero messages.
- User messages right-aligned with primary color bubble; AI messages left-aligned with neutral/muted bubble. Avatars and timestamps included.
- Typing/loading indicator (animated dots) while waiting for AI response. Send button shows spinner and is disabled during in-flight requests.
- **Dynamic UI rendering**: messages have a `type` field (`text` | `component`) and a `componentName` + `props` payload, so the AI can return rich React components inline.
- **Prospecting Summary Card** component, rendered from AI payloads, with dynamic props:
  - Industry Sector, Geographic Area, Target Number of Prospects, Custom Conditions/Metrics (rendered as labeled fields/badges).
  - Primary CTA: **Generate Database & Export to Google Sheets** (triggers n8n webhook stub, shows loading + toast).
  - Secondary CTA: **Create Recurrent Job from this Search** (pre-fills and saves a job into the Recurrent Jobs state, switches user to that tab, toast confirmation).
- Markdown rendering for plain text AI messages.

### Tab 2 — Recurrent Jobs Dashboard
- Control bar: search input ("Search jobs by name or criteria…"), **Create Manual Job** button, and three filter dropdowns: Industry Sector, Location, Status. Filter options are generated dynamically from the current jobs state (no hardcoded lists).
- **Create Manual Job** opens a modal/dialog with a clean form for: Job Title, Industry Sector, Location, Target Prospects, Custom Conditions, Schedule (frequency).
- Job list rendered as responsive cards/rows. **Job Card** props: Job Title, Search Criteria Summary Badges, Status Toggle (active/paused), Last Run Date, Next Scheduled Run Date, actions: **View Latest News Report**, **Edit Configuration**.
- Toggling status, editing, and viewing reports each call clearly-labeled async stubs.
- Empty state: large, friendly "No recurrent jobs found" component with a CTA to create the first job. Shown on load and when filters return zero results (with a distinct message for filtered-empty).
- Loading skeletons while jobs are being fetched.

### Backend Preparation (stubs, no mock data)
A dedicated `src/lib/api/` folder with clearly labeled, exported async functions ready to wire:
- **AWS Bedrock (chat)**: `sendMessageToBedrock(payload)`, `streamBedrockResponse(payload, onChunk)`, `fetchChatHistory(conversationId)` — all return `Promise` and throw "Not implemented" until wired.
- **n8n webhooks**: `triggerGenerateDatabaseWebhook(searchCriteria)`, `triggerCreateRecurrentJobWebhook(jobConfig)`, `triggerJobActionWebhook(jobId, action)` — attached to the Prospecting Card buttons and dashboard actions.
- **Jobs API**: `fetchJobs()`, `createJob(job)`, `updateJob(id, patch)`, `deleteJob(id)`, `runJobNow(id)` — stubbed for later backend connection.
- Each function has a JSDoc block describing the expected request/response shape so wiring is trivial.

### State Management
- Global app state via React Context (or Zustand if preferred): `ChatContext` (messages, input draft, isSending) and `JobsContext` (jobs, filters, searchQuery, isLoading). State persists across tab switches because providers live above the tab router.

### UX Polish
- shadcn/ui components throughout (Button, Input, Textarea, Card, Dialog, Switch, Select, Badge, Skeleton, Toast/Sonner, Tabs, ScrollArea).
- Generous whitespace, clear typography hierarchy, consistent spacing scale.
- Toast notifications for every action (success/error/info). Buttons show spinners and disabled states during async work.
- Skeletons for chat (assistant message placeholder) and jobs list while loading.
- Plain-language microcopy on every input, button, and tooltip.
- Clean, professional design system defined in `index.css` with semantic tokens (no hardcoded colors in components).

### Deliverables
- `src/pages/Index.tsx` — main layout with top nav + tab routing.
- `src/components/chat/` — ChatView, MessageList, MessageBubble, ChatComposer, ProspectingSummaryCard, TypingIndicator, EmptyChatState.
- `src/components/jobs/` — JobsView, JobsControlBar, JobCard, CreateJobDialog, EmptyJobsState, JobsListSkeleton.
- `src/contexts/` — ChatContext, JobsContext.
- `src/lib/api/` — bedrock.ts, n8n.ts, jobs.ts (all stubs, clearly labeled).
- `src/types/` — shared TypeScript types for Message, ProspectingCriteria, Job.
- Refined design tokens in `index.css` and `tailwind.config.ts`.
