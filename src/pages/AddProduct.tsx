import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useSubscription, FREE_IMAGE_LIMIT, PRO_IMAGE_LIMIT, FREE_PRODUCT_LIMIT } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Crown, Video, X, UploadCloud } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import PostUploadSuccess from "@/components/dashboard/PostUploadSuccess";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import LiveStorePreview from "@/components/dashboard/LiveStorePreview";
import { useIsMobile } from "@/hooks/use-mobile";
import DraggableImageUpload from "@/components/product/DraggableImageUpload";

const AddProduct = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { store, role, loading: storeLoading } = useStore();
  const [loading, setLoading] = useState(false);
  const [uploadImages, setUploadImages] = useState<{ id: string; preview: string; file?: File }[]>([]);
  const [uploadVideos, setUploadVideos] = useState<{ id: string; name: string; file: File; preview: string }[]>([]);
  const [createdProduct, setCreatedProduct] = useState<{ id: string; name: string } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [existingProducts, setExistingProducts] = useState<any[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { canAddProduct, productCount, isPro, refetch } = useSubscription(store?.id || null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    productType: "physical" as "physical" | "digital",
    trackInventory: false,
    stockQuantity: 0,
    digitalFileUrl: "",
    isNegotiable: false,
    allowMediaDownload: false,
  });

  useEffect(() => {
    if (!store?.id) return;
    supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setExistingProducts(data || []));
  }, [store?.id]);

  const maxImages = isPro ? PRO_IMAGE_LIMIT : FREE_IMAGE_LIMIT;
  const maxVideos = isPro ? 4 : 1;

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      description: "",
      productType: "physical",
      trackInventory: false,
      stockQuantity: 0,
      digitalFileUrl: "",
      isNegotiable: false,
      allowMediaDownload: false,
    });
    setUploadImages([]);
    setUploadVideos([]);
    setCreatedProduct(null);
    refetch();
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxVideos - uploadVideos.length;
    const toAdd = files.slice(0, remaining);
    const newVideos = toAdd.map((file) => ({
      id: `${Date.now()}_${file.name}`,
      name: file.name,
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadVideos((prev) => [...prev, ...newVideos]);
    e.target.value = "";
  };

  const removeVideo = (id: string) => {
    setUploadVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    if (!canAddProduct) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(form.name);

      const { data: product, error } = await supabase
        .from("products")
        .insert({
          store_id: store.id,
          name: form.name,
          slug,
          price: parseFloat(form.price) || 0,
          description: form.description,
          product_type: form.productType,
          track_inventory: form.trackInventory,
          stock_quantity: form.trackInventory ? form.stockQuantity : 0,
          digital_file_url: form.productType === "digital" ? form.digitalFileUrl : null,
          is_negotiable: form.isNegotiable,
          allow_media_download: isPro ? form.allowMediaDownload : false,
        } as any)
        .select()
        .single();

      if (error) throw error;

      await Promise.all(uploadImages.map(async (img, i) => {
        if (!img.file) return;
        const fileExt = img.file.name.split(".").pop();
        const filePath = `${store.id}/${product.id}/${i}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, img.file);
        if (uploadError) { console.error("Upload error:", uploadError); return; }
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(filePath);
        await supabase.from("product_images").insert({ product_id: product.id, image_url: publicUrl, display_order: i });
      }));

      await Promise.all(uploadVideos.map(async (vid, i) => {
        const fileExt = vid.file.name.split(".").pop() || "mp4";
        const filePath = `${store.id}/${product.id}/${Date.now()}_${i}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("product-videos").upload(filePath, vid.file);
        if (uploadError) { console.error("Video upload error:", uploadError); return; }
        const { data: { publicUrl } } = supabase.storage.from("product-videos").getPublicUrl(filePath);
        await supabase.from("product_videos").insert({ product_id: product.id, store_id: store.id, video_url: publicUrl, display_order: uploadImages.length + i });
      }));

      setCreatedProduct({ id: product.id, name: product.name });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!store) return null;

  if (createdProduct) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar store={store} role={role} />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
              <SidebarTrigger className="mr-4" />
              <h2 className="font-display text-lg font-semibold text-foreground">Product Added</h2>
            </header>
            <main className="flex-1 p-6 bg-background flex items-center justify-center">
              <PostUploadSuccess
                productName={createdProduct.name}
                productId={createdProduct.id}
                storeSlug={store.slug}
                onAddAnother={resetForm}
              />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!canAddProduct) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar store={store} role={role} />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
              <SidebarTrigger className="mr-4" />
              <h2 className="font-display text-lg font-semibold text-foreground">Add Product</h2>
            </header>
            <main className="flex-1 p-6 bg-background flex items-center justify-center">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <Crown className="h-8 w-8 text-accent-foreground" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">Free plan limit reached</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You've added {productCount} of {FREE_PRODUCT_LIMIT} products on the Free plan. Upgrade to Pro to add unlimited products.
                </p>
                <div className="mt-6 space-y-3">
                  <Button variant="hero" size="lg" className="w-full" onClick={() => setShowUpgrade(true)}>
                    <Crown className="mr-2 h-4 w-4" /> Upgrade to Pro - ₦3,500/mo
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/dashboard/products")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </div>
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} storeId={store?.id || null} reason="limit" />
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} role={role} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-display text-lg font-semibold text-foreground">Add Product</h2>
          </header>
          <main className="flex-1 p-4 sm:p-6 bg-background">
            <Button variant="ghost" onClick={() => navigate("/dashboard/products")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Button>

            <div className={`${isMobile ? '' : 'grid grid-cols-5 gap-6'}`}>
              <div className={isMobile ? '' : 'col-span-3'}>
                <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card">
                  {!isPro && (
                    <div className="mb-5 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {productCount} of {FREE_PRODUCT_LIMIT} products used (Free plan)
                      </span>
                      <button onClick={() => setShowUpgrade(true)} className="text-xs font-medium text-primary hover:underline">
                        Upgrade
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Luxury Brazilian Wig"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Price (₦)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe your product..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label>Product Type</Label>
                      <Select
                        value={form.productType}
                        onValueChange={(v) => setForm({ ...form, productType: v as "physical" | "digital" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical">Physical Product</SelectItem>
                          <SelectItem value="digital">Digital Product</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {form.productType === "physical" && (
                      <div className="space-y-4 rounded-xl bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="trackInventory">Track Inventory</Label>
                          <Switch
                            id="trackInventory"
                            checked={form.trackInventory}
                            onCheckedChange={(v) => setForm({ ...form, trackInventory: v })}
                          />
                        </div>
                        {form.trackInventory && (
                          <div>
                            <Label htmlFor="stock">Stock Quantity</Label>
                            <Input
                              id="stock"
                              type="number"
                              min="0"
                              value={form.stockQuantity}
                              onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {form.productType === "digital" && (
                      <div>
                        <Label htmlFor="digitalUrl">Download URL (Google Drive / Dropbox link)</Label>
                        <Input
                          id="digitalUrl"
                          value={form.digitalFileUrl}
                          onChange={(e) => setForm({ ...form, digitalFileUrl: e.target.value })}
                          placeholder="https://drive.google.com/..."
                        />
                      </div>
                    )}

                    {/* Image Upload */}
                    <DraggableImageUpload
                      images={uploadImages}
                      onChange={setUploadImages}
                      maxImages={maxImages}
                      isPro={isPro}
                    />

                    {/* Video Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Product Videos</Label>
                        <span className="text-xs text-muted-foreground">
                          {uploadVideos.length}/{maxVideos} {!isPro && "(1 on Free plan)"}
                        </span>
                      </div>

                      {uploadVideos.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {uploadVideos.map((vid) => (
                            <div key={vid.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-2">
                              <video src={vid.preview} className="h-10 w-16 rounded object-cover" />
                              <span className="flex-1 text-sm text-foreground truncate">{vid.name}</span>
                              <button
                                type="button"
                                onClick={() => removeVideo(vid.id)}
                                className="rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadVideos.length < maxVideos && (
                        <>
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            multiple
                            className="hidden"
                            onChange={handleVideoSelect}
                          />
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                          >
                            <UploadCloud className="h-5 w-5" />
                            Add Video {!isPro && <span className="text-xs">(1 video on Free plan)</span>}
                          </button>
                        </>
                      )}

                      {!isPro && uploadVideos.length >= maxVideos && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Upgrade to Pro for up to 4 videos per product.{" "}
                          <button type="button" onClick={() => setShowUpgrade(true)} className="text-primary hover:underline">Upgrade</button>
                        </p>
                      )}
                    </div>

                    {/* Negotiation Setting */}
                    <div className="rounded-xl bg-muted/50 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="isNegotiable" className="cursor-pointer">Price is Negotiable</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">Buyers can make a price offer</p>
                        </div>
                        <Switch
                          id="isNegotiable"
                          checked={form.isNegotiable}
                          onCheckedChange={(v) => setForm({ ...form, isNegotiable: v })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowDownload" className={!isPro ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer"}>
                            Allow Media Download {!isPro && <Crown className="inline h-3.5 w-3.5 text-amber-500 ml-1" />}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">Buyers can save your photos/videos</p>
                        </div>
                        <Switch
                          id="allowDownload"
                          checked={isPro ? form.allowMediaDownload : false}
                          onCheckedChange={(v) => isPro ? setForm({ ...form, allowMediaDownload: v }) : setShowUpgrade(true)}
                          disabled={!isPro}
                        />
                      </div>
                    </div>

                    <Button variant="hero" size="lg" className="w-full" disabled={loading}>
                      {loading ? "Adding product..." : "Add Product"}
                    </Button>
                  </form>
                </div>
              </div>

              {!isMobile && (
                <div className="col-span-2 sticky top-20 self-start">
                  <LiveStorePreview
                    store={store}
                    productName={form.name}
                    productPrice={form.price}
                    productDescription={form.description}
                    productImages={uploadImages.map(img => img.preview)}
                    existingProducts={existingProducts}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} storeId={store?.id || null} reason="limit" />
    </SidebarProvider>
  );
};

export default AddProduct;
