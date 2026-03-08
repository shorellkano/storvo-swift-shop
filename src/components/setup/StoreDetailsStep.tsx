import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const categories = [
  "Fashion",
  "Beauty",
  "Electronics",
  "Digital Products",
  "General Store",
];

interface StoreDetailsStepProps {
  storeName: string;
  setStoreName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  instagram: string;
  setInstagram: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const StoreDetailsStep = ({
  storeName,
  setStoreName,
  category,
  setCategory,
  instagram,
  setInstagram,
  loading,
  onSubmit,
}: StoreDetailsStepProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Store Name */}
      <div className="space-y-1.5">
        <Label htmlFor="storeName">Store Name</Label>
        <Input
          id="storeName"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="e.g. Luxe Hair"
          required
          maxLength={50}
          className="h-12 text-base"
        />
        {storeName && (
          <p className="mt-1 text-xs text-muted-foreground">
            Your store URL:{" "}
            <span className="font-semibold text-primary">
              {generateSlug(storeName)}.storvo.co
            </span>
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Store Category</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, "-")}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Instagram */}
      <div className="space-y-1.5">
        <Label htmlFor="instagram">Instagram Handle (optional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
          <Input
            id="instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="yourbrand"
            className="h-12 pl-7 text-base"
          />
        </div>
      </div>

      <Button variant="hero" size="lg" className="w-full text-base font-semibold" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating your store...
          </>
        ) : (
          "Continue →"
        )}
      </Button>
    </form>
  );
};

export default StoreDetailsStep;
