import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  MessageCircle,
  Package,
  Printer,
  ReceiptText,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import storvoLogo from "@/assets/storvo-logo.png";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

const formatDate = (value?: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    icon: Clock,
    description: "Your order has been received",
  },
  {
    key: "paid",
    label: "Payment Confirmed",
    icon: CheckCircle,
    description: "Payment has been confirmed",
  },
  {
    key: "processing",
    label: "Processing",
    icon: Package,
    description: "Seller is preparing your order",
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: Truck,
    description: "Your order is on the way",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: CheckCircle,
    description: "Order delivered successfully",
  },
];

const STATUS_ORDER = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

const RECEIPT_STATUSES = [
  "paid",
  "processing",
  "shipped",
  "delivered",
];

const OrderStatus = () => {
  const { orderNumber } =
    useParams<{
      orderNumber: string;
    }>();

  const navigate =
    useNavigate();

  const [
    order,
    setOrder,
  ] = useState<any>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    notFound,
    setNotFound,
  ] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;

    const fetchOrder =
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from("orders")
            .select(`
              *,
              customers(*),
              order_items(
                *,
                products(
                  name,
                  product_type,
                  digital_file_url
                )
              ),
              stores(
                name,
                slug,
                whatsapp_number,
                brand_color,
                logo_url
              )
            `)
            .eq(
              "order_number",
              orderNumber,
            )
            .single();

        if (
          error ||
          !data
        ) {
          setNotFound(
            true,
          );
        } else {
          setOrder(
            data,
          );
        }

        setLoading(
          false,
        );
      };

    void fetchOrder();
  }, [
    orderNumber,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (
    notFound ||
    !order
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="space-y-4 text-center">
          <p className="text-4xl font-bold text-foreground">
            Order Not Found
          </p>

          <p className="text-muted-foreground">
            We couldn't find an order with number #{orderNumber}
          </p>

          <Button
            variant="outline"
            onClick={() =>
              navigate("/")
            }
          >
            Go to Storvo
          </Button>
        </div>
      </div>
    );
  }

  const store =
    order.stores;

  const customer =
    order.customers;

  const items =
    order.order_items ||
    [];

  const brandColor =
    store?.brand_color ||
    "#6366F1";

  const currentStatusIdx =
    STATUS_ORDER.indexOf(
      order.status,
    );

  const hasPhysical =
    items.some(
      (item: any) =>
        item.products
          ?.product_type !==
        "digital",
    );

  const digitalItems =
    items.filter(
      (item: any) =>
        item.products
          ?.product_type ===
          "digital" &&
        item.products
          ?.digital_file_url &&
        RECEIPT_STATUSES.includes(
          order.status,
        ),
    );

  const cancelled =
    order.status ===
    "cancelled";

  const isReceipt =
    RECEIPT_STATUSES.includes(
      order.status,
    );

  const documentTitle =
    isReceipt
      ? "Receipt"
      : "Order Summary";

  const handlePrint =
    () => {
      window.print();
    };

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-card {
            border: none !important;
            box-shadow: none !important;
          }

          .print-break-avoid {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Browser header */}
      <div className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm">
        {store?.slug && (
          <button
            type="button"
            onClick={() =>
              navigate(
                `/store/${store.slug}`,
              )
            }
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {store?.name}
          </p>

          <p className="font-display font-bold text-foreground">
            Order #{orderNumber}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={
            handlePrint
          }
          className="gap-2"
        >
          <Printer className="h-4 w-4" />

          Print
        </Button>
      </div>

      <div className="print-container mx-auto max-w-2xl space-y-5 px-4 py-6">
        {/* Receipt header */}
        <section className="print-card print-break-avoid rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-3">
              {store?.logo_url ? (
                <img
                  src={
                    store.logo_url
                  }
                  alt={`${store.name} logo`}
                  className="h-14 w-14 rounded-xl border border-border/60 object-contain"
                />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-black text-white"
                  style={{
                    backgroundColor:
                      brandColor,
                  }}
                >
                  {store?.name
                    ?.charAt(0)
                    .toUpperCase() ||
                    "S"}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate font-display text-xl font-bold text-foreground">
                  {store?.name}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {documentTitle}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor:
                    `${brandColor}18`,
                  color:
                    brandColor,
                }}
              >
                {isReceipt ? (
                  <ReceiptText className="h-3.5 w-3.5" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}

                {documentTitle}
              </div>

              <p className="mt-3 font-mono text-sm font-bold text-foreground">
                #{orderNumber}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(
                  order.created_at,
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Customer
                </p>

                <p className="mt-2 font-semibold text-foreground">
                  {customer?.name ||
                    "Customer"}
                </p>

                {customer?.phone && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {
                      customer.phone
                    }
                  </p>
                )}

                {customer?.email && (
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {
                      customer.email
                    }
                  </p>
                )}
              </div>

              <div className="sm:text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </p>

                <p
                  className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize"
                  style={{
                    backgroundColor:
                      cancelled
                        ? "#fee2e2"
                        : `${brandColor}18`,
                    color:
                      cancelled
                        ? "#b91c1c"
                        : brandColor,
                  }}
                >
                  {order.status}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Status tracker */}
        {!cancelled ? (
          <section className="no-print rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <h2 className="mb-5 font-semibold text-foreground">
              Order Status
            </h2>

            <div className="space-y-0">
              {STATUS_STEPS.map(
                (
                  step,
                  index,
                ) => {
                  const stepIdx =
                    STATUS_ORDER.indexOf(
                      step.key,
                    );

                  const isDone =
                    stepIdx <=
                    currentStatusIdx;

                  const isCurrent =
                    stepIdx ===
                    currentStatusIdx;

                  const isLast =
                    index ===
                    STATUS_STEPS.length -
                      1;

                  const StepIcon =
                    step.icon;

                  return (
                    <div
                      key={
                        step.key
                      }
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isDone
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          <StepIcon className="h-4 w-4" />
                        </div>

                        {!isLast && (
                          <div
                            className={`my-1 w-0.5 flex-1 ${
                              isDone &&
                              !isCurrent
                                ? "bg-primary"
                                : "bg-border"
                            }`}
                            style={{
                              minHeight: 24,
                            }}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-5 pt-0.5">
                        <p
                          className={`text-sm font-semibold ${
                            isDone
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {
                            step.label
                          }

                          {isCurrent && (
                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              Current
                            </span>
                          )}
                        </p>

                        {isCurrent && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {
                              step.description
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>
        ) : (
          <section className="no-print rounded-2xl border border-red-200 bg-red-50 p-5 text-center dark:bg-red-950/20">
            <p className="font-semibold text-red-700 dark:text-red-400">
              Order Cancelled
            </p>

            <p className="mt-1 text-sm text-red-600/80 dark:text-red-500">
              This order has been cancelled.
            </p>
          </section>
        )}

        {/* Order lines */}
        <section className="print-card print-break-avoid rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-foreground">
            {isReceipt
              ? "Receipt Details"
              : "Order Summary"}
          </h2>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="grid grid-cols-[1fr_auto] gap-3 bg-muted/40 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <span>
                Item
              </span>

              <span>
                Amount
              </span>
            </div>

            <div className="divide-y divide-border/60">
              {items.map(
                (
                  item: any,
                ) => (
                  <div
                    key={
                      item.id
                    }
                    className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-sm"
                    data-testid={`order-item-${item.id}`}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {item.products
                          ?.name ||
                          "Item"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Qty:{" "}
                        {
                          item.quantity
                        }
                        {" × "}
                        {formatCurrency(
                          Number(
                            item.unit_price ||
                              0,
                          ),
                        )}
                      </p>
                    </div>

                    <span className="font-semibold text-foreground">
                      {formatCurrency(
                        Number(
                          item.total,
                        ),
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="ml-auto mt-5 max-w-sm space-y-2">
            <div className="flex justify-between gap-5 text-sm">
              <span className="text-muted-foreground">
                Subtotal
              </span>

              <span className="font-medium text-foreground">
                {formatCurrency(
                  Number(
                    order.subtotal,
                  ),
                )}
              </span>
            </div>

            {Number(
              order.delivery_fee,
            ) > 0 && (
              <div className="flex justify-between gap-5 text-sm">
                <span className="text-muted-foreground">
                  Delivery
                </span>

                <span className="font-medium text-foreground">
                  {formatCurrency(
                    Number(
                      order.delivery_fee,
                    ),
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between gap-5 border-t border-border pt-3 text-lg font-black">
              <span>
                Total
              </span>

              <span
                style={{
                  color:
                    brandColor,
                }}
              >
                {formatCurrency(
                  Number(
                    order.total,
                  ),
                )}
              </span>
            </div>
          </div>
        </section>

        {/* Digital downloads */}
        {digitalItems.length >
          0 && (
          <section className="no-print rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:bg-emerald-950/20">
            <p className="mb-3 flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-400">
              <Download className="h-4 w-4" />

              Your Downloads
            </p>

            <div className="space-y-2">
              {digitalItems.map(
                (
                  item: any,
                ) => (
                  <a
                    key={
                      item.id
                    }
                    href={
                      item.products
                        .digital_file_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300"
                  >
                    <span className="truncate">
                      {
                        item.products
                          .name
                      }
                    </span>

                    <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0" />
                  </a>
                ),
              )}
            </div>
          </section>
        )}

        {/* Delivery */}
        {hasPhysical &&
          (customer?.address ||
            order.delivery_address) && (
            <section className="print-card print-break-avoid rounded-2xl border border-border/60 bg-card p-5 shadow-card">
              <h2 className="mb-3 font-semibold text-foreground">
                Delivery Address
              </h2>

              <p className="text-sm leading-6 text-muted-foreground">
                {customer?.address ||
                  order.delivery_address}

                {customer?.city
                  ? `, ${customer.city}`
                  : order.city
                    ? `, ${order.city}`
                    : ""}

                {customer?.state
                  ? `, ${customer.state}`
                  : order.state
                    ? `, ${order.state}`
                    : ""}
              </p>

              <p className="mt-2 text-sm font-medium text-foreground">
                {customer?.name}
                {customer?.phone
                  ? ` · ${customer.phone}`
                  : ""}
              </p>
            </section>
          )}

        {/* Print / receipt controls */}
        <section className="no-print rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Printer className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {isReceipt
                  ? "Need a copy of your receipt?"
                  : "Save your order summary"}
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Print this page or choose “Save as PDF” from your browser's print window.
              </p>

              <Button
                type="button"
                onClick={
                  handlePrint
                }
                className="mt-4 gap-2"
              >
                <Printer className="h-4 w-4" />

                {isReceipt
                  ? "Print / Save Receipt"
                  : "Print / Save Order Summary"}
              </Button>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="no-print space-y-3">
          {store?.whatsapp_number && (
            <Button
              size="lg"
              className="w-full gap-2 font-semibold"
              style={{
                background:
                  "#25D366",
              }}
              onClick={() =>
                window.open(
                  `https://wa.me/${store.whatsapp_number.replace(
                    /\D/g,
                    "",
                  )}?text=Hi! I'm checking on my order %23${orderNumber}`,
                  "_blank",
                )
              }
              data-testid="button-contact-seller"
            >
              <MessageCircle className="h-4 w-4" />

              Contact Seller
            </Button>
          )}

          {store?.slug && (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() =>
                navigate(
                  `/store/${store.slug}`,
                )
              }
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
          )}
        </div>

        {/* Storvo footer */}
        <footer className="print-break-avoid pb-5 pt-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <img
              src={
                storvoLogo
              }
              alt="Storvo"
              className="h-6 w-auto"
            />

            <span className="text-xs text-muted-foreground">
              Powered by Storvo
            </span>
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            Order #{orderNumber}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default OrderStatus;