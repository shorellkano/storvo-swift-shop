import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HandshakeIcon, Check, X, MessageCircle, Loader2, ArrowUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
  accepted: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",
  rejected: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
  countered: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  countered: "Countered",
};

const OffersPage = () => {
  const { store, role } = useStore();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [sellerNote, setSellerNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const fetchOffers = async () => {
    if (!store?.id) return;
    const { data } = await supabase
      .from("price_offers")
      .select("*, products(name, price, slug)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    setOffers((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (store?.id) fetchOffers();
  }, [store?.id]);

  const updateOffer = async (offerId: string, update: object) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from("price_offers").update(update).eq("id", offerId);
      if (error) throw error;
      await fetchOffers();
      setSelectedOffer(null);
      toast.success("Offer updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const acceptOffer = (offer: any) => {
    updateOffer(offer.id, { status: "accepted", seller_note: sellerNote || null });
  };

  const rejectOffer = (offer: any) => {
    updateOffer(offer.id, { status: "rejected", seller_note: sellerNote || null });
  };

  const counterOffer = (offer: any) => {
    if (!counterPrice) { toast.error("Enter a counter price"); return; }
    updateOffer(offer.id, { status: "countered", counter_price: parseFloat(counterPrice), seller_note: sellerNote || null });
  };

  const openWhatsApp = (offer: any) => {
    const phone = offer.buyer_phone.replace(/\D/g, "");
    const msg = offer.status === "accepted"
      ? `Hi ${offer.buyer_name}, your offer of ${formatCurrency(offer.offered_price)} for "${offer.products?.name}" has been accepted! Proceed to payment.`
      : offer.status === "countered"
      ? `Hi ${offer.buyer_name}, regarding your offer of ${formatCurrency(offer.offered_price)} for "${offer.products?.name}", I'd like to counter with ${formatCurrency(offer.counter_price)}.${offer.seller_note ? " " + offer.seller_note : ""}`
      : `Hi ${offer.buyer_name}, regarding your offer for "${offer.products?.name}".`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const pendingCount = offers.filter((o) => o.status === "pending").length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} role={role} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4 gap-3">
            <SidebarTrigger className="mr-2" />
            <HandshakeIcon className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Price Offers</h2>
            {pendingCount > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-xs">{pendingCount} new</Badge>
            )}
          </header>

          <main className="flex-1 p-4 sm:p-6 bg-background">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : offers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <HandshakeIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">No offers yet</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                  Buyers can make price offers on products you mark as "Negotiable" in your product settings.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="rounded-2xl border border-border/60 bg-card p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
                    onClick={() => { setSelectedOffer(offer); setCounterPrice(""); setSellerNote(""); }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{offer.buyer_name}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[offer.status]}`}>
                            {STATUS_LABELS[offer.status]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Product: <span className="font-medium text-foreground">{offer.products?.name}</span>
                        </p>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Listed</p>
                            <p className="text-sm font-medium text-foreground">{formatCurrency(Number(offer.products?.price))}</p>
                          </div>
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Offered</p>
                            <p className="text-sm font-bold text-primary">{formatCurrency(Number(offer.offered_price))}</p>
                          </div>
                          {offer.counter_price && (
                            <>
                              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                              <div>
                                <p className="text-[10px] text-muted-foreground">Counter</p>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(Number(offer.counter_price))}</p>
                              </div>
                            </>
                          )}
                        </div>
                        {offer.message && (
                          <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">"{offer.message}"</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <p className="text-[10px] text-muted-foreground">{formatDate(offer.created_at)}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); openWhatsApp(offer); }}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                          style={{ backgroundColor: '#25D366' }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Offer Detail Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Respond to Offer</DialogTitle>
          </DialogHeader>

          {selectedOffer && (
            <div className="space-y-5">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{selectedOffer.buyer_name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[selectedOffer.status]}`}>
                    {STATUS_LABELS[selectedOffer.status]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Phone: {selectedOffer.buyer_phone}</p>
                <p className="text-xs text-muted-foreground">Product: <span className="font-medium text-foreground">{selectedOffer.products?.name}</span></p>
                <p className="text-sm">
                  Listed: <span className="font-medium">{formatCurrency(Number(selectedOffer.products?.price))}</span>
                  {" - "}
                  Offered: <span className="font-bold text-primary">{formatCurrency(Number(selectedOffer.offered_price))}</span>
                </p>
                {selectedOffer.message && (
                  <p className="text-xs text-muted-foreground italic">"{selectedOffer.message}"</p>
                )}
                {selectedOffer.seller_note && (
                  <p className="text-xs text-muted-foreground">Your note: {selectedOffer.seller_note}</p>
                )}
              </div>

              {selectedOffer.status === "pending" ? (
                <>
                  <div>
                    <Label htmlFor="sellerNote">Note to Buyer (optional)</Label>
                    <Textarea
                      id="sellerNote"
                      value={sellerNote}
                      onChange={(e) => setSellerNote(e.target.value)}
                      placeholder="Add a message for the buyer..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="counterPrice">Counter Offer Amount (₦)</Label>
                    <Input
                      id="counterPrice"
                      type="number"
                      min="1"
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      placeholder="Leave blank to accept or reject as-is"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => acceptOffer(selectedOffer)}
                      disabled={actionLoading}
                    >
                      <Check className="mr-1.5 h-4 w-4" /> Accept
                    </Button>
                    {counterPrice && (
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => counterOffer(selectedOffer)}
                        disabled={actionLoading}
                      >
                        <ArrowUpDown className="mr-1.5 h-4 w-4" /> Counter
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => rejectOffer(selectedOffer)}
                      disabled={actionLoading}
                    >
                      <X className="mr-1.5 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    This offer has been {selectedOffer.status}.
                  </p>
                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: '#25D366' }}
                    onClick={() => openWhatsApp(selectedOffer)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Message Buyer on WhatsApp
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default OffersPage;
