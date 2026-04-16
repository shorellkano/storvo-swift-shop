import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle, Download, ExternalLink, Lock } from "lucide-react";
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
    toast.success("Order placed successfully! 🎉");
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

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-card text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Order Confirmed! 🎉</h1>
          <p className="mt-2 text-muted-foreground">
            Your order <span className="font-semibold text-foreground">#{orderNumber}</span> has been placed.
          </p>

          {/* Digital downloads */}
          {hasDigital && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <Download className="h-4 w-4" />
                Your downloads are ready
              </p>
              <div className="space-y-2">
                {digitalItems.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg bg-white border border-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    <span className="truncate">{item.name}</span>
                    <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0" />
                  </a>
                ))}
              </div>
              <p className="mt-2 text-xs text-emerald-600">Save these links - they won't appear again.</p>
            </div>
          )}

          {/* Physical delivery note */}
          {hasPhysical && (
            <p className="mt-4 text-sm text-muted-foreground">
              The seller will contact you at <span className="font-medium text-foreground">{form.phone}</span> to arrange delivery.
            </p>
          )}

          {/* WhatsApp seller link */}
          {store.whatsapp_number && (
            <a
              href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, "")}?text=Hi! I just placed order %23${orderNumber} on your Storvo store.`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.127 1.535 5.857L.057 23.885l6.195-1.447A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.728.977.997-3.645-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
              Message the seller
            </a>
          )}

          <Button variant="hero" className="mt-6 w-full" onClick={() => navigate(`/store/${slug}`)}>
            Back to Store
          </Button>
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
