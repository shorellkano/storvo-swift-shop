import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

const CollectionPage = () => {
  const { storeSlug, collectionSlug } = useParams<{ storeSlug: string; collectionSlug: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeSlug || !collectionSlug) return;
    (async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", storeSlug)
        .single();
      if (!storeData) { navigate(`/store/${storeSlug}`); return; }
      setStore(storeData);

      const { data: colData } = await supabase
        .from("collections")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("slug", collectionSlug)
        .eq("is_active", true)
        .single();
      if (!colData) { navigate(`/store/${storeSlug}`); return; }
      setCollection(colData);

      const { data: cpData } = await supabase
        .from("collection_products")
        .select("display_order, products:product_id(id, name, price, slug, product_images(image_url, display_order))")
        .eq("collection_id", colData.id)
        .order("display_order");
      const items = (cpData || [])
        .map((r: any) => r.products)
        .filter((p: any) => p?.id);
      setProducts(items);

      // Track click
      await supabase.from("link_clicks").insert({
        store_id: storeData.id,
        collection_id: colData.id,
        link_type: "collection",
        referrer: document.referrer || null,
      });

      // OG tags
      const setOg = (prop: string, val: string) => {
        let el = document.querySelector(`meta[property="${prop}"]`);
        if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
        el.setAttribute("content", val);
      };
      setOg("og:title", `${colData.name} | ${storeData.name}`);
      setOg("og:description", colData.description || `Shop the ${colData.name} collection at ${storeData.name} on Storvo`);
      if (colData.cover_image_url) setOg("og:image", colData.cover_image_url);
      document.title = `${colData.name} | ${storeData.name}`;

      setLoading(false);
    })();
  }, [storeSlug, collectionSlug, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!collection || !store) return null;

  const brandColor = store.brand_color || "#6366F1";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(`/store/${storeSlug}`)}
          className="rounded-lg p-1.5 hover:bg-accent transition-colors text-muted-foreground"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{store.name}</p>
          <p className="font-display font-bold text-foreground truncate">{collection.name}</p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate(`/store/${storeSlug}`)}
          style={{ background: brandColor }}
          className="text-white shrink-0"
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Shop All
        </Button>
      </div>

      {/* Cover image */}
      {collection.cover_image_url && (
        <div className="h-44 w-full overflow-hidden">
          <img src={collection.cover_image_url} alt={collection.name} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Collection header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">{collection.name}</h1>
          {collection.description && (
            <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-muted/30 py-16 text-center">
            <p className="text-muted-foreground">No products in this collection yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((product) => {
              const image = (product.product_images || [])
                .sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url;
              const outOfStock = product.track_inventory && product.stock_quantity <= 0;
              return (
                <button
                  key={product.id}
                  onClick={() =>
                    product.slug
                      ? navigate(`/store/${storeSlug}/p/${product.slug}`)
                      : navigate(`/store/${storeSlug}`)
                  }
                  className="group rounded-2xl border border-border/60 bg-card overflow-hidden text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="aspect-square w-full overflow-hidden bg-muted">
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{product.name}</p>
                    <p className="mt-1 text-sm font-bold" style={{ color: brandColor }}>
                      {formatCurrency(Number(product.price))}
                    </p>
                    {outOfStock && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Out of stock</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionPage;
