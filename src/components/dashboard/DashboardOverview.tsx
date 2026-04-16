import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, ShoppingCart, Package, Crown, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import FreePlanBanner from "@/components/dashboard/FreePlanBanner";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, isAfter } from "date-fns";

interface DashboardOverviewProps {
  store: any;
}

const DashboardOverview = ({ store }: DashboardOverviewProps) => {
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ day: string; orders: number; revenue: number }[]>([]);
  const notifiedOrderIds = useRef<Set<string>>(new Set());

  const { isPro, productCount, canAddProduct } = useSubscription(store?.id || null);

  const buildChart = (orders: any[]) => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { day: format(d, "EEE"), date: startOfDay(d), orders: 0, revenue: 0 };
    });

    for (const order of orders) {
      const created = startOfDay(new Date(order.created_at));
      const bucket = days.find((d) => d.date.getTime() === created.getTime());
      if (bucket) {
        bucket.orders += 1;
        bucket.revenue += Number(order.total);
      }
    }

    return days.map(({ day, orders, revenue }) => ({ day, orders, revenue }));
  };

  const fetchStats = async () => {
    const [ordersRes, productsRes, paymentsRes, allOrdersRes] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact" }).eq("store_id", store.id),
      supabase.from("products").select("*", { count: "exact" }).eq("store_id", store.id),
      supabase.from("payments").select("amount").eq("store_id", store.id).eq("status", "success"),
      supabase
        .from("orders")
        .select("total, created_at")
        .eq("store_id", store.id)
        .gte("created_at", subDays(new Date(), 7).toISOString()),
    ]);

    const totalRevenue = (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount), 0);
    setStats({ totalRevenue, totalOrders: ordersRes.count || 0, totalProducts: productsRes.count || 0 });
    setChartData(buildChart(allOrdersRes.data || []));

    const { data: recent } = await supabase
      .from("orders")
      .select("*, customers(name, phone)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentOrders(recent || []);

    // Seed known order IDs so we don't notify on first load
    if (recent) {
      for (const o of recent) notifiedOrderIds.current.add(o.id);
    }
  };

  useEffect(() => {
    if (!store) return;
    fetchStats();

    // Real-time new order notification
    const channel = supabase
      .channel(`store-orders-${store.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `store_id=eq.${store.id}` },
        (payload) => {
          const newOrder = payload.new as any;
          if (notifiedOrderIds.current.has(newOrder.id)) return;
          notifiedOrderIds.current.add(newOrder.id);

          toast.success(`New order #${newOrder.order_number}!`, {
            description: `${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(newOrder.total))}`,
            duration: 8000,
            icon: "🛍️",
            action: {
              label: "View orders",
              onClick: () => navigate("/dashboard/orders"),
            },
          });

          // Refresh stats
          fetchStats();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);

  const handleAddProduct = () => {
    if (!canAddProduct) setShowUpgrade(true);
    else navigate("/dashboard/products/new");
  };

  const statCards = [
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Orders", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "text-storvo-indigo bg-accent" },
    { label: "Products", value: stats.totalProducts.toString(), icon: Package, color: "text-amber-600 bg-amber-50" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className="text-muted-foreground">{payload[0].value} order{payload[0].value !== 1 ? "s" : ""}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold text-foreground">Welcome back 👋</h1>
            <Badge variant={isPro ? "default" : "secondary"} className="text-xs">
              {isPro ? <><Crown className="mr-1 h-3 w-3" /> Pro</> : "Free"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Here's what's happening with {store.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isPro && (
            <Button variant="outline" size="sm" onClick={() => setShowUpgrade(true)}>
              <Crown className="mr-1.5 h-3.5 w-3.5" /> Upgrade
            </Button>
          )}
          <Button variant="hero" onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {!isPro && productCount >= 8 && (
        <FreePlanBanner productCount={productCount} onUpgrade={() => setShowUpgrade(true)} />
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 7-day orders chart */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold text-foreground">Orders: last 7 days</h3>
          <Bell className="h-4 w-4 text-muted-foreground" title="Real-time alerts enabled" />
        </div>
        {chartData.every((d) => d.orders === 0) ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">No orders yet this week. Share your store to start selling!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))", radius: 8 }} />
              <Bar dataKey="orders" fill="hsl(244 100% 65%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Recent Orders</h3>
          {recentOrders.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/orders")}>
              View all →
            </Button>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No orders yet. Share your store link to start selling!
          </p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{order.customers?.name}</p>
                  <p className="text-xs text-muted-foreground">#{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(order.total))}</p>
                  <span className={`text-xs font-medium ${order.status === "paid" || order.status === "delivered" ? "text-emerald-600" : order.status === "shipped" ? "text-blue-600" : order.status === "cancelled" ? "text-red-500" : "text-amber-600"}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} storeId={store?.id || null} />
    </div>
  );
};

export default DashboardOverview;
