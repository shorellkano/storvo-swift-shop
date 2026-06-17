import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Users, Search, ShoppingCart, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
}

const CustomersPage = () => {
  const { store, role, loading: storeLoading } = useStore();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);

  useEffect(() => {
    if (!store?.id) return;

    const fetchCustomers = async () => {
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (!customerData || customerData.length === 0) {
        setCustomers([]);
        setLoading(false);
        return;
      }

      const { data: orderData } = await supabase
        .from("orders")
        .select("customer_id, total, created_at")
        .eq("store_id", store.id);

      const ordersByCustomer = new Map<string, { count: number; total: number; lastDate: string | null }>();
      for (const order of orderData || []) {
        const existing = ordersByCustomer.get(order.customer_id) || { count: 0, total: 0, lastDate: null };
        existing.count += 1;
        existing.total += Number(order.total);
        if (!existing.lastDate || order.created_at > existing.lastDate) {
          existing.lastDate = order.created_at;
        }
        ordersByCustomer.set(order.customer_id, existing);
      }

      const enriched: CustomerRow[] = customerData.map((c: any) => {
        const stats = ordersByCustomer.get(c.id) || { count: 0, total: 0, lastDate: null };
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          city: c.city,
          state: c.state,
          created_at: c.created_at,
          order_count: stats.count,
          total_spent: stats.total,
          last_order_date: stats.lastDate,
        };
      });

      enriched.sort((a, b) => b.total_spent - a.total_spent);
      setCustomers(enriched);
      setLoading(false);
    };

    fetchCustomers();
  }, [store?.id]);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.state?.toLowerCase().includes(q)
    );
  });

  if (!store || storeLoading) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} role={role} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4 gap-3">
            <SidebarTrigger className="mr-1" />
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground flex-1">Customers</h2>
            {customers.length > 0 && (
              <span className="text-sm text-muted-foreground">{customers.length} total</span>
            )}
          </header>

          <main className="flex-1 p-4 md:p-6 bg-background space-y-4">
            {/* Stats */}
            {customers.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground font-medium">Total Customers</p>
                  </div>
                  <p className="font-display text-lg font-bold text-foreground">{customers.length}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="h-4 w-4 text-emerald-500" />
                    <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                  </div>
                  <p className="font-display text-lg font-bold text-foreground">
                    {customers.reduce((s, c) => s + c.order_count, 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-amber-500" />
                    <p className="text-xs text-muted-foreground font-medium">Repeat Buyers</p>
                  </div>
                  <p className="font-display text-lg font-bold text-foreground">
                    {customers.filter((c) => c.order_count > 1).length}
                  </p>
                </div>
              </div>
            )}

            {/* Search */}
            {customers.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name, phone, email, or location"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}

            {/* List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-16 shadow-card">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold text-foreground">No customers yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customers will appear here when they place orders from your store
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
                <p className="text-muted-foreground">No customers match your search.</p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-3 text-sm font-medium text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((customer) => (
                  <div
                    key={customer.id}
                    className="rounded-2xl border border-border/60 bg-card p-5 shadow-card"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-foreground">{customer.name}</h3>
                        <div className="mt-1.5 space-y-1">
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {customer.phone}
                          </p>
                          {customer.email && (
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              {customer.email}
                            </p>
                          )}
                          {(customer.address || customer.city || customer.state) && (
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {[customer.address, customer.city, customer.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-lg font-bold text-foreground">
                          {formatCurrency(customer.total_spent)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.order_count} order{customer.order_count !== 1 ? "s" : ""}
                        </p>
                        {customer.last_order_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Last order{" "}
                            {new Date(customer.last_order_date).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    {customer.phone && (
                      <div className="mt-3 border-t border-border pt-3">
                        <a
                          href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "#25D366" }}
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.127 1.535 5.857L.057 23.885l6.195-1.447A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.728.977.997-3.645-.234-.374A9.818 9.818 0 1112 21.818z" />
                          </svg>
                          WhatsApp
                        </a>
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

export default CustomersPage;
