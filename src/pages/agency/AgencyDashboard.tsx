import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Link2,
  Copy,
  Check,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import storvoLogo from "@/assets/storvo-logo.png";

type Agency = {
  id: string;
  agency_name: string;
  contact_name: string;
  email: string;
  slug: string;
  commission_rate: number;
  total_earnings: number;
  is_active: boolean;
  created_at: string;
};

type ClientStore = {
  id: string;
  store_name: string;
  store_slug: string;
  owner_email: string;
  plan: string;
  referred_at: string;
};

type Commission = {
  id: string;
  store_name: string;
  amount: number;
  subscription_period: string;
  status: string;
  created_at: string;
};

type ApplicationStatus = "pending" | "rejected" | null;

const TABS = ["overview", "clients", "earnings", "referral"] as const;
type Tab = typeof TABS[number];

const formatNGN = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);

const AgencyDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>(null);
  const [clients, setClients] = useState<ClientStore[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?redirect=/agency/dashboard");
      return;
    }
    loadAgencyData();
  }, [user, authLoading]);

  const loadAgencyData = async () => {
    setLoading(true);
    try {
      // Check if user has an approved agency account
      const { data: agencyData } = await supabase
        .from("agencies")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (agencyData) {
        setAgency(agencyData as Agency);
        await Promise.all([loadClients(agencyData.id), loadCommissions(agencyData.id)]);
      } else {
        // Check for pending/rejected application
        const { data: appData } = await supabase
          .from("agency_applications")
          .select("status")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (appData) {
          setApplicationStatus(appData.status as ApplicationStatus);
        }
      }
    } catch (err: any) {
      toast.error("Failed to load agency data.");
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async (agencyId: string) => {
    const { data } = await supabase
      .from("agency_referrals")
      .select(`
        id,
        created_at,
        stores (
          id,
          name,
          slug,
          user_id,
          subscriptions ( plan, is_active )
        )
      `)
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    if (data) {
      const mapped: ClientStore[] = (data as any[]).map((r) => ({
        id: r.stores?.id,
        store_name: r.stores?.name || "Unnamed Store",
        store_slug: r.stores?.slug,
        owner_email: r.stores?.user_id || "",
        plan: r.stores?.subscriptions?.[0]?.plan || "free",
        referred_at: r.created_at,
      }));
      setClients(mapped);
    }
  };

  const loadCommissions = async (agencyId: string) => {
    const { data } = await supabase
      .from("agency_commissions")
      .select(`
        id,
        amount,
        subscription_period,
        status,
        created_at,
        stores ( name )
      `)
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    if (data) {
      const mapped: Commission[] = (data as any[]).map((c) => ({
        id: c.id,
        store_name: c.stores?.name || "Unknown Store",
        amount: c.amount,
        subscription_period: c.subscription_period,
        status: c.status,
        created_at: c.created_at,
      }));
      setCommissions(mapped);
    }
  };

  const referralLink = agency
    ? `${window.location.origin}/auth?mode=signup&partner=${agency.slug}`
    : "";

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not an approved agency
  if (!agency) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <img src={storvoLogo} alt="Storvo" className="mb-8 h-7" />
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          {applicationStatus === "pending" ? (
            <>
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-7 w-7 text-amber-600" />
                </div>
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Application Under Review</h2>
              <p className="mb-6 text-muted-foreground text-sm">
                Your application to become a Storvo Agency Partner is being reviewed. We will notify you at your
                registered email once a decision is made (usually 2 to 3 business days).
              </p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </>
          ) : applicationStatus === "rejected" ? (
            <>
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="h-7 w-7 text-red-600" />
                </div>
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Application Not Approved</h2>
              <p className="mb-6 text-muted-foreground text-sm">
                Unfortunately your application was not approved at this time. You may reapply with updated information.
              </p>
              <Button onClick={() => navigate("/agency/apply")}>Apply Again</Button>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Not an Agency Partner</h2>
              <p className="mb-6 text-muted-foreground text-sm">
                You don't have an approved Agency Partner account yet. Apply to start earning commissions.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate("/agency/apply")}>Apply Now</Button>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Go to Store Dashboard
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const pendingEarnings = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amount, 0);

  const paidEarnings = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  const proClients = clients.filter((c) => c.plan === "pro").length;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center px-5 border-b border-border">
          <img src={storvoLogo} alt="Storvo" className="h-6" />
        </div>

        <div className="flex flex-1 flex-col gap-1 px-3 py-4">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Agency Partner
          </div>
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "clients", label: "My Clients", icon: Users },
            { id: "earnings", label: "Earnings", icon: TrendingUp },
            { id: "referral", label: "Referral Links", icon: Link2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              data-testid={`nav-${id}`}
              onClick={() => setTab(id as Tab)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="border-t border-border px-3 py-4 space-y-1">
          <Link
            to="/dashboard"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Store Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div>
            <h1 className="text-base font-semibold text-foreground">{agency.agency_name}</h1>
            <p className="text-xs text-muted-foreground">Agency Partner Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="mr-1 h-3 w-3" />
              Approved Partner
            </Badge>
            {/* Mobile nav */}
            <div className="flex gap-1 lg:hidden">
              {[
                { id: "overview", icon: LayoutDashboard },
                { id: "clients", icon: Users },
                { id: "earnings", icon: TrendingUp },
                { id: "referral", icon: Link2 },
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id as Tab)}
                  className={`rounded-lg p-2 transition-colors ${
                    tab === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <div>
              <h2 className="mb-6 text-xl font-bold text-foreground">Overview</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Clients</p>
                  <p className="mt-1 text-3xl font-bold text-foreground" data-testid="stat-total-clients">
                    {clients.length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{proClients} on Pro plan</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Earned</p>
                  <p className="mt-1 text-3xl font-bold text-foreground" data-testid="stat-total-earned">
                    {formatNGN(agency.total_earnings)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Lifetime commissions</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending Payout</p>
                  <p className="mt-1 text-3xl font-bold text-amber-600" data-testid="stat-pending-payout">
                    {formatNGN(pendingEarnings)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Awaiting bank transfer</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Commission Rate</p>
                  <p className="mt-1 text-3xl font-bold text-primary" data-testid="stat-commission-rate">
                    {agency.commission_rate}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Per Pro subscription</p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-1 font-semibold text-foreground">Your Referral Link</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Share this link with businesses to automatically link their store to your agency.
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                      {referralLink}
                    </code>
                    <Button size="sm" variant="outline" onClick={handleCopyLink} data-testid="button-copy-link-overview">
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-1 font-semibold text-foreground">How Commissions Work</h3>
                  <p className="text-sm text-muted-foreground">
                    Every time a client store you referred upgrades to the Pro plan ({formatNGN(5000)}/month),
                    you automatically earn {agency.commission_rate}% - that's{" "}
                    {formatNGN(5000 * (agency.commission_rate / 100))} per client per month. Payouts are made
                    via bank transfer after verification.
                  </p>
                </div>
              </div>

              {/* Recent clients */}
              {clients.length > 0 && (
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Recent Client Stores</h3>
                    <Button variant="ghost" size="sm" onClick={() => setTab("clients")}>
                      View all
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Store</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {clients.slice(0, 5).map((client) => (
                          <tr key={client.id}>
                            <td className="px-4 py-3 font-medium text-foreground">{client.store_name}</td>
                            <td className="px-4 py-3">
                              <Badge variant={client.plan === "pro" ? "default" : "secondary"}>
                                {client.plan === "pro" ? "Pro" : "Free"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(client.referred_at).toLocaleDateString("en-NG")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CLIENTS TAB */}
          {tab === "clients" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">My Client Stores</h2>
                  <p className="text-sm text-muted-foreground">{clients.length} stores referred by your agency</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  data-testid="button-copy-link-clients"
                >
                  {copied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                  Copy Referral Link
                </Button>
              </div>

              {clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                  <Users className="mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="mb-1 font-semibold text-foreground">No clients yet</h3>
                  <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                    Share your referral link with businesses. When they sign up and create a store using your link,
                    they'll appear here automatically.
                  </p>
                  <Button onClick={() => setTab("referral")}>Get Referral Link</Button>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Store Name</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subscription</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date Referred</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {clients.map((client) => (
                        <tr key={client.id} data-testid={`row-client-${client.id}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{client.store_name}</div>
                            <div className="text-xs text-muted-foreground">storvo.co/store/{client.store_slug}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={client.plan === "pro" ? "default" : "secondary"}>
                              {client.plan === "pro" ? "Pro" : "Free"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(client.referred_at).toLocaleDateString("en-NG")}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`/store/${client.store_slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              View store <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* EARNINGS TAB */}
          {tab === "earnings" && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Commission Earnings</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Commissions are automatically tracked when your referred clients upgrade to Pro.
                Payouts are made via bank transfer after verification.
              </p>

              {/* Earnings summary */}
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Earned</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{formatNGN(agency.total_earnings)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending Payout</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">{formatNGN(pendingEarnings)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paid Out</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{formatNGN(paidEarnings)}</p>
                </div>
              </div>

              {commissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                  <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="mb-1 font-semibold text-foreground">No commissions yet</h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Commissions are generated when your referred client stores upgrade to the Pro plan.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Store</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {commissions.map((commission) => (
                        <tr key={commission.id} data-testid={`row-commission-${commission.id}`}>
                          <td className="px-4 py-3 font-medium text-foreground">{commission.store_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {commission.subscription_period || "-"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {formatNGN(commission.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                commission.status === "paid"
                                  ? "default"
                                  : commission.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={
                                commission.status === "paid"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : commission.status === "pending"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : ""
                              }
                            >
                              {commission.status === "paid" ? "Paid" : commission.status === "cancelled" ? "Cancelled" : "Pending"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">
                  To request a payout, contact us at{" "}
                  <a href="mailto:help@storvo.co" className="text-primary hover:underline">
                    help@storvo.co
                  </a>{" "}
                  or call +2347071042782. Minimum payout amount: 5,000 NGN.
                </p>
              </div>
            </div>
          )}

          {/* REFERRAL TAB */}
          {tab === "referral" && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Referral Links</h2>
              <p className="mb-8 text-sm text-muted-foreground">
                When a business signs up using your referral link and creates a store, they are automatically
                linked to your agency and any Pro plan purchases generate commissions for you.
              </p>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Referral link card */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Link2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Your Referral Link</h3>
                      <p className="text-xs text-muted-foreground">Partner code: {agency.slug}</p>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-border bg-muted p-3">
                    <code className="break-all text-xs text-muted-foreground" data-testid="text-referral-link">
                      {referralLink}
                    </code>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCopyLink}
                    data-testid="button-copy-referral-link"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>

                {/* Instructions */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-4 font-semibold text-foreground">How to use your referral link</h3>
                  <ol className="space-y-4">
                    {[
                      {
                        step: "1",
                        title: "Share the link",
                        desc: "Send your referral link to businesses via WhatsApp, email, or social media.",
                      },
                      {
                        step: "2",
                        title: "Client signs up",
                        desc: "When they click your link, their account is automatically tagged with your agency.",
                      },
                      {
                        step: "3",
                        title: "Client creates their store",
                        desc: "After signing up, they go through the standard store setup. Their store is linked to you.",
                      },
                      {
                        step: "4",
                        title: "Earn commission",
                        desc: `When they upgrade to Pro, you earn ${agency.commission_rate}% (${formatNGN(5000 * (agency.commission_rate / 100))} per month) automatically.`,
                      },
                    ].map(({ step, title, desc }) => (
                      <li key={step} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {step}
                        </span>
                        <div>
                          <p className="font-medium text-foreground text-sm">{title}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* WhatsApp share hint */}
              <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground mb-1">Sample message to share</p>
                <p className="text-sm text-muted-foreground italic">
                  "Start selling online today with Storvo - the easiest way to create your own store. Sign up here:
                  {" "}{referralLink}"
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AgencyDashboard;
