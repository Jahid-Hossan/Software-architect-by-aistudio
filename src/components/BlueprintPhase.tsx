import React, { useState } from 'react';
import { ImplementationBlueprint, ImplementationTask } from '../types/architect';
import {
  Code2,
  Database,
  Layers,
  ShieldCheck,
  CheckSquare,
  ArrowRight,
  Server,
  FileCode,
  AlertCircle,
  Copy,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface BlueprintPhaseProps {
  blueprint: ImplementationBlueprint;
  projectName: string;
  onProceedToCodingPrompt: () => void;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const BlueprintPhase: React.FC<BlueprintPhaseProps> = ({
  blueprint,
  projectName,
  onProceedToCodingPrompt,
  isLoading = false,
  error = null,
  onClearError,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'tech' | 'data' | 'apis' | 'tasks' | 'dod'>('architecture');
  const [copiedTask, setCopiedTask] = useState<string | null>(null);

  const copyTask = (task: ImplementationTask) => {
    const text = `[${task.id}] ${task.title}\nPhase: ${task.phase}\nDependencies: ${task.dependencies.join(', ') || 'None'}\nDescription: ${task.description}\nAcceptance Criteria:\n${task.acceptanceCriteria.map(c => `- ${c}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedTask(task.id);
    setTimeout(() => setCopiedTask(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <span>Stage 5 of 5: Practical Implementation Blueprint</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Technical Architecture: {projectName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-grade blueprint with dependency-ordered tasks, data models, and contracts.
          </p>
        </div>

        {/* CTA to Agent Prompt */}
        <button
          onClick={onProceedToCodingPrompt}
          disabled={isLoading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 shrink-0"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Coding Agent Prompt...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Generate Coding Agent Prompt</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Error Callout if prompt generation failed */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 flex items-start justify-between gap-3 text-xs text-rose-200 shadow-md">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-rose-100">Coding Prompt Generation Failed</span>
              <span className="text-rose-300">{error}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onProceedToCodingPrompt}
              disabled={isLoading}
              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-xs transition-colors"
            >
              Retry
            </button>
            {onClearError && (
              <button
                onClick={onClearError}
                className="p-1 text-rose-400 hover:text-white transition-colors"
                title="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Blueprint Sub-navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
        {[
          { id: 'architecture', label: 'Architecture & System' },
          { id: 'tech', label: 'Tech Stack & Rationale' },
          { id: 'data', label: 'Data Entities & Schemas' },
          { id: 'apis', label: 'API & Integration Contracts' },
          { id: 'tasks', label: `Implementation Tasks (${blueprint.tasks.length})` },
          { id: 'dod', label: 'Definition of Done & Security' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Architecture & System Overview */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
              System Architecture & Data Flow
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs whitespace-pre-wrap">
              {blueprint.architectureOverview}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
              Module Responsibilities & Directory Structure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(blueprint.moduleResponsibilities || []).map((mod, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-mono text-xs font-semibold text-slate-200">{mod.module}</span>
                  </div>
                  <p className="text-xs text-slate-400">{mod.responsibility}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Technology Choices & Rationale */}
      {activeTab === 'tech' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
            Technology Choices & Justification
          </h3>
          <div className="divide-y divide-slate-800">
            {(blueprint.techChoices || []).map((choice, idx) => (
              <div key={idx} className="py-4 space-y-1.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-500">{choice.category}</span>
                  <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 rounded">
                    {choice.chosenTech}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  <strong className="text-slate-400 font-medium">Rationale: </strong>
                  {choice.reason}
                </p>
                <p className="text-[11px] text-slate-500">
                  <strong className="text-slate-500 font-medium">Alternatives evaluated: </strong>
                  {choice.alternativesConsidered}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Data Entities & Schemas */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
              Data Entities & Schemas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(blueprint.dataEntities || []).map((entity, idx) => (
                <div key={idx} className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-mono text-xs font-bold text-white">{entity.name}</span>
                    <span className="text-[10px] uppercase font-mono text-slate-500">Entity Model</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs text-slate-300">
                    {(entity.fields || []).map((field, fIdx) => (
                      <div key={fIdx} className="text-slate-300">• {field}</div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Relationships: </span>
                    {entity.relationships}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: API & Integration Contracts */}
      {activeTab === 'apis' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
            API Endpoints & Integration Contracts
          </h3>
          <div className="space-y-4">
            {(blueprint.apiEndpoints || []).map((api, idx) => (
              <div key={idx} className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    api.method === 'GET' ? 'bg-sky-950 text-sky-400 border border-sky-500/20' :
                    api.method === 'POST' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' :
                    api.method === 'DELETE' ? 'bg-rose-950 text-rose-400 border border-rose-500/20' :
                    'bg-amber-950 text-amber-400 border border-amber-500/20'
                  }`}>
                    {api.method}
                  </span>
                  <span className="font-mono text-xs text-white font-semibold">{api.path}</span>
                  <span className="text-xs text-slate-400">· {api.description}</span>
                </div>
                {api.responseSample && (
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <span className="text-slate-500 block mb-1">// Sample Response</span>
                    {api.responseSample}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Dependency-Ordered Implementation Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Tasks ordered strictly by dependency. No cycles. Verifiable acceptance criteria.
            </span>
          </div>
          <div className="space-y-4">
            {(blueprint.tasks || []).map((task) => (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded">
                      {task.id}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">{task.phase}</span>
                    <button
                      onClick={() => copyTask(task)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="Copy task prompt"
                    >
                      {copiedTask === task.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{task.description}</p>

                {/* Dependencies */}
                {(task.dependencies || []).length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-500">Dependencies:</span>
                    {(task.dependencies || []).map(dep => (
                      <span key={dep} className="font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                        {dep}
                      </span>
                    ))}
                  </div>
                )}

                {/* Acceptance Criteria */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Acceptance Criteria:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {(task.acceptanceCriteria || []).map((crit, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{crit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Definition of Done & Security */}
      {activeTab === 'dod' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Measurable Definition of Done (DoD)</span>
            </h3>
            <ul className="space-y-2.5">
              {(blueprint.definitionOfDone || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Security & Privacy Rules</span>
            </h3>
            <ul className="space-y-2.5">
              {(blueprint.securityAndPrivacy || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-indigo-400 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">Generate Coding Agent Implementation Directive</h4>
          </div>
          <p className="text-xs text-slate-400">
            Transforms this complete architectural specification into a single self-contained prompt for Claude Code, Cursor, Devin, or AI Studio Build.
          </p>
        </div>
        <button
          onClick={onProceedToCodingPrompt}
          disabled={isLoading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 shrink-0"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Coding Agent Prompt...</span>
            </>
          ) : (
            <>
              <span>Generate Coding Agent Prompt</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
