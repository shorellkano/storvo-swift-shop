import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  completed: boolean;
  active: boolean;
}

interface SetupProgressProps {
  steps: Step[];
}

const SetupProgress = ({ steps }: SetupProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                step.completed
                  ? "gradient-primary text-primary-foreground shadow-button"
                  : step.active
                  ? "border-2 border-primary bg-accent text-primary"
                  : "border-2 border-border bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                step.completed || step.active
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-6 sm:w-10 rounded-full transition-all duration-300",
                step.completed ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default SetupProgress;
