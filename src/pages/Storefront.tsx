import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageCircle, Share2, Store, X, Check, ArrowLeft } from "lucide-react";
import ProductImageCarousel from "@/components/product/ProductImageCarousel";
import VerifiedBadge from "@/components/VerifiedBadge";
import { toast } from "sonner";
import ShareSheet from "@/components/dashboard/ShareSheet";

interface CartItem {
  product: any;
  quantity: number;
}

const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [isOwner, setIsOwner] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ url: string; title: string; text?: string } | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!storeData) { setLoading(false); return; }
      setStore(storeData);

      // Set OG meta tags dynamically
      document.title = `${storeData.name} | Shop on Storvo`;
      const setMeta = (property: string, content: string) => {
        let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
        if (!el) {
          el = document.createElement("meta");
          if (property.startsWith("og:")) el.setAttribute("property", property);
          else el.setAttribute("name", property);
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };
      setMeta("og:title", `${storeData.name} | Shop on Storvo`);
      setMeta("og:description", storeData.description || `Shop ${storeData.name} on Storvo`);
      if (storeData.logo_url) setMeta("og:image", storeData.logo_url);
      setMeta("og:url", window.location.href);

      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === storeData.user_id) setIsOwner(true);

      // Check if store is on Pro plan (to remove branding)
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, is_active")
        .eq("store_id", storeData.id)
        .maybeSingle();
      if (sub?.plan === "pro" && sub?.is_active) setIsPro(true);

      const { data: prods } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setProducts(prods || []);
      setLoading(false);
    };

    fetchStore();
  }, [slug]);

  // Restore cart when navigating back from checkout
  useEffect(() => {
    const state = location.state as any;
    if (state?.restoredCart) {
      setCart(state.restoredCart);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    const id = product.id;
    setAddedIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2000);
    toast.success("Added to cart!");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const deliveryFee = store?.delivery_fee ? Number(store.delivery_fee) : 0;
  const orderTotal = cartTotal + deliveryFee;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const shareProduct = (product: any) => {
    const url = `${window.location.origin}/store/${slug}`;
    const text = `Check out ${product.name} - ${formatCurrency(Number(product.price))}`;
    setShareTarget({ url, title: product.name, text });
  };

  const openWhatsApp = (product: any) => {
    if (store.whatsapp_number) {
      window.open(`https://wa.me/${store.whatsapp_number}?text=Hi, I'm interested in ${product.name} (${formatCurrency(Number(product.price))})`, "_blank");
    } else {
      toast.error("Seller hasn't added a WhatsApp number yet");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Store className="mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold text-foreground">Store not found</h1>
        <p className="mt-2 text-muted-foreground">This store doesn't exist or has been deactivated.</p>
        <Link to="/">
          <Button variant="hero" className="mt-6">Go to Storvo</Button>
        </Link>
      </div>
    );
  }

  const brandColor = store.brand_color || "#6366F1";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {isOwner && (
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: brandColor }}>
                {store.name.charAt(0)}
              </div>
            )}
            <span className="font-display font-semibold text-foreground">{store.name}</span>
            {store.is_verified && (
              <VerifiedBadge size="sm" className="ml-1" />
            )}
          </div>
          <button
            onClick={() => { setSelectedProduct(null); setShowCart(!showCart); }}
            className="relative rounded-xl bg-accent p-2 transition-colors hover:bg-accent/80"
          >
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: brandColor }}>
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No products available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const mainImage = product.product_images?.[0]?.image_url;
              const outOfStock = product.track_inventory && product.stock_quantity <= 0;

              return (
                <div
                  key={product.id}
                  className="group cursor-pointer rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-all"
                  onClick={() => { setSelectedProduct(product); }}
                >
                  <div className="relative aspect-square bg-muted">
                    {mainImage ? (
                      <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Store className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
                        <span className="rounded-full bg-card px-3 py-1 text-sm font-semibold text-foreground">Out of stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-display text-sm font-semibold text-foreground truncate">{product.name}</h3>
                    <p className="text-sm font-bold mt-1" style={{ color: brandColor }}>{formatCurrency(Number(product.price))}</p>

                    {/* Full-width Add to Cart on mobile */}
                    <button
                      className="mt-3 w-full inline-flex items-center justify-center rounded-lg text-xs font-semibold h-10 px-3 text-white transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                      style={{ backgroundColor: addedIds[product.id] ? '#22c55e' : brandColor }}
                      disabled={outOfStock}
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                    >
                      {addedIds[product.id] ? (
                        <><Check className="mr-1 h-3.5 w-3.5" /> Added</>
                      ) : (
                        <><ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Add to Cart</>
                      )}
                    </button>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openWhatsApp(product); }}
                        className="flex-1 inline-flex items-center justify-center rounded-lg p-2 transition-colors text-xs font-medium gap-1"
                        style={{ backgroundColor: '#25D366', color: '#fff' }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Chat</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); shareProduct(product); }}
                        className="flex-1 inline-flex items-center justify-center rounded-lg bg-accent p-2 hover:bg-accent/80 transition-colors text-xs font-medium gap-1"
                      >
                        <Share2 className="h-3.5 w-3.5 text-foreground" />
                        <span className="hidden sm:inline text-foreground">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (() => {
        const images = selectedProduct.product_images || [];
        const outOfStock = selectedProduct.track_inventory && selectedProduct.stock_quantity <= 0;
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card shadow-xl">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 z-10 rounded-full bg-card/80 backdrop-blur-sm p-2 shadow-md hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>

              {/* Image carousel */}
              <ProductImageCarousel
                images={images.sort((a: any, b: any) => a.display_order - b.display_order)}
                productName={selectedProduct.name}
              />

              {/* Details */}
              <div className="p-5 space-y-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{selectedProduct.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold" style={{ color: brandColor }}>
                      {formatCurrency(Number(selectedProduct.price))}
                    </p>
                    {store?.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-blue-600 dark:text-blue-400 text-[11px] font-semibold leading-none">
                        Sold by {store.name} - Verified Seller
                      </span>
                    )}
                  </div>
                </div>

                {selectedProduct.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selectedProduct.description}</p>
                )}

                {selectedProduct.track_inventory && (
                  <p className="text-xs text-muted-foreground">
                    {outOfStock ? "Out of stock" : `${selectedProduct.stock_quantity} in stock`}
                  </p>
                )}

                {/* Primary actions */}
                <div className="space-y-3 pt-2">
                  <Button
                    size="lg"
                    className="w-full font-semibold transition-all duration-150 active:scale-95 text-white"
                    style={{ background: brandColor }}
                    disabled={outOfStock}
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full font-semibold transition-all duration-150 active:scale-95"
                    style={{ borderColor: brandColor, color: brandColor }}
                    disabled={outOfStock}
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                      setShowCart(false);
                      navigate(`/store/${slug}/checkout`, { state: { cart: [...cart, { product: selectedProduct, quantity: 1 }], store } });
                    }}
                  >
                    Buy Now
                  </Button>
                </div>

                {/* Secondary actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => openWhatsApp(selectedProduct)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-medium transition-colors hover:opacity-80 text-white"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="h-4 w-4" /> Chat
                  </button>
                  <button
                    onClick={() => shareProduct(selectedProduct)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent p-3 text-sm font-medium hover:bg-accent/80 transition-colors"
                  >
                    <Share2 className="h-4 w-4 text-foreground" /> <span className="text-foreground">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-card p-6 shadow-xl overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowCart(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="font-display text-xl font-bold text-foreground">Your Cart</h2>
            </div>
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 rounded-xl bg-muted/50 p-3">
                      <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {item.product.product_images?.[0]?.image_url && (
                          <img src={item.product.product_images[0].image_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                        <p className="text-sm" style={{ color: brandColor }}>{formatCurrency(Number(item.product.price))}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="h-7 w-7 rounded-lg bg-card border border-border text-sm font-medium">-</button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="h-7 w-7 rounded-lg bg-card border border-border text-sm font-medium">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(cartTotal)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="text-foreground">{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-foreground">Total</span>
                    <span style={{ color: brandColor }}>{formatCurrency(orderTotal)}</span>
                  </div>
                </div>

                <Link to={`/store/${slug}/checkout`} state={{ cart, store }}>
                  <Button size="lg" className="mt-6 w-full transition-all duration-150 active:scale-95 text-white" style={{ background: brandColor }}>
                    Checkout · {formatCurrency(orderTotal)}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Share Sheet */}
      <ShareSheet
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        url={shareTarget?.url || ""}
        title={shareTarget?.title || ""}
        text={shareTarget?.text}
      />

      {/* Footer: hidden for Pro stores */}
      {!isPro && (
        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          Powered by <a href="/" className="font-semibold text-primary hover:underline">Storvo</a>
        </footer>
      )}
    </div>
  );
};

export default Storefront;
