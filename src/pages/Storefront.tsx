import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, MessageCircle, Share2, Store, X, Check, ArrowLeft, HandshakeIcon, Copy, Zap } from "lucide-react";
import ProductImageCarousel from "@/components/product/ProductImageCarousel";
import VerifiedBadge from "@/components/VerifiedBadge";
import { toast } from "sonner";
import ShareSheet from "@/components/dashboard/ShareSheet";
import CartDrawer from "@/components/storefront/CartDrawer";
import { useCart } from "@/hooks/useCart";
import storvoLogo from "@/assets/storvo-logo.png";

const SOCIAL_DOMAINS: Record<string, string> = {
  "instagram.com": "Instagram",
  "tiktok.com": "TikTok",
  "facebook.com": "Facebook",
  "snapchat.com": "Snapchat",
  "wa.me": "WhatsApp",
  "t.co": "Twitter / X",
  "twitter.com": "Twitter / X",
  "x.com": "X (Twitter)",
  "telegram.org": "Telegram",
  "pinterest.com": "Pinterest",
  "youtube.com": "YouTube",
};

const REF_MAP: Record<string, string> = {
  instagram: "Instagram", ig: "Instagram", insta: "Instagram",
  tiktok: "TikTok", tt: "TikTok",
  facebook: "Facebook", fb: "Facebook",
  whatsapp: "WhatsApp", wa: "WhatsApp",
  twitter: "Twitter / X", tw: "Twitter / X", x: "X (Twitter)",
  snapchat: "Snapchat", snap: "Snapchat",
  telegram: "Telegram", tg: "Telegram",
};

const detectSocialSource = (): string | null => {
  const ref = document.referrer;
  for (const domain of Object.keys(SOCIAL_DOMAINS)) {
    if (ref.includes(domain)) return SOCIAL_DOMAINS[domain];
  }
  const params = new URLSearchParams(window.location.search);
  const refParam = (params.get("ref") || params.get("utm_source") || "").toLowerCase();
  if (refParam && REF_MAP[refParam]) return REF_MAP[refParam];
  return null;
};

const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const { cart, addToCart: hookAddToCart, updateQuantity, removeFromCart, cartCount, cartTotal } = useCart(slug);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [isOwner, setIsOwner] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ url: string; title: string; text?: string } | null>(null);
  const [isSocialMode, setIsSocialMode] = useState(false);
  const [socialSource, setSocialSource] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Make Offer state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
  const [offerForm, setOfferForm] = useState({ buyerName: "", buyerPhone: "", offeredPrice: "", message: "" });

  useEffect(() => {
    const source = detectSocialSource();
    if (source) { setIsSocialMode(true); setSocialSource(source); }
  }, []);

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
      setMeta("og:type", "website");

      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === storeData.user_id) setIsOwner(true);

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, is_active")
        .eq("store_id", storeData.id)
        .maybeSingle();
      if (sub?.plan === "pro" && sub?.is_active) setIsPro(true);

      const { data: prods } = await supabase
        .from("products")
        .select("*, product_images(*), product_videos(*)")
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      const productList = prods || [];
      setProducts(productList);
      setLoading(false);

      const productSlug = new URLSearchParams(window.location.search).get("product");
      if (productSlug) {
        const target = productList.find((p: any) => p.slug === productSlug);
        if (target) {
          setSelectedProduct(target);
          trackProductView(target.id, storeData.id);
        }
      }
    };

    fetchStore();
  }, [slug]);

  const trackProductView = async (productId: string, storeId: string) => {
    try {
      await supabase.from("product_views").insert({ product_id: productId, store_id: storeId });
    } catch {
      // View tracking never breaks storefront
    }
  };

  const openProduct = (product: any, storeId: string) => {
    setSelectedProduct(product);
    setRelatedProducts([]);
    setOfferSent(false);
    setOfferForm({ buyerName: "", buyerPhone: "", offeredPrice: "", message: "" });
    trackProductView(product.id, storeId);

    // Fetch related products
    supabase
      .from("product_related")
      .select("related_product_id, display_order, products:related_product_id(id, name, price, product_images(image_url, display_order))")
      .eq("product_id", product.id)
      .order("display_order")
      .then(({ data }) => {
        const items = (data || []).map((r: any) => r.products).filter(Boolean);
        setRelatedProducts(items);
      });

    // Update OG tags for product sharing
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const mainImg = product.product_images?.[0]?.image_url;
    if (mainImg) setMeta("og:image", mainImg);
    setMeta("og:title", `${product.name} - ${formatCurrency(Number(product.price))} | ${store?.name}`);
    setMeta("og:description", product.description || `Buy ${product.name} from ${store?.name} on Storvo`);
  };

  const addToCart = (product: any) => {
    hookAddToCart(product);
    const id = product.id;
    setAddedIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setAddedIds((prev) => { const next = { ...prev }; delete next[id]; return next; }), 2000);
    toast.success("Added to cart!");
  };

  const deliveryFee = store?.delivery_fee ? Number(store.delivery_fee) : 0;
  const orderTotal = cartTotal + deliveryFee;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const productShareUrl = (product: any) =>
    product.slug
      ? `${window.location.origin}/store/${slug}/p/${product.slug}`
      : `${window.location.origin}/store/${slug}`;

  const shareProduct = (product: any) => {
    const url = productShareUrl(product);
    const text = `Check out ${product.name} - ${formatCurrency(Number(product.price))}`;
    setShareTarget({ url, title: product.name, text });
  };

  const openWhatsApp = (product: any) => {
    if (store.whatsapp_number) {
      window.open(`https://wa.me/${store.whatsapp_number}?text=Hi, I'm interested in ${product.name} (${formatCurrency(Number(product.price))}) ${productShareUrl(product)}`, "_blank");
    } else {
      toast.error("Seller hasn't added a WhatsApp number yet");
    }
  };

  const copyLink = (product: any) => {
    navigator.clipboard.writeText(productShareUrl(product)).then(() => toast.success("Link copied!"));
  };

  const submitOffer = async () => {
    if (!selectedProduct || !store) return;
    if (!offerForm.buyerName || !offerForm.buyerPhone || !offerForm.offeredPrice) {
      toast.error("Please fill in your name, phone number, and offer amount");
      return;
    }
    setOfferSubmitting(true);
    try {
      const { error } = await supabase.from("price_offers").insert({
        product_id: selectedProduct.id,
        store_id: store.id,
        buyer_name: offerForm.buyerName,
        buyer_phone: offerForm.buyerPhone,
        offered_price: parseFloat(offerForm.offeredPrice),
        message: offerForm.message || null,
      } as any);
      if (error) throw error;
      setOfferSent(true);
      toast.success("Offer sent to seller!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send offer");
    } finally {
      setOfferSubmitting(false);
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
        <Link to="/"><Button variant="hero" className="mt-6">Go to Storvo</Button></Link>
      </div>
    );
  }

  const brandColor = store.brand_color || "#6366F1";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {isOwner && (
              <button onClick={() => navigate("/dashboard")} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
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
            {store.is_verified && <VerifiedBadge size="sm" className="ml-1" />}
          </div>
          <button
            onClick={() => { setSelectedProduct(null); setShowCart(!showCart); }}
            className="relative rounded-xl bg-accent p-2 transition-colors hover:bg-accent/80"
            data-testid="button-open-cart"
          >
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: brandColor }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className={isSocialMode ? "max-w-lg mx-auto px-4 py-6" : "mx-auto max-w-5xl px-4 py-8"}>
        {/* Social mode banner */}
        {isSocialMode && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-medium text-foreground">
              Quick checkout enabled - tap <span className="font-bold">Buy Now</span> on any product
            </p>
          </div>
        )}

        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No products available yet. Check back soon!</p>
          </div>
        ) : isSocialMode ? (
          /* Social Commerce Mode - vertical scroll, full-width conversion cards */
          <div className="space-y-5">
            {products.map((product) => {
              const mainImage = product.product_images?.[0]?.image_url;
              const outOfStock = product.track_inventory && product.stock_quantity <= 0;
              const hasVideo = (product.product_videos?.length || 0) > 0;
              const isAdded = addedIds[product.id];
              return (
                <div key={product.id} className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card">
                  <div
                    className="relative aspect-[4/3] bg-muted cursor-pointer"
                    onClick={() => openProduct(product, store.id)}
                  >
                    {mainImage ? (
                      <img src={mainImage} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Store className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                        <span className="rounded-full bg-card px-3 py-1 text-sm font-semibold text-foreground">Out of stock</span>
                      </div>
                    )}
                    {hasVideo && (
                      <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white font-medium">Video</div>
                    )}
                    {/* Tap-to-view overlay hint */}
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white">Tap to view</div>
                  </div>

                  <div className="p-4">
                    <h3
                      className="font-display text-lg font-bold text-foreground cursor-pointer hover:opacity-80"
                      onClick={() => openProduct(product, store.id)}
                    >
                      {product.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xl font-bold" style={{ color: brandColor }}>
                        {formatCurrency(Number(product.price))}
                      </span>
                      {product.is_negotiable && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2 py-0.5">Negotiable</span>
                      )}
                    </div>
                    {product.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                    <div className="mt-4 space-y-2">
                      <button
                        disabled={outOfStock}
                        className="w-full h-12 rounded-xl text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: outOfStock ? undefined : brandColor }}
                        onClick={() => navigate(`/store/${slug}/checkout`, { state: { cart: [{ product, quantity: 1 }], store } })}
                      >
                        <Zap className="h-4 w-4" />
                        Buy Now - {formatCurrency(Number(product.price))}
                      </button>
                      <button
                        disabled={outOfStock}
                        className="w-full h-10 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 border border-border/60 bg-accent hover:bg-accent/80 text-foreground flex items-center justify-center gap-2"
                        onClick={() => addToCart(product)}
                      >
                        {isAdded ? <><Check className="h-4 w-4 text-green-600" /> Added to Cart</> : <><ShoppingCart className="h-4 w-4" /> Add to Cart</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Standard Mode - product grid */
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const mainImage = product.product_images?.[0]?.image_url;
              const outOfStock = product.track_inventory && product.stock_quantity <= 0;
              const hasVideo = (product.product_videos?.length || 0) > 0;
              const isAdded = addedIds[product.id];

              return (
                <div
                  key={product.id}
                  className="group cursor-pointer rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-all"
                  onClick={() => { openProduct(product, store.id); }}
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
                      <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                        <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground">Out of stock</span>
                      </div>
                    )}
                    {hasVideo && (
                      <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white font-medium">Video</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-foreground line-clamp-2">{product.name}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold" style={{ color: brandColor }}>{formatCurrency(Number(product.price))}</p>
                      {product.is_negotiable && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-1.5 py-0.5">Negotiable</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        disabled={outOfStock}
                        className="flex-1 inline-flex items-center justify-center rounded-lg p-2 text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: isAdded ? "#16a34a" : brandColor }}
                      >
                        {isAdded ? <><Check className="h-3.5 w-3.5 mr-1" /> Added</> : "Add to Cart"}
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
        const images = (selectedProduct.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order);
        const videos = (selectedProduct.product_videos || []).sort((a: any, b: any) => a.display_order - b.display_order);
        const outOfStock = selectedProduct.track_inventory && selectedProduct.stock_quantity <= 0;
        const isNegotiable = selectedProduct.is_negotiable;
        const allowDownload = selectedProduct.allow_media_download;

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />

            {/* Modal: flex column so sticky buy bar can sit at bottom */}
            <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-card shadow-xl">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 z-10 rounded-full bg-card/80 backdrop-blur-sm p-2 shadow-md hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <ProductImageCarousel
                  images={images}
                  videos={videos}
                  productName={selectedProduct.name}
                  allowDownload={allowDownload}
                />

                <div className="p-5 space-y-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{selectedProduct.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold" style={{ color: brandColor }}>
                        {formatCurrency(Number(selectedProduct.price))}
                      </p>
                      {isNegotiable && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                          Negotiable
                        </span>
                      )}
                      {store?.is_verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
                          Verified Seller
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

                  {/* Related Products */}
                  {relatedProducts.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Frequently Bought Together</p>
                      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1" data-testid="related-products-row">
                        {relatedProducts.map((rp) => {
                          const rpImage = (rp.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order)[0]?.image_url;
                          return (
                            <button
                              key={rp.id}
                              type="button"
                              onClick={() => {
                                const full = products.find((p) => p.id === rp.id);
                                if (full && store) openProduct(full, store.id);
                              }}
                              className="flex-shrink-0 w-28 rounded-xl overflow-hidden border border-border/60 bg-background hover:border-primary/60 transition-colors text-left"
                              data-testid={`related-product-card-${rp.id}`}
                            >
                              <div className="h-24 w-full bg-muted">
                                {rpImage ? (
                                  <img src={rpImage} alt={rp.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full bg-muted/60" />
                                )}
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{rp.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(Number(rp.price))}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Standard mode: buttons inside scroll area */}
                  {!isSocialMode && (
                    <>
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
                            const existing = cart.find(i => i.product.id === selectedProduct.id);
                            const newCart = existing
                              ? cart.map(i => i.product.id === selectedProduct.id ? { ...i, quantity: i.quantity + 1 } : i)
                              : [...cart, { product: selectedProduct, quantity: 1 }];
                            hookAddToCart(selectedProduct);
                            setSelectedProduct(null);
                            setShowCart(false);
                            navigate(`/store/${slug}/checkout`, { state: { cart: newCart, store } });
                          }}
                        >
                          Buy Now
                        </Button>
                        {isNegotiable && (
                          <Button size="lg" variant="outline" className="w-full font-semibold" onClick={() => setShowOfferModal(true)}>
                            <HandshakeIcon className="mr-2 h-4 w-4" /> Make an Offer
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openWhatsApp(selectedProduct)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-medium transition-colors hover:opacity-80 text-white"
                          style={{ backgroundColor: '#25D366' }}
                        >
                          <MessageCircle className="h-4 w-4" /> Chat
                        </button>
                        <button
                          onClick={() => copyLink(selectedProduct)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent p-3 text-sm font-medium hover:bg-accent/80 transition-colors"
                        >
                          <Copy className="h-4 w-4 text-foreground" /> <span className="text-foreground">Copy Link</span>
                        </button>
                        <button
                          onClick={() => shareProduct(selectedProduct)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent p-3 text-sm font-medium hover:bg-accent/80 transition-colors"
                        >
                          <Share2 className="h-4 w-4 text-foreground" /> <span className="text-foreground">Share</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Social mode: extra padding so sticky bar doesn't cover content */}
                  {isSocialMode && <div className="h-2" />}
                </div>
              </div>

              {/* Social mode: sticky Buy Now bar */}
              {isSocialMode && (
                <div className="shrink-0 border-t border-border/60 bg-card p-3 space-y-2 rounded-b-2xl">
                  <button
                    disabled={outOfStock}
                    className="w-full h-12 rounded-xl text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: outOfStock ? undefined : brandColor }}
                    onClick={() => {
                      const existing = cart.find(i => i.product.id === selectedProduct.id);
                      const newCart = existing
                        ? cart.map(i => i.product.id === selectedProduct.id ? { ...i, quantity: i.quantity + 1 } : i)
                        : [...cart, { product: selectedProduct, quantity: 1 }];
                      hookAddToCart(selectedProduct);
                      setSelectedProduct(null);
                      navigate(`/store/${slug}/checkout`, { state: { cart: newCart, store } });
                    }}
                  >
                    <Zap className="h-4 w-4" /> Buy Now - {formatCurrency(Number(selectedProduct.price))}
                  </button>
                  <div className="flex gap-2">
                    <button
                      disabled={outOfStock}
                      className="flex-1 h-9 rounded-lg border border-border/60 bg-accent text-sm font-medium text-foreground hover:bg-accent/80 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                    </button>
                    <button
                      className="flex-1 h-9 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: '#25D366' }}
                      onClick={() => openWhatsApp(selectedProduct)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Chat
                    </button>
                    {isNegotiable && (
                      <button
                        className="flex-1 h-9 rounded-lg border border-border/60 bg-accent text-sm font-medium text-foreground hover:bg-accent/80 transition-colors flex items-center justify-center gap-1.5"
                        onClick={() => setShowOfferModal(true)}
                      >
                        <HandshakeIcon className="h-3.5 w-3.5" /> Offer
                      </button>
                    )}
                    <button
                      className="h-9 w-9 rounded-lg border border-border/60 bg-accent text-foreground hover:bg-accent/80 transition-colors flex items-center justify-center shrink-0"
                      onClick={() => shareProduct(selectedProduct)}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Make Offer Modal */}
      {showOfferModal && selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setShowOfferModal(false)} />
          <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card shadow-xl p-6">
            <button
              onClick={() => setShowOfferModal(false)}
              className="absolute top-4 right-4 rounded-full bg-accent p-2 hover:bg-accent/80 transition-colors"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>

            {offerSent ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Offer Sent!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The seller will review your offer and get back to you.
                </p>
                <Button className="mt-6 w-full" onClick={() => { setShowOfferModal(false); }} style={{ background: brandColor }}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <h3 className="font-display text-xl font-bold text-foreground">Make an Offer</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProduct.name} - Listed at {formatCurrency(Number(selectedProduct.price))}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="offerName">Your Name</Label>
                    <Input
                      id="offerName"
                      value={offerForm.buyerName}
                      onChange={(e) => setOfferForm({ ...offerForm, buyerName: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="offerPhone">WhatsApp / Phone Number</Label>
                    <Input
                      id="offerPhone"
                      value={offerForm.buyerPhone}
                      onChange={(e) => setOfferForm({ ...offerForm, buyerPhone: e.target.value })}
                      placeholder="e.g. 08012345678"
                      type="tel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="offerPrice">Your Offer (₦)</Label>
                    <Input
                      id="offerPrice"
                      type="number"
                      min="1"
                      value={offerForm.offeredPrice}
                      onChange={(e) => setOfferForm({ ...offerForm, offeredPrice: e.target.value })}
                      placeholder="Enter your offer amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="offerMsg">Message (optional)</Label>
                    <Textarea
                      id="offerMsg"
                      value={offerForm.message}
                      onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                      placeholder="Reason for offer or any details..."
                      rows={2}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="w-full text-white"
                    style={{ background: brandColor }}
                    onClick={submitOffer}
                    disabled={offerSubmitting}
                  >
                    <HandshakeIcon className="mr-2 h-4 w-4" />
                    {offerSubmitting ? "Sending..." : "Send Offer to Seller"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          setShowCart(false);
          navigate(`/store/${slug}/checkout`, { state: { cart, store } });
        }}
        brandColor={brandColor}
        deliveryFee={deliveryFee}
      />

      <ShareSheet
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        url={shareTarget?.url || ""}
        title={shareTarget?.title || ""}
        text={shareTarget?.text}
      />

      {/* Footer */}
      {!isPro ? (
        <footer className="border-t border-border/60 py-8 text-center bg-card/50">
          <div className="flex flex-col items-center gap-3">
            <img src={storvoLogo} alt="Storvo" className="h-8 w-auto rounded-md" />
            <p className="text-sm font-semibold text-foreground">Sell with Storvo</p>
            <p className="text-xs text-muted-foreground">Turn your social media into a store - it's free</p>
            <a href="/" className="mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90" style={{ background: brandColor }}>
              Start your free store
            </a>
          </div>
        </footer>
      ) : null}
    </div>
  );
};

export default Storefront;
