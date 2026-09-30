export type Phase = 'idea' | 'interview' | 'memory' | 'review' | 'blueprint' | 'coding_prompt';

export interface ProjectMemory {
  userDecisions: string[];
  recommendations: string[];
  assumptions: string[];
  exclusions: string[];
  researchFindings: {
    topic: string;
    finding: string;
    sourceOrLimitation?: string;
    type: 'quota' | 'pricing' | 'compatibility' | 'security' | 'hosting';
  }[];
  unresolvedQuestions: string[];
  scopeConflicts: string[];
}

export interface InterviewOption {
  label: string;
  description: string;
  tradeoff: string;
  recommended?: boolean;
  action?: 'continue_interview' | 'proceed_to_review' | 'add_constraint';
}

export interface InterviewMessage {
  id: string;
  sender: 'architect' | 'user';
  text: string;
  timestamp: number;
  options?: InterviewOption[];
  interviewStatus?: 'continue' | 'ready_for_review';
  relatedCategory?: 'purpose' | 'features' | 'platform' | 'data' | 'integrations' | 'budget' | 'exclusions';
  feasibilityNote?: {
    topic: string;
    detail: string;
    warning?: boolean;
  };
}

export interface RequirementsReview {
  version: string;
  confirmedAt?: number;
  isConfirmed: boolean;
  purpose: string;
  targetUsers: string[];
  primaryUserJourney: string[];
  includedFeatures: string[];
  explicitExclusions: string[];
  dataAndAccessRequirements: string[];
  integrationsAndApis: string[];
  budgetAndHostingConstraints: string[];
  technicalAssumptions: string[];
  researchLimitations: string[];
  successCriteria: string[];
}

export interface ImplementationTask {
  id: string;
  title: string;
  phase: string;
  dependencies: string[];
  description: string;
  acceptanceCriteria: string[];
  filesAffected?: string[];
}

export interface ImplementationBlueprint {
  summary: string;
  targetAudience: string;
  scopeSummary: string;
  techChoices: {
    category: string;
    chosenTech: string;
    reason: string;
    alternativesConsidered: string;
  }[];
  architectureOverview: string;
  moduleResponsibilities: {
    module: string;
    responsibility: string;
  }[];
  dataEntities: {
    name: string;
    fields: string[];
    relationships: string;
  }[];
  apiEndpoints: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    requestSample?: string;
    responseSample?: string;
  }[];
  securityAndPrivacy: string[];
  uiStatesAndJourneys: {
    flowName: string;
    steps: string[];
    loadingAndErrorHandling: string;
  }[];
  tasks: ImplementationTask[];
  definitionOfDone: string[];
  risksAndLimitations: string[];
}

export interface ProjectState {
  id: string;
  name: string;
  initialIdea: string;
  currentPhase: Phase;
  memory: ProjectMemory;
  conversation: InterviewMessage[];
  review: RequirementsReview;
  blueprint?: ImplementationBlueprint;
  codingPrompt?: string;
  createdAt: number;
  updatedAt: number;
}
