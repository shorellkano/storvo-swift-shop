import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Copy,
  Check,
  MessageCircle,
  Instagram,
  Facebook,
  Share2,
  Download,
  MousePointerClick,
  ShoppingCart,
  Wallet,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FirstSalePanelProps {
  store: any;
}

const CHECKLIST_ITEMS = [
  { id: "whatsapp", label: "Share your product on WhatsApp" },
  { id: "instagram_bio", label: "Add your store link to your Instagram bio" },
  { id: "send_10", label: "Send your product link to 10 potential customers" },
  { id: "story_post", label: "Post your product on Instagram or TikTok story" },
];

const formatNGN = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const darkenHex = (hex: string, amount = 0.4) => {
  const { r, g, b } = hexToRgb(hex.startsWith("#") ? hex : "#6366F1");
  return `rgb(${Math.round(r * (1 - amount))}, ${Math.round(g * (1 - amount))}, ${Math.round(b * (1 - amount))})`;
};

const FirstSalePanel = ({ store }: FirstSalePanelProps) => {
  const [firstProduct, setFirstProduct] = useState<any>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Celebration dialog
  const [showCelebration, setShowCelebration] = useState(false);
  const prevOrdersRef = useRef<number | null>(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Checklist
  const checklistKey = `storvo_firstsale_checklist_${store?.id}`;
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(checklistKey) || "{}");
    } catch {
      return {};
    }
  });

  // Celebration seen key
  const celebrationKey = `storvo_firstsale_celebrated_${store?.id}`;

  const productUrl = firstProduct
    ? `${window.location.origin}/store/${store.slug}?product=${firstProduct.slug}`
    : `${window.location.origin}/store/${store.slug}`;

  useEffect(() => {
    if (!store?.id) return;
    loadData();

    // Poll every 30s for new orders (lightweight)
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [store?.id]);

  const loadData = async () => {
    if (!store?.id) return;

    const [productsRes, ordersRes, paymentsRes, viewsRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, slug, price, product_images(*)")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1),
      supabase.from("orders").select("id", { count: "exact" }).eq("store_id", store.id),
      supabase
        .from("payments")
        .select("amount")
        .eq("store_id", store.id)
        .eq("status", "success"),
      supabase.from("product_views").select("id", { count: "exact" }).eq("store_id", store.id),
    ]);

    const product = productsRes.data?.[0] || null;
    const orderCount = ordersRes.count || 0;
    const revenue = (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount), 0);
    const clicks = viewsRes.count || 0;

    setFirstProduct(product);
    setTotalOrders(orderCount);
    setTotalRevenue(revenue);
    setTotalClicks(clicks);

    // Show panel if seller has products
    setVisible(product !== null);

    // Detect first order celebration
    if (prevOrdersRef.current !== null && prevOrdersRef.current === 0 && orderCount > 0) {
      const alreadySeen = localStorage.getItem(celebrationKey);
      if (!alreadySeen) {
        setShowCelebration(true);
        localStorage.setItem(celebrationKey, "1");
      }
    }
    // Also show celebration on initial load if they have orders but haven't seen it
    if (prevOrdersRef.current === null && orderCount > 0) {
      const alreadySeen = localStorage.getItem(celebrationKey);
      if (!alreadySeen) {
        setShowCelebration(true);
        localStorage.setItem(celebrationKey, "1");
      }
    }
    prevOrdersRef.current = orderCount;

    setLoading(false);
  };

  const saveChecklist = (updated: Record<string, boolean>) => {
    setChecklist(updated);
    localStorage.setItem(checklistKey, JSON.stringify(updated));
  };

  const toggleCheck = (id: string) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    saveChecklist(updated);
  };

  const autoCheck = (id: string) => {
    if (!checklist[id]) {
      const updated = { ...checklist, [id]: true };
      saveChecklist(updated);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
    autoCheck("send_10");
  };

  const handleShareWhatsApp = () => {
    const text = `Check out ${firstProduct?.name || store.name} at my store - ${productUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    autoCheck("whatsapp");
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, "_blank");
  };

  const handleShareSnapchat = () => {
    // Snapchat web share
    window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(productUrl)}`, "_blank");
  };

  const handleShareInstagram = () => {
    // Instagram has no web share API - copy link instead
    navigator.clipboard.writeText(productUrl);
    toast.success("Link copied - paste it in your Instagram bio or story!");
    autoCheck("instagram_bio");
    autoCheck("story_post");
  };

  const handleDownloadStatusImage = () => {
    if (!firstProduct || !store) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const brandColor = store.brand_color || "#6366F1";
    const darkColor = darkenHex(brandColor, 0.35);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, brandColor);
    gradient.addColorStop(1, darkColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Semi-transparent overlay for text area
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);

    // Store name
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 52px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(store.name.toUpperCase(), 540, 760);

    // Divider line
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 800);
    ctx.lineTo(880, 800);
    ctx.stroke();

    // Product name (word wrap)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 72px system-ui, sans-serif";
    const name = firstProduct.name;
    const maxWidth = 900;
    const words = name.split(" ");
    let line = "";
    let y = 900;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, 540, y);
        line = word;
        y += 90;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, 540, y);

    // Price
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "bold 60px system-ui, sans-serif";
    ctx.fillText(formatNGN(firstProduct.price), 540, y + 100);

    // URL bar at bottom
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.roundRect(80, 1230, 920, 80, 40);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "36px system-ui, sans-serif";
    const shortUrl = productUrl.replace("https://", "").replace("http://", "");
    ctx.fillText(shortUrl, 540, 1280);

    // Storvo badge top
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.roundRect(40, 40, 220, 60, 30);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("storvo.co", 150, 80);

    // Download
    const link = document.createElement("a");
    link.download = `${store.slug}-${firstProduct.slug}-promo.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    toast.success("Status image downloaded!");
    autoCheck("story_post");
  };

  const checkedCount = CHECKLIST_ITEMS.filter((i) => checklist[i.id]).length;

  if (loading || !visible) return null;

  // If seller has orders and has seen celebration, hide the activation panel
  // but still show progress stats
  const hasFirstSale = totalOrders > 0;

  return (
    <>
      <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              {hasFirstSale ? (
                <>
                  <p className="font-semibold text-foreground text-sm">Your store is live!</p>
                  <p className="text-xs text-muted-foreground">Keep promoting to grow your sales</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground text-sm">Your store is live! Let's help you get your first sale.</p>
                  <p className="text-xs text-muted-foreground">
                    Share your product link to reach your first customer
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-toggle-first-sale-panel"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="p-6 space-y-6">
            {/* Progress stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <MousePointerClick className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold text-foreground" data-testid="stat-product-clicks">
                  {totalClicks}
                </p>
                <p className="text-xs text-muted-foreground">Product Clicks</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <ShoppingCart className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold text-foreground" data-testid="stat-orders-received">
                  {totalOrders}
                </p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <Wallet className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold text-foreground" data-testid="stat-revenue">
                  {formatNGN(totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>

            {/* Share panel */}
            {firstProduct && (
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Share: <span className="font-normal text-muted-foreground">{firstProduct.name}</span>
                </p>

                {/* Product URL display */}
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                  <code className="flex-1 truncate text-xs text-muted-foreground" data-testid="text-product-link">
                    {productUrl.replace("https://", "").replace("http://", "")}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 shrink-0"
                    onClick={handleCopyLink}
                    data-testid="button-copy-product-link"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                {/* Share buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleShareWhatsApp}
                    data-testid="button-share-whatsapp"
                  >
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShareInstagram}
                    data-testid="button-share-instagram"
                  >
                    <Instagram className="mr-1.5 h-3.5 w-3.5" />
                    Instagram
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShareFacebook}
                    data-testid="button-share-facebook"
                  >
                    <Facebook className="mr-1.5 h-3.5 w-3.5" />
                    Facebook
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShareSnapchat}
                    data-testid="button-share-snapchat"
                  >
                    <Share2 className="mr-1.5 h-3.5 w-3.5" />
                    Snapchat
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadStatusImage}
                    data-testid="button-download-status-image"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download Status Image
                  </Button>
                </div>
              </div>
            )}

            {/* Checklist */}
            {!hasFirstSale && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">First Sale Checklist</p>
                  <Badge variant="secondary" className="text-xs">
                    {checkedCount}/{CHECKLIST_ITEMS.length} done
                  </Badge>
                </div>
                <div className="space-y-2">
                  {CHECKLIST_ITEMS.map((item) => {
                    const done = !!checklist[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        data-testid={`checklist-${item.id}`}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                          done
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                            : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            done
                              ? "border-green-500 bg-green-500"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {done && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className={done ? "text-green-700 dark:text-green-400 line-through" : "text-foreground"}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {checkedCount === CHECKLIST_ITEMS.length && (
                  <p className="mt-3 text-center text-xs font-medium text-primary">
                    Amazing work! You've done everything to get your first sale.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* First Sale Celebration Dialog */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="sm:max-w-sm text-center border-0 bg-gradient-to-br from-primary/10 to-background">
          <div className="flex flex-col items-center py-6">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Congratulations!</h2>
            <p className="mb-1 text-lg font-semibold text-primary">
              You just made your first sale on Storvo.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              This is just the beginning. Keep sharing your store and products to grow your sales!
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={() => {
                  setShowCelebration(false);
                  handleShareWhatsApp();
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-celebrate-share-whatsapp"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Share the news on WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCelebration(false)}
                data-testid="button-celebrate-close"
              >
                View Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FirstSalePanel;
