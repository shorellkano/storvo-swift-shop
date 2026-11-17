import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Search,
  ShoppingBag,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const db = supabase as any;

type CustomerOrder = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
};

type CustomerRecord = {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
  orders?: CustomerOrder[];
};

const COMPLETED_REVENUE_STATUSES = [
  "paid",
  "processing",
  "shipped",
  "delivered",
];

const Customers = () => {
  const {
    store,
    role,
    loading: storeLoading,
  } = useStore();

  const [
    customers,
    setCustomers,
  ] = useState<CustomerRecord[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    expandedCustomerId,
    setExpandedCustomerId,
  ] = useState<string | null>(
    null,
  );

  const formatCurrency = (
    amount: number,
  ) =>
    new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
      },
    ).format(amount);

  const formatDate = (
    value?: string | null,
  ) => {
    if (!value) {
      return "No orders yet";
    }

    return new Date(
      value,
    ).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    );
  };

  const fetchCustomers =
    async () => {
      if (!store?.id) {
        return;
      }

      setLoading(true);

      try {
        const {
          data,
          error,
        } = await db
          .from("customers")
          .select(`
            *,
            orders (
              id,
              order_number,
              total,
              status,
              created_at
            )
          `)
          .eq(
            "store_id",
            store.id,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          );

        if (error) {
          throw error;
        }

        const rows =
          (data || []).map(
            (
              customer: CustomerRecord,
            ) => ({
              ...customer,
              orders:
                Array.isArray(
                  customer.orders,
                )
                  ? [
                      ...customer.orders,
                    ].sort(
                      (
                        a,
                        b,
                      ) =>
                        new Date(
                          b.created_at,
                        ).getTime() -
                        new Date(
                          a.created_at,
                        ).getTime(),
                    )
                  : [],
            }),
          );

        setCustomers(rows);
      } catch (error) {
        console.error(
          "Could not load customers:",
          error,
        );

        toast.error(
          "Could not load customers.",
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!store?.id) {
      return;
    }

    void fetchCustomers();

    const channel =
      supabase
        .channel(
          `customers:${store.id}`,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "customers",
            filter:
              `store_id=eq.${store.id}`,
          },
          () => {
            void fetchCustomers();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter:
              `store_id=eq.${store.id}`,
          },
          () => {
            void fetchCustomers();
          },
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel,
      );
    };
  }, [store?.id]);

  const getOrders = (
    customer: CustomerRecord,
  ) =>
    customer.orders || [];

  const getPaidOrders = (
    customer: CustomerRecord,
  ) =>
    getOrders(
      customer,
    ).filter((order) =>
      COMPLETED_REVENUE_STATUSES.includes(
        order.status,
      ),
    );

  const getCustomerSpend = (
    customer: CustomerRecord,
  ) =>
    getPaidOrders(
      customer,
    ).reduce(
      (
        total,
        order,
      ) =>
        total +
        Number(
          order.total || 0,
        ),
      0,
    );

  const filteredCustomers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return customers;
      }

      return customers.filter(
        (customer) =>
          customer.name
            ?.toLowerCase()
            .includes(
              query,
            ) ||
          customer.phone
            ?.toLowerCase()
            .includes(
              query,
            ) ||
          customer.email
            ?.toLowerCase()
            .includes(
              query,
            ),
      );
    }, [
      customers,
      search,
    ]);

  const totalCustomers =
    customers.length;

  const repeatCustomers =
    customers.filter(
      (customer) =>
        getOrders(
          customer,
        ).length > 1,
    ).length;

  const totalCustomerRevenue =
    customers.reduce(
      (
        total,
        customer,
      ) =>
        total +
        getCustomerSpend(
          customer,
        ),
      0,
    );

  const customersWithOrders =
    customers.filter(
      (customer) =>
        getOrders(
          customer,
        ).length > 0,
    ).length;

  const openWhatsApp = (
    customer: CustomerRecord,
  ) => {
    const number =
      customer.phone.replace(
        /\D/g,
        "",
      );

    if (!number) {
      toast.error(
        "No phone number available.",
      );
      return;
    }

    const message =
      encodeURIComponent(
        `Hi ${customer.name}, this is ${store?.name}.`,
      );

    window.open(
      `https://wa.me/${number}?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (
    storeLoading ||
    !store
  ) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar
          store={store}
          role={role}
        />

        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-border/60 bg-card px-4">
            <SidebarTrigger className="mr-1" />

            <Users className="h-5 w-5 text-primary" />

            <h2 className="flex-1 font-display text-lg font-semibold text-foreground">
              Customers
            </h2>

            {!loading &&
              customers.length >
                0 && (
                <span className="text-sm text-muted-foreground">
                  {
                    customers.length
                  }{" "}
                  total
                </span>
              )}
          </header>

          <main className="flex-1 space-y-5 bg-background p-4 md:p-6">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />

                  <p className="text-xs font-medium text-muted-foreground">
                    Total customers
                  </p>
                </div>

                <p className="font-display text-2xl font-bold text-foreground">
                  {totalCustomers}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                <div className="mb-2 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-violet-500" />

                  <p className="text-xs font-medium text-muted-foreground">
                    Repeat customers
                  </p>
                </div>

                <p className="font-display text-2xl font-bold text-foreground">
                  {repeatCustomers}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                <div className="mb-2 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-amber-500" />

                  <p className="text-xs font-medium text-muted-foreground">
                    Customers with orders
                  </p>
                </div>

                <p className="font-display text-2xl font-bold text-foreground">
                  {customersWithOrders}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />

                  <p className="text-xs font-medium text-muted-foreground">
                    Customer revenue
                  </p>
                </div>

                <p className="font-display text-xl font-bold text-foreground">
                  {formatCurrency(
                    totalCustomerRevenue,
                  )}
                </p>
              </div>
            </section>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search customers by name, phone or email"
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={
                        item
                      }
                      className="h-36 animate-pulse rounded-2xl bg-muted/50"
                    />
                  ),
                )}
              </div>
            ) : customers.length ===
              0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-16 text-center shadow-card">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />

                <h3 className="font-display text-lg font-semibold text-foreground">
                  No customers yet
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Customers will appear here automatically when they place orders through your Storvo storefront.
                </p>
              </div>
            ) : filteredCustomers.length ===
              0 ? (
              <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
                <p className="text-muted-foreground">
                  No customers match your search.
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    setSearch(
                      "",
                    )
                  }
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map(
                  (
                    customer,
                  ) => {
                    const orders =
                      getOrders(
                        customer,
                      );

                    const totalSpend =
                      getCustomerSpend(
                        customer,
                      );

                    const lastOrder =
                      orders[0];

                    const isExpanded =
                      expandedCustomerId ===
                      customer.id;

                    return (
                      <article
                        key={
                          customer.id
                        }
                        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card"
                      >
                        <div className="p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <UserRound className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                  <h3 className="truncate font-display text-base font-bold text-foreground">
                                    {
                                      customer.name
                                    }
                                  </h3>

                                  <p className="mt-0.5 text-sm text-muted-foreground">
                                    {
                                      customer.phone
                                    }
                                  </p>
                                </div>
                              </div>

                              {customer.email && (
                                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-4 w-4" />

                                  {
                                    customer.email
                                  }
                                </p>
                              )}

                              {(customer.address ||
                                customer.city ||
                                customer.state) && (
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                  {[
                                    customer.address,
                                    customer.city,
                                    customer.state,
                                  ]
                                    .filter(
                                      Boolean,
                                    )
                                    .join(
                                      ", ",
                                    )}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-3 lg:min-w-[360px]">
                              <div className="rounded-xl bg-muted/40 p-3">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Orders
                                </p>

                                <p className="mt-1 font-display text-lg font-bold text-foreground">
                                  {
                                    orders.length
                                  }
                                </p>
                              </div>

                              <div className="rounded-xl bg-muted/40 p-3">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Spend
                                </p>

                                <p className="mt-1 truncate font-display text-sm font-bold text-foreground">
                                  {formatCurrency(
                                    totalSpend,
                                  )}
                                </p>
                              </div>

                              <div className="rounded-xl bg-muted/40 p-3">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Last order
                                </p>

                                <p className="mt-1 text-xs font-semibold text-foreground">
                                  {formatDate(
                                    lastOrder?.created_at,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                            <button
                              type="button"
                              onClick={() =>
                                openWhatsApp(
                                  customer,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                              style={{
                                backgroundColor:
                                  "#25D366",
                              }}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </button>

                            {customer.email && (
                              <a
                                href={`mailto:${customer.email}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-accent"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                Email
                              </a>
                            )}

                            {orders.length >
                              0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedCustomerId(
                                    isExpanded
                                      ? null
                                      : customer.id,
                                  )
                                }
                                className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                              >
                                {isExpanded
                                  ? "Hide orders"
                                  : "View orders"}

                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {isExpanded &&
                          orders.length >
                            0 && (
                            <div className="border-t border-border bg-muted/20 px-5 py-4">
                              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                Order history
                              </p>

                              <div className="space-y-2">
                                {orders.map(
                                  (
                                    order,
                                  ) => (
                                    <a
                                      key={
                                        order.id
                                      }
                                      href={`/order/${order.order_number}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 transition hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                      <div>
                                        <p className="text-sm font-semibold text-foreground">
                                          #
                                          {
                                            order.order_number
                                          }
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {formatDate(
                                            order.created_at,
                                          )}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                                          {
                                            order.status
                                          }
                                        </span>

                                        <span className="text-sm font-bold text-foreground">
                                          {formatCurrency(
                                            Number(
                                              order.total ||
                                                0,
                                            ),
                                          )}
                                        </span>
                                      </div>
                                    </a>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Customers;