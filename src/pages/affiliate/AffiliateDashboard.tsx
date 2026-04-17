import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Check, TrendingUp, Users, DollarSign, Clock, ArrowRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import storvoLogo from "@/assets/storvo-logo.png";

interface AffiliateSummary {
  affiliate: any;
  clicks: number;
  signups: number;
  proUsers: number;
  monthlyEarnings: number;
  totalEarnings: number;
  pendingPayout: number;
  commissions: any[];
  payouts: any[];
}

const AffiliateDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AffiliateSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth?redirect=/affiliate/dashboard"); return; }

      // Find affiliate by user_id or email
      let { data: affiliate } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!affiliate) {
        // Try by email
        const { data: byEmail } = await supabase
          .from("affiliates")
          .select("*")
          .eq("email", user.email || "")
          .maybeSingle();
        affiliate = byEmail;

        // If found by email, link user_id
        if (byEmail && !byEmail.user_id) {
          await supabase.from("affiliates").update({ user_id: user.id }).eq("id", byEmail.id);
        }
      }

      if (!affiliate) {
        setLoading(false);
        return;
      }

      // Fetch all stats in parallel
      const [clicksRes, referralsRes, commissionsRes, payoutsRes] = await Promise.all([
        supabase.from("affiliate_clicks").select("id", { count: "exact" }).eq("affiliate_id", affiliate.id),
        supabase.from("affiliate_referrals").select("*").eq("affiliate_id", affiliate.id),
        supabase.from("affiliate_commissions").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
        supabase.from("affiliate_payouts").select("*").eq("affiliate_id", affiliate.id).order("requested_at", { ascending: false }),
      ]);

      const referrals = referralsRes.data || [];
      const commissions = commissionsRes.data || [];
      const payouts = payoutsRes.data || [];

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

      const monthlyEarnings = commissions
        .filter((c: any) => c.period_month === currentMonthStart)
        .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0);

      const totalEarnings = commissions.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0);

      const paidOut = payouts
        .filter((p: any) => p.status === "paid")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      const pendingPayout = totalEarnings - paidOut;

      setData({
        affiliate,
        clicks: clicksRes.count || 0,
        signups: referrals.length,
        proUsers: referrals.filter((r: any) => r.converted_to_pro).length,
        monthlyEarnings,
        totalEarnings,
        pendingPayout,
        commissions,
        payouts,
      });
      setLoading(false);
    };

    load();
  }, [navigate]);

  const copyLink = () => {
    if (!data) return;
    const link = `${window.location.origin}/ref/${data.affiliate.username}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const requestPayout = async () => {
    if (!data) return;
    const MIN_PAYOUT = 50000;
    if (data.pendingPayout < MIN_PAYOUT) {
      toast.error(`Minimum payout is ${formatCurrency(MIN_PAYOUT)}. You currently have ${formatCurrency(data.pendingPayout)} available.`);
      return;
    }
    setRequestingPayout(true);
    try {
      const { error } = await supabase.from("affiliate_payouts").insert({
        affiliate_id: data.affiliate.id,
        amount: data.pendingPayout,
        status: "pending",
      } as any);
      if (error) throw error;
      toast.success("Payout request submitted! We'll process it within 3-5 business days.");
      setData((prev) => prev ? {
        ...prev,
        pendingPayout: 0,
        payouts: [{ id: "new", amount: prev.pendingPayout, status: "pending", requested_at: new Date().toISOString() }, ...prev.payouts],
      } : prev);
    } catch (err: any) {
      toast.error(err.message || "Failed to request payout");
    } finally {
      setRequestingPayout(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  const signOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4">
        <img src={storvoLogo} alt="Storvo" className="h-8" />
        <h1 className="font-display text-xl font-bold text-foreground">No affiliate account found</h1>
        <p className="text-muted-foreground text-sm text-center">
          You don't have a Storvo Creator Rewards account yet.
        </p>
        <Button variant="hero" onClick={() => navigate("/partners")}>
          Join Creator Rewards <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/ref/${data.affiliate.username}`;
  const MIN_PAYOUT = 50000;

  const statusColor = (s: string) => ({
    pending: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
    processing: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400",
    paid: "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400",
  }[s] || "bg-muted text-muted-foreground");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link to="/"><img src={storvoLogo} alt="Storvo" className="h-7" /></Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{data.affiliate.full_name}</span>
            <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your referral performance and earnings</p>
        </div>

        {/* Referral link */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Referral Link</p>
          <div className="flex items-center gap-3">
            <p className="flex-1 font-mono text-sm font-semibold text-foreground bg-accent rounded-lg px-3 py-2 break-all">
              {referralLink}
            </p>
            <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0 gap-2" data-testid="button-copy-referral-link">
              {copied ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Share this link. Sellers who sign up get a free 7-day Pro trial. You earn 30% commission for 12 months.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Clicks", value: data.clicks.toLocaleString(), icon: TrendingUp, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/50" },
            { label: "Signups", value: data.signups.toLocaleString(), icon: Users, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-950/50" },
            { label: "Pro Users", value: data.proUsers.toLocaleString(), icon: TrendingUp, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-950/50" },
            { label: "Monthly Earnings", value: formatCurrency(data.monthlyEarnings), icon: DollarSign, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/50" },
            { label: "Total Earnings", value: formatCurrency(data.totalEarnings), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
            { label: "Pending Payout", value: formatCurrency(data.pendingPayout), icon: Clock, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950/50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-border/60 bg-card p-4 shadow-card" data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`}>
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg} mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Payout section */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-foreground mb-1">Request Payout</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Minimum payout: {formatCurrency(MIN_PAYOUT)}. Payouts are processed within 3-5 business days.
          </p>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(data.pendingPayout)}</p>
              <p className="text-xs text-muted-foreground">Available for payout</p>
            </div>
            <Button
              onClick={requestPayout}
              disabled={requestingPayout || data.pendingPayout < MIN_PAYOUT}
              className="ml-auto"
              data-testid="button-request-payout"
            >
              {requestingPayout ? "Requesting..." : "Request Payout"}
            </Button>
          </div>
          {data.pendingPayout < MIN_PAYOUT && data.pendingPayout > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              You need {formatCurrency(MIN_PAYOUT - data.pendingPayout)} more to reach the minimum payout threshold.
            </p>
          )}

          {/* Payout history */}
          {data.payouts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <p className="text-sm font-semibold text-foreground mb-3">Payout History</p>
              <div className="space-y-2">
                {data.payouts.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between text-sm" data-testid={`payout-${payout.id}`}>
                    <div>
                      <span className="font-medium text-foreground">{formatCurrency(Number(payout.amount))}</span>
                      <span className="ml-2 text-muted-foreground">{formatDate(payout.requested_at)}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Commission history */}
        {data.commissions.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            <div className="p-5 border-b border-border/60">
              <h2 className="font-display text-base font-bold text-foreground">Commission History</h2>
            </div>
            <div className="divide-y divide-border/60">
              {data.commissions.slice(0, 20).map((commission: any) => (
                <div key={commission.id} className="flex items-center justify-between px-5 py-3" data-testid={`commission-${commission.id}`}>
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(Number(commission.commission_amount))}</p>
                    <p className="text-xs text-muted-foreground">
                      {commission.period_month
                        ? new Date(commission.period_month).toLocaleDateString("en-NG", { month: "long", year: "numeric" })
                        : formatDate(commission.created_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(commission.status)}`}>
                    {commission.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.commissions.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-card">
            <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">No commissions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Share your referral link to start earning. You'll see commissions here when referred sellers upgrade to Pro.
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5" /> Copy Referral Link
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AffiliateDashboard;
