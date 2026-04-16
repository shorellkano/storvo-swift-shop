import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { ShoppingCart, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "paid", label: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "shipped", label: "Shipped", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "delivered", label: "Delivered", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
];

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      const label = ORDER_STATUSES.find((s) => s.value === newStatus)?.label;
      toast.success(`Order marked as ${label}`);
    }
    setUpdatingId(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const getStatusStyle = (status: string) =>
    ORDER_STATUSES.find((s) => s.value === status)?.color || "bg-gray-50 text-gray-700";

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
            <h1 className="mb-6 font-display text-2xl font-bold text-foreground">
              Orders
              {orders.length > 0 && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  ({orders.length})
                </span>
              )}
            </h1>

            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-16 shadow-card">
                <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold text-foreground">No orders yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Orders will appear here when customers buy from your store</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = ORDER_STATUSES.find((s) => s.value === order.status);
                  return (
                    <div key={order.id} className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-display font-semibold text-foreground">#{order.order_number}</h3>
                            {/* Status badge — click to change */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${statusInfo?.color || ""}`}
                                  disabled={updatingId === order.id}
                                >
                                  {updatingId === order.id ? (
                                    <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                  ) : null}
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
                                    <span className={`mr-2 h-2 w-2 rounded-full inline-block ${s.color.includes("amber") ? "bg-amber-400" : s.color.includes("emerald") ? "bg-emerald-500" : s.color.includes("blue") ? "bg-blue-500" : s.color.includes("green") ? "bg-green-500" : "bg-red-400"}`} />
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
                              {order.customers.address}, {order.customers.city}, {order.customers.state}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg font-bold text-foreground">{formatCurrency(Number(order.total))}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                          {/* WhatsApp customer */}
                          {order.customers?.phone && (
                            <a
                              href={`https://wa.me/${order.customers.phone.replace(/\D/g, "")}?text=Hi ${order.customers.name}, your order %23${order.order_number} is now ${order.status}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center text-xs font-medium text-[#25D366] hover:underline"
                            >
                              WhatsApp customer →
                            </a>
                          )}
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
                      {order.notes && (
                        <p className="mt-3 text-xs text-muted-foreground italic border-t border-border pt-2">
                          Note: {order.notes}
                        </p>
                      )}
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
