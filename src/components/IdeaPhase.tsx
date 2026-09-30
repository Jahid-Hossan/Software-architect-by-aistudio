import React, { useState } from 'react';
import { ArrowRight, Lightbulb, Sparkles, CheckCircle2, ShieldCheck, Compass } from 'lucide-react';
import { SAMPLE_PROJECTS } from '../services/templates';

interface IdeaPhaseProps {
  initialIdea: string;
  projectName: string;
  onUpdateIdea: (name: string, idea: string) => void;
  onStartInterview: () => void;
  onSelectSample: (sample: typeof SAMPLE_PROJECTS[0]) => void;
}

export const IdeaPhase: React.FC<IdeaPhaseProps> = ({
  initialIdea,
  projectName,
  onUpdateIdea,
  onStartInterview,
  onSelectSample,
}) => {
  const [name, setName] = useState(projectName || '');
  const [idea, setIdea] = useState(initialIdea || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    onUpdateIdea(name.trim() || 'Software Project', idea.trim());
    onStartInterview();
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-10">
      {/* Intro hero banner */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
          <Compass className="w-4 h-4" />
          <span>Stage 1 of 5: Problem Definition & Scope Discovery</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          What software do you want to build?
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
          Share your idea in your own words. We will conduct a dynamic technical interview,
          research feasibility and trade-offs, maintain accurate project memory, and deliver a
          complete, copy-ready prompt for your coding agent.
        </p>
      </div>

      {/* Primary Input Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
        <div className="space-y-2">
          <label htmlFor="projectName" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Project Name (Optional)
          </label>
          <input
            id="projectName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Local-First Note Engine, Fleet Dispatcher, B2B Compliance Portal"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="ideaInput" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              The Software Idea & Problem Statement
            </label>
            <span className="text-xs text-slate-500">Incomplete ideas are welcome</span>
          </div>
          <textarea
            id="ideaInput"
            rows={5}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe what you want to achieve: Who is it for? What core problem does it solve? Any preferred platform (web, desktop, mobile), data privacy needs, or constraints?..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Researches free tiers, quotas & technical limits before confirmation</span>
          </div>
          <button
            type="submit"
            disabled={!idea.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-indigo-500/20"
          >
            <span>Begin Dynamic Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Quick-Start Archetypes */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Or Explore a Pre-Researched Software Archetype</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_PROJECTS.map((sample, idx) => (
            <div
              key={idx}
              onClick={() => onSelectSample(sample)}
              className="bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {sample.name}
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Archetype</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {sample.initialIdea}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <span>{sample.memory.userDecisions.length} Decisions</span>
                <span>·</span>
                <span>{sample.memory.exclusions.length} Exclusions</span>
                <span>·</span>
                <span>Feasibility verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
