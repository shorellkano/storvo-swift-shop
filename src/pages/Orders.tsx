import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { ShoppingCart, ChevronDown, Search, Copy, Check, ExternalLink, TrendingUp, Clock, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400", dot: "bg-amber-400" },
  { value: "paid", label: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  { value: "processing", label: "Processing", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400", dot: "bg-purple-500" },
  { value: "shipped", label: "Shipped", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400", dot: "bg-blue-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400", dot: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400", dot: "bg-red-400" },
];

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

const Orders = () => {
  const { store, role, loading: storeLoading } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const getStatusStyle = (status: string) =>
    ORDER_STATUSES.find((s) => s.value === status)?.color || "bg-gray-50 text-gray-700";

  const fetchOrders = async () => {
    if (!store?.id) return;
    const { data } = await supabase
      .from("orders")
      .select("*, customers(name, phone, email, address, city, state), order_items(*, products(name, price))")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setOrdersLoading(false);
  };

  useEffect(() => {
    if (!store?.id) return;
    fetchOrders();

    // Real-time subscription for new orders
    const channel = supabase
      .channel(`orders:${store.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `store_id=eq.${store.id}` },
        () => {
          fetchOrders();
          toast.success("New order received!");
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `store_id=eq.${store.id}` },
        (payload) => {
          setOrders((prev) => prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store?.id]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) {
      toast.error("Failed to update order status");
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      const label = ORDER_STATUSES.find((s) => s.value === newStatus)?.label;
      toast.success(`Order marked as ${label}`);
    }
    setUpdatingId(null);
  };

  const copyStatusLink = async (orderNumber: string) => {
    const url = `${window.location.origin}/order/${orderNumber}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(orderNumber);
    toast.success("Order status link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = orders
    .filter((o) => filterStatus === "all" || o.status === filterStatus)
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.order_number?.toLowerCase().includes(q) ||
        o.customers?.name?.toLowerCase().includes(q) ||
        o.customers?.phone?.includes(q)
      );
    });

  // Stats
  const totalRevenue = orders.filter(o => ["paid", "shipped", "delivered"].includes(o.status)).reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const todayCount = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;

  if (!store || storeLoading) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} role={role} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4 gap-3">
            <SidebarTrigger className="mr-1" />
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground flex-1">Orders</h2>
            {orders.length > 0 && (
              <span className="text-sm text-muted-foreground">{orders.length} total</span>
            )}
          </header>

          <main className="flex-1 p-4 md:p-6 bg-background space-y-4">
            {/* Stats */}
            {orders.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="h-4 w-4 text-emerald-500" />
                    <p className="text-xs text-muted-foreground font-medium">Revenue</p>
                  </div>
                  <p className="font-display text-lg font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <p className="text-xs text-muted-foreground font-medium">Pending</p>
                  </div>
                  <p className="font-display text-lg font-bold text-foreground">{pendingCount}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground font-medium">Today</p>
                  </div>
                  <p className="font-display text-lg font-bold text-foreground">{todayCount}</p>
                </div>
              </div>
            )}

            {/* Search + filter */}
            {orders.length > 0 && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by name, phone, or order #"
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-testid="input-search-orders"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setFilterStatus(tab.value)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        filterStatus === tab.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                      data-testid={`filter-${tab.value}`}
                    >
                      {tab.label}
                      {tab.value !== "all" && (
                        <span className="ml-1 opacity-70">
                          ({orders.filter(o => o.status === tab.value).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Orders list */}
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-16 shadow-card">
                <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold text-foreground">No orders yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Orders will appear here when customers buy from your store</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
                <p className="text-muted-foreground">No orders match your search.</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(""); setFilterStatus("all"); }}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((order) => {
                  const statusInfo = ORDER_STATUSES.find((s) => s.value === order.status);
                  return (
                    <div key={order.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card" data-testid={`order-card-${order.id}`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-semibold text-foreground">#{order.order_number}</h3>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${statusInfo?.color || ""}`}
                                  disabled={updatingId === order.id}
                                  data-testid={`status-badge-${order.id}`}
                                >
                                  {updatingId === order.id ? (
                                    <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                  ) : (
                                    <span className={`h-1.5 w-1.5 rounded-full ${statusInfo?.dot}`} />
                                  )}
                                  {statusInfo?.label || order.status}
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-36">
                                {ORDER_STATUSES.map((s) => (
                                  <DropdownMenuItem
                                    key={s.value}
                                    disabled={s.value === order.status}
                                    onClick={() => handleStatusChange(order.id, s.value)}
                                    className="cursor-pointer"
                                  >
                                    <span className={`mr-2 h-2 w-2 rounded-full inline-block ${s.dot}`} />
                                    {s.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {order.customers?.name} · {order.customers?.phone}
                          </p>
                          {order.customers?.email && (
                            <p className="text-xs text-muted-foreground">{order.customers.email}</p>
                          )}
                          {order.customers?.address && (
                            <p className="text-xs text-muted-foreground">
                              {order.customers.address}{order.customers.city ? `, ${order.customers.city}` : ""}{order.customers.state ? `, ${order.customers.state}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-lg font-bold text-foreground">{formatCurrency(Number(order.total))}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Order items */}
                      {order.order_items?.length > 0 && (
                        <div className="mt-3 border-t border-border pt-3 space-y-1">
                          {order.order_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-foreground">{item.products?.name} × {item.quantity}</span>
                              <span className="text-muted-foreground">{formatCurrency(Number(item.total))}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action row */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        {order.customers?.phone && (
                          <a
                            href={`https://wa.me/${order.customers.phone.replace(/\D/g, "")}?text=Hi ${order.customers.name}, your Storvo order %23${order.order_number} is now ${order.status}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: "#25D366" }}
                            data-testid={`button-whatsapp-${order.id}`}
                          >
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.127 1.535 5.857L.057 23.885l6.195-1.447A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.728.977.997-3.645-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
                            WhatsApp
                          </a>
                        )}

                        <button
                          onClick={() => copyStatusLink(order.order_number)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                          data-testid={`button-copy-status-${order.id}`}
                        >
                          {copiedId === order.order_number ? (
                            <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" /> Share Status Link</>
                          )}
                        </button>

                        <a
                          href={`/order/${order.order_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Orders;
