import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle, Download, ExternalLink, Lock, MessageCircle, ReceiptText, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

const usePaystackScript = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.PaystackPop) { setReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = () => setReady(true);
    document.body.appendChild(script);
    return () => { /* keep script for reuse */ };
  }, []);
  return ready;
};

const Checkout = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, store } = (location.state as any) || {};

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [digitalItems, setDigitalItems] = useState<{ name: string; url: string }[]>([]);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const paystackScriptReady = usePaystackScript();
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
  const paystackEnabled = !!paystackPublicKey && paystackScriptReady;

  if (!cart || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">No cart data. Please go back to the store.</p>
      </div>
    );
  }

  const cartTotal = cart.reduce((sum: number, item: any) => sum + Number(item.product.price) * item.quantity, 0);
  const deliveryFee = store?.delivery_fee ? Number(store.delivery_fee) : 0;
  const orderTotal = cartTotal + deliveryFee;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const finishOrder = async (orderId: string, orderNum: string, paid: boolean) => {
    // Update inventory for physical tracked products
    for (const item of cart) {
      if (item.product.track_inventory && item.product.product_type === "physical") {
        await supabase
          .from("products")
          .update({ stock_quantity: Math.max(0, item.product.stock_quantity - item.quantity) })
          .eq("id", item.product.id);
      }
    }

    if (paid) {
      await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);
      await supabase.from("payments").update({ status: "success" }).eq("order_id", orderId);
    }

    const digital = cart
      .filter((item: any) => item.product.product_type === "digital" && item.product.digital_file_url)
      .map((item: any) => ({ name: item.product.name, url: item.product.digital_file_url }));

    setDigitalItems(digital);
    setOrderNumber(orderNum);
    setOrderComplete(true);
    toast.success("Order placed successfully!");

    // Send email notifications (non-blocking)
    supabase.functions.invoke("send-order-email", { body: { orderId } }).catch(() => {});
  };

  const createOrderRecord = async () => {
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .insert({
        store_id: store.id,
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        address: form.address,
        city: form.city,
        state: form.state,
      })
      .select()
      .single();

    if (custErr) throw custErr;

    const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        store_id: store.id,
        customer_id: customer.id,
        order_number: orderNum,
        subtotal: cartTotal,
        delivery_fee: deliveryFee,
        total: orderTotal,
        status: "pending",
        delivery_address: form.address,
        city: form.city,
        state: form.state,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    const items = cart.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: Number(item.product.price),
      total: Number(item.product.price) * item.quantity,
    }));
    await supabase.from("order_items").insert(items);

    await supabase.from("payments").insert({
      order_id: order.id,
      store_id: store.id,
      amount: orderTotal,
      status: "pending",
    });

    return { order, orderNum };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email && paystackEnabled) {
      toast.error("Email is required for card payment.");
      return;
    }
    setLoading(true);

    try {
      const { order, orderNum } = await createOrderRecord();
      setPlacedOrder({ id: order.id, num: orderNum });

      if (paystackEnabled && form.email) {
        // Open Paystack inline popup
        const handler = window.PaystackPop.setup({
          key: paystackPublicKey,
          email: form.email,
          amount: Math.round(orderTotal * 100), // kobo
          currency: "NGN",
          ref: `order_${order.id}_${Date.now()}`,
          metadata: {
            order_id: order.id,
            store_id: store.id,
            customer_name: form.name,
            customer_phone: form.phone,
          },
          ...(store.paystack_subaccount_code
            ? { subaccount: store.paystack_subaccount_code, bearer: "subaccount" }
            : {}),
          onSuccess: async () => {
            await finishOrder(order.id, orderNum, true);
          },
          onCancel: async () => {
            // Keep the order as pending (COD fallback)
            toast.info("Payment cancelled. Order placed as pending - the seller will contact you.");
            await finishOrder(order.id, orderNum, false);
          },
        });
        handler.openIframe();
        setLoading(false);
      } else {
        // COD / manual payment flow
        await finishOrder(order.id, orderNum, false);
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  if (orderComplete) {
    const hasDigital = digitalItems.length > 0;
    const hasPhysical = cart.some((i: any) => i.product.product_type !== "digital");
    const brandColor = store.brand_color || "#6366F1";

    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-md space-y-4">
          {/* Confirmation header */}
          <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Order Confirmed!</h1>
            <p className="mt-1 text-muted-foreground text-sm">{store.name}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2">
              <ReceiptText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono font-semibold text-foreground">#{orderNumber}</span>
            </div>
            {form.email && (
              <p className="mt-3 text-xs text-muted-foreground">
                Confirmation sent to <span className="font-medium">{form.email}</span>
              </p>
            )}
          </div>

          {/* Order items */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <h2 className="mb-3 font-semibold text-foreground">Items Purchased</h2>
            <div className="space-y-2">
              {cart.map((item: any) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">
                    {item.product.name} × {item.quantity}
                    {item.product.product_type === "digital" && (
                      <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Digital</span>
                    )}
                  </span>
                  <span className="text-muted-foreground">{formatCurrency(Number(item.product.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total Paid</span>
                <span style={{ color: brandColor }}>{formatCurrency(orderTotal)}</span>
              </div>
            </div>
          </div>

          {/* Digital downloads */}
          {hasDigital && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                <Download className="h-4 w-4" /> Your downloads are ready
              </p>
              <div className="space-y-2">
                {digitalItems.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl bg-white dark:bg-emerald-900/20 border border-emerald-100 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    <span className="truncate">{item.name}</span>
                    <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0" />
                  </a>
                ))}
              </div>
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-500">Save these links - they won't appear again.</p>
            </div>
          )}

          {/* Physical delivery note */}
          {hasPhysical && (
            <div className="rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
              The seller will contact you at <span className="font-medium text-foreground">{form.phone}</span> to arrange delivery.
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              variant="hero"
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate(`/order/${orderNumber}`)}
              data-testid="button-view-order"
            >
              <ReceiptText className="h-4 w-4" /> View Order Status
            </Button>

            {store.whatsapp_number && (
              <Button
                size="lg"
                className="w-full gap-2 font-semibold"
                style={{ background: "#25D366" }}
                onClick={() =>
                  window.open(
                    `https://wa.me/${store.whatsapp_number.replace(/\D/g, "")}?text=Hi! I just placed order %23${orderNumber} on your Storvo store.`,
                    "_blank"
                  )
                }
                data-testid="button-whatsapp-seller"
              >
                <MessageCircle className="h-4 w-4" /> Contact Seller
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate(`/store/${slug}`)}
              data-testid="button-continue-shopping"
            >
              <ShoppingBag className="h-4 w-4" /> Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const brandColor = store.brand_color || "#6366F1";
  const hasPhysicalItems = cart.some((i: any) => i.product.product_type !== "digital");

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(`/store/${slug}`, { state: { restoredCart: cart } })}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-2xl font-bold text-foreground">Checkout</h1>
          {paystackEnabled && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Lock className="h-3 w-3" /> Secured by Paystack
            </span>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display font-semibold text-foreground">
                {hasPhysicalItems ? "Delivery Details" : "Your Details"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4" id="checkout-form">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    data-testid="input-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label htmlFor="email">
                    Email{paystackEnabled ? " (required for card payment)" : " (optional)"}
                  </Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required={paystackEnabled}
                    maxLength={255}
                    placeholder={paystackEnabled ? "you@example.com" : "Optional"}
                  />
                </div>
                {hasPhysicalItems && (
                  <>
                    <div>
                      <Label htmlFor="address">Delivery Address</Label>
                      <Input
                        id="address"
                        data-testid="input-address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        required
                        maxLength={255}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          data-testid="input-city"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          required
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          data-testid="input-state"
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          required
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card sticky top-4">
              <h2 className="mb-4 font-display font-semibold text-foreground">Order Summary</h2>
              <div className="space-y-3">
                {cart.map((item: any) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {item.product.name} × {item.quantity}
                      {item.product.product_type === "digital" && (
                        <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Digital</span>
                      )}
                    </span>
                    <span className="text-muted-foreground">{formatCurrency(Number(item.product.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span style={{ color: brandColor }}>{formatCurrency(orderTotal)}</span>
                </div>
              </div>

              <Button
                form="checkout-form"
                type="submit"
                size="lg"
                data-testid="button-place-order"
                className="mt-6 w-full transition-all duration-150 active:scale-95"
                style={{ background: brandColor }}
                disabled={loading}
              >
                {loading ? (
                  <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent inline-block" /> Processing...</>
                ) : paystackEnabled ? (
                  `Pay ${formatCurrency(orderTotal)}`
                ) : (
                  `Place Order · ${formatCurrency(orderTotal)}`
                )}
              </Button>

              {!paystackEnabled && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  The seller will confirm your order and payment details via WhatsApp.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
