import React, { useState, useEffect } from 'react';
import { ProjectState, Phase, InterviewOption, ProjectMemory, RequirementsReview } from './types/architect';
import { SAMPLE_PROJECTS } from './services/templates';
import { callArchitectApi } from './services/geminiService';
import { Header } from './components/Header';
import { PhaseStepper } from './components/PhaseStepper';
import { IdeaPhase } from './components/IdeaPhase';
import { InterviewPhase } from './components/InterviewPhase';
import { MemoryVault } from './components/MemoryVault';
import { ReviewPhase } from './components/ReviewPhase';
import { BlueprintPhase } from './components/BlueprintPhase';
import { CodingAgentPromptPhase } from './components/CodingAgentPromptPhase';
import { X } from 'lucide-react';

const STORAGE_KEY = 'architect_project_state_v1';

const INITIAL_PROJECT_STATE: ProjectState = {
  id: 'proj-' + Date.now(),
  name: '',
  initialIdea: '',
  currentPhase: 'idea',
  memory: {
    userDecisions: [],
    recommendations: [],
    assumptions: [],
    exclusions: [],
    researchFindings: [],
    unresolvedQuestions: [],
    scopeConflicts: [],
  },
  conversation: [],
  review: {
    version: '1.0.0',
    isConfirmed: false,
    purpose: '',
    targetUsers: [],
    primaryUserJourney: [],
    includedFeatures: [],
    explicitExclusions: [],
    dataAndAccessRequirements: [],
    integrationsAndApis: [],
    budgetAndHostingConstraints: [],
    technicalAssumptions: [],
    researchLimitations: [],
    successCriteria: [],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export function normalizeProjectState(loaded: any): ProjectState {
  const base = INITIAL_PROJECT_STATE;
  if (!loaded || typeof loaded !== 'object') return base;

  const rawMemory: Partial<ProjectMemory> = loaded.memory || {};
  const rawReview: Partial<RequirementsReview> = loaded.review || {};
  const rawBlueprint = loaded.blueprint;

  return {
    id: loaded.id || base.id,
    name: loaded.name || '',
    initialIdea: loaded.initialIdea || '',
    currentPhase: loaded.currentPhase || 'idea',
    memory: {
      userDecisions: Array.isArray(rawMemory.userDecisions) ? rawMemory.userDecisions : [],
      recommendations: Array.isArray(rawMemory.recommendations) ? rawMemory.recommendations : [],
      assumptions: Array.isArray(rawMemory.assumptions) ? rawMemory.assumptions : [],
      exclusions: Array.isArray(rawMemory.exclusions) ? rawMemory.exclusions : [],
      researchFindings: Array.isArray(rawMemory.researchFindings) ? rawMemory.researchFindings : [],
      unresolvedQuestions: Array.isArray(rawMemory.unresolvedQuestions) ? rawMemory.unresolvedQuestions : [],
      scopeConflicts: Array.isArray(rawMemory.scopeConflicts) ? rawMemory.scopeConflicts : [],
    },
    conversation: Array.isArray(loaded.conversation)
      ? loaded.conversation.map((msg) => ({
          ...msg,
          options: Array.isArray(msg.options) ? msg.options : [],
        }))
      : [],
    review: {
      version: rawReview.version || '1.0.0',
      confirmedAt: rawReview.confirmedAt,
      isConfirmed: Boolean(rawReview.isConfirmed),
      purpose: rawReview.purpose || '',
      targetUsers: Array.isArray(rawReview.targetUsers) ? rawReview.targetUsers : [],
      primaryUserJourney: Array.isArray(rawReview.primaryUserJourney) ? rawReview.primaryUserJourney : [],
      includedFeatures: Array.isArray(rawReview.includedFeatures) ? rawReview.includedFeatures : [],
      explicitExclusions: Array.isArray(rawReview.explicitExclusions) ? rawReview.explicitExclusions : [],
      dataAndAccessRequirements: Array.isArray(rawReview.dataAndAccessRequirements) ? rawReview.dataAndAccessRequirements : [],
      integrationsAndApis: Array.isArray(rawReview.integrationsAndApis) ? rawReview.integrationsAndApis : [],
      budgetAndHostingConstraints: Array.isArray(rawReview.budgetAndHostingConstraints) ? rawReview.budgetAndHostingConstraints : [],
      technicalAssumptions: Array.isArray(rawReview.technicalAssumptions) ? rawReview.technicalAssumptions : [],
      researchLimitations: Array.isArray(rawReview.researchLimitations) ? rawReview.researchLimitations : [],
      successCriteria: Array.isArray(rawReview.successCriteria) ? rawReview.successCriteria : [],
    },
    blueprint: rawBlueprint
      ? {
          summary: rawBlueprint.summary || '',
          targetAudience: rawBlueprint.targetAudience || '',
          scopeSummary: rawBlueprint.scopeSummary || '',
          techChoices: Array.isArray(rawBlueprint.techChoices) ? rawBlueprint.techChoices : [],
          architectureOverview: rawBlueprint.architectureOverview || '',
          moduleResponsibilities: Array.isArray(rawBlueprint.moduleResponsibilities) ? rawBlueprint.moduleResponsibilities : [],
          dataEntities: Array.isArray(rawBlueprint.dataEntities)
            ? rawBlueprint.dataEntities.map((e) => ({
                ...e,
                fields: Array.isArray(e.fields) ? e.fields : [],
              }))
            : [],
          apiEndpoints: Array.isArray(rawBlueprint.apiEndpoints) ? rawBlueprint.apiEndpoints : [],
          securityAndPrivacy: Array.isArray(rawBlueprint.securityAndPrivacy) ? rawBlueprint.securityAndPrivacy : [],
          uiStatesAndJourneys: Array.isArray(rawBlueprint.uiStatesAndJourneys)
            ? rawBlueprint.uiStatesAndJourneys.map((u) => ({
                ...u,
                steps: Array.isArray(u.steps) ? u.steps : [],
              }))
            : [],
          tasks: Array.isArray(rawBlueprint.tasks)
            ? rawBlueprint.tasks.map((t) => ({
                ...t,
                dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
                acceptanceCriteria: Array.isArray(t.acceptanceCriteria) ? t.acceptanceCriteria : [],
                filesAffected: Array.isArray(t.filesAffected) ? t.filesAffected : [],
              }))
            : [],
          definitionOfDone: Array.isArray(rawBlueprint.definitionOfDone) ? rawBlueprint.definitionOfDone : [],
          risksAndLimitations: Array.isArray(rawBlueprint.risksAndLimitations) ? rawBlueprint.risksAndLimitations : [],
        }
      : undefined,
    codingPrompt: loaded.codingPrompt || '',
    createdAt: loaded.createdAt || Date.now(),
    updatedAt: loaded.updatedAt || Date.now(),
  };
}

export const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return normalizeProjectState(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse saved project state:', e);
    }
    return INITIAL_PROJECT_STATE;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);

  // Auto-persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [project]);

  // Phase navigation
  const setPhase = (phase: Phase) => {
    // Enforce Section 7: Cannot visit blueprint or coding prompt unless confirmed
    if ((phase === 'blueprint' || phase === 'coding_prompt') && !project.review.isConfirmed) {
      return;
    }
    setProject((prev) => ({ ...prev, currentPhase: phase }));
  };

  // Start interview from Idea phase
  const handleStartInterview = async () => {
    setIsLoading(true);
    setProject((prev) => ({
      ...prev,
      currentPhase: 'interview',
      conversation: [
        {
          id: 'welcome-msg',
          sender: 'architect',
          text: `Welcome! I've logged your initial vision for "${project.name || 'your software idea'}": "${project.initialIdea}".\n\nTo establish our foundation: who is the primary target user, and what is the single most critical problem this first release must solve?`,
          timestamp: Date.now(),
          options: [
            {
              label: 'Individual Power User / Solo Operator',
              description: 'Single-user workflow with fast local execution and zero friction.',
              tradeoff: 'Fastest to build and launch; no complex multi-user permissions needed for v1.',
              recommended: true,
            },
            {
              label: 'Collaborative Small Team (2–10 members)',
              description: 'Shared workspaces with basic invite or link sharing.',
              tradeoff: 'Higher engagement, but requires cloud backend and user authentication.',
            },
            {
              label: 'Enterprise / Regulated Organization',
              description: 'Strict security, audit logs, and compliance boundaries.',
              tradeoff: 'Highest revenue potential, but requires RBAC, audit trails, and data isolation.',
            },
          ],
          relatedCategory: 'purpose',
          feasibilityNote: {
            topic: 'Scope Boundary',
            detail: 'Starting with a single-user archetype reduces MVP complexity by over 60% compared to multi-tenant RBAC.',
          },
        },
      ],
      memory: {
        ...prev.memory,
        userDecisions: [
          `Core Problem: "${project.initialIdea.slice(0, 120)}..."`,
        ],
      },
    }));
    setIsLoading(false);
  };

  // Handle user response in dynamic interview
  const handleSendMessage = async (text: string, selectedOption?: InterviewOption) => {
    const userMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user' as const,
      text,
      timestamp: Date.now(),
    };

    const newConversation = [...project.conversation, userMessage];

    // Optimistically update conversation
    setProject((prev) => ({
      ...prev,
      conversation: newConversation,
      // If user selected an option, log it to decisions
      memory: selectedOption
        ? {
            ...prev.memory,
            userDecisions: [
              ...prev.memory.userDecisions,
              `${selectedOption.label} (${selectedOption.description})`,
            ],
          }
        : prev.memory,
    }));

    setIsLoading(true);

    try {
      const data = await callArchitectApi({
        action: 'interview_next',
        projectName: project.name,
        initialIdea: project.initialIdea,
        conversation: newConversation,
        memory: project.memory,
        userReply: text,
      });

      const architectMsg = {
        id: 'arch-' + Date.now(),
        sender: 'architect' as const,
        text: data.question || 'Thank you. Let us explore the next technical dimension.',
        timestamp: Date.now(),
        options: data.options || [],
        relatedCategory: data.relatedCategory,
        feasibilityNote: data.feasibilityNote,
      };

      setProject((prev) => {
        const memUpdates = data.memoryUpdates || {};
        return {
          ...prev,
          conversation: [...prev.conversation, architectMsg],
          memory: {
            ...prev.memory,
            userDecisions: [
              ...prev.memory.userDecisions,
              ...(memUpdates.userDecisions || []),
            ],
            recommendations: [
              ...prev.memory.recommendations,
              ...(memUpdates.recommendations || []),
            ],
            assumptions: [
              ...prev.memory.assumptions,
              ...(memUpdates.assumptions || []),
            ],
            exclusions: [
              ...prev.memory.exclusions,
              ...(memUpdates.exclusions || []),
            ],
          },
        };
      });
    } catch (e) {
      console.error('Error getting interview reply:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Proceed from Interview to Requirements Review
  const handleProceedToReview = async () => {
    setIsLoading(true);
    try {
      const reviewData = await callArchitectApi({
        action: 'synthesize_review',
        projectName: project.name,
        initialIdea: project.initialIdea,
        conversation: project.conversation,
        memory: project.memory,
      });

      setProject((prev) =>
        normalizeProjectState({
          ...prev,
          currentPhase: 'review',
          review: {
            ...prev.review,
            ...reviewData,
            version: '1.0.0',
            isConfirmed: false,
          },
        })
      );
    } catch (e) {
      console.error('Error generating review:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Explicit confirmation gate (Section 7)
  const handleConfirmRequirements = async () => {
    setIsLoading(true);
    try {
      // 1. Mark confirmed
      const confirmedReview = {
        ...project.review,
        isConfirmed: true,
        confirmedAt: Date.now(),
      };

      // 2. Synthesize Implementation Blueprint
      const blueprintData = await callArchitectApi({
        action: 'generate_blueprint',
        projectName: project.name,
        initialIdea: project.initialIdea,
        review: confirmedReview,
        memory: project.memory,
      });

      // 3. Synthesize Coding Agent Prompt
      const promptData = await callArchitectApi({
        action: 'generate_coding_prompt',
        projectName: project.name,
        initialIdea: project.initialIdea,
        review: confirmedReview,
        blueprint: blueprintData,
      });

      setProject((prev) =>
        normalizeProjectState({
          ...prev,
          review: confirmedReview,
          blueprint: blueprintData,
          codingPrompt: promptData.markdown || promptData.text || '',
          currentPhase: 'blueprint',
        })
      );
    } catch (e) {
      console.error('Error during confirmation synthesis:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke confirmation if user requests changes
  const handleRevokeConfirmation = () => {
    setProject((prev) => ({
      ...prev,
      review: {
        ...prev.review,
        isConfirmed: false,
        confirmedAt: undefined,
      },
      currentPhase: 'review',
    }));
  };

  // Load a pre-researched archetype
  const handleSelectSample = (sample: typeof SAMPLE_PROJECTS[0]) => {
    setProject(
      normalizeProjectState({
        ...sample,
        id: 'proj-' + Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
  };

  // Reset to brand new project
  const handleReset = () => {
    if (confirm('Start a new software project? Current memory will be cleared.')) {
      setProject(INITIAL_PROJECT_STATE);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Export full JSON specification
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${(project.name || 'software_spec').toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export Coding Prompt Markdown
  const handleExportMarkdown = () => {
    const content = project.codingPrompt || `# Specification for ${project.name}\n\n${project.initialIdea}`;
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(content);
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${(project.name || 'implementation').toLowerCase().replace(/\s+/g, '_')}_prompt.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        project={project}
        onSelectSample={handleSelectSample}
        onReset={handleReset}
        onToggleMemoryDrawer={() => setIsMemoryDrawerOpen(!isMemoryDrawerOpen)}
        isMemoryOpen={isMemoryDrawerOpen}
        onExportJson={handleExportJson}
        onExportMarkdown={handleExportMarkdown}
      />

      {/* Phase Progression Stepper */}
      <PhaseStepper
        currentPhase={project.currentPhase}
        onSelectPhase={setPhase}
        isConfirmed={project.review.isConfirmed}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 pb-16">
        {project.currentPhase === 'idea' && (
          <IdeaPhase
            initialIdea={project.initialIdea}
            projectName={project.name}
            onUpdateIdea={(name, idea) =>
              setProject((prev) => ({ ...prev, name, initialIdea: idea }))
            }
            onStartInterview={handleStartInterview}
            onSelectSample={handleSelectSample}
          />
        )}

        {project.currentPhase === 'interview' && (
          <InterviewPhase
            project={project}
            onSendMessage={handleSendMessage}
            onProceedToReview={handleProceedToReview}
            isLoading={isLoading}
          />
        )}

        {project.currentPhase === 'memory' && (
          <MemoryVault
            memory={project.memory}
            onUpdateMemory={(mem) => setProject((prev) => ({ ...prev, memory: mem }))}
            onProceedToReview={handleProceedToReview}
          />
        )}

        {project.currentPhase === 'review' && (
          <ReviewPhase
            review={project.review}
            projectName={project.name}
            onConfirmRequirements={handleConfirmRequirements}
            onRevokeConfirmation={handleRevokeConfirmation}
            onProceedToBlueprint={() => setPhase('blueprint')}
            onReturnToInterview={() => setPhase('interview')}
          />
        )}

        {project.currentPhase === 'blueprint' && project.blueprint && (
          <BlueprintPhase
            blueprint={project.blueprint}
            projectName={project.name}
            onProceedToCodingPrompt={() => setPhase('coding_prompt')}
          />
        )}

        {project.currentPhase === 'coding_prompt' && (
          <CodingAgentPromptPhase
            promptText={project.codingPrompt || 'No coding prompt generated yet.'}
            projectName={project.name}
          />
        )}
      </main>

      {/* Project Memory Drawer Sidebar */}
      {isMemoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMemoryDrawerOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 overflow-y-auto">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
              <span className="font-semibold text-sm text-white">Project Memory Bank</span>
              <button
                onClick={() => setIsMemoryDrawerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 p-2">
              <MemoryVault
                memory={project.memory}
                onUpdateMemory={(mem) => setProject((prev) => ({ ...prev, memory: mem }))}
                isDrawer
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
