import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Users, TrendingUp, Link2 } from "lucide-react";
import storvoLogo from "@/assets/storvo-logo.png";

const AFRICAN_COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Ethiopia", "Tanzania",
  "Uganda", "Senegal", "Ivory Coast", "Cameroon", "Rwanda", "Zambia", "Zimbabwe",
  "Other",
];

const AgencyApply = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [agencyName, setAgencyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [clientsCount, setClientsCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName || !contactName || !email || !country) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("agency_applications").insert({
        user_id: user?.id || null,
        agency_name: agencyName,
        contact_name: contactName,
        email,
        website: website || null,
        country,
        clients_count: parseInt(clientsCount) || 0,
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Application Submitted</h1>
          <p className="mb-6 text-muted-foreground">
            Thank you, {contactName}. We have received your application for the Storvo Agency Partner Program.
            Our team will review it and reach out to you at <strong>{email}</strong> within 2 to 3 business days.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate("/")} variant="outline">
              Back to Home
            </Button>
            {user && (
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/">
            <img src={storvoLogo} alt="Storvo" className="h-7" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left: Benefits */}
          <div>
            <div className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Agency Partner Program
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground leading-tight">
              Grow your business by growing your clients
            </h1>
            <p className="mb-8 text-muted-foreground">
              Join the Storvo Agency Partner Program and earn recurring commissions for every business you onboard.
              Perfect for marketing agencies, freelancers, and digital consultants across Africa.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">20% recurring commission</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn 20% of every Pro subscription your referred clients pay - every month, automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Your own referral link</h3>
                  <p className="text-sm text-muted-foreground">
                    Get a unique link to share with clients. Any store they create is automatically linked to you.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Full client management</h3>
                  <p className="text-sm text-muted-foreground">
                    View all your client stores, their subscription status, and your commission history in one dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Example:</span> You onboard 10 clients on the Pro plan
                (5,000 NGN/month). Your monthly commission: <span className="font-bold text-primary">50,000 NGN</span> - paid automatically.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-1 text-xl font-bold text-foreground">Apply to become a partner</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Applications are reviewed within 2 to 3 business days.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="agency-name">Agency or Business Name *</Label>
                  <Input
                    id="agency-name"
                    data-testid="input-agency-name"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Bright Digital Agency"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contact-name">Your Full Name *</Label>
                  <Input
                    id="contact-name"
                    data-testid="input-contact-name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Adaeze Okonkwo"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="adaeze@brightdigital.co"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website or Social Media</Label>
                  <Input
                    id="website"
                    data-testid="input-website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://brightdigital.co or @brightdigital"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country" data-testid="select-country" className="mt-1">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="clients-count">Number of Clients You Currently Manage</Label>
                  <Select value={clientsCount} onValueChange={setClientsCount}>
                    <SelectTrigger id="clients-count" data-testid="select-clients-count" className="mt-1">
                      <SelectValue placeholder="Select a range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 to 5</SelectItem>
                      <SelectItem value="6">6 to 20</SelectItem>
                      <SelectItem value="21">21 to 50</SelectItem>
                      <SelectItem value="51">51 to 100</SelectItem>
                      <SelectItem value="101">100+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  data-testid="button-submit-application"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already a partner?{" "}
                  <Link to="/agency/dashboard" className="text-primary hover:underline">
                    Go to Agency Dashboard
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyApply;
