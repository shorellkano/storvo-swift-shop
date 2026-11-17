import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Eye,
  ShoppingCart,
  Users,
  Wallet,
  TrendingUp,
  Package,
  Percent,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  format,
  startOfDay,
  subDays,
} from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";

const db = supabase as any;

type RangeDays = 7 | 30;

type OrderRow = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  customer_id: string;
};

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string | null;
};

type ViewRow = {
  id: string;
  product_id: string;
  store_id: string;
  viewed_at: string;
};

type ProductRow = {
  id: string;
  name: string;
};

type OrderItemRow = {
  product_id: string;
  quantity: number;
  total: number;
};

type CustomerRow = {
  id: string;
};

const Analytics = () => {
  const {
    store,
    role,
    loading: storeLoading,
  } = useStore();

  const [
    rangeDays,
    setRangeDays,
  ] = useState<RangeDays>(7);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    orders,
    setOrders,
  ] = useState<OrderRow[]>([]);

  const [
    payments,
    setPayments,
  ] = useState<PaymentRow[]>([]);

  const [
    views,
    setViews,
  ] = useState<ViewRow[]>([]);

  const [
    customers,
    setCustomers,
  ] = useState<CustomerRow[]>([]);

  const [
    products,
    setProducts,
  ] = useState<ProductRow[]>([]);

  const [
    orderItems,
    setOrderItems,
  ] = useState<OrderItemRow[]>([]);

  const formatCurrency = (
    amount: number,
  ) =>
    new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      },
    ).format(amount);

  const loadAnalytics =
    async () => {
      if (!store?.id) {
        return;
      }

      setLoading(true);

      try {
        const fromDate =
          subDays(
            new Date(),
            rangeDays - 1,
          ).toISOString();

        const [
          ordersResult,
          paymentsResult,
          viewsResult,
          customersResult,
          productsResult,
          orderItemsResult,
        ] =
          await Promise.all([
            supabase
              .from("orders")
              .select(
                "id,total,status,created_at,customer_id",
              )
              .eq(
                "store_id",
                store.id,
              )
              .gte(
                "created_at",
                fromDate,
              ),

            supabase
              .from("payments")
              .select(
                "id,amount,status,created_at,paid_at",
              )
              .eq(
                "store_id",
                store.id,
              )
              .gte(
                "created_at",
                fromDate,
              ),

            db
              .from(
                "product_views",
              )
              .select(
                "id,product_id,store_id,viewed_at",
              )
              .eq(
                "store_id",
                store.id,
              )
              .gte(
                "viewed_at",
                fromDate,
              ),

            supabase
              .from("customers")
              .select("id")
              .eq(
                "store_id",
                store.id,
              ),

            supabase
              .from("products")
              .select("id,name")
              .eq(
                "store_id",
                store.id,
              ),

            supabase
              .from("order_items")
              .select(`
                product_id,
                quantity,
                total,
                orders!inner (
                  store_id,
                  created_at
                )
              `)
              .eq(
                "orders.store_id",
                store.id,
              )
              .gte(
                "orders.created_at",
                fromDate,
              ),
          ]);

        setOrders(
          (ordersResult.data ||
            []) as OrderRow[],
        );

        setPayments(
          (paymentsResult.data ||
            []) as PaymentRow[],
        );

        setViews(
          (viewsResult.data ||
            []) as ViewRow[],
        );

        setCustomers(
          (customersResult.data ||
            []) as CustomerRow[],
        );

        setProducts(
          (productsResult.data ||
            []) as ProductRow[],
        );

        setOrderItems(
          (orderItemsResult.data ||
            []) as OrderItemRow[],
        );
      } catch (error) {
        console.error(
          "Could not load analytics:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!store?.id) {
      return;
    }

    void loadAnalytics();
  }, [
    store?.id,
    rangeDays,
  ]);

  const successfulPayments =
    useMemo(
      () =>
        payments.filter(
          (payment) =>
            payment.status ===
            "success",
        ),
      [payments],
    );

  const revenue =
    useMemo(
      () =>
        successfulPayments.reduce(
          (
            total,
            payment,
          ) =>
            total +
            Number(
              payment.amount ||
                0,
            ),
          0,
        ),
      [successfulPayments],
    );

  const totalOrders =
    orders.length;

  const totalViews =
    views.length;

  const averageOrderValue =
    totalOrders > 0
      ? orders.reduce(
          (
            total,
            order,
          ) =>
            total +
            Number(
              order.total ||
                0,
            ),
          0,
        ) /
        totalOrders
      : 0;

  const conversionRate =
    totalViews > 0
      ? Math.min(
          100,
          (totalOrders /
            totalViews) *
            100,
        )
      : 0;

  const uniqueCustomers =
    useMemo(
      () =>
        new Set(
          orders.map(
            (order) =>
              order.customer_id,
          ),
        ).size,
      [orders],
    );

  const chartData =
    useMemo(() => {
      const days =
        Array.from(
          {
            length:
              rangeDays,
          },
          (_, index) => {
            const date =
              subDays(
                new Date(),
                rangeDays -
                  1 -
                  index,
              );

            return {
              key: format(
                date,
                "yyyy-MM-dd",
              ),
              label:
                rangeDays === 7
                  ? format(
                      date,
                      "EEE",
                    )
                  : format(
                      date,
                      "d MMM",
                    ),
              date:
                startOfDay(
                  date,
                ),
              orders: 0,
              revenue: 0,
              views: 0,
            };
          },
        );

      for (const order of orders) {
        const key =
          format(
            new Date(
              order.created_at,
            ),
            "yyyy-MM-dd",
          );

        const bucket =
          days.find(
            (day) =>
              day.key ===
              key,
          );

        if (bucket) {
          bucket.orders += 1;
        }
      }

      for (const payment of successfulPayments) {
        const dateValue =
          payment.paid_at ||
          payment.created_at;

        const key =
          format(
            new Date(
              dateValue,
            ),
            "yyyy-MM-dd",
          );

        const bucket =
          days.find(
            (day) =>
              day.key ===
              key,
          );

        if (bucket) {
          bucket.revenue +=
            Number(
              payment.amount ||
                0,
            );
        }
      }

      for (const view of views) {
        const key =
          format(
            new Date(
              view.viewed_at,
            ),
            "yyyy-MM-dd",
          );

        const bucket =
          days.find(
            (day) =>
              day.key ===
              key,
          );

        if (bucket) {
          bucket.views += 1;
        }
      }

      return days;
    }, [
      orders,
      successfulPayments,
      views,
      rangeDays,
    ]);

  const topViewedProducts =
    useMemo(() => {
      const counts =
        new Map<
          string,
          number
        >();

      for (const view of views) {
        counts.set(
          view.product_id,
          (counts.get(
            view.product_id,
          ) || 0) + 1,
        );
      }

      return Array.from(
        counts.entries(),
      )
        .map(
          ([
            productId,
            count,
          ]) => ({
            id: productId,
            name:
              products.find(
                (product) =>
                  product.id ===
                  productId,
              )?.name ||
              "Product",
            views: count,
          }),
        )
        .sort(
          (a, b) =>
            b.views -
            a.views,
        )
        .slice(0, 5);
    }, [
      views,
      products,
    ]);

  const topSellingProducts =
    useMemo(() => {
      const sales =
        new Map<
          string,
          {
            quantity: number;
            revenue: number;
          }
        >();

      for (const item of orderItems) {
        const current =
          sales.get(
            item.product_id,
          ) || {
            quantity: 0,
            revenue: 0,
          };

        sales.set(
          item.product_id,
          {
            quantity:
              current.quantity +
              Number(
                item.quantity ||
                  0,
              ),
            revenue:
              current.revenue +
              Number(
                item.total ||
                  0,
              ),
          },
        );
      }

      return Array.from(
        sales.entries(),
      )
        .map(
          ([
            productId,
            values,
          ]) => ({
            id: productId,
            name:
              products.find(
                (product) =>
                  product.id ===
                  productId,
              )?.name ||
              "Product",
            ...values,
          }),
        )
        .sort(
          (a, b) =>
            b.quantity -
            a.quantity,
        )
        .slice(0, 5);
    }, [
      orderItems,
      products,
    ]);

  if (
    storeLoading ||
    !store
  ) {
    return null;
  }

  const statCards = [
    {
      label: "Revenue",
      value:
        formatCurrency(
          revenue,
        ),
      icon: Wallet,
    },
    {
      label: "Orders",
      value:
        totalOrders.toString(),
      icon: ShoppingCart,
    },
    {
      label: "Product views",
      value:
        totalViews.toString(),
      icon: Eye,
    },
    {
      label: "Customers",
      value:
        uniqueCustomers.toString(),
      icon: Users,
    },
    {
      label:
        "Average order value",
      value:
        formatCurrency(
          averageOrderValue,
        ),
      icon: TrendingUp,
    },
    {
      label: "Conversion",
      value:
        `${conversionRate.toFixed(
          1,
        )}%`,
      icon: Percent,
    },
  ];

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

            <BarChart3 className="h-5 w-5 text-primary" />

            <h2 className="flex-1 font-display text-lg font-semibold text-foreground">
              Analytics
            </h2>

            <div className="flex items-center rounded-lg border border-border bg-background p-1">
              <Button
                type="button"
                size="sm"
                variant={
                  rangeDays === 7
                    ? "default"
                    : "ghost"
                }
                className="h-7 px-3 text-xs"
                onClick={() =>
                  setRangeDays(
                    7,
                  )
                }
              >
                7 days
              </Button>

              <Button
                type="button"
                size="sm"
                variant={
                  rangeDays === 30
                    ? "default"
                    : "ghost"
                }
                className="h-7 px-3 text-xs"
                onClick={() =>
                  setRangeDays(
                    30,
                  )
                }
              >
                30 days
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 bg-background p-4 md:p-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Store performance
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                See how your Storvo storefront is performing over the last{" "}
                {rangeDays} days.
              </p>
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({
                  length: 6,
                }).map(
                  (
                    _,
                    index,
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="h-28 animate-pulse rounded-2xl bg-muted/50"
                    />
                  ),
                )}
              </div>
            ) : (
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {statCards.map(
                  ({
                    label,
                    value,
                    icon:
                      Icon,
                  }) => (
                    <div
                      key={
                        label
                      }
                      className="rounded-2xl border border-border/60 bg-card p-5 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {
                              label
                            }
                          </p>

                          <p className="mt-2 font-display text-2xl font-bold text-foreground">
                            {
                              value
                            }
                          </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </section>
            )}

            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
              <div className="mb-5">
                <h3 className="font-display text-lg font-bold text-foreground">
                  Orders trend
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Daily orders over the selected period.
                </p>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      chartData
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={
                        false
                      }
                    />

                    <XAxis
                      dataKey="label"
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                      fontSize={
                        11
                      }
                    />

                    <YAxis
                      allowDecimals={
                        false
                      }
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                      fontSize={
                        11
                      }
                    />

                    <Tooltip />

                    <Bar
                      dataKey="orders"
                      fill="currentColor"
                      className="text-primary"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                <div className="mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />

                  <h3 className="font-display text-lg font-bold text-foreground">
                    Top selling products
                  </h3>
                </div>

                {topSellingProducts.length ===
                0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No product sales yet in this period.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topSellingProducts.map(
                      (
                        product,
                        index,
                      ) => (
                        <div
                          key={
                            product.id
                          }
                          className="flex items-center gap-3 rounded-xl bg-muted/30 p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                            {index +
                              1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {
                                product.name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {
                                product.quantity
                              }{" "}
                              sold
                            </p>
                          </div>

                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(
                              product.revenue,
                            )}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                <div className="mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />

                  <h3 className="font-display text-lg font-bold text-foreground">
                    Most viewed products
                  </h3>
                </div>

                {topViewedProducts.length ===
                0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No product views yet in this period.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topViewedProducts.map(
                      (
                        product,
                        index,
                      ) => (
                        <div
                          key={
                            product.id
                          }
                          className="flex items-center gap-3 rounded-xl bg-muted/30 p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                            {index +
                              1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {
                                product.name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {
                                product.views
                              }{" "}
                              view
                              {product.views !==
                              1
                                ? "s"
                                : ""}
                            </p>
                          </div>

                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>
            </div>

            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
              <h3 className="font-display text-lg font-bold text-foreground">
                Customer snapshot
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total customer records
                  </p>

                  <p className="mt-1 font-display text-xl font-bold text-foreground">
                    {
                      customers.length
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Customers who ordered
                  </p>

                  <p className="mt-1 font-display text-xl font-bold text-foreground">
                    {
                      uniqueCustomers
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Successful payments
                  </p>

                  <p className="mt-1 font-display text-xl font-bold text-foreground">
                    {
                      successfulPayments.length
                    }
                  </p>
                </div>
              </div>
            </section>

            <p className="text-xs leading-5 text-muted-foreground">
              Conversion currently compares product views with orders. Traffic-source reporting from Instagram, WhatsApp, TikTok and other channels will be added once source tracking is persisted.
            </p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;