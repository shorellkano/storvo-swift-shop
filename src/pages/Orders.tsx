import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { ShoppingCart } from "lucide-react";

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!storeData) { navigate("/setup"); return; }
      setStore(storeData);

      const { data } = await supabase
        .from("orders")
        .select("*, customers(name, phone, email, address, city, state), order_items(*, products(name, price))")
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false });

      setOrders(data || []);
      setLoading(false);
    };

    fetch();
  }, [user, navigate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const statusColor: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    paid: "bg-emerald-50 text-emerald-700",
    shipped: "bg-blue-50 text-blue-700",
    delivered: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
  };

  if (!store || loading) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-display text-lg font-semibold text-foreground">Orders</h2>
          </header>
          <main className="flex-1 p-6 bg-background">
            <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Orders</h1>

            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-16 shadow-card">
                <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold text-foreground">No orders yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Orders will appear here when customers buy from your store</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display font-semibold text-foreground">#{order.order_number}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[order.status] || ""}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.customers?.name} · {order.customers?.phone}
                        </p>
                        {order.customers?.address && (
                          <p className="text-xs text-muted-foreground">
                            {order.customers.address}, {order.customers.city}, {order.customers.state}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-foreground">{formatCurrency(Number(order.total))}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mt-4 border-t border-border pt-3">
                        {order.order_items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm py-1">
                            <span className="text-foreground">{item.products?.name} × {item.quantity}</span>
                            <span className="text-muted-foreground">{formatCurrency(Number(item.total))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Orders;
