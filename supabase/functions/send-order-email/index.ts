import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Storvo <orders@storvo.co>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
  }
}

const buyerEmailHtml = (opts: {
  orderNumber: string;
  storeName: string;
  storePhone?: string;
  storeWhatsapp?: string;
  customerName: string;
  items: { name: string; qty: number; unit: number; total: number }[];
  subtotal: number;
  deliveryFee: number;
  orderTotal: number;
  statusUrl: string;
  hasPhysical: boolean;
}) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:system-ui,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 28px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Order Confirmed!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Your order has been placed successfully</p>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;">Hi ${opts.customerName},</p>
      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#6b7280;">Order Number</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#111827;">#${opts.orderNumber}</p>
      </div>

      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Items Ordered</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${opts.items.map(item => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">${item.name} × ${item.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;text-align:right;">${formatCurrency(item.total)}</td>
        </tr>`).join("")}
        ${opts.deliveryFee > 0 ? `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Delivery</td>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;text-align:right;">${formatCurrency(opts.deliveryFee)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#111827;">Total</td>
          <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#6366f1;text-align:right;">${formatCurrency(opts.orderTotal)}</td>
        </tr>
      </table>

      ${opts.hasPhysical ? `<p style="margin:0 0 20px;font-size:14px;color:#6b7280;">The seller from <strong>${opts.storeName}</strong> will contact you to arrange delivery.</p>` : ""}

      <a href="${opts.statusUrl}" style="display:block;background:#6366f1;color:#ffffff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;margin-bottom:20px;">Track Your Order</a>

      ${opts.storeWhatsapp ? `
      <a href="https://wa.me/${opts.storeWhatsapp.replace(/\D/g,"")}?text=Hi! I just placed order %23${opts.orderNumber}" style="display:block;background:#25D366;color:#ffffff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;">Contact Seller on WhatsApp</a>
      ` : opts.storePhone ? `<p style="text-align:center;font-size:14px;color:#6b7280;">Questions? Call the seller: <strong>${opts.storePhone}</strong></p>` : ""}
    </div>
    <div style="background:#f9fafb;padding:16px 28px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Powered by <strong>Storvo</strong> - Nigerian Social Commerce</p>
    </div>
  </div>
</body>
</html>`;

const sellerEmailHtml = (opts: {
  orderNumber: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: { name: string; qty: number; total: number }[];
  orderTotal: number;
  deliveryAddress?: string;
  city?: string;
  state?: string;
  dashboardUrl: string;
  whatsappLink?: string;
}) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:system-ui,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 28px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">New Order!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">${opts.storeName} received a new order</p>
    </div>
    <div style="padding:28px;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#15803d;">Order Number</p>
        <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#14532d;">#${opts.orderNumber}</p>
        <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#16a34a;">${formatCurrency(opts.orderTotal)}</p>
      </div>

      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Customer</h3>
      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${opts.customerName}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">${opts.customerPhone}</p>
        ${opts.customerEmail ? `<p style="margin:4px 0 0;font-size:14px;color:#6b7280;">${opts.customerEmail}</p>` : ""}
        ${opts.deliveryAddress ? `<p style="margin:8px 0 0;font-size:14px;color:#374151;"><strong>Deliver to:</strong><br>${opts.deliveryAddress}${opts.city ? `, ${opts.city}` : ""}${opts.state ? `, ${opts.state}` : ""}</p>` : ""}
      </div>

      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${opts.items.map(item => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">${item.name} × ${item.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;text-align:right;">${formatCurrency(item.total)}</td>
        </tr>`).join("")}
        <tr>
          <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#111827;">Total</td>
          <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#16a34a;text-align:right;">${formatCurrency(opts.orderTotal)}</td>
        </tr>
      </table>

      <a href="${opts.dashboardUrl}" style="display:block;background:#111827;color:#ffffff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;margin-bottom:12px;">View in Dashboard</a>
      ${opts.whatsappLink ? `<a href="${opts.whatsappLink}" style="display:block;background:#25D366;color:#ffffff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;">WhatsApp Customer</a>` : ""}
    </div>
    <div style="background:#f9fafb;padding:16px 28px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Powered by <strong>Storvo</strong></p>
    </div>
  </div>
</body>
</html>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "https://storvo.co";

    const { orderId } = await req.json();
    if (!orderId) return new Response("Missing orderId", { status: 400, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch full order details
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, customers(*), order_items(*, products(name)), stores(name, whatsapp_number, phone_number)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error("Order fetch error:", error);
      return new Response("Order not found", { status: 404, headers: corsHeaders });
    }

    const customer = order.customers;
    const store = order.stores;
    const items = (order.order_items || []).map((i: any) => ({
      name: i.products?.name || "Product",
      qty: i.quantity,
      unit: Number(i.unit_price),
      total: Number(i.total),
    }));
    const hasPhysical = !!customer?.address;
    const statusUrl = `${APP_URL}/order/${order.order_number}`;
    const dashboardUrl = `${APP_URL}/dashboard/orders`;

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set. Email would have been sent:");
      console.log("Buyer:", customer?.email, "Seller order:", order.order_number);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailPromises: Promise<void>[] = [];

    // Buyer confirmation email
    if (customer?.email) {
      const html = buyerEmailHtml({
        orderNumber: order.order_number,
        storeName: store?.name || "the store",
        storePhone: store?.phone_number,
        storeWhatsapp: store?.whatsapp_number,
        customerName: customer.name,
        items,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee || 0),
        orderTotal: Number(order.total),
        statusUrl,
        hasPhysical,
      });
      emailPromises.push(
        sendEmail(RESEND_API_KEY, customer.email, `Order Confirmed #${order.order_number} | ${store?.name}`, html)
      );
    }

    // Seller notification email - fetch store owner's email
    const { data: storeRow } = await supabase
      .from("stores")
      .select("user_id")
      .eq("id", order.store_id)
      .single();

    if (storeRow?.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(storeRow.user_id);
      const sellerEmail = userData?.user?.email;
      if (sellerEmail) {
        const waLink = customer?.phone
          ? `https://wa.me/${customer.phone.replace(/\D/g, "")}?text=Hi ${encodeURIComponent(customer.name)}, your order %23${order.order_number} is being processed!`
          : undefined;
        const html = sellerEmailHtml({
          orderNumber: order.order_number,
          storeName: store?.name || "Your store",
          customerName: customer?.name || "Customer",
          customerPhone: customer?.phone || "",
          customerEmail: customer?.email,
          items,
          orderTotal: Number(order.total),
          deliveryAddress: customer?.address,
          city: customer?.city,
          state: customer?.state,
          dashboardUrl,
          whatsappLink: waLink,
        });
        emailPromises.push(
          sendEmail(RESEND_API_KEY, sellerEmail, `New Order #${order.order_number} - ${formatCurrency(Number(order.total))} | ${store?.name}`, html)
        );
      }
    }

    await Promise.allSettled(emailPromises);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-order-email error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
