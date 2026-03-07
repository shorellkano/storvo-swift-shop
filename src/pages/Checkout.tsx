import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create customer
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

      // Create order
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

      // Create order items
      const items = cart.map((item: any) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: Number(item.product.price),
        total: Number(item.product.price) * item.quantity,
      }));

      await supabase.from("order_items").insert(items);

      // Create payment record
      await supabase.from("payments").insert({
        order_id: order.id,
        store_id: store.id,
        amount: orderTotal,
        status: "pending",
      });

      // Update inventory
      for (const item of cart) {
        if (item.product.track_inventory) {
          await supabase
            .from("products")
            .update({ stock_quantity: Math.max(0, item.product.stock_quantity - item.quantity) })
            .eq("id", item.product.id);
        }
      }

      setOrderNumber(orderNum);
      setOrderComplete(true);
      toast.success("Order placed successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-card text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Order Confirmed! 🎉</h1>
          <p className="mt-2 text-muted-foreground">Your order <span className="font-semibold text-foreground">#{orderNumber}</span> has been placed.</p>
          <p className="mt-4 text-sm text-muted-foreground">The seller will contact you regarding delivery.</p>
          <Button variant="hero" className="mt-6" onClick={() => navigate(`/store/${slug}`)}>
            Back to Store
          </Button>
        </div>
      </div>
    );
  }

  const brandColor = store.brand_color || "#6366F1";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Checkout</h1>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display font-semibold text-foreground">Delivery Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4" id="checkout-form">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required maxLength={20} />
                </div>
                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
                </div>
                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required maxLength={255} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required maxLength={100} />
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card sticky top-4">
              <h2 className="mb-4 font-display font-semibold text-foreground">Order Summary</h2>
              <div className="space-y-3">
                {cart.map((item: any) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-foreground">{item.product.name} × {item.quantity}</span>
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
                className="mt-6 w-full"
                style={{ background: brandColor }}
                disabled={loading}
              >
                {loading ? "Placing order..." : `Pay ${formatCurrency(orderTotal)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
