import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Package, Edit, Eye, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ProductCardProps {
  product: any;
  storeSlug: string;
  onDeleted: () => void;
}

const ProductCard = ({ product, storeSlug, onDeleted }: ProductCardProps) => {
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const mainImage = product.product_images?.[0]?.image_url;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete images from storage
      for (const img of product.product_images || []) {
        const path = img.image_url.split("/product-images/")[1];
        if (path) {
          await supabase.storage.from("product-images").remove([path]);
        }
      }
      // Delete product_images rows
      await supabase.from("product_images").delete().eq("product_id", product.id);
      // Delete product
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      toast.success("Product deleted");
      onDeleted();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <>
      <div className="group rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-all">
        {/* Image */}
        <div className="relative aspect-square bg-muted">
          {mainImage ? (
            <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${
              product.is_active 
                ? "bg-emerald-500/90 text-primary-foreground" 
                : "bg-muted/90 text-muted-foreground"
            }`}>
              {product.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          {/* Actions menu */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full bg-card/80 backdrop-blur-sm p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
                  <MoreVertical className="h-4 w-4 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/dashboard/products/${product.id}/preview`)}>
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDelete(true)} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-display font-semibold text-foreground truncate">{product.name}</h3>
          <p className="text-sm font-bold text-primary">{formatCurrency(Number(product.price))}</p>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground capitalize">
              {product.product_type}
            </span>
            {product.track_inventory && (
              <span className="text-xs text-muted-foreground">
                {product.stock_quantity} in stock
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
            >
              <Edit className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => navigate(`/dashboard/products/${product.id}/preview`)}
            >
              <Eye className="mr-1 h-3 w-3" /> Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product and its images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductCard;
