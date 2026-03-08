import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface BillingSectionProps {
  subscription: {
    plan: "free" | "pro";
    is_active: boolean;
    expires_at: string | null;
    started_at: string;
  } | null;
  onUpgrade: () => void;
}

const PRO_FEATURES = [
  "Unlimited products",
  "Custom domain support",
  "Sales analytics",
  "Remove Storvo branding",
  "Priority support",
];

const BillingSection = ({ subscription, onUpgrade }: BillingSectionProps) => {
  const isPro = subscription?.plan === "pro" && subscription?.is_active;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" /> Billing & Subscription
        </CardTitle>
        <CardDescription>Manage your plan and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current Plan */}
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
              <Crown className="mr-2 h-4 w-4" /> Upgrade to Pro — ₦3,500/mo
            </Button>
          )}
        </div>

        {isPro && (
          <p className="text-xs text-muted-foreground text-center">
            To cancel your subscription, contact support at hello@storvo.co
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingSection;
