import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Globe, Copy, Check, Loader2, Trash2, RefreshCw, AlertCircle } from "lucide-react";

interface CustomDomainCardProps {
  storeId: string;
  storeSlug: string;
  isPro: boolean;
  onUpgrade: () => void;
}

interface CustomDomain {
  id: string;
  domain: string;
  status: string;
  verified_at: string | null;
  created_at: string;
}

const CustomDomainCard = ({ storeId, storeSlug, isPro, onUpgrade }: CustomDomainCardProps) => {
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains();
  }, [storeId]);

  const fetchDomains = async () => {
    const { data } = await supabase
      .from("custom_domains")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    setDomains((data as CustomDomain[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!cleaned || !cleaned.includes(".")) {
      toast({ title: "Invalid domain", description: "Please enter a valid domain (e.g. shop.luxehair.com)", variant: "destructive" });
      return;
    }

    setAdding(true);
    const { error } = await supabase
      .from("custom_domains")
      .insert({ store_id: storeId, domain: cleaned });

    if (error) {
      toast({
        title: "Could not add domain",
        description: error.message.includes("duplicate") ? "This domain is already connected to a store." : error.message,
        variant: "destructive",
      });
    } else {
      setDomain("");
      toast({ title: "Domain added", description: "Follow the DNS instructions below to connect it." });
      await fetchDomains();
    }
    setAdding(false);
  };

  const handleVerify = async (domainRecord: CustomDomain) => {
    setVerifying(domainRecord.id);
    try {
      const res = await supabase.functions.invoke("verify-domain", {
        body: { domain: domainRecord.domain, store_id: storeId },
      });

      if (res.error) throw res.error;

      const { verified } = res.data;
      if (verified) {
        toast({ title: "Domain verified!", description: `${domainRecord.domain} is now connected to your store.` });
      } else {
        toast({ title: "Not yet verified", description: "DNS records haven't propagated yet. This can take up to 48 hours.", variant: "destructive" });
      }
      await fetchDomains();
    } catch {
      toast({ title: "Verification failed", description: "Could not check DNS. Please try again later.", variant: "destructive" });
    }
    setVerifying(null);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("custom_domains").delete().eq("id", id);
    if (!error) {
      toast({ title: "Domain removed" });
      setDomains((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-500/30">Pending DNS</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isPro) {
    return (
      <Card className="shadow-card border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-muted-foreground" /> Custom Domain
          </CardTitle>
          <CardDescription>Connect your own domain to your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Custom domains are available on the Pro plan.
            </p>
            <Button variant="hero" size="sm" onClick={onUpgrade}>
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" /> Custom Domain
        </CardTitle>
        <CardDescription>
          Connect your own domain. Your Storvo link ({storeSlug}.storvo.co) stays active as a fallback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Add domain */}
        <div className="flex gap-2">
          <Input
            placeholder="shop.luxehair.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={adding || !domain.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </div>

        {/* Existing domains */}
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : domains.length > 0 ? (
          <div className="space-y-4">
            {domains.map((d) => (
              <div key={d.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{d.domain}</span>
                    {statusBadge(d.status)}
                  </div>
                  <div className="flex items-center gap-1">
                    {d.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVerify(d)}
                        disabled={verifying === d.id}
                      >
                        {verifying === d.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(d.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {d.status === "pending" && (
                  <div className="rounded-md bg-muted/50 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Add this DNS record at your domain provider:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-mono font-medium">CNAME</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-mono font-medium">
                          {d.domain.split(".").length > 2 ? d.domain.split(".")[0] : "@"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Value</p>
                        <div className="flex items-center gap-1">
                          <p className="font-mono font-medium truncate">stores.storvo.co</p>
                          <button
                            onClick={() => copyToClipboard("stores.storvo.co", d.id)}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            {copied === d.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      DNS propagation can take up to 48 hours. Click the refresh button to re-check.
                    </p>
                  </div>
                )}

                {d.status === "verified" && (
                  <p className="text-xs text-green-600">
                    ✓ Your store is accessible at <span className="font-medium">{d.domain}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* Fallback info */}
        <div className="rounded-lg bg-accent/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Default URL: <span className="font-medium text-primary">{storeSlug}.storvo.co</span> (always active)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomDomainCard;
