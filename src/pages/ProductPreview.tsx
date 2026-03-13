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
        {/* Image carousel */}
        <ProductImageCarousel
          images={images}
          productName={product.name}
        />

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
