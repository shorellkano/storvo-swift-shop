import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, Truck, Package, MessageCircle, ArrowLeft, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock, description: "Your order has been received" },
  { key: "paid", label: "Payment Confirmed", icon: CheckCircle, description: "Payment has been confirmed" },
  { key: "processing", label: "Processing", icon: Package, description: "Seller is preparing your order" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "Your order is on the way" },
  { key: "delivered", label: "Delivered", icon: CheckCircle, description: "Order delivered successfully" },
];

const STATUS_ORDER = ["pending", "paid", "processing", "shipped", "delivered"];

const OrderStatus = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(*), order_items(*, products(name, product_type, digital_file_url)), stores(name, slug, whatsapp_number, brand_color)")
        .eq("order_number", orderNumber)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setOrder(data);
      }
      setLoading(false);
    })();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <p className="text-4xl font-bold text-foreground">Order Not Found</p>
          <p className="text-muted-foreground">We couldn't find an order with number #{orderNumber}</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go to Storvo</Button>
        </div>
      </div>
    );
  }

  const store = order.stores;
  const customer = order.customers;
  const items = order.order_items || [];
  const brandColor = store?.brand_color || "#6366F1";
  const currentStatusIdx = STATUS_ORDER.indexOf(order.status);
  const hasPhysical = items.some((i: any) => i.products?.product_type !== "digital");
  const digitalItems = items.filter((i: any) => i.products?.product_type === "digital" && i.products?.digital_file_url && order.status === "paid");
  const cancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        {store?.slug && (
          <button
            onClick={() => navigate(`/store/${store.slug}`)}
            className="rounded-lg p-1.5 hover:bg-accent transition-colors text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{store?.name}</p>
          <p className="font-display font-bold text-foreground">Order #{orderNumber}</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
        {/* Status progress */}
        {!cancelled ? (
          <div className="rounded-2xl border border-border/60 bg-card shadow-card p-5">
            <h2 className="font-semibold text-foreground mb-5">Order Status</h2>
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const stepIdx = STATUS_ORDER.indexOf(step.key);
                const isDone = stepIdx <= currentStatusIdx;
                const isCurrent = stepIdx === currentStatusIdx;
                const isLast = i === STATUS_STEPS.length - 1;
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors shrink-0 ${
                        isDone ? "border-primary bg-primary text-white" : "border-border bg-background text-muted-foreground"
                      }`}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 my-1 ${isDone && !isCurrent ? "bg-primary" : "bg-border"}`} style={{ minHeight: 24 }} />
                      )}
                    </div>
                    <div className="pb-5 pt-0.5 flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                        {isCurrent && <span className="ml-2 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">Current</span>}
                      </p>
                      {isCurrent && <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-5 text-center">
            <p className="font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
            <p className="text-sm text-red-600/80 dark:text-red-500 mt-1">This order has been cancelled.</p>
          </div>
        )}

        {/* Order summary */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm" data-testid={`order-item-${item.id}`}>
                <span className="text-foreground font-medium">
                  {item.products?.name} × {item.quantity}
                </span>
                <span className="text-muted-foreground">{formatCurrency(Number(item.total))}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            {Number(order.delivery_fee) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>{formatCurrency(Number(order.delivery_fee))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span style={{ color: brandColor }}>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Digital downloads (if paid) */}
        {digitalItems.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-5">
            <p className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-400 mb-3">
              <Download className="h-4 w-4" /> Your Downloads
            </p>
            <div className="space-y-2">
              {digitalItems.map((item: any) => (
                <a
                  key={item.id}
                  href={item.products.digital_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl bg-white dark:bg-emerald-900/30 border border-emerald-100 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  <span className="truncate">{item.products.name}</span>
                  <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Delivery info */}
        {hasPhysical && customer?.address && (
          <div className="rounded-2xl border border-border/60 bg-card shadow-card p-5">
            <h2 className="font-semibold text-foreground mb-3">Delivery Address</h2>
            <p className="text-sm text-muted-foreground">
              {customer.address}{customer.city ? `, ${customer.city}` : ""}{customer.state ? `, ${customer.state}` : ""}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{customer.name} · {customer.phone}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {store?.whatsapp_number && (
            <Button
              size="lg"
              className="w-full gap-2 font-semibold"
              style={{ background: "#25D366" }}
              onClick={() =>
                window.open(
                  `https://wa.me/${store.whatsapp_number.replace(/\D/g, "")}?text=Hi! I'm checking on my order %23${orderNumber}`,
                  "_blank"
                )
              }
              data-testid="button-contact-seller"
            >
              <MessageCircle className="h-4 w-4" /> Contact Seller
            </Button>
          )}
          {store?.slug && (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate(`/store/${store.slug}`)}
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
