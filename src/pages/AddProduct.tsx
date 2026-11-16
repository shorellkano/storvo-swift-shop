import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import {
  useSubscription,
  FREE_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
  FREE_PRODUCT_LIMIT,
  FREE_VIDEO_LIMIT,
  PRO_VIDEO_LIMIT,
} from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Crown,
  Video,
  X,
  UploadCloud,
  Plus,
  Minus,
  Palette,
  Ruler,
} from "lucide-react";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import PostUploadSuccess from "@/components/dashboard/PostUploadSuccess";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import RelatedProductsPicker from "@/components/product/RelatedProductsPicker";

const AVAILABLE_SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "One Size",
];

interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

interface VariantRow {
  size: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  sku: string;
  priceOverride: string;
  stock: number;
}

interface UploadImage {
  id: string;
  preview: string;
  file?: File;
  colorName?: string;
}

const AddProduct = () => {
  const db = supabase as any;
  const navigate = useNavigate();

  const {
    store,
    role,
  } = useStore();

  const [loading, setLoading] =
    useState(false);

  const [uploadImages, setUploadImages] =
    useState<UploadImage[]>([]);

  const [uploadVideos, setUploadVideos] =
    useState<
      {
        id: string;
        name: string;
        file: File;
        preview: string;
      }[]
    >([]);

  const [
    createdProduct,
    setCreatedProduct,
  ] = useState<any>(null);

  const [showUpgrade, setShowUpgrade] =
    useState(false);

  const [
    existingProducts,
    setExistingProducts,
  ] = useState<any[]>([]);

  const [
    relatedProductIds,
    setRelatedProductIds,
  ] = useState<string[]>([]);

  const videoInputRef =
    useRef<HTMLInputElement>(null);

  const imageInputRef =
    useRef<HTMLInputElement>(null);

  const [hasVariants, setHasVariants] =
    useState(false);

  const [
    selectedSizes,
    setSelectedSizes,
  ] = useState<string[]>([]);

  const [colors, setColors] = useState<
    ColorOption[]
  >([]);

  const [
    newColorName,
    setNewColorName,
  ] = useState("");

  const [
    newColorHex,
    setNewColorHex,
  ] = useState("#000000");

  const [
    variantRows,
    setVariantRows,
  ] = useState<VariantRow[]>([]);

  const {
    canAddProduct,
    productCount,
    isPro,
    refetch,
  } = useSubscription(
    store?.id || null,
  );

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    productType:
      "physical" as
        | "physical"
        | "digital",
    trackInventory: false,
    stockQuantity: 0,
    digitalFileUrl: "",
    isNegotiable: false,
    allowMediaDownload: false,
  });

  useEffect(() => {
    if (!store?.id) {
      return;
    }

    supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("store_id", store.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(6)
      .then(({ data }) =>
        setExistingProducts(data || []),
      );
  }, [store?.id]);

  useEffect(() => {
    try {
      if (
        !hasVariants ||
        selectedSizes.length === 0 ||
        colors.length === 0
      ) {
        setVariantRows([]);
        return;
      }

      const newRows: VariantRow[] =
        [];

      for (const size of selectedSizes) {
        for (const color of colors) {
          if (!size || !color) {
            continue;
          }

          const existing =
            variantRows.find(
              (row) =>
                row.size === size &&
                row.colorId === color.id,
            );

          newRows.push({
            size,
            colorId: color.id,
            colorName: color.name,
            colorHex: color.hex,
            sku:
              existing?.sku ||
              `${form.name
                .toUpperCase()
                .replace(
                  /[^A-Z0-9]/g,
                  "-",
                )}-${size}-${color.name
                .substring(0, 3)
                .toUpperCase()}`,
            priceOverride:
              existing?.priceOverride ||
              "",
            stock:
              existing?.stock ?? 0,
          });
        }
      }

      setVariantRows(newRows);
    } catch (err) {
      console.error(
        "Error generating variants:",
        err,
      );
    }
  }, [
    hasVariants,
    selectedSizes,
    colors,
    form.name,
  ]);

  const maxImages = isPro
    ? PRO_IMAGE_LIMIT
    : FREE_IMAGE_LIMIT;

  const maxVideos = isPro
    ? PRO_VIDEO_LIMIT
    : FREE_VIDEO_LIMIT;

  const generateSlug = (
    name: string,
  ) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      description: "",
      productType: "physical",
      trackInventory: false,
      stockQuantity: 0,
      digitalFileUrl: "",
      isNegotiable: false,
      allowMediaDownload: false,
    });

    setUploadImages([]);
    setUploadVideos([]);
    setRelatedProductIds([]);
    setCreatedProduct(null);
    setHasVariants(false);
    setSelectedSizes([]);
    setColors([]);
    setVariantRows([]);
    refetch();
  };

  const handleVideoSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      e.target.files || [],
    );

    const remaining =
      maxVideos -
      uploadVideos.length;

    const toAdd = files.slice(
      0,
      remaining,
    );

    const newVideos = toAdd.map(
      (file) => ({
        id: `${Date.now()}_${file.name}`,
        name: file.name,
        file,
        preview:
          URL.createObjectURL(file),
      }),
    );

    setUploadVideos((prev) => [
      ...prev,
      ...newVideos,
    ]);

    e.target.value = "";
  };

  const removeVideo = (id: string) =>
    setUploadVideos((prev) =>
      prev.filter(
        (video) => video.id !== id,
      ),
    );

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      e.target.files || [],
    );

    const remaining =
      maxImages -
      uploadImages.length;

    const toAdd = files.slice(
      0,
      remaining,
    );

    const newImages: UploadImage[] =
      toAdd.map((file) => ({
        id: `${Date.now()}_${file.name}`,
        preview:
          URL.createObjectURL(file),
        file,
      }));

    setUploadImages((prev) => [
      ...prev,
      ...newImages,
    ]);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) =>
    setUploadImages((prev) =>
      prev.filter(
        (image) => image.id !== id,
      ),
    );

  const toggleSize = (
    size: string,
  ) =>
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter(
            (item) => item !== size,
          )
        : [...prev, size],
    );

  const addColor = () => {
    try {
      if (!newColorName.trim()) {
        toast.error(
          "Please enter a color name",
        );
        return;
      }

      const newColor: ColorOption = {
        id: Date.now().toString(),
        name: newColorName.trim(),
        hex: newColorHex,
      };

      setColors((prev) => [
        ...prev,
        newColor,
      ]);

      setNewColorName("");
      setNewColorHex("#000000");

      toast.success(
        `Added color: ${newColor.name}`,
      );
    } catch (err) {
      console.error(
        "Error adding color:",
        err,
      );

      toast.error(
        "Failed to add color",
      );
    }
  };

  const removeColor = (
    id: string,
  ) =>
    setColors((prev) =>
      prev.filter(
        (color) => color.id !== id,
      ),
    );

  const updateVariantRow = (
    index: number,
    field: keyof VariantRow,
    value: any,
  ) =>
    setVariantRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );

  const handleImageColorChange = (
    index: number,
    colorName: string,
  ) =>
    setUploadImages((prev) =>
      prev.map((image, i) =>
        i === index
          ? {
              ...image,
              colorName:
                colorName === "all"
                  ? undefined
                  : colorName,
            }
          : image,
      ),
    );
      const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (!store) {
      return;
    }

    if (!canAddProduct) {
      setShowUpgrade(true);
      return;
    }

    if (hasVariants) {
      if (
        selectedSizes.length === 0
      ) {
        toast.error(
          "Please select at least one size",
        );
        return;
      }

      if (colors.length === 0) {
        toast.error(
          "Please add at least one color",
        );
        return;
      }
    }

    setLoading(true);

    try {
      const slug = generateSlug(
        form.name,
      );

      const {
        data: product,
        error,
      } = await supabase
        .from("products")
        .insert({
          store_id: store.id,
          name: form.name,
          slug,
          price:
            parseFloat(form.price) || 0,
          description:
            form.description,
          product_type:
            form.productType,
          track_inventory:
            hasVariants
              ? false
              : form.trackInventory,
          stock_quantity:
            hasVariants
              ? 0
              : form.trackInventory
                ? form.stockQuantity
                : 0,
          digital_file_url:
            form.productType ===
            "digital"
              ? form.digitalFileUrl
              : null,
          is_negotiable:
            form.isNegotiable,
          allow_media_download:
            isPro
              ? form.allowMediaDownload
              : false,
          has_variants:
            hasVariants,
          variant_options:
            hasVariants
              ? JSON.stringify({
                  sizes:
                    selectedSizes,
                  colors:
                    colors.map(
                      (color) => ({
                        name:
                          color.name,
                        hex:
                          color.hex,
                      }),
                    ),
                })
              : "[]",
        } as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (
        hasVariants &&
        variantRows.length > 0
      ) {
        const {
          error:
            variantInsertError,
        } = await db
          .from("product_variants")
          .insert(
            variantRows.map(
              (variant) => ({
                product_id:
                  product.id,
                size: variant.size,
                color_name:
                  variant.colorName,
                color_hex:
                  variant.colorHex,
                sku:
                  variant.sku ||
                  null,
                price_override:
                  variant.priceOverride
                    ? parseFloat(
                        variant.priceOverride,
                      )
                    : null,
                stock_quantity:
                  variant.stock,
                            }),
            ),
          );

        if (
          variantInsertError
        ) {
          throw variantInsertError;
        }
      }

      await Promise.all(
        uploadImages.map(
          async (image, index) => {
            if (!image.file) {
              return;
            }

            const fileExt =
              image.file.name
                .split(".")
                .pop();

            const filePath =
              `${store.id}/${product.id}/` +
              `${index}.${fileExt}`;

            const {
              error:
                uploadError,
            } =
              await supabase.storage
                .from(
                  "product-images",
                )
                .upload(
                  filePath,
                  image.file,
                );

            if (uploadError) {
              throw uploadError;
            }

            const {
              data: {
                publicUrl,
              },
            } =
              supabase.storage
                .from(
                  "product-images",
                )
                .getPublicUrl(
                  filePath,
                );

            const {
              error:
                imageInsertError,
            } =
              await supabase
                .from(
                  "product_images",
                )
                .insert({
                  product_id:
                    product.id,
                  image_url:
                    publicUrl,
                  display_order:
                    index,
                  color_name:
                    image.colorName ||
                    null,
                } as any);

            if (
              imageInsertError
            ) {
              throw imageInsertError;
            }
          },
        ),
      );

      if (
        isPro &&
        uploadVideos.length > 0
      ) {
        await Promise.all(
          uploadVideos.map(
            async (
              video,
              index,
            ) => {
              const fileExt =
                video.file.name
                  .split(".")
                  .pop() ||
                "mp4";

              const filePath =
                `${store.id}/${product.id}/` +
                `${Date.now()}_${index}.${fileExt}`;

              const {
                error:
                  uploadError,
              } =
                await supabase.storage
                  .from(
                    "product-videos",
                  )
                  .upload(
                    filePath,
                    video.file,
                  );

              if (uploadError) {
                throw uploadError;
              }

              const {
                data: {
                  publicUrl,
                },
              } =
                supabase.storage
                  .from(
                    "product-videos",
                  )
                  .getPublicUrl(
                    filePath,
                  );

              const {
                error:
                  videoInsertError,
              } =
                await db
                  .from(
                    "product_videos",
                  )
                  .insert({
                    product_id:
                      product.id,
                    store_id:
                      store.id,
                    video_url:
                      publicUrl,
                    display_order:
                      uploadImages.length +
                      index,
                  });

              if (
                videoInsertError
              ) {
                throw videoInsertError;
              }
            },
          ),
        );
      }

      if (
        relatedProductIds.length > 0
      ) {
        const {
          error:
            relatedInsertError,
        } =
          await db
            .from(
              "product_related",
            )
            .insert(
              relatedProductIds.map(
                (
                  relatedId,
                  index,
                ) => ({
                  product_id:
                    product.id,
                  related_product_id:
                    relatedId,
                  display_order:
                    index,
                                }),
              ),
            );

        if (
          relatedInsertError
        ) {
          throw relatedInsertError;
        }
      }

      setCreatedProduct({
        id: product.id,
        name: product.name,
        slug:
          product.slug || slug,
        price:
          parseFloat(
            form.price,
          ) || 0,
        imageUrl:
          uploadImages[0]
            ?.preview,
      });
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Could not add product",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!store) {
    return null;
  }

  if (createdProduct) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar
            store={store}
            role={role}
          />

          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
              <SidebarTrigger className="mr-4" />

              <h2 className="font-display text-lg font-semibold text-foreground">
                Product Added
              </h2>
            </header>

            <main className="flex-1 p-6 bg-background flex items-center justify-center">
              <PostUploadSuccess
                productName={
                  createdProduct.name
                }
                productId={
                  createdProduct.id
                }
                productSlug={
                  createdProduct.slug
                }
                productPrice={
                  createdProduct.price
                }
                productImageUrl={
                  createdProduct.imageUrl
                }
                storeSlug={
                  store.slug
                }
                onAddAnother={
                  resetForm
                }
              />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!canAddProduct) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar
            store={store}
            role={role}
          />

          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
              <SidebarTrigger className="mr-4" />

              <h2 className="font-display text-lg font-semibold text-foreground">
                Add Product
              </h2>
            </header>

            <main className="flex-1 p-6 bg-background flex items-center justify-center">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <Crown className="h-8 w-8 text-accent-foreground" />
                </div>

                <h2 className="font-display text-xl font-bold text-foreground">
                  Free plan limit reached
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  You&apos;ve added{" "}
                  {productCount} of{" "}
                  {FREE_PRODUCT_LIMIT}{" "}
                  products on the Free
                  plan. Upgrade to Pro
                  for more product
                  capacity.
                </p>

                <div className="mt-6 space-y-3">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={() =>
                      setShowUpgrade(
                        true,
                      )
                    }
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro -
                    ₦3,500/mo
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() =>
                      navigate(
                        "/dashboard/products",
                      )
                    }
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Products
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </div>

        <UpgradeModal
          open={showUpgrade}
          onOpenChange={
            setShowUpgrade
          }
          storeId={
            store?.id || null
          }
          reason="limit"
        />
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar
          store={store}
          role={role}
        />

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
            <SidebarTrigger className="mr-4" />

            <h2 className="font-display text-lg font-semibold text-foreground">
              Add Product
            </h2>
          </header>

          <main className="flex-1 p-4 sm:p-6 bg-background">
            <Button
              variant="ghost"
              onClick={() =>
                navigate(
                  "/dashboard/products",
                )
              }
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>

            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card">
                {!isPro && (
                  <div className="mb-5 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {productCount} of{" "}
                      {
                        FREE_PRODUCT_LIMIT
                      }{" "}
                      products used
                      (Free plan)
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setShowUpgrade(
                          true,
                        )
                      }
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Upgrade
                    </button>
                  </div>
                )}

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="space-y-6"
                >
                  <div>
                    <Label htmlFor="name">
                      Product Name
                    </Label>

                    <Input
                      id="name"
                      value={
                        form.name
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          name:
                            e.target
                              .value,
                        })
                      }
                      placeholder="e.g. Luxury Brazilian Wig"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">
                      Price (₦)
                    </Label>

                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.price
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price:
                            e.target
                              .value,
                        })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">
                      Description
                    </Label>

                    <Textarea
                      id="description"
                      value={
                        form.description
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          description:
                            e.target
                              .value,
                        })
                      }
                      placeholder="Describe your product..."
                      rows={4}
                    />
                  </div>
                                    <div>
                    <Label>
                      Product Type
                    </Label>

                    <Select
                      value={
                        form.productType
                      }
                      onValueChange={(
                        value,
                      ) =>
                        setForm({
                          ...form,
                          productType:
                            value as
                              | "physical"
                              | "digital",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="physical">
                          Physical Product
                        </SelectItem>

                        <SelectItem value="digital">
                          Digital Product
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.productType ===
                    "physical" && (
                    <div className="space-y-4 rounded-xl bg-muted/50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="hasVariants">
                            Product Variants
                          </Label>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Add sizes, colours
                            and stock per
                            combination.
                          </p>
                        </div>

                        <Switch
                          id="hasVariants"
                          checked={
                            hasVariants
                          }
                          onCheckedChange={(
                            value,
                          ) => {
                            setHasVariants(
                              value,
                            );

                            if (!value) {
                              setSelectedSizes(
                                [],
                              );
                              setColors([]);
                              setVariantRows(
                                [],
                              );
                            }
                          }}
                        />
                      </div>

                      {hasVariants ? (
                        <div className="space-y-6 border-t border-border/60 pt-4">
                          <div>
                            <div className="mb-3 flex items-center gap-2">
                              <Ruler className="h-4 w-4 text-primary" />

                              <Label>
                                Sizes
                              </Label>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {AVAILABLE_SIZES.map(
                                (
                                  size,
                                ) => (
                                  <button
                                    key={
                                      size
                                    }
                                    type="button"
                                    onClick={() =>
                                      toggleSize(
                                        size,
                                      )
                                    }
                                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                                      selectedSizes.includes(
                                        size,
                                      )
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background text-foreground hover:border-primary/50"
                                    }`}
                                  >
                                    {
                                      size
                                    }
                                  </button>
                                ),
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="mb-3 flex items-center gap-2">
                              <Palette className="h-4 w-4 text-primary" />

                              <Label>
                                Colours
                              </Label>
                            </div>

                            {colors.length >
                              0 && (
                              <div className="mb-4 flex flex-wrap gap-2">
                                {colors.map(
                                  (
                                    color,
                                  ) => (
                                    <div
                                      key={
                                        color.id
                                      }
                                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                                    >
                                      <span
                                        className="h-4 w-4 rounded-full border border-border"
                                        style={{
                                          backgroundColor:
                                            color.hex,
                                        }}
                                      />

                                      <span className="text-sm">
                                        {
                                          color.name
                                        }
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeColor(
                                            color.id,
                                          )
                                        }
                                        className="ml-1 text-muted-foreground hover:text-destructive"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                              <Input
                                value={
                                  newColorName
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setNewColorName(
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="Colour name, e.g. Navy"
                              />

                              <input
                                type="color"
                                value={
                                  newColorHex
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setNewColorHex(
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background p-1 sm:w-12"
                              />

                              <Button
                                type="button"
                                variant="outline"
                                onClick={
                                  addColor
                                }
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add colour
                              </Button>
                            </div>
                          </div>

                          {variantRows.length >
                            0 && (
                            <div className="space-y-3">
                              <div>
                                <Label>
                                  Variant
                                  Inventory
                                </Label>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  Set stock,
                                  SKU and an
                                  optional price
                                  for each
                                  variation.
                                </p>
                              </div>

                              <div className="space-y-3">
                                {variantRows.map(
                                  (
                                    row,
                                    index,
                                  ) => (
                                    <div
                                      key={`${row.size}-${row.colorId}`}
                                      className="rounded-xl border border-border bg-background p-4"
                                    >
                                      <div className="mb-4 flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">
                                          {
                                            row.size
                                          }
                                        </Badge>

                                        <Badge
                                          variant="outline"
                                          className="gap-2"
                                        >
                                          <span
                                            className="h-3 w-3 rounded-full border border-border"
                                            style={{
                                              backgroundColor:
                                                row.colorHex,
                                            }}
                                          />
                                          {
                                            row.colorName
                                          }
                                        </Badge>
                                      </div>

                                      <div className="grid gap-3 sm:grid-cols-3">
                                        <div>
                                          <Label className="text-xs">
                                            SKU
                                          </Label>

                                          <Input
                                            value={
                                              row.sku
                                            }
                                            onChange={(
                                              event,
                                            ) =>
                                              updateVariantRow(
                                                index,
                                                "sku",
                                                event
                                                  .target
                                                  .value,
                                              )
                                            }
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-xs">
                                            Price
                                            override
                                          </Label>

                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                              row.priceOverride
                                            }
                                            onChange={(
                                              event,
                                            ) =>
                                              updateVariantRow(
                                                index,
                                                "priceOverride",
                                                event
                                                  .target
                                                  .value,
                                              )
                                            }
                                            placeholder={
                                              form.price ||
                                              "Optional"
                                            }
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-xs">
                                            Stock
                                          </Label>

                                          <div className="flex items-center gap-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="icon"
                                              onClick={() =>
                                                updateVariantRow(
                                                  index,
                                                  "stock",
                                                  Math.max(
                                                    0,
                                                    row.stock -
                                                      1,
                                                  ),
                                                )
                                              }
                                            >
                                              <Minus className="h-4 w-4" />
                                            </Button>

                                            <Input
                                              type="number"
                                              min="0"
                                              value={
                                                row.stock
                                              }
                                              onChange={(
                                                event,
                                              ) =>
                                                updateVariantRow(
                                                  index,
                                                  "stock",
                                                  Math.max(
                                                    0,
                                                    Number.parseInt(
                                                      event
                                                        .target
                                                        .value,
                                                    ) ||
                                                      0,
                                                  ),
                                                )
                                              }
                                              className="text-center"
                                            />

                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="icon"
                                              onClick={() =>
                                                updateVariantRow(
                                                  index,
                                                  "stock",
                                                  row.stock +
                                                    1,
                                                )
                                              }
                                            >
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 border-t border-border/60 pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="trackInventory">
                                Track
                                Inventory
                              </Label>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Track one stock
                                quantity for this
                                product.
                              </p>
                            </div>

                            <Switch
                              id="trackInventory"
                              checked={
                                form.trackInventory
                              }
                              onCheckedChange={(
                                value,
                              ) =>
                                setForm({
                                  ...form,
                                  trackInventory:
                                    value,
                                })
                              }
                            />
                          </div>

                          {form.trackInventory && (
                            <div>
                              <Label htmlFor="stock">
                                Stock Quantity
                              </Label>

                              <Input
                                id="stock"
                                type="number"
                                min="0"
                                value={
                                  form.stockQuantity
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setForm({
                                    ...form,
                                    stockQuantity:
                                      Number.parseInt(
                                        event
                                          .target
                                          .value,
                                      ) ||
                                      0,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {form.productType ===
                    "digital" && (
                    <div>
                      <Label htmlFor="digitalUrl">
                        Download URL
                        (Google Drive /
                        Dropbox link)
                      </Label>

                      <Input
                        id="digitalUrl"
                        value={
                          form.digitalFileUrl
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm({
                            ...form,
                            digitalFileUrl:
                              event
                                .target
                                .value,
                          })
                        }
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label>
                        Product Images
                      </Label>

                      <span className="text-xs text-muted-foreground">
                        {
                          uploadImages.length
                        }
                        /{maxImages}
                        {!isPro &&
                          " (3 images on Free plan)"}
                      </span>
                    </div>

                    {uploadImages.length >
                      0 && (
                      <div className="mb-3 space-y-3">
                        {uploadImages.map(
                          (
                            image,
                            index,
                          ) => (
                            <div
                              key={
                                image.id
                              }
                              className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/50 p-3"
                            >
                              <img
                                src={
                                  image.preview
                                }
                                alt=""
                                className="h-16 w-16 rounded bg-white object-cover"
                              />

                              <div className="flex-1">
                                <Label className="mb-1 block text-xs text-muted-foreground">
                                  Image{" "}
                                  {index +
                                    1}{" "}
                                  - Assign
                                  to Colour
                                  (optional)
                                </Label>

                                {hasVariants &&
                                colors.length >
                                  0 ? (
                                  <Select
                                    value={
                                      image.colorName ||
                                      "all"
                                    }
                                    onValueChange={(
                                      colorName,
                                    ) =>
                                      handleImageColorChange(
                                        index,
                                        colorName,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-9 text-sm">
                                      <SelectValue placeholder="Select colour variant" />
                                    </SelectTrigger>

                                    <SelectContent>
                                      <SelectItem value="all">
                                        All
                                        colours
                                        (default)
                                      </SelectItem>

                                      {colors.map(
                                        (
                                          color,
                                        ) => (
                                          <SelectItem
                                            key={
                                              color.id
                                            }
                                            value={
                                              color.name
                                            }
                                          >
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="h-4 w-4 rounded-full border border-border"
                                                style={{
                                                  backgroundColor:
                                                    color.hex,
                                                }}
                                              />

                                              {
                                                color.name
                                              }
                                            </div>
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <p className="text-xs italic text-muted-foreground">
                                    Enable
                                    variants to
                                    assign
                                    colours
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeImage(
                                    image.id,
                                  )
                                }
                                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    {uploadImages.length <
                      maxImages && (
                      <>
                        <input
                          ref={
                            imageInputRef
                          }
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={
                            handleImageSelect
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            imageInputRef.current?.click()
                          }
                          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <UploadCloud className="h-8 w-8" />
                          <span>
                            Click to
                            upload images
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                                    <div>
                    {isPro ? (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <Label>
                            Product Videos
                          </Label>

                          <span className="text-xs text-muted-foreground">
                            {
                              uploadVideos.length
                            }
                            /{maxVideos}
                          </span>
                        </div>

                        {uploadVideos.length >
                          0 && (
                          <div className="mb-3 space-y-2">
                            {uploadVideos.map(
                              (
                                video,
                              ) => (
                                <div
                                  key={
                                    video.id
                                  }
                                  className="flex items-center gap-3 rounded-lg bg-muted/50 p-2"
                                >
                                  <video
                                    src={
                                      video.preview
                                    }
                                    className="h-10 w-16 rounded object-cover"
                                  />

                                  <span className="flex-1 truncate text-sm text-foreground">
                                    {
                                      video.name
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeVideo(
                                        video.id,
                                      )
                                    }
                                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        {uploadVideos.length <
                          maxVideos && (
                          <>
                            <input
                              ref={
                                videoInputRef
                              }
                              type="file"
                              accept="video/*"
                              multiple
                              className="hidden"
                              onChange={
                                handleVideoSelect
                              }
                            />

                            <button
                              type="button"
                              onClick={() =>
                                videoInputRef.current?.click()
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                            >
                              <UploadCloud className="h-5 w-5" />
                              Add Video
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setShowUpgrade(
                            true,
                          )
                        }
                        className="w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/20 p-5 text-left transition hover:border-primary/40 hover:shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Video className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">
                                Product
                                Videos
                              </p>

                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                Pro
                              </Badge>
                            </div>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              Add product
                              videos to
                              showcase
                              movement,
                              detail and
                              quality from
                              every angle.
                            </p>

                            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                              <Crown className="h-4 w-4" />
                              Unlock with
                              Storvo Pro
                            </span>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 rounded-xl bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="isNegotiable">
                          Price is
                          Negotiable
                        </Label>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Buyers can make
                          a price offer
                        </p>
                      </div>

                      <Switch
                        id="isNegotiable"
                        checked={
                          form.isNegotiable
                        }
                        onCheckedChange={(
                          value,
                        ) =>
                          setForm({
                            ...form,
                            isNegotiable:
                              value,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label
                          htmlFor="allowDownload"
                          className={
                            !isPro
                              ? "cursor-not-allowed text-muted-foreground"
                              : "cursor-pointer"
                          }
                        >
                          Allow Media
                          Download{" "}
                          {!isPro && (
                            <Crown className="ml-1 inline h-3.5 w-3.5 text-amber-500" />
                          )}
                        </Label>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Buyers can save
                          your
                          photos/videos
                        </p>
                      </div>

                      <Switch
                        id="allowDownload"
                        checked={
                          isPro
                            ? form.allowMediaDownload
                            : false
                        }
                        onCheckedChange={(
                          value,
                        ) =>
                          isPro
                            ? setForm({
                                ...form,
                                allowMediaDownload:
                                  value,
                              })
                            : setShowUpgrade(
                                true,
                              )
                        }
                        disabled={
                          !isPro
                        }
                      />
                    </div>
                  </div>

                  <RelatedProductsPicker
                    storeId={
                      store.id
                    }
                    selectedIds={
                      relatedProductIds
                    }
                    onChange={
                      setRelatedProductIds
                    }
                  />

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading
                      ? "Adding product..."
                      : "Add Product"}
                  </Button>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onOpenChange={
          setShowUpgrade
        }
        storeId={
          store?.id || null
        }
        reason="limit"
      />
    </SidebarProvider>
  );
};

export default AddProduct;