import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Zap, Loader2 } from "lucide-react";
import ProductImageCarousel from "@/components/product/ProductImageCarousel";

const ProductPreview = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

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

      const { data: prod } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("id", id)
        .eq("store_id", storeData.id)
        .single();

      if (!prod) { navigate("/dashboard/products"); return; }
      setProduct(prod);
      setLoading(false);
    };

    fetchData();
  }, [user, id, navigate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product || !store) return null;

  const images = (product.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order);
  const brandColor = store.brand_color || "#6366F1";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-border/60 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Preview Mode
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/products/${id}/edit`)}>
            Edit
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Image gallery */}
        <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl bg-muted overflow-hidden">
          {images.length > 0 ? (
            <img
              src={images[activeImage]?.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImage((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-card/80 backdrop-blur-sm p-2 shadow-md hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-card/80 backdrop-blur-sm p-2 shadow-md hover:bg-accent transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-2 w-2 rounded-full transition-all ${i === activeImage ? "bg-primary-foreground scale-125" : "bg-primary-foreground/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((img: any, i: number) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={`h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  i === activeImage ? "border-primary" : "border-transparent opacity-60"
                }`}
              >
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Product details */}
        <div className="mt-6 space-y-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="mt-1 text-2xl font-bold" style={{ color: brandColor }}>
              {formatCurrency(Number(product.price))}
            </p>
          </div>

          {product.description && (
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {product.track_inventory && (
            <p className="text-sm text-muted-foreground">
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              size="lg"
              className="flex-1 font-semibold text-primary-foreground"
              style={{ background: brandColor }}
              onClick={() => {}}
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button
              size="lg"
              className="flex-1 font-semibold"
              variant="outline"
              onClick={() => {}}
            >
              <Zap className="mr-2 h-5 w-5" /> Buy Now
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-2">
            This is a preview. Buttons are disabled in preview mode.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
