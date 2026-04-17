import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Store, Package, Layers, BarChart2, Link2 } from "lucide-react";
import { toast } from "sonner";

const LinksPage = () => {
  const { store, role } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = window.location.origin;
  const storeUrl = store ? `${origin}/store/${store.slug}` : "";

  useEffect(() => {
    if (!store) return;
    (async () => {
      const [{ data: prods }, { data: cols }, { data: clicks }] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, slug, product_images(image_url, display_order)")
          .eq("store_id", store.id)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("collections")
          .select("id, name, slug")
          .eq("store_id", store.id)
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("link_clicks")
          .select("product_id, collection_id, link_type")
          .eq("store_id", store.id),
      ]);
      setProducts(prods || []);
      setCollections(cols || []);

      // Aggregate click counts by product_id / collection_id / store
      const counts: Record<string, number> = {};
      for (const click of clicks || []) {
        if (click.link_type === "store") {
          counts["__store"] = (counts["__store"] || 0) + 1;
        } else if (click.product_id) {
          counts[click.product_id] = (counts[click.product_id] || 0) + 1;
        } else if (click.collection_id) {
          counts[click.collection_id] = (counts[click.collection_id] || 0) + 1;
        }
      }
      setClickCounts(counts);
      setLoading(false);
    })();
  }, [store]);

  const copyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    toast.success("Link copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  if (!store) return null;

  const CopyButton = ({ url, id }: { url: string; id: string }) => (
    <button
      onClick={() => copyLink(url, id)}
      className="rounded-lg p-1.5 hover:bg-accent transition-colors shrink-0"
      data-testid={`button-copy-${id}`}
    >
      {copied === id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  const ClickBadge = ({ id }: { id: string }) => {
    const count = clickCounts[id] || 0;
    if (count === 0) return null;
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <BarChart2 className="h-3.5 w-3.5" />
        {count}
      </span>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar store={store} role={role} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4">
            <SidebarTrigger />
            <Link2 className="h-5 w-5 text-primary" />
            <h1 className="font-display text-lg font-bold text-foreground">My Links</h1>
          </header>

          <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-6">
            {/* Store Link */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Store Link</p>
                  <p className="text-xs text-muted-foreground">Share this in your Instagram bio or social profiles</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                <p className="flex-1 text-sm font-medium text-foreground truncate font-mono">{storeUrl}</p>
                <ClickBadge id="__store" />
                <CopyButton url={storeUrl} id="__store" />
                <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 hover:bg-accent transition-colors">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Product Links</p>
                  <p className="text-xs text-muted-foreground">Direct links to individual product pages</p>
                </div>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active products yet.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {products.map((product) => {
                    const url = product.slug
                      ? `${origin}/store/${store.slug}/p/${product.slug}`
                      : `${origin}/store/${store.slug}`;
                    const img = (product.product_images || [])
                      .sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                        data-testid={`link-product-${product.id}`}
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/60">
                          {img && <img src={img} alt={product.name} className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">{url}</p>
                        </div>
                        <ClickBadge id={product.id} />
                        <CopyButton url={url} id={product.id} />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 hover:bg-accent transition-colors">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Collection Links */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Collection Links</p>
                  <p className="text-xs text-muted-foreground">Links to grouped product collections</p>
                </div>
              </div>
              {loading ? (
                <div className="h-12 rounded-xl bg-muted/50 animate-pulse" />
              ) : collections.length === 0 ? (
                <div className="py-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">No collections yet.</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard/collections"}>
                    Create your first collection
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {collections.map((col) => {
                    const url = `${origin}/store/${store.slug}/c/${col.slug}`;
                    return (
                      <div
                        key={col.id}
                        className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                        data-testid={`link-collection-${col.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{col.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">{url}</p>
                        </div>
                        <ClickBadge id={col.id} />
                        <CopyButton url={url} id={col.id} />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 hover:bg-accent transition-colors">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LinksPage;
