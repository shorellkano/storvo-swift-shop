import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { FREE_PRODUCT_LIMIT } from "@/hooks/useSubscription";

interface FreePlanBannerProps {
  productCount: number;
  onUpgrade: () => void;
}

const FreePlanBanner = ({ productCount, onUpgrade }: FreePlanBannerProps) => {
  const percentage = Math.min((productCount / FREE_PRODUCT_LIMIT) * 100, 100);
  const isAtLimit = productCount >= FREE_PRODUCT_LIMIT;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Free Plan
            </span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {productCount}/{FREE_PRODUCT_LIMIT} products
            </span>
          </div>
          <Progress value={percentage} className="h-2 mb-2" />
          {isAtLimit ? (
            <p className="text-sm text-muted-foreground">
              You've reached your limit. Upgrade to add more products.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {FREE_PRODUCT_LIMIT - productCount} product{FREE_PRODUCT_LIMIT - productCount !== 1 ? "s" : ""} remaining on Free plan.
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onUpgrade} className="shrink-0">
          <Crown className="mr-1.5 h-3.5 w-3.5" /> Upgrade
        </Button>
      </div>
    </div>
  );
};

export default FreePlanBanner;
