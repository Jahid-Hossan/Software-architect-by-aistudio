import React from 'react';
import { Phase } from '../types/architect';
import { Lightbulb, MessageSquare, Database, CheckCircle2, Code2, ArrowRight } from 'lucide-react';

interface PhaseStepperProps {
  currentPhase: Phase;
  onSelectPhase: (phase: Phase) => void;
  isConfirmed: boolean;
}

export const PhaseStepper: React.FC<PhaseStepperProps> = ({
  currentPhase,
  onSelectPhase,
  isConfirmed,
}) => {
  const steps: { id: Phase; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'idea', label: '1. Problem & Idea', icon: Lightbulb },
    { id: 'interview', label: '2. Dynamic Interview', icon: MessageSquare },
    { id: 'memory', label: '3. Project Memory', icon: Database },
    { id: 'review', label: '4. Review & Confirm', icon: CheckCircle2 },
    { id: 'blueprint', label: '5. Blueprint & Spec', icon: Code2 },
    { id: 'coding_prompt', label: '6. Coding Agent Prompt', icon: Code2 },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-950/60 px-4 py-2.5 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[700px]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentPhase === step.id;
            const isBlockedBlueprint =
              (step.id === 'blueprint' || step.id === 'coding_prompt') && !isConfirmed;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <span className="text-slate-700 text-xs px-1">/</span>}
                <button
                  onClick={() => onSelectPhase(step.id)}
                  disabled={isBlockedBlueprint}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isBlockedBlueprint
                      ? 'text-slate-600 cursor-not-allowed opacity-60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={
                    isBlockedBlueprint
                      ? 'Requirements must be explicitly confirmed in Step 4 before viewing Blueprint'
                      : step.label
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{step.label}</span>
                  {step.id === 'review' && isConfirmed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Status indicator on the right */}
        <div className="text-xs flex items-center gap-2">
          {isConfirmed ? (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Requirements Confirmed (v1.0)
            </span>
          ) : (
            <span className="text-amber-400/90 flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse" />
              Interview / Review in progress
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};
