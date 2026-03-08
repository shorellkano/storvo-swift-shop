import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import storvoLogo from "@/assets/storvo-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import SetupProgress from "@/components/setup/SetupProgress";
import StoreDetailsStep from "@/components/setup/StoreDetailsStep";
import LogoBrandStep from "@/components/setup/LogoBrandStep";
import SetupSuccess from "@/components/setup/SetupSuccess";

const StoreSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Store details
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);

  // Logo & brand
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState("#6366F1");
  const [uploading, setUploading] = useState(false);

  // Created store ref
  const [createdStoreSlug, setCreatedStoreSlug] = useState("");
  const [createdStoreId, setCreatedStoreId] = useState("");

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleLogoSelect = useCallback((file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Step 1: Create store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }
    if (!category) {
      toast.error("Please select a store category.");
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
        brand_color: brandColor,
      });

      if (error) throw error;

      // Get created store
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .single();

      if (store) {
        setCreatedStoreId(store.id);
        setCreatedStoreSlug(slug);

        // Create free subscription
        await supabase.from("subscriptions").insert({
          store_id: store.id,
          plan: "free",
        });
      }

      toast.success("Store created! Now let's brand it.");
      setStep(2);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Upload logo & save brand color
  const handleSaveBrand = async () => {
    if (!createdStoreId) return;
    setUploading(true);

    try {
      let logoUrl: string | null = null;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const filePath = `${createdStoreId}/logo.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("store-logos")
          .upload(filePath, logoFile, { upsert: true });

        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage
            .from("store-logos")
            .getPublicUrl(filePath);
          logoUrl = publicUrl;
        }
      }

      await supabase
        .from("stores")
        .update({
          ...(logoUrl ? { logo_url: logoUrl } : {}),
          brand_color: brandColor,
        })
        .eq("id", createdStoreId);

      toast.success("Your store is live! 🎉");
      setStep(3);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSkipBrand = () => {
    toast.success("Your store is live! 🎉");
    setStep(3);
  };

  const steps = [
    { label: "Store Details", completed: step > 1, active: step === 1 },
    { label: "Logo & Brand", completed: step > 2, active: step === 2 },
    { label: "You're Live!", completed: step === 3, active: step === 3 },
  ];

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4 py-8">
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] glow-indigo" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] glow-indigo opacity-40" />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="mb-5 flex justify-center">
          <img src={storvoLogo} alt="Storvo" className="h-7" />
        </div>

        {/* Progress */}
        <div className="mb-5">
          <SetupProgress steps={steps} />
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card backdrop-blur-sm"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <h1 className="mb-1 text-center font-display text-xl sm:text-2xl font-bold text-foreground">
                  Set up your store
                </h1>
                <p className="mb-5 text-center text-sm text-muted-foreground">
                  Just a few details and you'll be selling in no time
                </p>
                <StoreDetailsStep
                  storeName={storeName}
                  setStoreName={setStoreName}
                  category={category}
                  setCategory={setCategory}
                  instagram={instagram}
                  setInstagram={setInstagram}
                  loading={loading}
                  onSubmit={handleCreateStore}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <h1 className="mb-1 text-center font-display text-xl sm:text-2xl font-bold text-foreground">
                  Brand your store
                </h1>
                <p className="mb-5 text-center text-sm text-muted-foreground">
                  Upload your logo and we'll set your brand colors automatically
                </p>
                <LogoBrandStep
                  logoPreview={logoPreview}
                  onLogoSelect={handleLogoSelect}
                  brandColor={brandColor}
                  onBrandColorChange={setBrandColor}
                  uploading={uploading}
                  onContinue={handleSaveBrand}
                  onSkip={handleSkipBrand}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <SetupSuccess
                  storeName={storeName}
                  storeSlug={createdStoreSlug}
                  logoPreview={logoPreview}
                  brandColor={brandColor}
                  onViewStore={() => navigate(`/store/${createdStoreSlug}`)}
                  onAddProduct={() => navigate("/dashboard/products/new")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default StoreSetup;
