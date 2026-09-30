import { executeAiRequest, testProviderConnection, fetchProviderModels, AiChatMessage } from './aiRouter.js';
import { AiSettings, AiProvider } from '../types/aiSettings.js';

export async function handleArchitectRequest(body: any): Promise<any> {
  const {
    action,
    projectName,
    initialIdea,
    conversation = [],
    memory,
    userReply,
    topic,
    aiSettings,
    testProvider,
  } = body;

  // Handle provider connection testing directly
  if (action === 'test_connection' && testProvider) {
    const result = await testProviderConnection(testProvider.provider as AiProvider, testProvider.modelSlug);
    return result;
  }

  // Handle fetching models directly
  if (action === 'fetch_models' && testProvider) {
    const result = await fetchProviderModels(testProvider.provider as AiProvider);
    return result;
  }

  try {
    if (action === 'interview_next') {
      const systemInstruction = `You are a Software Research & Planning Architect.
Help users turn an initial software idea into clear, researched requirements, a practical implementation blueprint, and a complete prompt for a coding agent.
Quality Rules:
- Ask ONE high-value question at a time (or two closely related questions).
- Offer 2 or 3 meaningful options and explain their practical differences/tradeoffs.
- Keep track of: Purpose, intended users, essential features, platform, data/storage, external services, budget/hosting, and explicit exclusions.
- If the user provided an answer: extract decisions, recommendations, assumptions, and exclusions.
- When foundational architecture dimensions (purpose, users, data/auth, integrations, hosting) have been sufficiently captured, set "interviewStatus": "ready_for_review" and offer a recommended option with "action": "proceed_to_review" ("Proceed to Requirements Review & Confirmation Gate").
- You MUST respond ONLY with a single valid JSON object, without backticks or markdown formatting around it.`;

      const prompt = `Project Name: "${projectName}"
Initial Idea: "${initialIdea}"
Conversation history:
${conversation.map((m: any) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}

Latest User Statement: "${userReply || 'Starting conversation'}"

Return JSON matching this exact structure:
{
  "question": "string (the clear, focused question)",
  "interviewStatus": "continue" | "ready_for_review",
  "options": [
    {
      "label": "short label",
      "description": "what this choice means",
      "tradeoff": "practical difference, cost, or limitation",
      "recommended": boolean,
      "action": "continue_interview" | "proceed_to_review" | "add_constraint"
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

      const aiRes = await executeAiRequest({
        messages: [{ role: 'user', content: prompt }],
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        aiSettings,
      });

      const parsed = extractJsonObject(aiRes.text);
      if (!parsed || !parsed.question) {
        throw new Error('Invalid JSON structure returned by AI model');
      }
      return {
        ...parsed,
        _providerUsed: aiRes.providerUsed,
      };
    }

    if (action === 'synthesize_review') {
      const systemInstruction = `You are a Software Research & Planning Architect.
Present the structured requirements review for the user to explicitly confirm before any blueprint is generated.
You MUST respond ONLY with a single valid JSON object, without backticks or markdown formatting.`;

      const prompt = `Project Name: "${projectName}"
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

      const aiRes = await executeAiRequest({
        messages: [{ role: 'user', content: prompt }],
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        aiSettings,
      });

      const parsed = extractJsonObject(aiRes.text);
      if (!parsed || !parsed.purpose) {
        throw new Error('Invalid JSON structure returned for Requirements Review');
      }
      return {
        ...parsed,
        _providerUsed: aiRes.providerUsed,
      };
    }

    if (action === 'generate_blueprint') {
      const systemInstruction = `You are a Software Research & Planning Architect.
The requirements have been EXPLICITLY CONFIRMED. Now produce a complete, production-grade implementation blueprint.
Follow standard software engineering principles:
- Give implementation tasks unique IDs (TASK-101, TASK-102, etc.), dependencies, and verifiable acceptance criteria.
- Dependencies must be valid and not form cycles.
- Provide data models and API contracts.
- Include clear UI states (empty, loading, error, success) and Definition of Done.
You MUST respond ONLY with a single valid JSON object, without backticks or markdown formatting.`;

      const prompt = `Project Name: "${projectName}"
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

      const aiRes = await executeAiRequest({
        messages: [{ role: 'user', content: prompt }],
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        aiSettings,
      });

      const parsed = extractJsonObject(aiRes.text);
      if (!parsed || !parsed.tasks) {
        throw new Error('Invalid JSON structure returned for Implementation Blueprint');
      }
      return {
        ...parsed,
        _providerUsed: aiRes.providerUsed,
      };
    }

    if (action === 'generate_coding_prompt') {
      const systemInstruction = `You are a Software Research & Planning Architect.
Generate a self-contained, complete prompt that another coding agent (e.g., Claude Code, Cursor, Devin, AI Studio) can use without reading the interview conversation.
Include:
- Confirmed requirements & explicit exclusions
- Chosen architecture & technology stack
- File structure proposal
- Data & API contracts
- Step-by-step implementation tasks with acceptance criteria
- Configuration placeholders (.env.example with ZERO real secrets)
- Verification & testing instructions
- Definition of Done`;

      const prompt = `Project Name: "${projectName}"
Initial Idea: "${initialIdea}"
Confirmed Review: ${JSON.stringify(body.review)}
Blueprint: ${JSON.stringify(body.blueprint)}

Format as clean, beautifully structured Markdown with code blocks and headers.`;

      const aiRes = await executeAiRequest({
        messages: [{ role: 'user', content: prompt }],
        systemInstruction,
        temperature: 0.2,
        aiSettings,
      });

      return {
        markdown: aiRes.text || '',
        _providerUsed: aiRes.providerUsed,
      };
    }

    return { fallback: true };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.log('[AI Router Fallback] Seamlessly switching to heuristic synthesis:', errMsg);
    return {
      fallback: true,
      error: errMsg,
    };
  }
}

function extractJsonObject(text: string): any {
  if (!text) return null;
  // If wrapped in ```json ... ```, strip markdown tags
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find the first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const substring = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(substring);
      } catch {
        return null;
      }
    }
    return null;
  }
}
