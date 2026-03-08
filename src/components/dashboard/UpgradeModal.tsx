import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Crown, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "limit" | "general";
}

const PRO_FEATURES = [
  "Unlimited products",
  "Custom domain support",
  "Sales analytics",
  "Remove Storvo branding",
  "Priority support",
  "0% platform transaction fee",
];

const UpgradeModal = ({ open, onOpenChange, reason = "general" }: UpgradeModalProps) => {
  const handleUpgrade = () => {
    // TODO: Integrate Paystack payment
    // For now, show as coming soon
    window.open("https://paystack.com", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <Crown className="h-7 w-7 text-accent-foreground" />
          </div>
          <DialogTitle className="font-display text-xl">
            {reason === "limit"
              ? "You've reached the free plan limit"
              : "Upgrade to Pro"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {reason === "limit"
              ? "You've used all 10 free products. Upgrade to Pro to add unlimited products and unlock advanced features."
              : "Unlock the full power of Storvo with Pro."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl border border-border/60 bg-muted/30 p-5">
          <div className="flex items-baseline justify-between mb-4">
            <span className="font-display text-lg font-bold text-foreground">Pro Plan</span>
            <div className="text-right">
              <span className="font-display text-2xl font-bold text-foreground">₦3,500</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
          </div>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <Button variant="hero" size="lg" className="w-full mt-2" onClick={handleUpgrade}>
          <Zap className="mr-2 h-4 w-4" /> Upgrade to Pro — ₦3,500/mo
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Powered by Paystack. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
