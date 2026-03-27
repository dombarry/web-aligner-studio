"use client";

import type { TreatmentPlan, TreatmentStep } from "@/lib/segmentation/types";
import { TOOTH_NAMES } from "@/lib/segmentation/types";

interface PlanViewerProps {
  plan: TreatmentPlan | null;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function PlanViewer({ plan, currentStep, onStepChange }: PlanViewerProps) {
  if (!plan || plan.steps.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No treatment plan yet. Segment teeth to start planning.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Treatment Steps</h4>
        <span className="text-xs text-muted-foreground">
          {plan.steps.length} step{plan.steps.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Step timeline */}
      <div className="space-y-1">
        {plan.steps.map((step) => (
          <button
            key={step.stepNumber}
            onClick={() => onStepChange(step.stepNumber)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              step.stepNumber === currentStep
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step.stepNumber === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.stepNumber < currentStep
                    ? "bg-success text-success-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {step.stepNumber}
              </div>
              <span className="text-xs font-medium flex-1">{step.description}</span>
            </div>
            {step.movements.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1 ml-8">
                {step.movements.length} tooth movement{step.movements.length !== 1 ? "s" : ""}:{" "}
                {step.movements
                  .map((m) => `#${m.toothNumber}`)
                  .join(", ")}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Step scrubber */}
      <div>
        <input
          type="range"
          min={1}
          max={plan.steps.length}
          value={currentStep}
          onChange={(e) => onStepChange(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Step 1</span>
          <span>Step {plan.steps.length}</span>
        </div>
      </div>
    </div>
  );
}
