import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSubscription, FREE_IMAGE_LIMIT, PRO_IMAGE_LIMIT } from "@/hooks/useSubscription";
import DraggableImageUpload from "@/components/product/DraggableImageUpload";

const EditProduct = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    productType: "physical" as "physical" | "digital",
    trackInventory: false,
    stockQuantity: 0,
    digitalFileUrl: "",
    isActive: true,
  });

  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!storeData) { navigate("/setup"); return; }
      setStore(storeData);

      const { data: product } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("id", id)
        .eq("store_id", storeData.id)
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
      });

      setExistingImages(
        (product.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order)
      );
      setLoading(false);
    };

    fetchData();
  }, [user, id, navigate]);

  const { isPro } = useSubscription(store?.id || null);
  const maxImages = isPro ? PRO_IMAGE_LIMIT : FREE_IMAGE_LIMIT;

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentTotal = existingImages.length - removedImageIds.length + newImages.length;
    const allowed = files.slice(0, maxImages - currentTotal);
    if (allowed.length < files.length) {
      toast.error(`Maximum ${maxImages} images per product`);
    }
    if (allowed.length === 0) return;
    setNewImages((prev) => [...prev, ...allowed]);
    allowed.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setNewPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (imageId: string) => {
    setRemovedImageIds((prev) => [...prev, imageId]);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
        })
        .eq("id", id);

      if (error) throw error;

      // Remove deleted images
      for (const imgId of removedImageIds) {
        const img = existingImages.find((i) => i.id === imgId);
        if (img) {
          const path = img.image_url.split("/product-images/")[1];
          if (path) await supabase.storage.from("product-images").remove([path]);
          await supabase.from("product_images").delete().eq("id", imgId);
        }
      }

      // Upload new images in parallel
      const remainingCount = existingImages.length - removedImageIds.length;
      await Promise.all(newImages.map(async (file, i) => {
        const fileExt = file.name.split(".").pop();
        const filePath = `${store.id}/${id}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file);

        if (uploadError) { console.error(uploadError); return; }

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        await supabase.from("product_images").insert({
          product_id: id,
          image_url: publicUrl,
          display_order: remainingCount + i,
        });
      }));

      toast.success("Product updated! ✨");
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

  const visibleExisting = existingImages.filter((img) => !removedImageIds.includes(img.id));
  const totalImages = visibleExisting.length + newPreviews.length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} />
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

                {/* Images */}
                <div>
                  <Label>Product Images</Label>
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {visibleExisting.map((img) => (
                      <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                        <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1 right-1 rounded-full bg-card/80 p-1 backdrop-blur"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {newPreviews.map((preview, i) => (
                      <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-border border-dashed">
                        <img src={preview} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute top-1 right-1 rounded-full bg-card/80 p-1 backdrop-blur"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {totalImages < maxImages && (
                      <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleNewImages}
                          className="hidden"
                        />
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </label>
                    )}
                  </div>
                </div>

                <Button variant="hero" size="lg" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EditProduct;
