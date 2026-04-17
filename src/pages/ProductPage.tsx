import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, MessageCircle, Share2, Check, ZapIcon } from "lucide-react";
import { toast } from "sonner";
import SharePanel from "@/components/product/SharePanel";
import CartDrawer from "@/components/storefront/CartDrawer";
import ProductImageCarousel from "@/components/product/ProductImageCarousel";
import { useCart } from "@/hooks/useCart";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

const setOgMeta = (property: string, content: string) => {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const ProductPage = () => {
  const { storeSlug, productSlug } = useParams<{ storeSlug: string; productSlug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const { cart, addToCart, updateQuantity, removeFromCart, cartCount, cartTotal } = useCart(storeSlug);

  useEffect(() => {
    if (!storeSlug || !productSlug) return;
    (async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", storeSlug)
        .single();
      if (!storeData) { navigate(`/store/${storeSlug}`); return; }
      setStore(storeData);

      const { data: productData } = await supabase
        .from("products")
        .select("*, product_images(*), product_videos(*)")
        .eq("store_id", storeData.id)
        .eq("slug", productSlug)
        .eq("is_active", true)
        .single();

      if (!productData) { navigate(`/store/${storeSlug}`); return; }
      setProduct(productData);

      const img = productData.product_images?.[0]?.image_url;
      if (img) setOgMeta("og:image", img);
      setOgMeta("og:title", `${productData.name} - ${formatCurrency(Number(productData.price))} | ${storeData.name}`);
      setOgMeta("og:description", productData.description || `Buy ${productData.name} from ${storeData.name} on Storvo`);
      setOgMeta("og:url", window.location.href);
      setOgMeta("og:type", "product");
      document.title = `${productData.name} - ${storeData.name} | Storvo`;

      await supabase.from("link_clicks").insert({
        store_id: storeData.id,
        product_id: productData.id,
        link_type: "product",
        referrer: document.referrer || null,
      });

      setLoading(false);
    })();
  }, [storeSlug, productSlug, navigate]);

  const handleAddToCart = () => {
    addToCart(product);
    setAddedToCart(true);
    toast.success(`${product.name} added to cart`, {
      action: { label: "View Cart", onClick: () => setShowCart(true) },
    });
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    const existing = cart.find((i) => i.product.id === product.id);
    const newCart = existing
      ? cart.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...cart, { product, quantity: 1 }];
    addToCart(product);
    navigate(`/store/${storeSlug}/checkout`, { state: { cart: newCart, store } });
  };

  const openWhatsApp = () => {
    if (!store?.whatsapp_number) return;
    const text = `Hi! I'm interested in buying "${product.name}" (${formatCurrency(Number(product.price))}).\n\n${window.location.href}`;
    window.open(`https://wa.me/${store.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product || !store) return null;

  const images = (product.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order);
  const videos = (product.product_videos || []).sort((a: any, b: any) => a.display_order - b.display_order);
  const outOfStock = product.track_inventory && product.stock_quantity <= 0;
  const brandColor = store.brand_color || "#6366F1";
  const deliveryFee = store.delivery_fee ? Number(store.delivery_fee) : 0;
  const productUrl = `${window.location.origin}/store/${storeSlug}/p/${productSlug}`;

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
        <span className="font-display font-semibold text-foreground truncate flex-1">{store.name}</span>
        <button
          onClick={() => setShowShare(!showShare)}
          className="rounded-lg p-1.5 hover:bg-accent transition-colors text-muted-foreground"
          data-testid="button-share"
        >
          <Share2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => setShowCart(true)}
          className="relative rounded-xl bg-accent p-2 transition-colors hover:bg-accent/80"
          data-testid="button-open-cart"
        >
          <ShoppingCart className="h-5 w-5 text-foreground" />
          {cartCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: brandColor }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-28 pt-4 space-y-5">
        {/* Image carousel */}
        <ProductImageCarousel
          images={images}
          videos={videos}
          productName={product.name}
          allowDownload={product.allow_media_download}
        />

        {/* Product Info */}
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground" data-testid="text-product-name">
            {product.name}
          </h1>
          <p className="text-2xl font-bold" style={{ color: brandColor }} data-testid="text-product-price">
            {formatCurrency(Number(product.price))}
          </p>
          {product.track_inventory && (
            <p className="text-sm text-muted-foreground">
              {outOfStock ? "Out of stock" : `${product.stock_quantity} in stock`}
            </p>
          )}
          {product.is_negotiable && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Price negotiable
            </span>
          )}
        </div>

        {product.description && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Description</p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* Share Panel */}
        {showShare && (
          <SharePanel
            productName={product.name}
            productPrice={Number(product.price)}
            productImageUrl={images[0]?.image_url}
            productUrl={productUrl}
            storeSlug={storeSlug!}
          />
        )}

        {/* Cart summary strip (if items in cart) */}
        {cartCount > 0 && (
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm hover:bg-accent/30 transition-colors"
            data-testid="button-view-cart-strip"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShoppingCart className="h-4 w-4" />
              {cartCount} {cartCount === 1 ? "item" : "items"} in cart
            </span>
            <span className="text-sm font-bold" style={{ color: brandColor }}>
              {formatCurrency(cartTotal + deliveryFee)} - View Cart
            </span>
          </button>
        )}

        <div className="h-4" />
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 space-y-2">
        <Button
          size="lg"
          className="w-full font-bold transition-all duration-150 active:scale-95 text-white"
          style={{ background: outOfStock ? undefined : brandColor }}
          disabled={outOfStock}
          onClick={handleBuyNow}
          data-testid="button-buy-now"
        >
          <ZapIcon className="mr-2 h-4 w-4" /> Buy Now - {formatCurrency(Number(product.price))}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={outOfStock}
            onClick={handleAddToCart}
            data-testid="button-add-to-cart"
          >
            {addedToCart ? (
              <><Check className="mr-2 h-4 w-4 text-emerald-500" /> Added!</>
            ) : (
              <><ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart</>
            )}
          </Button>
          {store.whatsapp_number && (
            <Button
              variant="outline"
              size="sm"
              style={{ borderColor: "#25D366", color: "#25D366" }}
              onClick={openWhatsApp}
              data-testid="button-whatsapp"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Chat
            </Button>
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          setShowCart(false);
          navigate(`/store/${storeSlug}/checkout`, { state: { cart, store } });
        }}
        brandColor={brandColor}
        deliveryFee={deliveryFee}
      />
    </div>
  );
};

export default ProductPage;
