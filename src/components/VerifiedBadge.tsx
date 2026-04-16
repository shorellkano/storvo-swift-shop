import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

const VerifiedBadge = ({ size = "sm", className = "" }: VerifiedBadgeProps) => {
  const iconSize = size === "md" ? "h-4.5 w-4.5" : "h-3.5 w-3.5";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-blue-600 dark:text-blue-400 select-none ${className}`}
          aria-label="Verified Seller"
          data-testid="badge-verified-seller"
        >
          <BadgeCheck className={`${iconSize} shrink-0`} />
          <span className="text-[11px] font-semibold leading-none">Verified Seller</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">This seller has verified their identity with Storvo.</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default VerifiedBadge;
