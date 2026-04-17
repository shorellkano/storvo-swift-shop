import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Crown, X, UploadCloud } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSubscription, FREE_IMAGE_LIMIT, PRO_IMAGE_LIMIT } from "@/hooks/useSubscription";
import DraggableImageUpload from "@/components/product/DraggableImageUpload";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import RelatedProductsPicker from "@/components/product/RelatedProductsPicker";

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { store, role, loading: storeLoading } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [allImages, setAllImages] = useState<{ id: string; preview: string; file?: File; isExisting?: boolean; originalId?: string }[]>([]);
  const [originalExistingIds, setOriginalExistingIds] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<{ id: string; video_url: string; display_order: number }[]>([]);
  const [uploadVideos, setUploadVideos] = useState<{ id: string; name: string; file: File; preview: string }[]>([]);
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    productType: "physical" as "physical" | "digital",
    trackInventory: false,
    stockQuantity: 0,
    digitalFileUrl: "",
    isActive: true,
    isNegotiable: false,
    allowMediaDownload: false,
  });

  useEffect(() => {
    if (!store?.id || !id) return;

    const fetchData = async () => {
      const { data: product } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("id", id)
        .eq("store_id", store.id)
        .single();

      if (!product) { navigate("/dashboard/products"); return; }

      setForm({
        name: product.name,
        price: String(product.price),
        description: product.description || "",
        productType: product.product_type as "physical" | "digital",
        trackInventory: product.track_inventory,
        stockQuantity: product.stock_quantity || 0,
        digitalFileUrl: product.digital_file_url || "",
        isActive: product.is_active,
        isNegotiable: (product as any).is_negotiable || false,
        allowMediaDownload: (product as any).allow_media_download || false,
      });

      const sorted = (product.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order);
      setAllImages(sorted.map((img: any) => ({
        id: img.id,
        preview: img.image_url,
        isExisting: true,
        originalId: img.id,
      })));
      setOriginalExistingIds(sorted.map((img: any) => img.id));

      const { data: vids } = await supabase
        .from("product_videos")
        .select("*")
        .eq("product_id", id)
        .order("display_order");
      setExistingVideos(vids || []);

      const { data: related } = await supabase
        .from("product_related")
        .select("related_product_id")
        .eq("product_id", id)
        .order("display_order");
      setRelatedProductIds((related || []).map((r: any) => r.related_product_id));

      setLoading(false);
    };

    fetchData();
  }, [store?.id, id, navigate]);

  const { isPro } = useSubscription(store?.id || null);
  const maxImages = isPro ? PRO_IMAGE_LIMIT : FREE_IMAGE_LIMIT;
  const maxVideos = isPro ? 4 : 1;
  const totalVideos = existingVideos.length + uploadVideos.length;

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxVideos - totalVideos;
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

  const removeExistingVideo = async (videoId: string) => {
    const vid = existingVideos.find((v) => v.id === videoId);
    if (vid) {
      const path = vid.video_url.split("/product-videos/")[1];
      if (path) await supabase.storage.from("product-videos").remove([path]);
      await supabase.from("product_videos").delete().eq("id", videoId);
      setExistingVideos((prev) => prev.filter((v) => v.id !== videoId));
    }
  };

  const removeNewVideo = (id: string) => setUploadVideos((prev) => prev.filter((v) => v.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          slug: generateSlug(form.name),
          price: parseFloat(form.price),
          description: form.description,
          product_type: form.productType,
          track_inventory: form.trackInventory,
          stock_quantity: form.trackInventory ? form.stockQuantity : 0,
          digital_file_url: form.productType === "digital" ? form.digitalFileUrl : null,
          is_active: form.isActive,
          is_negotiable: form.isNegotiable,
          allow_media_download: isPro ? form.allowMediaDownload : false,
        } as any)
        .eq("id", id);

      if (error) throw error;

      const currentExistingIds = allImages.filter(img => img.isExisting).map(img => img.originalId!);
      const removedIds = originalExistingIds.filter(id => !currentExistingIds.includes(id));

      for (const imgId of removedIds) {
        const { data: imgData } = await supabase.from("product_images").select("image_url").eq("id", imgId).single();
        if (imgData) {
          const path = imgData.image_url.split("/product-images/")[1];
          if (path) await supabase.storage.from("product-images").remove([path]);
          await supabase.from("product_images").delete().eq("id", imgId);
        }
      }

      const existingInOrder = allImages.filter(img => img.isExisting);
      for (let i = 0; i < existingInOrder.length; i++) {
        await supabase.from("product_images").update({ display_order: allImages.indexOf(existingInOrder[i]) }).eq("id", existingInOrder[i].originalId!);
      }

      const newItems = allImages.filter(img => !img.isExisting && img.file);
      await Promise.all(newItems.map(async (img) => {
        const i = allImages.indexOf(img);
        const fileExt = img.file!.name.split(".").pop();
        const filePath = `${store.id}/${id}/${Date.now()}_${i}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, img.file!);
        if (uploadError) { console.error(uploadError); return; }
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(filePath);
        await supabase.from("product_images").insert({ product_id: id, image_url: publicUrl, display_order: i });
      }));

      await Promise.all(uploadVideos.map(async (vid, i) => {
        const fileExt = vid.file.name.split(".").pop() || "mp4";
        const filePath = `${store.id}/${id}/${Date.now()}_${i}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("product-videos").upload(filePath, vid.file);
        if (uploadError) { console.error(uploadError); return; }
        const { data: { publicUrl } } = supabase.storage.from("product-videos").getPublicUrl(filePath);
        await supabase.from("product_videos").insert({ product_id: id, store_id: store.id, video_url: publicUrl, display_order: allImages.length + existingVideos.length + i });
      }));

      // Save related products: delete all then re-insert
      await supabase.from("product_related").delete().eq("product_id", id);
      if (relatedProductIds.length > 0) {
        await supabase.from("product_related").insert(
          relatedProductIds.map((rId, i) => ({
            product_id: id,
            related_product_id: rId,
            display_order: i,
          }))
        );
      }

      toast.success("Product updated!");
      navigate("/dashboard/products");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} role={role} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-display text-lg font-semibold text-foreground">Edit Product</h2>
          </header>
          <main className="flex-1 p-4 sm:p-6 bg-background">
            <Button variant="ghost" onClick={() => navigate("/dashboard/products")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Button>

            <div className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Product Active</Label>
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  />
                </div>

                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="Describe your product..."
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
                    <Label htmlFor="digitalUrl">Download URL</Label>
                    <Input
                      id="digitalUrl"
                      value={form.digitalFileUrl}
                      onChange={(e) => setForm({ ...form, digitalFileUrl: e.target.value })}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                )}

                <DraggableImageUpload
                  images={allImages}
                  onChange={setAllImages}
                  maxImages={maxImages}
                  isPro={isPro}
                />

                {/* Video Management */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Product Videos</Label>
                    <span className="text-xs text-muted-foreground">{totalVideos}/{maxVideos}</span>
                  </div>

                  {existingVideos.map((vid) => (
                    <div key={vid.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-2 mb-2">
                      <video src={vid.video_url} className="h-10 w-16 rounded object-cover" />
                      <span className="flex-1 text-sm text-foreground truncate">Video {vid.display_order + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeExistingVideo(vid.id)}
                        className="rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {uploadVideos.map((vid) => (
                    <div key={vid.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-2 mb-2">
                      <video src={vid.preview} className="h-10 w-16 rounded object-cover" />
                      <span className="flex-1 text-sm text-foreground truncate">{vid.name}</span>
                      <button
                        type="button"
                        onClick={() => removeNewVideo(vid.id)}
                        className="rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {totalVideos < maxVideos && (
                    <>
                      <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoSelect} />
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <UploadCloud className="h-5 w-5" /> Add Video
                      </button>
                    </>
                  )}
                </div>

                {/* Negotiation & Download Settings */}
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
                      <p className="text-xs text-muted-foreground mt-0.5">Buyers can save photos and videos</p>
                    </div>
                    <Switch
                      id="allowDownload"
                      checked={isPro ? form.allowMediaDownload : false}
                      onCheckedChange={(v) => isPro ? setForm({ ...form, allowMediaDownload: v }) : setShowUpgrade(true)}
                      disabled={!isPro}
                    />
                  </div>
                </div>

                {/* Related Products */}
                <RelatedProductsPicker
                  storeId={store.id}
                  currentProductId={id}
                  selectedIds={relatedProductIds}
                  onChange={setRelatedProductIds}
                />

                <Button variant="hero" size="lg" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          </main>
        </div>
      </div>
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} storeId={store?.id || null} />
    </SidebarProvider>
  );
};

export default EditProduct;
