import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Layers, Pencil, Trash2, X, Check, ExternalLink, GripVertical } from "lucide-react";

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").substring(0, 60);

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  display_order: number;
  product_count?: number;
}

const CollectionsPage = () => {
  const { store, role } = useStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: true,
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const fetchData = async () => {
    if (!store) return;
    const [{ data: cols }, { data: prods }] = await Promise.all([
      supabase
        .from("collections")
        .select("*, collection_products(count)")
        .eq("store_id", store.id)
        .order("display_order"),
      supabase
        .from("products")
        .select("id, name, price, product_images(image_url, display_order)")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("name"),
    ]);
    const withCounts = (cols || []).map((c: any) => ({
      ...c,
      product_count: c.collection_products?.[0]?.count || 0,
    }));
    setCollections(withCounts);
    setProducts(prods || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [store]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", description: "", is_active: true });
    setSelectedProductIds([]);
    setProductSearch("");
    setShowForm(true);
  };

  const openEdit = async (col: Collection) => {
    setEditingId(col.id);
    setForm({
      name: col.name,
      slug: col.slug,
      description: col.description || "",
      is_active: col.is_active,
    });
    const { data: cp } = await supabase
      .from("collection_products")
      .select("product_id")
      .eq("collection_id", col.id);
    setSelectedProductIds((cp || []).map((r: any) => r.product_id));
    setProductSearch("");
    setShowForm(true);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: editingId ? f.slug : slugify(name) }));
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !form.name.trim()) return;
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.name);
      let collectionId = editingId;

      if (editingId) {
        await supabase
          .from("collections")
          .update({ name: form.name, slug, description: form.description || null, is_active: form.is_active })
          .eq("id", editingId);
      } else {
        const { data, error } = await supabase
          .from("collections")
          .insert({ store_id: store.id, name: form.name, slug, description: form.description || null, is_active: form.is_active })
          .select("id")
          .single();
        if (error) throw error;
        collectionId = data.id;
      }

      // Sync products
      await supabase.from("collection_products").delete().eq("collection_id", collectionId);
      if (selectedProductIds.length > 0) {
        await supabase.from("collection_products").insert(
          selectedProductIds.map((pid, i) => ({ collection_id: collectionId, product_id: pid, display_order: i }))
        );
      }

      toast.success(editingId ? "Collection updated!" : "Collection created!");
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collection? Products won't be deleted.")) return;
    setDeleting(id);
    await supabase.from("collections").delete().eq("id", id);
    toast.success("Collection deleted.");
    setDeleting(null);
    fetchData();
  };

  const toggleActive = async (col: Collection) => {
    await supabase.from("collections").update({ is_active: !col.is_active }).eq("id", col.id);
    setCollections((prev) => prev.map((c) => c.id === col.id ? { ...c, is_active: !c.is_active } : c));
  };

  if (!store) return null;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar store={store} role={role} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4">
            <SidebarTrigger />
            <Layers className="h-5 w-5 text-primary" />
            <h1 className="font-display text-lg font-bold text-foreground flex-1">Collections</h1>
            <Button variant="hero" size="sm" onClick={openCreate} data-testid="button-create-collection">
              <Plus className="mr-1.5 h-4 w-4" /> New Collection
            </Button>
          </header>

          <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />)}
              </div>
            ) : collections.length === 0 && !showForm ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center space-y-3">
                <Layers className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="font-semibold text-foreground">No collections yet</p>
                <p className="text-sm text-muted-foreground">Group products into collections like "New Arrivals" or "Sale".</p>
                <Button variant="hero" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Create Collection
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {collections.map((col) => (
                  <div
                    key={col.id}
                    className="rounded-2xl border border-border/60 bg-card shadow-card p-4 flex items-center gap-3"
                    data-testid={`collection-card-${col.id}`}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{col.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${col.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                          {col.is_active ? "Active" : "Hidden"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {col.product_count} product{col.product_count !== 1 ? "s" : ""} | /{col.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`/store/${store.slug}/c/${col.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 hover:bg-accent transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <Switch checked={col.is_active} onCheckedChange={() => toggleActive(col)} />
                      <button
                        onClick={() => openEdit(col)}
                        className="rounded-lg p-1.5 hover:bg-accent transition-colors"
                        data-testid={`button-edit-collection-${col.id}`}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(col.id)}
                        disabled={deleting === col.id}
                        className="rounded-lg p-1.5 hover:bg-destructive/10 transition-colors"
                        data-testid={`button-delete-collection-${col.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create/Edit Form */}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card shadow-xl max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/60">
                    <h2 className="font-display font-bold text-foreground">
                      {editingId ? "Edit Collection" : "New Collection"}
                    </h2>
                    <button onClick={() => setShowForm(false)} className="rounded-full p-1.5 hover:bg-accent transition-colors">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    <div>
                      <Label>Collection Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. New Arrivals"
                        required
                        data-testid="input-collection-name"
                      />
                    </div>
                    <div>
                      <Label>URL Slug</Label>
                      <div className="flex items-center rounded-xl border border-border bg-muted/30 overflow-hidden">
                        <span className="px-3 text-xs text-muted-foreground whitespace-nowrap font-mono border-r border-border py-2.5">
                          /store/{store.slug}/c/
                        </span>
                        <input
                          className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none font-mono"
                          value={form.slug}
                          onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                          required
                          data-testid="input-collection-slug"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="What's in this collection?"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Active (visible on store)</Label>
                      <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                    </div>

                    {/* Product Picker */}
                    <div>
                      <Label>Products in this collection</Label>
                      <p className="text-xs text-muted-foreground mb-2">{selectedProductIds.length} selected</p>
                      <Input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-44 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/60">
                        {filteredProducts.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground text-center">No products found</p>
                        ) : (
                          filteredProducts.map((product) => {
                            const isSelected = selectedProductIds.includes(product.id);
                            const img = (product.product_images || [])
                              .sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url;
                            return (
                              <button
                                type="button"
                                key={product.id}
                                onClick={() => toggleProduct(product.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isSelected ? "bg-primary/8 dark:bg-primary/15" : "hover:bg-accent"}`}
                                data-testid={`select-product-${product.id}`}
                              >
                                <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/60">
                                  {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                                </div>
                                <p className="flex-1 text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary border-primary" : "border-border"}`}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 pb-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                        Cancel
                      </Button>
                      <Button variant="hero" type="submit" className="flex-1" disabled={saving} data-testid="button-save-collection">
                        {saving ? "Saving..." : editingId ? "Save Changes" : "Create Collection"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CollectionsPage;
