import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BillingSection from "@/components/dashboard/BillingSection";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, Store, Palette, MessageCircle, Truck, Loader2 } from "lucide-react";

const BRAND_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F97316",
  "#EAB308", "#22C55E", "#14B8A6", "#06B6D4", "#3B82F6",
];

const StoreSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { subscription } = useSubscription(store?.id || null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState("#6366F1");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchStore = async () => {
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) { navigate("/setup"); return; }
      setStore(data);
      setName(data.name);
      setDescription(data.description || "");
      setBrandColor(data.brand_color || "#6366F1");
      setWhatsappNumber(data.whatsapp_number || "");
      setInstagramHandle(data.instagram_handle || "");
      setDeliveryFee(data.delivery_fee?.toString() || "0");
      setLogoUrl(data.logo_url);
      setLoading(false);
    };

    fetchStore();
  }, [user, navigate]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${store.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("store-logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("store-logos")
      .getPublicUrl(filePath);

    setLogoUrl(publicUrl);
    setUploading(false);
    toast({ title: "Logo uploaded", description: "Your logo has been updated." });
  };

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);

    const { error } = await supabase
      .from("stores")
      .update({
        name,
        description,
        brand_color: brandColor,
        whatsapp_number: whatsappNumber || null,
        instagram_handle: instagramHandle || null,
        delivery_fee: parseFloat(deliveryFee) || 0,
        logo_url: logoUrl,
      })
      .eq("id", store.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      setStore((prev: any) => ({
        ...prev,
        name,
        description,
        brand_color: brandColor,
        whatsapp_number: whatsappNumber,
        instagram_handle: instagramHandle,
        delivery_fee: parseFloat(deliveryFee) || 0,
        logo_url: logoUrl,
      }));
      toast({ title: "Settings saved", description: "Your store settings have been updated." });
    }
  };

  if (!store || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-display text-lg font-semibold text-foreground">Store Settings</h2>
          </header>
          <main className="flex-1 p-6 bg-background">
            <div className="mx-auto max-w-2xl space-y-6">
              {/* Billing & Subscription */}
              <BillingSection
                subscription={subscription}
                storeId={store?.id || null}
                onUpgrade={() => setShowUpgrade(true)}
                onCancelled={() => refetchSubscription()}
              />

              {/* Store Logo */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Camera className="h-5 w-5 text-primary" /> Store Logo
                  </CardTitle>
                  <CardDescription>Upload your store logo (max 2MB)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-colors hover:border-primary"
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="Store logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Store className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? "Uploading…" : "Change Logo"}
                      </Button>
                      <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* General Info */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="h-5 w-5 text-primary" /> General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input id="storeName" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeDesc">Description</Label>
                    <Textarea
                      id="storeDesc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Tell customers about your store…"
                    />
                  </div>
                  <div className="rounded-lg bg-accent/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Store URL: <span className="font-medium text-primary">{store.slug}.storvo.co</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Brand Color */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="h-5 w-5 text-primary" /> Brand Color
                  </CardTitle>
                  <CardDescription>This color is used on your storefront</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {BRAND_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setBrandColor(color)}
                        className={`h-10 w-10 rounded-xl border-2 transition-all ${
                          brandColor === color
                            ? "border-foreground scale-110 shadow-md"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Label htmlFor="customColor" className="whitespace-nowrap text-sm">
                      Custom:
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-9 w-9 cursor-pointer rounded-lg border border-border"
                      />
                      <Input
                        id="customColor"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-28 font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact / WhatsApp */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5 text-primary" /> Contact
                  </CardTitle>
                  <CardDescription>Let customers reach you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <Input
                      id="whatsapp"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                      <Input
                        id="instagram"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="yourstorename"
                        className="pl-7"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Fee */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5 text-primary" /> Delivery
                  </CardTitle>
                  <CardDescription>Set a flat delivery fee for all orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryFee">Delivery Fee (₦)</Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      min="0"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save */}
              <div className="flex justify-end pb-8">
                <Button variant="hero" size="lg" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? "Saving…" : "Save Settings"}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} storeId={store?.id || null} />
    </SidebarProvider>
  );
};

export default StoreSettings;
