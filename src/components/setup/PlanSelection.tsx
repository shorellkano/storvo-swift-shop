import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface PlanSelectionProps {
  onSelectFree: () => void;
  onSelectPro: () => void;
}

const PlanSelection = ({ onSelectFree, onSelectPro }: PlanSelectionProps) => {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent"
      >
        <Sparkles className="h-7 w-7 text-accent-foreground" />
      </motion.div>

      <h2 className="font-display text-xl font-bold text-foreground">Choose your plan</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        You can always upgrade later from your dashboard.
      </p>

      <div className="w-full space-y-3">
        {/* Free Plan */}
        <button
          onClick={onSelectFree}
          className="w-full rounded-xl border-2 border-border/60 bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-base font-bold text-foreground">Free Plan</span>
            <span className="font-display text-lg font-bold text-foreground">₦0</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Start selling with up to 10 products.
          </p>
          <ul className="space-y-1.5">
            {["Up to 10 products", "Storvo branding", "1% transaction fee"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </button>

        {/* Pro Plan */}
        <button
          onClick={onSelectPro}
          className="w-full rounded-xl border-2 border-primary/40 bg-accent/30 p-4 text-left transition-all hover:border-primary hover:shadow-card-hover relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 rounded-bl-lg bg-primary px-2.5 py-0.5">
            <span className="text-xs font-semibold text-primary-foreground">Recommended</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-display text-base font-bold text-foreground">Pro Plan</span>
            </div>
            <div className="text-right">
              <span className="font-display text-lg font-bold text-foreground">₦3,500</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Unlimited products and advanced tools.
          </p>
          <ul className="space-y-1.5">
            {[
              "Unlimited products",
              "Custom domain support",
              "Sales analytics",
              "Remove Storvo branding",
              "0% transaction fee",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </button>
      </div>

      <div className="mt-4 w-full flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onSelectFree}>
          Start with Free
        </Button>
        <Button variant="hero" size="lg" className="flex-1" onClick={onSelectPro}>
          <Crown className="mr-1.5 h-4 w-4" /> Upgrade to Pro
        </Button>
      </div>
    </div>
  );
};

export default PlanSelection;
