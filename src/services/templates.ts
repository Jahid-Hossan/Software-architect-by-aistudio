import { ProjectState } from '../types/architect';

export const SAMPLE_PROJECTS: Omit<ProjectState, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Local-First Markdown Knowledge Engine',
    initialIdea: 'A lightning-fast, local-first markdown note-taking app with bidirectional links, tags, and peer-to-peer or self-hosted encrypted sync. I want zero vendor lock-in and offline availability.',
    currentPhase: 'review',
    memory: {
      userDecisions: [
        'Local-first storage using OPFS (Origin Private File System) with IndexedDB fallback.',
        'Bidirectional [[wikilinks]] parser with instant graph visualization.',
        'End-to-End Encrypted (E2EE) sync via WebRTC data channels with optional WebDAV fallback.',
        'Desktop-first responsive design optimized for keyboard power users.'
      ],
      recommendations: [
        'Use CRDT (Yjs) for conflict-free multi-device synchronization without centralized server merging.',
        'Use CodeMirror 6 for extensible markdown editing and vim keybindings support.',
        'Export formats: standard CommonMark .md directory with frontmatter metadata.'
      ],
      assumptions: [
        'Users will manage their own WebDAV credentials if not using P2P pairing.',
        'Browser OPFS storage quota is sufficient (>10GB typically available per origin).'
      ],
      exclusions: [
        'Real-time multi-user public collaboration (MVP is single-user multi-device only).',
        'Complex PDF annotation or OCR processing in v1.',
        'Native mobile iOS/Android apps in v1 (PWA with offline service worker instead).'
      ],
      researchFindings: [
        {
          topic: 'OPFS Browser Support',
          finding: 'OPFS is supported in Chrome 102+, Safari 15.2+, and Firefox 111+. Provides direct filesystem-like IO without memory bloat.',
          sourceOrLimitation: 'W3C File System Access API specification',
          type: 'compatibility'
        },
        {
          topic: 'WebRTC Signaling Quotas',
          finding: 'Free public STUN servers (e.g. Google STUN) do not relay data. TURN relay requires hosted coturn or Metered.ca free tier (500MB/mo).',
          sourceOrLimitation: 'WebRTC standard RFC 5766',
          type: 'pricing'
        }
      ],
      unresolvedQuestions: [],
      scopeConflicts: []
    },
    conversation: [
      {
        id: 'msg-1',
        sender: 'architect',
        text: 'Welcome! I reviewed your goal for a local-first markdown knowledge engine. To ground our architecture: what is your primary synchronization strategy between user devices?',
        timestamp: Date.now() - 300000,
        options: [
          {
            label: 'P2P WebRTC + E2EE signaling',
            description: 'Direct device-to-device sync when both are online.',
            tradeoff: 'Zero server storage cost, but devices must be online simultaneously or use a relay.',
            recommended: true
          },
          {
            label: 'Self-hosted WebDAV / S3 bucket',
            description: 'User enters their own Nextcloud, Synology, or Cloudflare R2 bucket.',
            tradeoff: 'Async sync works anytime, but requires non-technical users to set up cloud storage.'
          },
          {
            label: 'CouchDB / PouchDB sync',
            description: 'Standard replication protocol to a CouchDB instance.',
            tradeoff: 'Mature protocol, but introduces document overhead and heavier dependencies.'
          }
        ],
        relatedCategory: 'platform',
        feasibilityNote: {
          topic: 'Sync trade-off',
          detail: 'Yjs CRDTs over WebRTC provide seamless offline-first merges with zero central database bills.'
        }
      },
      {
        id: 'msg-2',
        sender: 'user',
        text: 'I prefer P2P WebRTC with E2EE, with an optional WebDAV export fallback for users with their own storage.',
        timestamp: Date.now() - 240000
      },
      {
        id: 'msg-3',
        sender: 'architect',
        text: 'Understood. For the markdown editor engine: do you need full WYSIWYG (like Notion/Typora) or a clean split-pane / live-preview markdown editor?',
        timestamp: Date.now() - 180000,
        options: [
          {
            label: 'CodeMirror 6 Live-Preview (Obsidian style)',
            description: 'Renders headers, bold, and links inline while typing.',
            tradeoff: 'Best balance of keyboard speed and visual polish; reliable raw markdown fidelity.',
            recommended: true
          },
          {
            label: 'TipTap / ProseMirror WYSIWYG',
            description: 'Pure rich text blocks that serialize to markdown.',
            tradeoff: 'More familiar to non-technical users, but prone to markdown serialization edge cases.'
          }
        ],
        relatedCategory: 'features'
      }
    ],
    review: {
      version: '1.0.0',
      isConfirmed: false,
      purpose: 'Provide privacy-conscious knowledge workers with an ultra-responsive, offline-first personal wiki that stores plain markdown files with instant graph exploration and zero vendor lock-in.',
      targetUsers: [
        'Software developers and technical writers',
        'Researchers and students managing citation graphs',
        'Privacy-focused knowledge workers needing offline reliability'
      ],
      primaryUserJourney: [
        '1. User launches web app (or installs PWA); default local notebook is instantly mounted in OPFS.',
        '2. User creates a new note using Ctrl+N or captures rapid thoughts with vim/markdown shortcuts.',
        '3. User types [[Concept]] to trigger fuzzy link suggestions, linking related thoughts.',
        '4. User views the Interactive Knowledge Graph to explore connection clusters.',
        '5. User opens Settings > Sync, scans a QR code with their laptop/phone, establishing an E2EE P2P sync.'
      ],
      includedFeatures: [
        'OPFS local file persistence with auto-save',
        'Bidirectional [[wikilinks]] indexer and backlink inspector',
        'Interactive 2D graph view using Canvas2D',
        'Full-text search using client-side MiniSearch / FlexSearch',
        'WebRTC P2P sync using Yjs binary update vectors'
      ],
      explicitExclusions: [
        'Public web publishing / hosting in v1',
        'Multiplayer collaborative simultaneous cursor rooms (v1 is single-user multi-device sync)',
        'Proprietary cloud database subscriptions'
      ],
      dataAndAccessRequirements: [
        'All note content is stored locally on device disk via OPFS.',
        'No remote telemetry or analytics without explicit user consent.',
        'Sync payloads are AES-GCM-256 encrypted with a user-derived passphrase before leaving the browser.'
      ],
      integrationsAndApis: [
        'WebRTC standard API (RTCPeerConnection)',
        'Public STUN server for NAT traversal (stun:stun.l.google.com:19302)',
        'Optional WebDAV client via standard HTTP REST verbs'
      ],
      budgetAndHostingConstraints: [
        'Budget: $0/month infrastructure cost.',
        'Hosted as a static PWA on Cloudflare Pages, GitHub Pages, or Vercel Hobby.',
        'No backend database maintenance overhead.'
      ],
      technicalAssumptions: [
        'Target browser supports Web Cryptography API and OPFS.',
        'Peer devices have network connectivity capable of STUN hole-punching.'
      ],
      researchLimitations: [
        'Symmetric NAT firewalls may block direct WebRTC without a TURN relay server (relies on WebDAV fallback).'
      ],
      successCriteria: [
        'Cold start time under 300ms for notebooks up to 5,000 notes.',
        'Zero data loss on unexpected browser closure or offline edits.',
        'Clean round-trip export to standard .md files readable by Obsidian or VS Code.'
      ]
    }
  },
  {
    name: 'B2B Compliance & Audit Trail Platform',
    initialIdea: 'A web portal for SOC2 and ISO27001 readiness that collects evidence from cloud providers (AWS, GitHub, Google Workspace), assigns remediation tasks, and generates audit reports.',
    currentPhase: 'interview',
    memory: {
      userDecisions: [
        'Read-only OAuth integrations with GitHub and AWS IAM roles.',
        'Role-Based Access Control (RBAC): Admin, Auditor (read-only), Compliance Officer, Team Member.',
        'Relational PostgreSQL database with immutable audit logging table.',
        'Automated daily compliance scans with webhook notifications (Slack / Email).'
      ],
      recommendations: [
        'Use PostgreSQL append-only event tables with cryptographic hash chaining for audit integrity.',
        'Use background worker queue (BullMQ or Cloud Tasks) for throttled API evidence polling.'
      ],
      assumptions: [
        'Companies will grant read-only metadata permissions to their cloud accounts.'
      ],
      exclusions: [
        'Automated automated code fixing/pull requests in v1 (read-only checks only).',
        'HIPAA or PCI-DSS specialized modules deferred to v2.'
      ],
      researchFindings: [
        {
          topic: 'GitHub REST API Rate Limits',
          finding: 'Authenticated GitHub OAuth apps receive 5,000 requests/hour per installation. Must implement exponential backoff and caching.',
          sourceOrLimitation: 'GitHub Developer Documentation',
          type: 'quota'
        }
      ],
      unresolvedQuestions: [
        'Will user organizations self-host or use multi-tenant cloud?'
      ],
      scopeConflicts: []
    },
    conversation: [
      {
        id: 'msg-b2b-1',
        sender: 'architect',
        text: 'Welcome! For your B2B SOC2 compliance platform, what is your deployment architecture requirement for customer data separation?',
        timestamp: Date.now() - 150000,
        options: [
          {
            label: 'Multi-tenant with Row-Level Security (RLS)',
            description: 'Single PostgreSQL instance with tenant_id isolation enforced by database policies.',
            tradeoff: 'Lowest infrastructure cost and simplest maintenance; requires careful RLS test coverage.',
            recommended: true
          },
          {
            label: 'Schema-per-tenant isolation',
            description: 'Dedicated schema for each paying organization inside PostgreSQL.',
            tradeoff: 'Stronger logical boundary, but migrations become more complex as customer count scales.'
          },
          {
            label: 'On-premise / Single-tenant Docker deployment',
            description: 'Customers deploy an appliance within their own VPC.',
            tradeoff: 'Appeals to high-security enterprises, but slower sales cycle and version fragmentation.'
          }
        ],
        relatedCategory: 'platform',
        feasibilityNote: {
          topic: 'Tenant Isolation',
          detail: 'Postgres RLS is audited and approved by enterprise SOC2 auditors when combined with automated integration tests.'
        }
      }
    ],
    review: {
      version: '0.9.0',
      isConfirmed: false,
      purpose: 'Streamline continuous SOC2 compliance for mid-market software companies by automating cloud evidence collection.',
      targetUsers: ['CTOs', 'Security Engineers', 'External SOC2 Auditors'],
      primaryUserJourney: ['Connect AWS & GitHub', 'Run automatic compliance scan', 'Review failing controls', 'Export audit package'],
      includedFeatures: ['Cloud connectors', 'Control catalog', 'Audit log export'],
      explicitExclusions: ['Direct remediation push'],
      dataAndAccessRequirements: ['AES-256 encrypted credentials at rest'],
      integrationsAndApis: ['AWS STS & Security Hub', 'GitHub REST API'],
      budgetAndHostingConstraints: ['PostgreSQL on AWS RDS or Supabase'],
      technicalAssumptions: ['Read-only cloud policies'],
      researchLimitations: ['AWS API rate limits'],
      successCriteria: ['Generates auditor-ready PDF in under 60 seconds']
    }
  }
];
