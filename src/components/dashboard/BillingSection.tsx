import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BillingSectionProps {
  subscription: {
    plan: "free" | "pro";
    is_active: boolean;
    expires_at: string | null;
    started_at: string;
  } | null;
  storeId: string | null;
  onUpgrade: () => void;
  onCancelled: () => void;
}

const PRO_FEATURES = [
  "Unlimited products",
  "Custom domain support",
  "Sales analytics",
  "Remove Storvo branding",
  "Priority support",
];

const BillingSection = ({ subscription, storeId, onUpgrade, onCancelled }: BillingSectionProps) => {
  const isPro = subscription?.plan === "pro" && subscription?.is_active;
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    if (!storeId) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: "free" as const,
          is_active: true,
          expires_at: null,
        })
        .eq("store_id", storeId);

      if (error) throw error;

      toast({
        title: "Subscription cancelled",
        description: "You've been moved back to the Free plan.",
      });
      onCancelled();
    } catch (err: any) {
      toast({
        title: "Failed to cancel",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" /> Billing & Subscription
        </CardTitle>
        <CardDescription>Manage your plan and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-foreground">
                {isPro ? "Pro Plan" : "Free Plan"}
              </span>
              <Badge variant={isPro ? "default" : "secondary"}>
                {isPro ? "Active" : "Current"}
              </Badge>
            </div>
            {isPro && (
              <span className="font-display text-lg font-bold text-foreground">
                ₦3,500<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </span>
            )}
          </div>

          {isPro && subscription?.expires_at && (
            <p className="text-sm text-muted-foreground mb-3">
              Next billing date: {format(new Date(subscription.expires_at), "MMMM d, yyyy")}
            </p>
          )}

          {!isPro && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                You're on the Free plan with up to 10 products.
              </p>
            </div>
          )}

          {isPro ? (
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          ) : (
            <Button variant="hero" size="lg" className="w-full" onClick={onUpgrade}>
              <Crown className="mr-2 h-4 w-4" /> Upgrade to Pro - ₦3,500/mo
            </Button>
          )}
        </div>

        {isPro && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-muted-foreground">
                Cancel subscription
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Pro subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll lose access to unlimited products, analytics, custom domain support, and other Pro features. Your store will revert to the Free plan with a 10-product limit.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Pro</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Yes, cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingSection;
