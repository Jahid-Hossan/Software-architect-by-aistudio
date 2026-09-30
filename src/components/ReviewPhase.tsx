import React, { useState } from 'react';
import { RequirementsReview } from '../types/architect';
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  FileCheck,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReviewPhaseProps {
  review: RequirementsReview;
  projectName: string;
  onConfirmRequirements: () => void;
  onRevokeConfirmation: () => void;
  onProceedToBlueprint: () => void;
  onReturnToInterview: () => void;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const ReviewPhase: React.FC<ReviewPhaseProps> = ({
  review,
  projectName,
  onConfirmRequirements,
  onRevokeConfirmation,
  onProceedToBlueprint,
  onReturnToInterview,
  isLoading = false,
  error = null,
  onClearError,
}) => {
  const [hasAcknowledgedAssumptions, setHasAcknowledgedAssumptions] = useState(false);

  const handleConfirmClick = () => {
    if (isLoading) return;
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
    onConfirmRequirements();
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <span>Stage 4 of 5: Requirements Review & Formal Confirmation Gate</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Requirements Review: {projectName || 'Software Specification'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict requirements freeze. Implementation blueprint and coding agent prompts require
            explicit user confirmation.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {review.isConfirmed ? (
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmed v{review.version}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Confirmation Required</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Callout if blueprint generation failed */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 flex items-start justify-between gap-3 text-xs text-rose-200 shadow-md">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-rose-100">Blueprint Generation Failed</span>
              <span className="text-rose-300">{error}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleConfirmClick}
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

      {/* Review Document Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-8 shadow-xl">
        {/* 1. Purpose & Target Audience */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
              01. Project Purpose & Target Users
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Section 1</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
            {review.purpose}
          </p>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-400">Target User Personas:</span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(review.targetUsers || []).map((user, idx) => (
                <li key={idx} className="text-xs text-slate-300 bg-slate-950 px-3 py-2 rounded border border-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>{user}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Primary User Journey */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
              02. Primary User Journey
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Section 2</span>
          </div>
          <div className="space-y-2">
            {(review.primaryUserJourney || []).map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-200">
                <span className="font-mono text-indigo-400 font-semibold shrink-0">
                  {idx + 1}.
                </span>
                <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Included Features vs Explicit Exclusions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
          {/* Included */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Included in MVP (v1 Scope)</span>
            </div>
            <ul className="space-y-2">
              {(review.includedFeatures || []).map((feat, idx) => (
                <li key={idx} className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Excluded */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
              <XCircle className="w-4 h-4" />
              <span>Explicitly Excluded (Out of Scope for v1)</span>
            </div>
            <ul className="space-y-2">
              {(review.explicitExclusions || []).map((excl, idx) => (
                <li key={idx} className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-2">
                  <span className="text-rose-400 shrink-0 mt-0.5">✕</span>
                  <span>{excl}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Data, Security, Integrations & Constraints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs">
          {/* Data & Privacy */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block">Data, Access & Privacy Rules</span>
            <ul className="space-y-1 text-slate-400">
              {(review.dataAndAccessRequirements || []).map((req, idx) => (
                <li key={idx}>• {req}</li>
              ))}
            </ul>
          </div>

          {/* Integrations & APIs */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block">External APIs & Integrations</span>
            <ul className="space-y-1 text-slate-400">
              {(review.integrationsAndApis || []).map((api, idx) => (
                <li key={idx}>• {api}</li>
              ))}
            </ul>
          </div>

          {/* Budget & Hosting */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block">Budget & Hosting Constraints</span>
            <ul className="space-y-1 text-slate-400">
              {(review.budgetAndHostingConstraints || []).map((b, idx) => (
                <li key={idx}>• {b}</li>
              ))}
            </ul>
          </div>

          {/* Success Criteria */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block">Concrete Success Criteria</span>
            <ul className="space-y-1 text-slate-400">
              {(review.successCriteria || []).map((c, idx) => (
                <li key={idx}>• {c}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 5. Assumptions & Research Limitations */}
        {((review.technicalAssumptions && review.technicalAssumptions.length > 0) || (review.researchLimitations && review.researchLimitations.length > 0)) && (
          <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/20 space-y-2">
            <span className="text-xs font-semibold text-amber-300 block">
              Assumptions & Research Limitations Acknowledgment
            </span>
            <ul className="space-y-1 text-xs text-amber-200/80">
              {(review.technicalAssumptions || []).map((a, idx) => (
                <li key={idx}>• Assumption: {a}</li>
              ))}
              {(review.researchLimitations || []).map((r, idx) => (
                <li key={idx}>• Limitation: {r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Formal Confirmation Gate Box (Section 7) */}
      <div className={`border rounded-xl p-6 transition-all ${
        review.isConfirmed
          ? 'bg-emerald-950/20 border-emerald-500/40'
          : 'bg-slate-900 border-indigo-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${review.isConfirmed ? 'text-emerald-400' : 'text-indigo-400'}`} />
              <h3 className="font-semibold text-sm text-white">
                {review.isConfirmed
                  ? 'Requirements Formally Confirmed for Implementation'
                  : 'Section 7: Explicit Requirements Confirmation Gate'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {review.isConfirmed
                ? `Specification v${review.version} was confirmed at ${
                    review.confirmedAt
                      ? new Date(review.confirmedAt).toLocaleTimeString()
                      : 'recently'
                  }. Proceed to generate the technical blueprint and coding agent instructions.`
                : 'Per the Architect Quality Rules, blueprints and agent prompts will not be generated until you explicitly confirm this exact requirements specification.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {review.isConfirmed ? (
              <>
                <button
                  onClick={onRevokeConfirmation}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                  title="Revoke confirmation to make changes"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Request Scope Changes</span>
                </button>
                <button
                  onClick={onProceedToBlueprint}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                  <span>Open Implementation Blueprint</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onReturnToInterview}
                  className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                >
                  Adjust via Interview
                </button>
                <button
                  onClick={handleConfirmClick}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-lg hover:shadow-indigo-500/20"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing Blueprint...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Explicitly Confirm Requirements (v1.0)</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
