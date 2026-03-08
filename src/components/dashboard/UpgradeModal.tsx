import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Crown, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
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

const UpgradeModal = ({ open, onOpenChange, storeId, reason = "general" }: UpgradeModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!storeId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("initialize-payment", {
        body: {
          store_id: storeId,
          callback_url: `${window.location.origin}/dashboard?payment=success`,
        },
      });

      if (error) throw error;

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err: any) {
      toast({
        title: "Payment failed",
        description: err.message || "Could not start payment. Try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
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

        <Button variant="hero" size="lg" className="w-full mt-2" onClick={handleUpgrade} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          {loading ? "Redirecting to Paystack…" : "Upgrade to Pro — ₦3,500/mo"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Powered by Paystack. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
