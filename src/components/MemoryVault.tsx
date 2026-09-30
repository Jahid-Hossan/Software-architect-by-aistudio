import React, { useState } from 'react';
import { ProjectMemory } from '../types/architect';
import {
  CheckCircle,
  Lightbulb,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Trash2,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';

interface MemoryVaultProps {
  memory: ProjectMemory;
  onUpdateMemory: (newMemory: ProjectMemory) => void;
  onProceedToReview?: () => void;
  isDrawer?: boolean;
}

export const MemoryVault: React.FC<MemoryVaultProps> = ({
  memory,
  onUpdateMemory,
  onProceedToReview,
  isDrawer = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'decisions' | 'recommendations' | 'assumptions' | 'exclusions' | 'research'>('all');
  const [newEntryText, setNewEntryText] = useState('');
  const [newEntryType, setNewEntryType] = useState<'decision' | 'recommendation' | 'assumption' | 'exclusion'>('decision');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryText.trim()) return;

    const updated = { ...memory };
    const text = newEntryText.trim();

    if (newEntryType === 'decision') {
      updated.userDecisions = [...updated.userDecisions, text];
    } else if (newEntryType === 'recommendation') {
      updated.recommendations = [...updated.recommendations, text];
    } else if (newEntryType === 'assumption') {
      updated.assumptions = [...updated.assumptions, text];
    } else if (newEntryType === 'exclusion') {
      updated.exclusions = [...updated.exclusions, text];
    }

    onUpdateMemory(updated);
    setNewEntryText('');
  };

  const handleRemove = (type: 'decision' | 'recommendation' | 'assumption' | 'exclusion', index: number) => {
    const updated = { ...memory };
    if (type === 'decision') {
      updated.userDecisions = updated.userDecisions.filter((_, i) => i !== index);
    } else if (type === 'recommendation') {
      updated.recommendations = updated.recommendations.filter((_, i) => i !== index);
    } else if (type === 'assumption') {
      updated.assumptions = updated.assumptions.filter((_, i) => i !== index);
    } else if (type === 'exclusion') {
      updated.exclusions = updated.exclusions.filter((_, i) => i !== index);
    }
    onUpdateMemory(updated);
  };

  const userDecisions = memory?.userDecisions || [];
  const recommendations = memory?.recommendations || [];
  const assumptions = memory?.assumptions || [];
  const exclusions = memory?.exclusions || [];
  const researchFindings = memory?.researchFindings || [];

  return (
    <div className={`space-y-6 ${isDrawer ? 'p-4' : 'max-w-5xl mx-auto py-8 px-4 sm:px-6'}`}>
      {/* Title & Guidance */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <Layers className="w-4 h-4" />
              <span>Project Memory Vault (Evolving Requirements Record)</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Active Project Memory & Constraints
            </h2>
          </div>
          {onProceedToReview && (
            <button
              onClick={onProceedToReview}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            >
              <span>Review Spec</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Maintaining strict separation between User Decisions, Technical Recommendations,
          Assumptions awaiting sign-off, and Explicit Exclusions.
        </p>
      </div>

      {/* Add Item Bar */}
      <form onSubmit={handleAddEntry} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-2.5">
        <select
          value={newEntryType}
          onChange={(e) => setNewEntryType(e.target.value as any)}
          className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
        >
          <option value="decision">User Decision</option>
          <option value="recommendation">Technical Recommendation</option>
          <option value="assumption">Assumption</option>
          <option value="exclusion">Explicit Exclusion</option>
        </select>
        <input
          type="text"
          value={newEntryText}
          onChange={(e) => setNewEntryText(e.target.value)}
          placeholder="Add manual record (e.g. 'Must work on Firefox ESR' or 'Exclude Stripe billing in v1')..."
          className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
        />
        <button
          type="submit"
          disabled={!newEntryText.trim()}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Record</span>
        </button>
      </form>

      {/* Memory Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Explicit User Decisions */}
        <div className="bg-slate-900/70 border border-emerald-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>User Decisions ({userDecisions.length})</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-mono">Explicitly Stated</span>
          </div>
          {userDecisions.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No explicit decisions logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {userDecisions.map((item, idx) => (
                <li key={idx} className="flex items-start justify-between gap-2 text-xs text-slate-300 group">
                  <span className="leading-relaxed flex-1">• {item}</span>
                  <button
                    onClick={() => handleRemove('decision', idx)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 2. Technical Recommendations */}
        <div className="bg-slate-900/70 border border-indigo-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Lightbulb className="w-4 h-4" />
              <span>Recommendations ({recommendations.length})</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-mono">Proposed</span>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No recommendations proposed yet.</p>
          ) : (
            <ul className="space-y-2">
              {recommendations.map((item, idx) => (
                <li key={idx} className="flex items-start justify-between gap-2 text-xs text-slate-300 group">
                  <span className="leading-relaxed flex-1">• {item}</span>
                  <button
                    onClick={() => handleRemove('recommendation', idx)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. Assumptions Awaiting Sign-Off */}
        <div className="bg-slate-900/70 border border-amber-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Assumptions ({assumptions.length})</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-mono">Needs Acknowledgment</span>
          </div>
          {assumptions.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No unacknowledged assumptions.</p>
          ) : (
            <ul className="space-y-2">
              {assumptions.map((item, idx) => (
                <li key={idx} className="flex items-start justify-between gap-2 text-xs text-slate-300 group">
                  <span className="leading-relaxed flex-1">• {item}</span>
                  <button
                    onClick={() => handleRemove('assumption', idx)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 4. Explicit Exclusions (Out of Scope for v1) */}
        <div className="bg-slate-900/70 border border-rose-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
              <XCircle className="w-4 h-4" />
              <span>Explicit Exclusions ({exclusions.length})</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-mono">Out of Scope for v1</span>
          </div>
          {exclusions.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No features explicitly excluded yet.</p>
          ) : (
            <ul className="space-y-2">
              {exclusions.map((item, idx) => (
                <li key={idx} className="flex items-start justify-between gap-2 text-xs text-slate-300 group">
                  <span className="leading-relaxed flex-1">• {item}</span>
                  <button
                    onClick={() => handleRemove('exclusion', idx)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 5. Feasibility Research & Quota Facts */}
      {researchFindings.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 pb-2 border-b border-slate-800">
            <Search className="w-4 h-4" />
            <span>Feasibility Research & Verified Constraints ({researchFindings.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {researchFindings.map((finding, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">{finding.topic}</span>
                  <span className="text-[10px] uppercase font-mono text-slate-500">{finding.type}</span>
                </div>
                <p className="text-xs text-slate-400">{finding.finding}</p>
                {finding.sourceOrLimitation && (
                  <p className="text-[10px] text-slate-500 italic">Source: {finding.sourceOrLimitation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
