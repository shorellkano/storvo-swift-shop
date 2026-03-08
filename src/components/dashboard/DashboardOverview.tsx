import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, ShoppingCart, Package, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import FreePlanBanner from "@/components/dashboard/FreePlanBanner";
import UpgradeModal from "@/components/dashboard/UpgradeModal";

interface DashboardOverviewProps {
  store: any;
}

const DashboardOverview = ({ store }: DashboardOverviewProps) => {
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const { isPro, productCount, canAddProduct } = useSubscription(store?.id || null);

  useEffect(() => {
    if (!store) return;

    const fetchStats = async () => {
      const [ordersRes, productsRes, paymentsRes] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact" }).eq("store_id", store.id),
        supabase.from("products").select("*", { count: "exact" }).eq("store_id", store.id),
        supabase.from("payments").select("amount").eq("store_id", store.id).eq("status", "success"),
      ]);

      const totalRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalRevenue,
        totalOrders: ordersRes.count || 0,
        totalProducts: productsRes.count || 0,
      });

      const { data: recent } = await supabase
        .from("orders")
        .select("*, customers(name, phone)")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentOrders(recent || []);
    };

    fetchStats();
  }, [store]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const handleAddProduct = () => {
    if (!canAddProduct) {
      setShowUpgrade(true);
    } else {
      navigate("/dashboard/products/new");
    }
  };

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-storvo-indigo bg-accent",
    },
    {
      label: "Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold text-foreground">Welcome back 👋</h1>
            <Badge variant={isPro ? "default" : "secondary"} className="text-xs">
              {isPro ? (
                <><Crown className="mr-1 h-3 w-3" /> Pro</>
              ) : (
                "Free"
              )}
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
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Free plan banner when approaching limit */}
      {!isPro && productCount >= 7 && (
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

      {/* Recent Orders */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Orders</h3>
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
                  <span className={`text-xs font-medium ${
                    order.status === "paid" ? "text-emerald-600" : "text-amber-600"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
};

export default DashboardOverview;
