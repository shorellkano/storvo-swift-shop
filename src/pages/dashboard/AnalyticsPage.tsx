import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { BarChart3, DollarSign, ShoppingCart, Users, TrendingUp, Package } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const AnalyticsPage = () => {
  const { store, role, loading: storeLoading } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7" | "30">("30");

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);

  useEffect(() => {
    if (!store?.id) return;

    const fetchData = async () => {
      const [ordersRes, customersRes, productsRes, itemsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total, status, created_at, customer_id")
          .eq("store_id", store.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("customers")
          .select("id, created_at")
          .eq("store_id", store.id),
        supabase
          .from("products")
          .select("id, name")
          .eq("store_id", store.id),
        supabase
          .from("order_items")
          .select("product_id, quantity, total, order_id")
          .in(
            "order_id",
            (await supabase.from("orders").select("id").eq("store_id", store.id)).data?.map((o: any) => o.id) || []
          ),
      ]);

      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
      setOrderItems(itemsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [store?.id]);

  const days = parseInt(range);
  const cutoff = subDays(new Date(), days);
  const recentOrders = orders.filter((o) => new Date(o.created_at) >= cutoff);
  const paidStatuses = ["paid", "processing", "shipped", "delivered"];

  const totalRevenue = recentOrders
    .filter((o) => paidStatuses.includes(o.status))
    .reduce((s, o) => s + Number(o.total), 0);

  const totalOrders = recentOrders.length;
  const uniqueCustomers = new Set(recentOrders.map((o) => o.customer_id)).size;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / recentOrders.filter((o) => paidStatuses.includes(o.status)).length || 0 : 0;

  const chartData = (() => {
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = subDays(new Date(), days - 1 - i);
      return {
        label: days <= 7
          ? format(d, "EEE")
          : format(d, "MMM d"),
        date: startOfDay(d),
        revenue: 0,
        orders: 0,
      };
    });

    for (const order of recentOrders) {
      if (!paidStatuses.includes(order.status)) continue;
      const created = startOfDay(new Date(order.created_at));
      const bucket = buckets.find((b) => b.date.getTime() === created.getTime());
      if (bucket) {
        bucket.revenue += Number(order.total);
        bucket.orders += 1;
      }
    }

    return buckets.map(({ label, revenue, orders }) => ({ label, revenue, orders }));
  })();

  const topProducts = (() => {
    const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();
    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) continue;
      const existing = productMap.get(item.product_id) || { name: product.name, revenue: 0, quantity: 0 };
      existing.revenue += Number(item.total);
      existing.quantity += item.quantity;
      productMap.set(item.product_id, existing);
    }
    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  })();

  const statusBreakdown = (() => {
    const counts: Record<string, number> = {};
    for (const order of recentOrders) {
      counts[order.status] = (counts[order.status] || 0) + 1;
    }
    return counts;
  })();

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    processing: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
    shipped: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className="text-muted-foreground">{formatCurrency(payload[0].value)}</p>
        {payload[1] && (
          <p className="text-muted-foreground">{payload[1].value} order{payload[1].value !== 1 ? "s" : ""}</p>
        )}
      </div>
    );
  };

  if (!store || storeLoading) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} role={role} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4 gap-3">
            <SidebarTrigger className="mr-1" />
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground flex-1">Analytics</h2>
            <div className="flex gap-1">
              {(["7", "30"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    range === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 bg-background space-y-5">
            {loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
                  ))}
                </div>
                <div className="h-64 rounded-2xl bg-muted/50 animate-pulse" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-16 shadow-card">
                <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold text-foreground">No data yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Analytics will appear here once you start receiving orders
                </p>
              </div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="rounded-lg p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">Revenue</p>
                    </div>
                    <p className="font-display text-lg font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="rounded-lg p-1.5 bg-accent text-primary">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">Orders</p>
                    </div>
                    <p className="font-display text-lg font-bold text-foreground">{totalOrders}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="rounded-lg p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                        <Users className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">Customers</p>
                    </div>
                    <p className="font-display text-lg font-bold text-foreground">{uniqueCustomers}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="rounded-lg p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">Avg. Order</p>
                    </div>
                    <p className="font-display text-lg font-bold text-foreground">{formatCurrency(avgOrderValue)}</p>
                  </div>
                </div>

                {/* Revenue Chart */}
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-5">
                    Revenue: last {days} days
                  </h3>
                  {chartData.every((d) => d.revenue === 0) ? (
                    <div className="flex h-44 items-center justify-center">
                      <p className="text-sm text-muted-foreground">No paid orders in this period.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} barSize={days <= 7 ? 32 : 14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          interval={days <= 7 ? 0 : "preserveStartEnd"}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          width={50}
                          tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))", radius: 8 }} />
                        <Bar dataKey="revenue" fill="hsl(244 100% 65%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {/* Top Products */}
                  <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4">Top Products</h3>
                    {topProducts.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No product sales yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {topProducts.map((product, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-foreground">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-foreground shrink-0 ml-3">
                              {formatCurrency(product.revenue)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Order Status Breakdown */}
                  <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4">Order Status</h3>
                    {Object.keys(statusBreakdown).length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No orders in this period.</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(statusBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .map(([status, count]) => {
                            const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                            return (
                              <div key={status}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status] || "bg-muted text-muted-foreground"}`}>
                                    {status}
                                  </span>
                                  <span className="text-sm text-muted-foreground">{count} ({pct}%)</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AnalyticsPage;
