import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Rocket,
  MapPin,
  Package,
  MessageCircle,
  CheckCircle,
  ChevronRight,
  Info,
  Zap,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

type CampaignType = "local_visibility" | "product_launch" | "whatsapp_lead";

type CampaignRequest = {
  id: string;
  campaign_type: CampaignType;
  store_name: string;
  product_name: string | null;
  target_location: string | null;
  radius_km: number | null;
  campaign_goal: string | null;
  status: string;
  created_at: string;
};

const CAMPAIGN_CONFIGS: Record<
  CampaignType,
  { label: string; icon: typeof MapPin; color: string; description: string; badge: string }
> = {
  local_visibility: {
    label: "Local Visibility Campaign",
    icon: MapPin,
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    description: "Target customers within a specific radius of your location and get your store in front of the right audience nearby.",
    badge: "Most Popular",
  },
  product_launch: {
    label: "Product Launch Campaign",
    icon: Package,
    color: "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800",
    description: "Promote a new product to reach more customers and generate early traction for your latest offering.",
    badge: "New Arrivals",
  },
  whatsapp_lead: {
    label: "WhatsApp Lead Campaign",
    icon: MessageCircle,
    color: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
    description: "Drive potential buyers directly into a WhatsApp conversation with you - the fastest way to close sales.",
    badge: "High Conversion",
  },
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  in_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

const GrowthToolsPage = () => {
  const { store, role, loading: storeLoading } = useStore();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CampaignType | null>(null);
  const [step, setStep] = useState<"select" | "form" | "success">("select");

  // Form fields
  const [storeName, setStoreName] = useState("");
  const [productName, setProductName] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Past campaigns
  const [campaigns, setCampaigns] = useState<CampaignRequest[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  useEffect(() => {
    if (store) {
      setStoreName(store.name);
      loadCampaigns();
    }
  }, [store]);

  const loadCampaigns = async () => {
    if (!store) return;
    setLoadingCampaigns(true);
    const { data } = await supabase
      .from("campaign_requests")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (data) setCampaigns(data as CampaignRequest[]);
    setLoadingCampaigns(false);
  };

  const openCampaignDialog = (type?: CampaignType) => {
    setSelectedType(type || null);
    setStep(type ? "form" : "select");
    setProductName("");
    setTargetLocation("");
    setRadiusKm("");
    setCampaignGoal("");
    setDialogOpen(true);
  };

  const handleSelectType = (type: CampaignType) => {
    setSelectedType(type);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !user || !selectedType) return;
    if (!storeName.trim()) {
      toast.error("Please enter your store name.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaign_requests").insert({
        store_id: store.id,
        user_id: user.id,
        campaign_type: selectedType,
        store_name: storeName.trim(),
        product_name: productName.trim() || null,
        target_location: targetLocation.trim() || null,
        radius_km: radiusKm ? parseInt(radiusKm) : null,
        campaign_goal: campaignGoal.trim() || null,
        status: "submitted",
      });

      if (error) throw error;

      setStep("success");
      loadCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit campaign request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setStep("select");
    setSelectedType(null);
  };

  if (storeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar store={store} role={role} />
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-base font-semibold text-foreground">Growth Tools</h1>
              <p className="text-xs text-muted-foreground">Powered by Upbeatz Marcom</p>
            </div>
          </div>

          <div className="mx-auto max-w-4xl p-6 space-y-8">
            {/* Hero section */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-background p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Rocket className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Visibility Campaigns
                    </span>
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">
                    Promote your store and products to customers near you
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Partner marketing campaigns run by Upbeatz Marcom - a specialist agency helping
                    social sellers reach more buyers across Nigeria.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="shrink-0"
                  onClick={() => openCampaignDialog()}
                  data-testid="button-boost-my-store"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Boost My Store
                </Button>
              </div>
            </div>

            {/* Campaign type cards */}
            <div>
              <h3 className="mb-4 text-base font-semibold text-foreground">Campaign Types</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {(Object.entries(CAMPAIGN_CONFIGS) as [CampaignType, typeof CAMPAIGN_CONFIGS[CampaignType]][]).map(
                  ([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <div
                        key={type}
                        className={`relative rounded-xl border p-5 transition-shadow hover:shadow-md ${config.color}`}
                        data-testid={`card-campaign-${type}`}
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/80">
                            <Icon className="h-4 w-4 text-foreground" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {config.badge}
                          </Badge>
                        </div>
                        <h4 className="mb-2 font-semibold text-foreground text-sm">{config.label}</h4>
                        <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                          {config.description}
                        </p>

                        {/* Local visibility radius options */}
                        {type === "local_visibility" && (
                          <div className="mb-4 flex flex-wrap gap-1.5">
                            {["5km", "10km", "20km", "50km"].map((r) => (
                              <span
                                key={r}
                                className="rounded-full border border-border bg-background/70 px-2 py-0.5 text-xs font-medium text-foreground"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-background/70"
                          onClick={() => openCampaignDialog(type)}
                          data-testid={`button-select-campaign-${type}`}
                        >
                          Get Started
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Past campaigns */}
            {!loadingCampaigns && campaigns.length > 0 && (
              <div>
                <h3 className="mb-4 text-base font-semibold text-foreground">Your Campaign Requests</h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {campaigns.map((c) => (
                        <tr key={c.id} data-testid={`row-campaign-${c.id}`}>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {CAMPAIGN_CONFIGS[c.campaign_type]?.label || c.campaign_type}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {c.product_name && <div>Product: {c.product_name}</div>}
                            {c.target_location && <div>Location: {c.target_location}</div>}
                            {c.radius_km && <div>Radius: {c.radius_km}km</div>}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="secondary"
                              className={STATUS_COLORS[c.status] || ""}
                            >
                              {STATUS_LABELS[c.status] || c.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString("en-NG")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Disclaimer:</span> Storvo provides tools and marketing
                partnerships to help sellers promote their business. Sales results depend on product quality, pricing,
                and market demand. Storvo does not guarantee sales outcomes from any campaign.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Campaign Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          {step === "select" && (
            <>
              <DialogHeader>
                <DialogTitle>Choose a Campaign Type</DialogTitle>
                <DialogDescription>
                  Select the type of campaign you want to run for your store.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-3">
                {(Object.entries(CAMPAIGN_CONFIGS) as [CampaignType, typeof CAMPAIGN_CONFIGS[CampaignType]][]).map(
                  ([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => handleSelectType(type)}
                        data-testid={`dialog-select-${type}`}
                        className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">{config.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {config.description}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  }
                )}
              </div>
            </>
          )}

          {step === "form" && selectedType && (
            <>
              <DialogHeader>
                <DialogTitle>{CAMPAIGN_CONFIGS[selectedType].label}</DialogTitle>
                <DialogDescription>
                  Fill in the details below and the Upbeatz Marcom team will contact you to get started.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                <div>
                  <Label htmlFor="store-name">Store Name *</Label>
                  <Input
                    id="store-name"
                    data-testid="input-campaign-store-name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="product-name">
                    Product to Promote
                    {selectedType === "product_launch" && " *"}
                  </Label>
                  <Input
                    id="product-name"
                    data-testid="input-campaign-product-name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Ankara Tote Bag, Men's Agbada Set"
                    className="mt-1"
                    required={selectedType === "product_launch"}
                  />
                </div>

                <div>
                  <Label htmlFor="target-location">Target Location *</Label>
                  <Input
                    id="target-location"
                    data-testid="input-campaign-location"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="e.g. Lekki, Lagos or Wuse, Abuja"
                    className="mt-1"
                    required
                  />
                </div>

                {selectedType === "local_visibility" && (
                  <div>
                    <Label htmlFor="radius">Campaign Radius *</Label>
                    <Select value={radiusKm} onValueChange={setRadiusKm}>
                      <SelectTrigger id="radius" data-testid="select-campaign-radius" className="mt-1">
                        <SelectValue placeholder="Select radius" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5km - Hyperlocal</SelectItem>
                        <SelectItem value="10">10km - Neighbourhood</SelectItem>
                        <SelectItem value="20">20km - City zone</SelectItem>
                        <SelectItem value="50">50km - Wide area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="campaign-goal">Campaign Goal</Label>
                  <Textarea
                    id="campaign-goal"
                    data-testid="input-campaign-goal"
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(e.target.value)}
                    placeholder="Tell us what you want to achieve - more orders, brand awareness, WhatsApp messages..."
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("select")}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                    data-testid="button-submit-campaign"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">Request Submitted!</h3>
              <p className="mb-2 text-sm text-muted-foreground">
                The Upbeatz Marcom team will review your campaign request and reach out to you within
                <strong> 1 to 2 business days</strong> to discuss next steps.
              </p>
              <p className="mb-6 text-xs text-muted-foreground">
                You can track the status of your request in the campaign history below.
              </p>
              <Button onClick={handleClose} data-testid="button-campaign-done">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default GrowthToolsPage;
