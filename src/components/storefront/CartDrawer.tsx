import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/hooks/useCart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  brandColor: string;
  deliveryFee: number;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

const CartDrawer = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  brandColor,
  deliveryFee,
}: CartDrawerProps) => {
  if (!isOpen) return null;

  const cartTotal = cart.reduce(
    (s, i) => s + Number(i.product.price) * i.quantity,
    0
  );
  const orderTotal = cartTotal + deliveryFee;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-[70] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer - slides in from right */}
      <div className="absolute right-0 top-0 bottom-0 flex w-full max-w-sm flex-col bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Cart
            </h2>
            {itemCount > 0 && (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: brandColor }}
              >
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            data-testid="button-close-cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add products to get started
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={onClose}
                data-testid="button-continue-browsing"
              >
                Continue browsing
              </Button>
            </div>
          ) : (
            cart.map((item) => {
              const image =
                item.product.product_images?.[0]?.image_url ||
                item.product.media?.[0];
              return (
                <div
                  key={item.product.id}
                  className="flex gap-3 rounded-xl border border-border/60 bg-background p-3"
                  data-testid={`cart-item-${item.product.id}`}
                >
                  {/* Image */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {image ? (
                      <img
                        src={image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted/60" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                        {item.product.name}
                      </p>
                      <button
                        onClick={() => onRemove(item.product.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        data-testid={`button-remove-${item.product.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(Number(item.product.price) * item.quantity)}
                      </p>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-foreground hover:bg-accent transition-colors"
                          data-testid={`button-decrease-${item.product.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-white transition-opacity hover:opacity-80"
                          style={{ background: brandColor }}
                          data-testid={`button-increase-${item.product.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {item.quantity > 1 && (
                      <p className="text-[11px] text-muted-foreground">
                        {formatCurrency(Number(item.product.price))} each
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: totals + checkout */}
        {cart.length > 0 && (
          <div className="border-t border-border/60 bg-card px-4 py-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-lg" style={{ color: brandColor }}>
                  {formatCurrency(orderTotal)}
                </span>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full gap-2 font-semibold text-white"
              style={{ background: brandColor }}
              onClick={onCheckout}
              data-testid="button-checkout"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Button>
            <button
              onClick={onClose}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              data-testid="button-continue-shopping-cart"
            >
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
