import { ArrowRight, ShoppingBag } from "lucide-react";

type StoreHeroProps = {
  storeName: string;
  description?: string | null;
  logoUrl?: string | null;
  heroImage?: string | null;
  brandColor: string;
  accentColor?: string;
  headline: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  featuredLabel?: string;
  featuredText?: string;
  onShopNow: () => void;
  onBrowseCategories: () => void;
};

const StoreHero = ({
  storeName,
  description,
  logoUrl,
  heroImage,
  brandColor,
  accentColor,
  headline,
  primaryCtaLabel,
  secondaryCtaLabel = "Browse products",
  featuredLabel = "Featured collection",
  featuredText = "Products available",
  onShopNow,
  onBrowseCategories,
}: StoreHeroProps) => {
  const highlightColor = accentColor || brandColor;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm">
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          background: `radial-gradient(circle at 75% 30%, ${highlightColor}, transparent 46%)`,
        }}
      />

      <div className="relative grid min-h-[420px] items-center gap-8 px-6 py-10 md:grid-cols-[1.05fr_0.95fr] md:px-12 md:py-14">
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${storeName} logo`}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <ShoppingBag
                className="h-4 w-4"
                style={{ color: brandColor }}
              />
            )}

            {storeName}
          </div>

          <h1 className="max-w-2xl font-display text-4xl font-black leading-[1.05] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
            {headline}
          </h1>

          <div
            className="mt-4 h-1.5 w-20 rounded-full"
            style={{ backgroundColor: highlightColor }}
          />

          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            {description || `Discover products from ${storeName}.`}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onShopNow}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
              style={{ backgroundColor: brandColor }}
            >
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onBrowseCategories}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-6 text-sm font-bold text-foreground transition hover:bg-accent"
            >
              {secondaryCtaLabel}
            </button>
          </div>
        </div>

        <div className="relative min-h-[280px] overflow-hidden rounded-3xl bg-muted md:min-h-[340px]">
          {heroImage ? (
            <img
              src={heroImage}
              alt={`${storeName} featured product`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center md:min-h-[340px]">
              <div
                className="flex h-28 w-28 items-center justify-center rounded-3xl text-5xl font-black text-white shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, ${highlightColor})`,
                }}
              >
                {storeName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 rounded-xl bg-background/92 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {featuredLabel}
            </p>

            <p className="mt-0.5 text-sm font-bold text-foreground">
              {featuredText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreHero;