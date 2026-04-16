import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, FREE_IMAGE_LIMIT, PRO_IMAGE_LIMIT, FREE_PRODUCT_LIMIT } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Crown } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import PostUploadSuccess from "@/components/dashboard/PostUploadSuccess";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import LiveStorePreview from "@/components/dashboard/LiveStorePreview";
import { useIsMobile } from "@/hooks/use-mobile";
import DraggableImageUpload from "@/components/product/DraggableImageUpload";

const AddProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadImages, setUploadImages] = useState<{ id: string; preview: string; file?: File }[]>([]);
  const [createdProduct, setCreatedProduct] = useState<{ id: string; name: string } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [existingProducts, setExistingProducts] = useState<any[]>([]);

  const { canAddProduct, productCount, isPro, refetch } = useSubscription(store?.id || null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    productType: "physical" as "physical" | "digital",
    trackInventory: false,
    stockQuantity: 0,
    digitalFileUrl: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data }) => {
        setStore(data);
        if (data) {
          const { data: prods } = await supabase
            .from("products")
            .select("*, product_images(*)")
            .eq("store_id", data.id)
            .order("created_at", { ascending: false })
            .limit(6);
          setExistingProducts(prods || []);
        }
      });
  }, [user]);

  const maxImages = isPro ? PRO_IMAGE_LIMIT : FREE_IMAGE_LIMIT;

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
    });
    setUploadImages([]);
    setCreatedProduct(null);
    refetch();
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
          price: parseFloat(form.price),
          description: form.description,
          product_type: form.productType,
          track_inventory: form.trackInventory,
          stock_quantity: form.trackInventory ? form.stockQuantity : 0,
          digital_file_url: form.productType === "digital" ? form.digitalFileUrl : null,
        })
        .select()
        .single();

      if (error) throw error;

      await Promise.all(uploadImages.map(async (img, i) => {
        if (!img.file) return;
        const fileExt = img.file.name.split(".").pop();
        const filePath = `${store.id}/${product.id}/${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, img.file);

        if (uploadError) { console.error("Upload error:", uploadError); return; }

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        await supabase.from("product_images").insert({
          product_id: product.id,
          image_url: publicUrl,
          display_order: i,
        });
      }));

      setCreatedProduct({ id: product.id, name: product.name });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!store) return null;

  // Show success screen after creation
  if (createdProduct) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar store={store} />
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

  // Show limit reached screen
  if (!canAddProduct) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar store={store} />
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
                <h2 className="font-display text-xl font-bold text-foreground">
                  Free plan limit reached
                </h2>
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
        <DashboardSidebar store={store} />
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
              {/* Product Form */}
              <div className={isMobile ? '' : 'col-span-3'}>
                <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card">
                  {/* Product count indicator */}
                  {!isPro && (
                    <div className="mb-5 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {productCount} of {FREE_PRODUCT_LIMIT} products used (Free plan)
                      </span>
                      <button
                        onClick={() => setShowUpgrade(true)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
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

                    <Button variant="hero" size="lg" className="w-full" disabled={loading}>
                      {loading ? "Adding product..." : "Add Product"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Live Store Preview - desktop only */}
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
