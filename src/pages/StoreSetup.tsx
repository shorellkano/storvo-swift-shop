import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import storvoLogo from "@/assets/storvo-logo.png";
import { ShoppingBag } from "lucide-react";

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
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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

      // Create free subscription
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .single();

      if (store) {
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
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4">
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] glow-indigo" />

      <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card p-8 shadow-card">
        <div className="mb-6 flex justify-center">
          <img src={storvoLogo} alt="Storvo" className="h-8" />
        </div>

        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
            <ShoppingBag className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>

        <h1 className="mb-2 text-center font-display text-2xl font-bold text-foreground">
          Set up your store
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Just a few details and you'll be selling in no time
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Luxe Hair"
              required
              maxLength={50}
            />
            {storeName && (
              <p className="mt-1 text-xs text-muted-foreground">
                Your store URL: <span className="font-medium text-storvo-indigo">{generateSlug(storeName)}.storvo.co</span>
              </p>
            )}
          </div>

          <div>
            <Label>Store Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
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

          <div>
            <Label htmlFor="instagram">Instagram Handle (optional)</Label>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourbrand"
            />
          </div>

          <Button variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Creating your store..." : "Create My Store 🚀"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default StoreSetup;
