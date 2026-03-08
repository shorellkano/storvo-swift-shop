import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import storvoLogo from "@/assets/storvo-logo.png";
import { ShoppingBag, Camera, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  "Fashion",
  "Beauty",
  "Electronics",
  "Digital Products",
  "General Store",
];

const StoreSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB.");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (storeId: string): Promise<string | null> => {
    if (!logoFile) return null;
    setUploading(true);
    const ext = logoFile.name.split(".").pop();
    const filePath = `${storeId}/logo.${ext}`;

    const { error } = await supabase.storage
      .from("store-logos")
      .upload(filePath, logoFile, { upsert: true });

    if (error) {
      console.error("Logo upload error:", error.message);
      setUploading(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("store-logos")
      .getPublicUrl(filePath);

    setUploading(false);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first to create your store.");
      return;
    }
    setLoading(true);

    const slug = generateSlug(storeName);

    try {
      // Check reserved slugs
      const { data: reserved } = await supabase
        .from("reserved_slugs")
        .select("slug")
        .eq("slug", slug)
        .single();

      if (reserved) {
        toast.error("This store name is reserved. Please choose another.");
        setLoading(false);
        return;
      }

      // Check uniqueness
      const { data: existing } = await supabase
        .from("stores")
        .select("slug")
        .eq("slug", slug)
        .single();

      if (existing) {
        toast.error("This store name is already taken. Please choose another.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("stores").insert({
        user_id: user.id,
        name: storeName,
        slug,
        category,
        instagram_handle: instagram || null,
      });

      if (error) throw error;

      // Get the created store
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .single();

      if (store) {
        // Upload logo if selected
        const logoUrl = await uploadLogo(store.id);
        if (logoUrl) {
          await supabase.from("stores").update({ logo_url: logoUrl }).eq("id", store.id);
        }

        // Create free subscription
        await supabase.from("subscriptions").insert({
          store_id: store.id,
          plan: "free",
        });
      }

      toast.success("Your store is live! 🎉");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4 py-10">
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] glow-indigo" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] glow-indigo opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-lg"
      >
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card backdrop-blur-sm">
          {/* Header */}
          <div className="mb-6 flex justify-center">
            <img src={storvoLogo} alt="Storvo" className="h-8" />
          </div>

          <div className="mb-2 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg"
            >
              <ShoppingBag className="h-7 w-7 text-primary-foreground" />
            </motion.div>
          </div>

          <h1 className="mb-1 text-center font-display text-2xl font-bold text-foreground">
            Set up your store
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Just a few details and you'll be selling in no time
          </p>

          {/* Progress hint */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Takes less than 2 minutes</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Logo Upload */}
            <div className="flex flex-col items-center gap-3">
              <Label className="text-sm font-medium text-foreground">Store Logo</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/50 transition-all hover:border-primary hover:bg-accent/50"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Upload
                    </span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-2xl">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">JPG, PNG or WebP · Max 2MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoSelect}
              />
            </div>

            {/* Store Name */}
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Luxe Hair"
                required
                maxLength={50}
                className="h-11"
              />
              {storeName && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Your store URL:{" "}
                  <span className="font-semibold text-primary">
                    {generateSlug(storeName)}.storvo.co
                  </span>
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Store Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, "-")}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instagram */}
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram Handle (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="yourbrand"
                  className="h-11 pl-7"
                />
              </div>
            </div>

            <Button variant="hero" size="lg" className="w-full text-base font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating your store...
                </>
              ) : (
                "Create My Store 🚀"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default StoreSetup;
