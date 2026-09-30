import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function handleArchitectRequest(body: any): Promise<any> {
  const ai = getAiClient();
  const { action, projectName, initialIdea, conversation = [], memory, userReply, topic } = body;

  if (!ai) {
    // Graceful indicator to fallback
    return { fallback: true, reason: 'No GEMINI_API_KEY configured' };
  }

  try {
    if (action === 'interview_next') {
      const prompt = `You are a Software Research & Planning Architect.
Help users turn an initial software idea into clear, researched requirements, a practical implementation blueprint, and a complete prompt for a coding agent.
Quality Rules:
- Ask ONE high-value question at a time (or two closely related questions).
- Offer 2 or 3 meaningful options and explain their practical differences/tradeoffs.
- Keep track of: Purpose, intended users, essential features, platform, data/storage, external services, budget/hosting, and explicit exclusions.
- If the user provided an answer: extract decisions, recommendations, assumptions, and exclusions.

Project Name: "${projectName}"
Initial Idea: "${initialIdea}"
Conversation history:
${conversation.map((m: any) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}

Latest User Statement: "${userReply || 'Starting conversation'}"

Return JSON matching this exact structure:
{
  "question": "string (the clear, focused question)",
  "options": [
    {
      "label": "short label",
      "description": "what this choice means",
      "tradeoff": "practical difference, cost, or limitation",
      "recommended": boolean
    }
  ],
  "relatedCategory": "purpose" | "features" | "platform" | "data" | "integrations" | "budget" | "exclusions",
  "feasibilityNote": {
    "topic": "topic name",
    "detail": "factual technical insight, API limits, or free-tier realities"
  },
  "memoryUpdates": {
    "userDecisions": ["new explicit user choices"],
    "recommendations": ["technical recommendations proposed"],
    "assumptions": ["unverified assumptions that need confirmation"],
    "exclusions": ["features excluded from v1"]
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini');
      return JSON.parse(text);
    }

    if (action === 'synthesize_review') {
      const prompt = `You are a Software Research & Planning Architect.
Present the structured requirements review for the user to explicitly confirm before any blueprint is generated.

Project Name: "${projectName}"
Initial Idea: "${initialIdea}"
Project Memory:
User Decisions: ${JSON.stringify(memory?.userDecisions || [])}
Recommendations: ${JSON.stringify(memory?.recommendations || [])}
Assumptions: ${JSON.stringify(memory?.assumptions || [])}
Exclusions: ${JSON.stringify(memory?.exclusions || [])}
Research Findings: ${JSON.stringify(memory?.researchFindings || [])}

Return a comprehensive Requirements Review JSON matching this exact structure:
{
  "version": "1.0.0",
  "isConfirmed": false,
  "purpose": "Precise problem statement and project purpose",
  "targetUsers": ["Target user persona 1", "Target user persona 2"],
  "primaryUserJourney": ["1. Step one", "2. Step two", "3. Step three", "4. Step four", "5. Step five"],
  "includedFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "explicitExclusions": ["Excluded feature 1", "Excluded feature 2", "Excluded feature 3"],
  "dataAndAccessRequirements": ["Data storage rules", "Privacy and permission requirements"],
  "integrationsAndApis": ["External services, APIs, or None for v1"],
  "budgetAndHostingConstraints": ["Budget and deployment target"],
  "technicalAssumptions": ["Key technical assumptions"],
  "researchLimitations": ["Research notes and feasibility boundaries"],
  "successCriteria": ["Concrete measurable success criteria 1", "Criteria 2", "Criteria 3"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini');
      return JSON.parse(text);
    }

    if (action === 'generate_blueprint') {
      const prompt = `You are a Software Research & Planning Architect.
The requirements have been EXPLICITLY CONFIRMED. Now produce a complete, production-grade implementation blueprint.
Follow standard software engineering principles:
- Give implementation tasks unique IDs (TASK-101, TASK-102, etc.), dependencies, and verifiable acceptance criteria.
- Dependencies must be valid and not form cycles.
- Provide data models and API contracts.
- Include clear UI states (empty, loading, error, success) and Definition of Done.

Project Name: "${projectName}"
Initial Idea: "${initialIdea}"
Confirmed Review: ${JSON.stringify(body.review)}
Project Memory: ${JSON.stringify(memory)}

Return JSON matching this exact structure:
{
  "summary": "High-level summary of architecture",
  "targetAudience": "string",
  "scopeSummary": "string",
  "techChoices": [
    {
      "category": "Frontend / Backend / Database / UI",
      "chosenTech": "Technology name",
      "reason": "Specific justification",
      "alternativesConsidered": "Why alternatives were not selected"
    }
  ],
  "architectureOverview": "Detailed system architecture and data flow",
  "moduleResponsibilities": [
    {
      "module": "path/or/module/name",
      "responsibility": "What this module handles"
    }
  ],
  "dataEntities": [
    {
      "name": "EntityName",
      "fields": ["field: type", "field2: type"],
      "relationships": "Relationship description"
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "path": "/api/...",
      "description": "Endpoint purpose",
      "requestSample": "JSON string or N/A",
      "responseSample": "JSON string"
    }
  ],
  "securityAndPrivacy": ["Security rule 1", "Privacy rule 2"],
  "uiStatesAndJourneys": [
    {
      "flowName": "Flow name",
      "steps": ["step 1", "step 2"],
      "loadingAndErrorHandling": "How errors and loading are handled"
    }
  ],
  "tasks": [
    {
      "id": "TASK-101",
      "title": "Task title",
      "phase": "Phase 1: Foundations",
      "dependencies": [],
      "description": "What to build",
      "acceptanceCriteria": ["Criteria 1", "Criteria 2"],
      "filesAffected": ["file1.ts", "file2.tsx"]
    }
  ],
  "definitionOfDone": ["DoD item 1", "DoD item 2", "DoD item 3"],
  "risksAndLimitations": ["Risk or limitation 1", "Risk 2"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini');
      return JSON.parse(text);
    }

    if (action === 'generate_coding_prompt') {
      const prompt = `You are a Software Research & Planning Architect.
Generate a self-contained, complete prompt that another coding agent (e.g., Claude Code, Cursor, Devin, AI Studio) can use without reading the interview conversation.
Include:
- Confirmed requirements & explicit exclusions
- Chosen architecture & technology stack
- File structure proposal
- Data & API contracts
- Step-by-step implementation tasks with acceptance criteria
- Configuration placeholders (.env.example with ZERO real secrets)
- Verification & testing instructions
- Definition of Done

Project Name: "${projectName}"
Initial Idea: "${initialIdea}"
Confirmed Review: ${JSON.stringify(body.review)}
Blueprint: ${JSON.stringify(body.blueprint)}

Format as clean, beautifully structured Markdown with code blocks and headers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });

      return { markdown: response.text || '' };
    }

    return { fallback: true };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isRateLimit = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded');

    if (isRateLimit) {
      console.warn('[Gemini API Notice] Free tier quota/rate limit reached. Smoothly switching to local architectural intelligence engine.');
      return {
        fallback: true,
        rateLimited: true,
        reason: 'Gemini API free tier rate limit reached. Switched to offline architectural knowledge engine.',
      };
    }

    console.error('[Gemini Server Error]', err);
    return { fallback: true, error: errMsg };
  }
}
