import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Copy, ArrowRight, TrendingUp, Users, DollarSign, Link2 } from "lucide-react";
import storvoLogo from "@/assets/storvo-logo.png";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter / X" },
  { value: "whatsapp", label: "WhatsApp Community" },
  { value: "marketplace", label: "Marketplace Owner" },
];

const Partners = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    socialHandle: "",
    primaryPlatform: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === "username") setUsernameError("");
  };

  const validateUsername = (value: string) => {
    if (!/^[a-z0-9_]{3,20}$/.test(value)) {
      setUsernameError("3-20 characters, lowercase letters, numbers and underscores only");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.toLowerCase().trim();
    if (!validateUsername(username)) return;

    if (!form.primaryPlatform) {
      toast.error("Please select your primary platform");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("affiliates").insert({
        user_id: user?.id || null,
        username,
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        social_handle: form.socialHandle.trim() || null,
        primary_platform: form.primaryPlatform,
        bank_name: form.bankName.trim() || null,
        account_number: form.accountNumber.trim() || null,
        account_name: form.accountName.trim() || null,
        status: "active",
        commission_rate: 30,
      } as any);

      if (error) {
        if (error.message.includes("username")) throw new Error("That username is already taken. Choose another.");
        if (error.message.includes("email")) throw new Error("An affiliate account with that email already exists.");
        throw error;
      }

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `${window.location.origin}/ref/${form.username.toLowerCase().trim()}`;

  if (submitted) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-card text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">You're in!</h2>
          <p className="mt-2 text-muted-foreground">
            Welcome to Storvo Creator Rewards. Here's your referral link:
          </p>

          <div className="mt-6 rounded-xl bg-accent p-4">
            <p className="text-xs text-muted-foreground mb-1">Your referral link</p>
            <p className="font-mono text-sm font-semibold text-foreground break-all">{referralLink}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full gap-2"
              onClick={() => { navigator.clipboard.writeText(referralLink); toast.success("Link copied!"); }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy Link
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-foreground">What happens next?</p>
            <p className="text-sm text-muted-foreground">1. Share your link with your audience</p>
            <p className="text-sm text-muted-foreground">2. Sellers who sign up get a free 7-day Pro trial</p>
            <p className="text-sm text-muted-foreground">3. You earn <strong>30% (₦1,050)</strong> monthly for every Pro seller - for up to 12 months</p>
          </div>

          <Button
            className="mt-6 w-full gap-2"
            variant="hero"
            onClick={() => navigate("/affiliate/dashboard")}
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/"><img src={storvoLogo} alt="Storvo" className="h-7" /></Link>
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
        </div>
      </header>

      {/* Hero */}
      <div className="gradient-hero py-16 px-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-5">
          Creator Rewards Program
        </span>
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Earn recurring income<br />promoting Storvo
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Refer sellers to Storvo and earn <strong>30% (₦1,050)</strong> every month for each seller who upgrades to Pro - for up to 12 months.
        </p>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { icon: DollarSign, label: "Commission", value: "30%" },
            { icon: TrendingUp, label: "Duration", value: "12 months" },
            { icon: Users, label: "Per seller", value: "₦1,050/mo" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border/60 bg-card p-4 shadow-card">
              <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card border-y border-border/60 py-12 px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-center text-foreground mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", icon: Link2, title: "Get your link", desc: "Sign up and receive your unique referral link - storvo.co/ref/yourname" },
              { step: "2", icon: Users, title: "Share with your audience", desc: "Share your link on social media, WhatsApp, or anywhere. Referred sellers get a free 7-day Pro trial." },
              { step: "3", icon: DollarSign, title: "Earn every month", desc: "Get 30% of every Pro subscription from your referred sellers - up to 12 months each." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">{step}</div>
                <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signup Form */}
      <div className="py-16 px-4">
        <div className="mx-auto max-w-lg">
          <h2 className="font-display text-2xl font-bold text-center text-foreground mb-2">Join the program</h2>
          <p className="text-center text-muted-foreground mb-8">Fill in your details to get started</p>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={form.fullName} onChange={set("fullName")} placeholder="Ada Obi" required data-testid="input-affiliate-name" />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="ada@example.com" required data-testid="input-affiliate-email" />
            </div>
            <div>
              <Label htmlFor="username">
                Referral Username
                <span className="ml-2 text-xs text-muted-foreground">(your link will be storvo.co/ref/username)</span>
              </Label>
              <Input
                id="username"
                value={form.username}
                onChange={set("username")}
                onBlur={() => form.username && validateUsername(form.username.toLowerCase())}
                placeholder="ada"
                required
                data-testid="input-affiliate-username"
                className={usernameError ? "border-red-500" : ""}
              />
              {usernameError && <p className="mt-1 text-xs text-red-500">{usernameError}</p>}
              {form.username && !usernameError && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Your link: <strong className="text-foreground">{window.location.origin}/ref/{form.username.toLowerCase()}</strong>
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="socialHandle">Social Media Handle</Label>
              <Input id="socialHandle" value={form.socialHandle} onChange={set("socialHandle")} placeholder="@yourhandle" data-testid="input-affiliate-social" />
            </div>
            <div>
              <Label htmlFor="platform">Primary Platform</Label>
              <select
                id="platform"
                value={form.primaryPlatform}
                onChange={set("primaryPlatform")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                data-testid="select-affiliate-platform"
              >
                <option value="">Select platform...</option>
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div className="pt-2 border-t border-border/60">
              <p className="text-sm font-semibold text-foreground mb-3">Bank Account for Payouts</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input id="bankName" value={form.bankName} onChange={set("bankName")} placeholder="e.g. Zenith Bank" data-testid="input-affiliate-bank-name" />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input id="accountNumber" value={form.accountNumber} onChange={set("accountNumber")} placeholder="0123456789" type="tel" data-testid="input-affiliate-account-number" />
                </div>
                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input id="accountName" value={form.accountName} onChange={set("accountName")} placeholder="Ada Obi" data-testid="input-affiliate-account-name" />
                </div>
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading} data-testid="button-affiliate-submit">
              {loading ? "Creating your account..." : "Join Creator Rewards"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/affiliate/dashboard" className="text-primary font-medium hover:underline">View dashboard</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Partners;
