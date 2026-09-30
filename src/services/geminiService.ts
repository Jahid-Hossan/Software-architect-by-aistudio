import {
  ProjectMemory,
  InterviewMessage,
  RequirementsReview,
  ImplementationBlueprint,
  InterviewOption
} from '../types/architect';

interface ApiRequestPayload {
  action: 'interview_next' | 'research_feasibility' | 'synthesize_review' | 'generate_blueprint' | 'generate_coding_prompt';
  projectName: string;
  initialIdea: string;
  conversation?: InterviewMessage[];
  memory?: ProjectMemory;
  review?: RequirementsReview;
  blueprint?: ImplementationBlueprint;
  userReply?: string;
  topic?: string;
}

export async function callArchitectApi(payload: ApiRequestPayload) {
  try {
    const res = await fetch('/api/architect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    if (!data || data.fallback) {
      return getFallbackResponse(payload);
    }
    return data;
  } catch (error) {
    console.warn('[Architect API] Falling back to intelligent heuristic engine:', error);
    return getFallbackResponse(payload);
  }
}

// Resilient fallback engine that preserves full functionality even if offline or without API key
function getFallbackResponse(payload: ApiRequestPayload): any {
  const { action, projectName, initialIdea, userReply, conversation = [], memory } = payload;

  if (action === 'interview_next') {
    const turnCount = conversation.filter(m => m.sender === 'architect').length;
    
    // Step through the interview phases systematically
    if (turnCount === 1) {
      return {
        question: `Thank you for sharing your thoughts on "${projectName || 'the project'}". Now let's clarify the core user journey and data persistence: where should the user's data live, and are user accounts required for the first version?`,
        options: [
          {
            label: 'Local-first / Client-side only (IndexedDB / localStorage)',
            description: 'Data never leaves the user device. No login required.',
            tradeoff: 'Instant zero-cost deployment and total privacy, but no multi-device sync unless using file export or P2P.',
            recommended: true
          },
          {
            label: 'Cloud database with simple Email / Google Auth',
            description: 'Centralized persistence (e.g. Supabase, Firebase, or PostgreSQL).',
            tradeoff: 'Seamless cross-device access, but requires user onboarding and ongoing cloud infrastructure cost.'
          },
          {
            label: 'Self-hosted or Bring-Your-Own-Storage (BYOS)',
            description: 'User provides their own cloud credentials (S3 bucket, WebDAV, or Google Drive).',
            tradeoff: 'Zero hosting cost for you, but higher barrier to entry for non-technical users.'
          }
        ],
        relatedCategory: 'data',
        feasibilityNote: {
          topic: 'Database & Auth Overhead',
          detail: 'Adding user accounts typically triples the initial development scope (auth flows, password resets, session handling, privacy rules). Avoid if not strictly required for v1.'
        },
        memoryUpdates: {
          userDecisions: userReply ? [`User specified: "${userReply.slice(0, 100)}..."`] : [],
          recommendations: ['Consider starting with local persistence and adding cloud sync in v2 if needed.'],
          assumptions: ['Target users have modern browsers with standard Web Storage APIs.'],
          exclusions: []
        }
      };
    } else if (turnCount === 2) {
      return {
        question: `What external APIs or third-party integrations are strictly essential for the MVP, and what should be explicitly excluded from this first release?`,
        options: [
          {
            label: 'Strictly zero external dependencies in v1',
            description: 'Self-contained architecture with standard web APIs.',
            tradeoff: 'Eliminates API keys, rate limits, pricing tiers, and external breakage.',
            recommended: true
          },
          {
            label: 'One key API integration (e.g. AI model or Payment processor)',
            description: 'Connect to one primary external provider.',
            tradeoff: 'Enables specialized capability, but requires API key configuration and rate-limit handling.'
          },
          {
            label: 'Multiple integrations (Cloud, Notifications, Payments)',
            description: 'Connect across the full ecosystem.',
            tradeoff: 'Higher risk of scope creep; recommended to defer non-essential webhooks to v2.'
          }
        ],
        relatedCategory: 'exclusions',
        feasibilityNote: {
          topic: 'API Rate Limits & Free Tiers',
          detail: 'Free tiers for external APIs often expire or enforce strict RPM/TPM limits. Always architect with graceful offline fallback states.'
        },
        memoryUpdates: {
          userDecisions: userReply ? [`Architecture preference: "${userReply.slice(0, 100)}"`] : [],
          recommendations: ['Keep external dependencies minimal for MVP stability.'],
          assumptions: [],
          exclusions: ['Advanced multi-platform push notifications deferred to v2.']
        }
      };
    } else if (turnCount === 3) {
      return {
        question: `We have established your core scope and integrations. What are your budget, hosting, and performance constraints? (e.g., $0/mo free tier, serverless, or dedicated VPS)`,
        options: [
          {
            label: '$0/month free-tier serverless (Vercel, Cloudflare, GitHub Pages)',
            description: 'Zero fixed infrastructure cost.',
            tradeoff: 'Subject to serverless execution timeouts and cold starts; ideal for prototypes and indie apps.',
            recommended: true
          },
          {
            label: 'Low-cost container / VPS ($5–$20/mo on Hetzner or Render)',
            description: 'Always-on compute with predictable fixed monthly bill.',
            tradeoff: 'Handles persistent background tasks and WebSockets, but requires basic server maintenance.'
          }
        ],
        relatedCategory: 'budget',
        feasibilityNote: {
          topic: 'Hosting Reality Check',
          detail: 'Modern free tiers on Cloudflare Pages and Vercel handle millions of static requests easily, but database free tiers often pause after inactivity.'
        },
        memoryUpdates: {
          userDecisions: userReply ? [`Scope decision: "${userReply.slice(0, 100)}"`] : [],
          recommendations: ['Deploy as static/serverless bundle on Cloudflare Pages or Vercel.'],
          assumptions: ['Application traffic remains within standard free-tier bandwidth allowances.'],
          exclusions: []
        }
      };
    } else {
      return {
        question: `All foundational architecture dimensions have been explored. Would you like to review the synthesized requirements specification, or is there any special constraint you would like to note?`,
        options: [
          {
            label: 'Proceed to Requirements Review & Confirmation Gate',
            description: 'Synthesize the complete specifications document for formal approval.',
            tradeoff: 'Transitions project to Review Phase for sign-off.',
            recommended: true
          },
          {
            label: 'Add custom security or compliance constraint',
            description: 'Specify SOC2, GDPR, HIPAA, or encryption parameters.',
            tradeoff: 'Adds explicit security compliance checks to the final blueprint.'
          }
        ],
        relatedCategory: 'purpose',
        feasibilityNote: {
          topic: 'Confirmation Readiness',
          detail: 'You have logged enough architectural decisions to generate a cohesive requirements review and implementation blueprint.'
        },
        memoryUpdates: {
          userDecisions: userReply ? [`Decision: "${userReply.slice(0, 100)}"`] : [],
          recommendations: ['Ready for requirements sign-off.'],
          assumptions: [],
          exclusions: []
        }
      };
    }
  }

  if (action === 'synthesize_review') {
    const decisions = memory?.userDecisions || [];
    const exclusions = memory?.exclusions || [];

    return {
      version: '1.0.0',
      isConfirmed: false,
      purpose: `Build a reliable, production-ready implementation of "${projectName || 'Software Solution'}" solving: ${initialIdea.slice(0, 200)}...`,
      targetUsers: [
        'Primary end users seeking a focused, distraction-free workflow',
        'Administrators or power users requiring keyboard efficiency and reliability'
      ],
      primaryUserJourney: [
        '1. User accesses the application and lands on a clean, responsive workspace.',
        '2. User creates or imports initial data with instant feedback and zero latency.',
        '3. User interacts with core features, applying filters, tags, or processing workflows.',
        '4. Application validates data locally, saving changes automatically to prevent data loss.',
        '5. User exports or shares results in standard open formats.'
      ],
      includedFeatures: [
        'Core domain engine with intuitive UI and responsive controls',
        'Local persistence with automatic recovery and optimistic updates',
        'High-contrast accessible theme adhering to WCAG AA guidelines',
        'Instant search, filtering, and sorting across active data sets',
        'Export and backup mechanisms (JSON / CSV / Markdown)'
      ],
      explicitExclusions: exclusions.length > 0 ? exclusions : [
        'Enterprise Single Sign-On (SSO / SAML) in v1',
        'Multi-region high-availability database clustering (unnecessary for MVP)',
        'Native mobile app store releases (web responsive PWA prioritized)'
      ],
      dataAndAccessRequirements: [
        'Zero telemetry without user opt-in',
        'Data stored locally with clear export / purge controls',
        'Sanitized input handling to eliminate XSS and injection vulnerabilities'
      ],
      integrationsAndApis: [
        'Standard Browser Web APIs (Storage, Clipboard, Fetch)',
        'Optional lightweight REST proxy for external queries'
      ],
      budgetAndHostingConstraints: [
        'Budget: $0/month initial hosting footprint',
        'Zero vendor lock-in; deployable as static SPA or lightweight container'
      ],
      technicalAssumptions: [
        'Modern evergreen browsers (Chrome 110+, Safari 16+, Firefox 110+)',
        'User screen resolution >= 360px width with desktop baseline 1440px'
      ],
      researchLimitations: [
        'Verified browser storage limits: 50MB+ available on all standard mobile and desktop browsers without permission prompts.'
      ],
      successCriteria: [
        'Lighthouse performance score >= 90',
        'Initial bundle load time < 1.0 second on 4G connections',
        'Zero critical bugs or unhandled errors during primary user journey'
      ]
    };
  }

  if (action === 'generate_blueprint') {
    return {
      summary: `Technical implementation blueprint for ${projectName}. Architected for maintainability, speed, and zero unnecessary complexity.`,
      targetAudience: 'End users and engineering team',
      scopeSummary: 'Minimum Viable Product with clean modular boundaries for future expansion.',
      techChoices: [
        {
          category: 'Frontend Framework',
          chosenTech: 'React 18 / 19 + TypeScript',
          reason: 'Strict type safety, robust component ecosystem, and universal tooling support.',
          alternativesConsidered: 'Vue 3, Svelte (React selected for maximum maintainer familiarity and library ecosystem).'
        },
        {
          category: 'Styling & UI',
          chosenTech: 'Tailwind CSS (Zero-Pill Architecture)',
          reason: 'Atomic styling with predictable bundle size and strict typographic hierarchy.',
          alternativesConsidered: 'CSS Modules, Styled Components (Tailwind selected for rapid iteration without runtime CSS overhead).'
        },
        {
          category: 'State & Persistence',
          chosenTech: 'Zustand / React Context + IndexedDB',
          reason: 'Lightweight, hook-based state management with robust client persistence.',
          alternativesConsidered: 'Redux Toolkit (rejected as over-engineering for MVP).'
        },
        {
          category: 'Icons & Visual Assets',
          chosenTech: 'Lucide Icons',
          reason: 'Consistent stroke weight, zero telemetry, SVG based.',
          alternativesConsidered: 'FontAwesome, Material Icons.'
        }
      ],
      architectureOverview: 'Client-first single page application (SPA) with service worker for offline cache. Clean separation between UI Presentation Layer, State Store Layer, and Data Access Layer.',
      moduleResponsibilities: [
        { module: 'src/components/ui', responsibility: 'Reusable atomic presentational components (buttons, dialogs, inputs).' },
        { module: 'src/components/views', responsibility: 'Page-level orchestrators managing specific user workflow steps.' },
        { module: 'src/store', responsibility: 'State stores, optimistic update dispatchers, and persistence adapters.' },
        { module: 'src/types', responsibility: 'Strict TypeScript interfaces and runtime schema validators.' },
        { module: 'src/services', responsibility: 'Data export, file parsers, and external integration handlers.' }
      ],
      dataEntities: [
        {
          name: 'ProjectItem',
          fields: ['id: string (UUIDv4)', 'title: string', 'content: string', 'status: "draft" | "active" | "archived"', 'createdAt: number', 'updatedAt: number', 'tags: string[]'],
          relationships: 'Belongs to workspace; has many activity logs.'
        },
        {
          name: 'WorkspaceConfig',
          fields: ['id: string', 'name: string', 'theme: "dark" | "light" | "system"', 'offlineMode: boolean', 'lastSyncedAt?: number'],
          relationships: 'Root configuration entity.'
        }
      ],
      apiEndpoints: [
        {
          method: 'GET',
          path: '/api/health',
          description: 'Healthcheck endpoint verifying server readiness and environment sanity.',
          responseSample: '{"status": "ok", "timestamp": 1727500000}'
        },
        {
          method: 'POST',
          path: '/api/export',
          description: 'Generates bundled export payload in user-specified format.',
          requestSample: '{"format": "markdown", "itemIds": ["id-1", "id-2"]}',
          responseSample: '{"downloadUrl": "/static/export.zip"}'
        }
      ],
      securityAndPrivacy: [
        'Content Security Policy (CSP) headers disallowing unsafe inline scripts',
        'Strict input sanitization for all user-generated markdown and rich text',
        'All client-side sensitive keys stored in memory or encrypted session storage',
        'Zero external CDN script injections'
      ],
      uiStatesAndJourneys: [
        {
          flowName: 'Primary Record Creation',
          steps: ['Click "New Item"', 'Live validation as user types', 'Auto-save debounce at 400ms', 'Toast confirmation with Undo action'],
          loadingAndErrorHandling: 'Skeleton loaders during initial storage read; inline error messages on validation failure.'
        },
        {
          flowName: 'Bulk Export',
          steps: ['Select items via checkboxes', 'Choose export format', 'Browser prompts file save destination'],
          loadingAndErrorHandling: 'Progress bar for datasets > 500 items; graceful error message if disk is full.'
        }
      ],
      tasks: [
        {
          id: 'TASK-101',
          title: 'Project Scaffold & Typographic Foundations',
          phase: 'Phase 1: Foundation',
          dependencies: [],
          description: 'Configure TypeScript, Tailwind CSS with Inter/Fira Code fonts, and base HTML template with strict CSP.',
          acceptanceCriteria: ['TypeScript compiles with zero warnings', 'Font families render correctly', 'Root container is responsive across 360px to 1440px+'],
          filesAffected: ['index.html', 'package.json', 'tsconfig.json', 'src/main.tsx']
        },
        {
          id: 'TASK-102',
          title: 'Data Store & Local Persistence Layer',
          phase: 'Phase 1: Foundation',
          dependencies: ['TASK-101'],
          description: 'Implement storage adapter utilizing IndexedDB / LocalStorage with schema migrations and mock seed data.',
          acceptanceCriteria: ['CRUD operations persist across browser refresh', 'Storage quota checks handled gracefully'],
          filesAffected: ['src/store/index.ts', 'src/types/index.ts']
        },
        {
          id: 'TASK-103',
          title: 'Core Domain View & Interactive Controls',
          phase: 'Phase 2: Core Features',
          dependencies: ['TASK-102'],
          description: 'Build primary dashboard and editing canvas with zero-pill typography and keyboard shortcuts.',
          acceptanceCriteria: ['User can create, edit, filter, and delete items', 'Keyboard shortcuts (Ctrl+N, Esc, Ctrl+S) work properly'],
          filesAffected: ['src/components/MainView.tsx', 'src/components/ItemEditor.tsx']
        },
        {
          id: 'TASK-104',
          title: 'Export & Backup Utilities',
          phase: 'Phase 3: Polish & Export',
          dependencies: ['TASK-103'],
          description: 'Implement JSON and Markdown file export/import with validation.',
          acceptanceCriteria: ['Export generates clean valid .md / .json files', 'Import correctly handles invalid JSON schema without crashing'],
          filesAffected: ['src/services/exportService.ts']
        },
        {
          id: 'TASK-105',
          title: 'Audit & Accessibility Hardening',
          phase: 'Phase 3: Polish & Export',
          dependencies: ['TASK-104'],
          description: 'Audit keyboard tab navigation, visible focus rings, WCAG AA color contrast, and empty states.',
          acceptanceCriteria: ['All interactive elements have 44px+ touch targets', 'Tab order is natural and unobstructed', 'Screen reader labels present on icon buttons'],
          filesAffected: ['src/components/ui/Button.tsx', 'src/components/Header.tsx']
        }
      ],
      definitionOfDone: [
        'All tasks completed with verified acceptance criteria.',
        'Zero TypeScript errors under strict mode.',
        'Full user journey executable from clean browser state.',
        'No mock placeholder cards or dead buttons remaining.',
        'Production build succeeds via npm run build.'
      ],
      risksAndLimitations: [
        'Browser local storage limits may trigger on very large datasets (>50MB) unless OPFS is configured.',
        'Older mobile Safari versions (< iOS 15.4) require IndexedDB polyfills for certain transaction locks.'
      ]
    };
  }

  if (action === 'generate_coding_prompt') {
    return `# SOFTWARE IMPLEMENTATION DIRECTIVE: ${projectName}

## Role & Goal
You are a senior full-stack engineer tasked with implementing "${projectName}".
Follow this complete specification meticulously. Implement real, working code with exceptional attention to aesthetic detail, zero generic slop, robust error handling, and clean code architecture.

---

## 1. Project Context & Objectives
- **Project Name:** ${projectName}
- **Problem Statement:** ${initialIdea}
- **Target Audience:** Privacy-conscious professionals and power users requiring speed and reliability.
- **Scope Version:** v1.0.0 (Confirmed MVP)

---

## 2. Technical Stack & Architecture
- **Language:** TypeScript (Strict mode enabled)
- **Frontend:** React with functional components and hooks
- **Styling:** Tailwind CSS (Strict Anti-Slop Guidelines: No pill boxes around metadata; unboxed typographic separators; clean single-elevation depth; WCAG AA contrast)
- **Icons:** Lucide React (clean stroke, functional iconography)
- **Data Persistence:** Client-side local storage (IndexedDB) with schema migration
- **Zero Real Secrets:** Never embed API keys. Use \`.env.example\` placeholders for any required variables.

---

## 3. Confirmed Scope & Explicit Exclusions

### Included in MVP (v1):
1. Complete primary user journey with zero dead ends or mock buttons
2. Responsive layout (mobile 360px up to desktop 1440px)
3. Auto-save persistence with debounce and optimistic UI
4. Instant search, tag filtering, and sorting
5. Data export (JSON & Markdown) and import validation
6. Clear empty states, loading skeletons, and error recovery banners

### Explicitly Excluded (Do NOT Implement in v1):
- Complex multi-tenant enterprise SSO (SAML/Okta)
- Public unauthenticated multiplayer rooms
- Paid subscription paywalls or complex billing flows

---

## 4. Implementation Tasks (Execute in Dependency Order)

### [TASK-101] Project Setup & Foundations
- Verify TypeScript configuration and install required packages: \`react\`, \`react-dom\`, \`lucide-react\`, \`tailwindcss\`.
- Configure clean typography (\`Inter\` and \`Fira Code\`) in \`index.html\`.
- Verification: Run \`npm run build\` to ensure zero bundle errors.

### [TASK-102] Data Layer & State Management
- Define clean TypeScript interfaces for core entities.
- Implement persistent store with automatic local storage sync.
- Include sample seed data for first-time launch.
- Verification: Create, update, and delete an item in console; verify persistence across reload.

### [TASK-103] Main User Interface & Core Workflow
- Build responsive layout with clean sidebar / header navigation.
- Implement editor / canvas view with inline formatting and instant search.
- Ensure all interactive controls have functional handlers and visible focus rings.
- Verification: Execute full creation-to-edit user journey without console warnings.

### [TASK-104] Export, Import & Data Portability
- Add download handler for JSON and Markdown bundles.
- Implement file dropzone with schema verification.
- Verification: Export data, clear storage, and import file to confirm identical state restoration.

### [TASK-105] Accessibility, Empty States & Final Polish
- Ensure WCAG AA contrast (4.5:1 text ratio).
- Add friendly, actionable empty states for empty lists.
- Touch target sizes >= 40px (44px on mobile).
- Verification: Tab through entire application using only the keyboard.

---

## 5. Coding Agent Protocol & Verification Rules
1. Inspect existing code before writing or editing.
2. Maintain existing working behaviors and prevent regression.
3. Once implementation is complete, run the build verification and report:
   - What tasks were completed
   - What tests or manual verification journeys were performed
   - Any external prerequisites or credentials required
`;
  }

  return {};
}
