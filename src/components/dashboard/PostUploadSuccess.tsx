import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, Plus, Eye, Edit, Store } from "lucide-react";

interface PostUploadSuccessProps {
  productName: string;
  productId: string;
  storeSlug: string;
  onAddAnother: () => void;
}

const PostUploadSuccess = ({ productName, productId, storeSlug, onAddAnother }: PostUploadSuccessProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-md text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
      >
        <CheckCircle className="h-10 w-10 text-emerald-600" />
      </motion.div>

      <h2 className="font-display text-2xl font-bold text-foreground">Product added! 🎉</h2>
      <p className="mt-2 text-muted-foreground">
        <span className="font-semibold text-foreground">{productName}</span> is now live on your store.
      </p>

      <div className="mt-8 space-y-3">
        <Button variant="hero" size="lg" className="w-full" onClick={onAddAnother}>
          <Plus className="mr-2 h-4 w-4" /> Add Another Product
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(`/dashboard/products/${productId}/preview`)}
          >
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(`/dashboard/products/${productId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>

        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={() => navigate(`/store/${storeSlug}`)}
        >
          <Store className="mr-2 h-4 w-4" /> View My Store
        </Button>
      </div>
    </motion.div>
  );
};

export default PostUploadSuccess;
