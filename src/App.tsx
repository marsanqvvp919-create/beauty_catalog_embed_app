import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ArrowUpDown,
  Package2,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SortKey = "name-asc" | "name-desc" | "price-asc" | "price-desc";
type CategoryKey = "all" | string;

const NEWLINE = String.fromCharCode(10);

const CATEGORY_LABELS: Record<string, string> = {
  all: "全体",
  ボトックス: "ボトックス",
  メソセラピー: "メソセラピー",
  フィラー: "フィラー",
  脂肪分解注射: "脂肪分解注射",
  医薬品: "医薬品",
  Thread: "糸リフト",
  ピーリング: "ピーリング",
};

function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

type Product = {
  id: string;
  nameJa: string;
  nameEn?: string;
  category: string;
  brand?: string;
  ingredient?: string;
  spec?: string;
  volume?: string;
  manufacturer?: string;
  country?: string;
  priceSmall?: number | null;
  price11To20?: number | null;
  price21To30?: number | null;
  price31To40?: number | null;
  price41To50?: number | null;
  price51To60?: number | null;
  price61To70?: number | null;
  price71To80?: number | null;
  price81To90?: number | null;
  price91To99?: number | null;
  priceMedium?: number | null;
  priceLarge?: number | null;
  image: string;
  gallery?: string[];
  description?: string;
  status?: string;
  tags?: string[];
  sortLetter?: string;
};

type QuoteCartItem = {
  product: Product;
  quantity: number;
};

type QuoteRequestForm = {
  clinicName: string;
  contactName: string;
  email: string;
  phone: string;
};

type QuoteRequestErrors = {
  clinicName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
};

type ShippingRule = {
  threshold: number;
  shippingFee: number;
};

const SHIPPING_RULES: ShippingRule[] = [
  { threshold: 100000, shippingFee: 10000 },
  { threshold: 300000, shippingFee: 15000 },
  { threshold: 500000, shippingFee: 20000 },
  { threshold: 1000000, shippingFee: 25000 },
  { threshold: 1500000, shippingFee: 30000 },
  { threshold: 2000000, shippingFee: 35000 },
  { threshold: 3000000, shippingFee: 45000 },
  { threshold: 4000000, shippingFee: 65000 },
  { threshold: 5000000, shippingFee: 85000 },
  { threshold: 6000000, shippingFee: 105000 },
  { threshold: 8000000, shippingFee: 125000 },
  { threshold: 10000000, shippingFee: 145000 },
  { threshold: 90000000, shippingFee: 345000 },
];

function getShippingFee(subtotal: number) {
  if (subtotal <= 0) return 0;
  const matched = SHIPPING_RULES.find((rule) => subtotal < rule.threshold);
  return matched?.shippingFee ?? SHIPPING_RULES[SHIPPING_RULES.length - 1].shippingFee;
}

function getHandlingFee(subtotal: number, shippingFee: number) {
  if (subtotal <= 0) return 0;
  return Math.round((subtotal + shippingFee) * 0.01);
}

const SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbykDkcRG8jSNjQvrFFbjsIa9qjnmf0YTX0UyIz1dNSTaNqQ2PEocB7H38S8ldyFGslpTQ/exec";

function formatYen(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseMaybeNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const normalized = String(value).replace(/[^0-9.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function normalizeRow(row: any): Product {
  const price11To20 = parseMaybeNumber(row.price11To20 ?? row.price_11_20 ?? row["11個-20個"]);
  const price21To30 = parseMaybeNumber(row.price21To30 ?? row.price_21_30 ?? row["21個-30個"]);
  const price31To40 = parseMaybeNumber(row.price31To40 ?? row.price_31_40 ?? row["31個-40個"]);
  const price41To50 = parseMaybeNumber(row.price41To50 ?? row.price_41_50 ?? row["41個-50個"]);
  const price51To60 = parseMaybeNumber(row.price51To60 ?? row.price_51_60 ?? row["51個-60個"]);
  const price61To70 = parseMaybeNumber(row.price61To70 ?? row.price_61_70 ?? row["61個-70個"]);
  const price71To80 = parseMaybeNumber(row.price71To80 ?? row.price_71_80 ?? row["71個-80個"]);
  const price81To90 = parseMaybeNumber(row.price81To90 ?? row.price_81_90 ?? row["81個-90個"]);
  const price91To99 = parseMaybeNumber(row.price91To99 ?? row.price_91_99 ?? row["91個-99個"]);

  return {
    id: String(row.id ?? row.ID ?? crypto.randomUUID()),
    nameJa: String(row.nameJa ?? row.商品名 ?? ""),
    nameEn: row.nameEn ?? row.name ?? row.英語名 ?? "",
    category: String(row.category ?? row.カテゴリ ?? "その他"),
    brand: row.brand ?? row.ブランド ?? "",
    ingredient: row.ingredient ?? row.主成分 ?? "",
    spec: row.spec ?? row.規格 ?? "",
    volume: row.volume ?? row.容量 ?? "",
    manufacturer: row.manufacturer ?? row.メーカー ?? "",
    country: row.country ?? row.製造国 ?? "",
    priceSmall: parseMaybeNumber(row.priceSmall ?? row["1個-10個"] ?? row.price_1_10),
    price11To20,
    price21To30,
    price31To40,
    price41To50,
    price51To60,
    price61To70,
    price71To80,
    price81To90,
    price91To99,
    priceMedium:
      parseMaybeNumber(row.priceMedium ?? row["10個-99個"] ?? row.price_10_99) ??
      price11To20 ??
      price21To30 ??
      price31To40 ??
      price41To50 ??
      price51To60 ??
      price61To70 ??
      price71To80 ??
      price81To90 ??
      price91To99,
    priceLarge: parseMaybeNumber(row.priceLarge ?? row["100個以上"] ?? row.price_100_plus),
    image: String(row.image ?? row.画像 ?? "https://placehold.co/900x900?text=No+Image"),
    gallery: Array.isArray(row.gallery)
      ? row.gallery.filter(Boolean)
      : String(row.gallery ?? row.ギャラリー ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
    description: row.description ?? row.説明 ?? "",
    status: row.status ?? row.状態 ?? "取扱中",
    tags: Array.isArray(row.tags)
      ? row.tags.filter(Boolean)
      : String(row.tags ?? row.タグ ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
    sortLetter: String(row.sortLetter ?? row.頭文字 ?? row.nameJa?.[0] ?? "").toUpperCase(),
  };
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(SHEET_ENDPOINT, { cache: "no-store" });
  if (!res.ok) throw new Error("商品データの取得に失敗しました。");
  const data = await res.json();

  if (Array.isArray(data?.rows)) return data.rows.map(normalizeRow);
  if (Array.isArray(data)) return data.map(normalizeRow);

  throw new Error("データ形式が正しくありません。rows配列または配列を返してください。");
}

function ProductBadge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "active" | "subtle";
}) {
  const toneClass =
    tone === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "subtle"
        ? "border-slate-100 bg-slate-100 text-slate-500"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClass}`}>
      {children}
    </span>
  );
}

function getUnitPrice(product: Product, quantity: number) {
  if (quantity >= 100 && product.priceLarge != null) return product.priceLarge;
  if (quantity >= 91 && product.price91To99 != null) return product.price91To99;
  if (quantity >= 81 && product.price81To90 != null) return product.price81To90;
  if (quantity >= 71 && product.price71To80 != null) return product.price71To80;
  if (quantity >= 61 && product.price61To70 != null) return product.price61To70;
  if (quantity >= 51 && product.price51To60 != null) return product.price51To60;
  if (quantity >= 41 && product.price41To50 != null) return product.price41To50;
  if (quantity >= 31 && product.price31To40 != null) return product.price31To40;
  if (quantity >= 21 && product.price21To30 != null) return product.price21To30;
  if (quantity >= 11 && product.price11To20 != null) return product.price11To20;
  return (
    product.priceSmall ??
    product.price11To20 ??
    product.price21To30 ??
    product.price31To40 ??
    product.price41To50 ??
    product.price51To60 ??
    product.price61To70 ??
    product.price71To80 ??
    product.price81To90 ??
    product.price91To99 ??
    product.priceLarge ??
    null
  );
}

function DetailTable({ product }: { product: Product }) {
  const prices = [
    { label: "100個以上", value: product.priceLarge, accent: true },
    { label: "11個-99個", price: "-", accent: false },
    { label: "1個-10個", value: product.priceSmall, accent: false },
  ];

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="grid grid-cols-1 border-b border-slate-200 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="border-r-0 border-slate-200 bg-slate-50/70 xl:border-r">
          <div className="bg-sky-600 px-4 py-3 text-base font-bold text-white">主成分</div>
          <div className="flex min-h-[128px] items-center px-4 py-4 text-[18px] font-semibold leading-tight tracking-tight text-slate-900 md:text-[20px]">
            {product.ingredient || "-"}
          </div>
        </div>

        <div>
          <div className="px-4 py-3 text-base font-bold text-slate-900">価格</div>
          <div className="grid grid-cols-1 border-t border-slate-200 sm:grid-cols-3">
            {prices.map((price, index) => (
              <div
                key={price.label}
                className={`flex min-h-[128px] flex-col justify-between overflow-hidden bg-white p-3 text-center ${
                  index < prices.length - 1 ? "border-b border-slate-200 sm:border-b-0 sm:border-r" : ""
                } border-slate-200`}
              >
                <div
                  className={`text-[12px] font-semibold leading-tight ${
                    price.accent ? "text-sky-600" : "text-slate-500"
                  }`}
                >
                  {price.label}
                </div>

                <div className="flex min-h-[52px] items-center justify-center px-1">
                  <div
                    className={`w-full text-center leading-none tracking-[-0.04em] ${
                      price.accent
                        ? "text-[clamp(1.7rem,2vw,2.5rem)] font-bold text-sky-600"
                        : "text-[clamp(1.25rem,1.7vw,2rem)] font-bold text-slate-900"
                    }`}
                  >
                    {"value" in price
                      ? formatYen(price.value)
                      : price.price === "-"
                        ? "-"
                        : price.price}
                  </div>
                </div>

                <div className="mx-auto max-w-[96px] text-[10px] leading-snug text-slate-400">
                  税別・1箱あたり
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border-b border-r-0 border-slate-200 md:border-b-0 md:border-r">
          <div className="grid grid-cols-[120px_1fr] md:grid-cols-[132px_1fr]">
            <div className="bg-sky-600 px-4 py-3 text-base font-bold text-white">規格</div>
            <div className="px-4 py-3 text-base text-slate-900">{product.spec || "-"}</div>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-[120px_1fr] md:grid-cols-[132px_1fr]">
            <div className="bg-sky-600 px-4 py-3 text-base font-bold text-white">容量</div>
            <div className="px-4 py-3 text-base text-slate-900">{product.volume || "-"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-slate-200 md:grid-cols-2">
        <div className="border-b border-r-0 border-slate-200 md:border-b-0 md:border-r">
          <div className="grid grid-cols-[120px_1fr] md:grid-cols-[132px_1fr]">
            <div className="bg-sky-600 px-4 py-3 text-base font-bold text-white">製造国</div>
            <div className="px-4 py-3 text-base text-slate-900">{product.country || "-"}</div>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-[120px_1fr] md:grid-cols-[132px_1fr]">
            <div className="bg-sky-600 px-4 py-3 text-base font-bold text-white">メーカー</div>
            <div className="px-4 py-3 text-base text-slate-900">{product.manufacturer || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPriceBandLabel(quantity: number) {
  if (quantity >= 100) return "100個以上";
  if (quantity >= 91) return "91個-99個";
  if (quantity >= 81) return "81個-90個";
  if (quantity >= 71) return "71個-80個";
  if (quantity >= 61) return "61個-70個";
  if (quantity >= 51) return "51個-60個";
  if (quantity >= 41) return "41個-50個";
  if (quantity >= 31) return "31個-40個";
  if (quantity >= 21) return "21個-30個";
  if (quantity >= 11) return "11個-20個";
  return "1個-10個";
}

function ProductModal({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}) {
  const [activeImage, setActiveImage] = useState<string>(product?.gallery?.[0] || product?.image || "");
  const [quantity, setQuantity] = useState<string>("1");

  useEffect(() => {
    setActiveImage(product?.gallery?.[0] || product?.image || "");
    setQuantity("1");
  }, [product]);

  if (!product) return null;
  const images = Array.from(new Set([product.image, ...(product.gallery || [])].filter(Boolean)));
  const parsedQuantity = Number(quantity);
  const safeQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? Math.floor(parsedQuantity) : 1;
  const unitPrice = getUnitPrice(product, safeQuantity);
  const totalPrice = unitPrice != null ? unitPrice * safeQuantity : null;
  const activeBandLabel = getPriceBandLabel(safeQuantity);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition hover:scale-105 hover:bg-slate-50"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid max-h-[92vh] grid-cols-1 overflow-auto lg:grid-cols-[420px_1fr]">
            <div className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
              <div className="p-5">
                <div className="aspect-square overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                  <img src={activeImage} alt={product.nameJa} className="h-full w-full object-contain" />
                </div>
                {images.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {images.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        onClick={() => setActiveImage(src)}
                        className={`aspect-square overflow-hidden rounded-2xl border bg-white transition ${
                          activeImage === src ? "border-slate-900 ring-2 ring-slate-200" : "border-slate-200"
                        }`}
                      >
                        <img src={src} alt={`${product.nameJa}-${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 md:p-7">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <ProductBadge tone="active">{getCategoryLabel(product.category)}</ProductBadge>
                {product.status ? <ProductBadge tone="subtle">{product.status}</ProductBadge> : null}
                {product.brand ? <ProductBadge>{product.brand}</ProductBadge> : null}
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium tracking-[0.24em] text-slate-400">PRODUCT DETAIL</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  {product.nameJa}
                </h2>
                {product.nameEn ? <p className="mt-2 text-lg text-slate-500">{product.nameEn}</p> : null}
              </div>

              <DetailTable product={product} />

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold tracking-[0.2em] text-slate-500">見積もり追加</div>
                    <p className="mt-1 text-sm text-slate-500">
                      数量に応じて 1〜10 / 11〜20 / 21〜30 / 31〜40 / 41〜50 / 51〜60 / 61〜70 / 71〜80 / 81〜90 / 91〜99 / 100以上 の価格帯を自動判定します。
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">適用単価</div>
                    <div className="mt-1 inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {activeBandLabel}
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      {formatYen(unitPrice)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="inline-flex w-full max-w-[220px] items-center justify-between rounded-2xl border border-slate-200 bg-white p-1.5">
                    <button
                      onClick={() =>
                        setQuantity((prev) => {
                          const current = Number(prev);
                          const next = Number.isFinite(current) && current > 1 ? current - 1 : 1;
                          return String(next);
                        })
                      }
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantity}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (nextValue === "") {
                          setQuantity("");
                          return;
                        }
                        if (/^[0-9]+$/.test(nextValue)) {
                          setQuantity(nextValue);
                        }
                      }}
                      onBlur={() => {
                        const normalized = Number(quantity);
                        if (!Number.isFinite(normalized) || normalized < 1) {
                          setQuantity("1");
                          return;
                        }
                        setQuantity(String(Math.floor(normalized)));
                      }}
                      className="w-20 border-0 bg-transparent text-center text-lg font-semibold outline-none"
                    />
                    <button
                      onClick={() =>
                        setQuantity((prev) => {
                          const current = Number(prev);
                          const next = Number.isFinite(current) && current >= 1 ? current + 1 : 1;
                          return String(next);
                        })
                      }
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 md:ml-auto">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">概算合計</div>
                      <div className="text-3xl font-bold tracking-tight text-sky-600">{formatYen(totalPrice)}</div>
                    </div>
                    <button
                      onClick={() => onAddToCart(product, safeQuantity)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      見積もりに追加
                    </button>
                  </div>
                </div>
              </div>

              {product.description ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 text-sm font-semibold tracking-[0.2em] text-slate-500">DESCRIPTION</div>
                  <p className="leading-7 text-slate-700">{product.description}</p>
                </div>
              ) : null}

              {product.tags && product.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <ProductBadge key={tag}>{tag}</ProductBadge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.16 }}
      onClick={onClick}
      className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 md:h-48">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-sky-50/60 to-transparent" />
        <img
          src={product.image}
          alt={product.nameJa}
          className="relative z-10 h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">{getCategoryLabel(product.category)}</span>
          {product.status ? <ProductBadge tone="subtle">{product.status}</ProductBadge> : null}
        </div>

        <h3 className="line-clamp-2 min-h-[2.8rem] text-[18px] font-semibold leading-snug tracking-tight text-slate-900">
          {product.nameJa}
        </h3>

        {product.nameEn ? (
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{product.nameEn}</p>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
          <div>
            <div className="text-[10px] text-slate-400">主成分</div>
            <div className="mt-1 line-clamp-1 text-xs font-medium text-slate-700">
              {product.ingredient || "-"}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">メーカー</div>
            <div className="mt-1 line-clamp-1 text-xs font-medium text-slate-700">
              {product.manufacturer || "-"}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] text-slate-400">1個-10個</div>
            <div className="text-[24px] font-bold leading-none tracking-tight text-slate-900">
              {formatYen(product.priceSmall)}
            </div>
          </div>

          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white">
            詳細を見る
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string) {
  return /^[0-9+()\-\s]{10,15}$/.test(phone.trim());
}

function validateQuoteRequestForm(form: QuoteRequestForm) {
  const errors: QuoteRequestErrors = {};

  if (!form.clinicName.trim()) {
    errors.clinicName = "クリニック名を入力してください。";
  }

  if (!form.contactName.trim()) {
    errors.contactName = "担当者名を入力してください。";
  }

  if (!form.email.trim()) {
    errors.email = "メールアドレスを入力してください。";
  } else if (!isValidEmail(form.email)) {
    errors.email = "メールアドレスの形式が正しくありません。";
  }

  if (!form.phone.trim()) {
    errors.phone = "電話番号を入力してください。";
  } else if (!isValidPhone(form.phone)) {
    errors.phone = "電話番号の形式が正しくありません。";
  }

  return errors;
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Package2 className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900">該当する商品がありません</h3>
      <p className="mt-2 text-slate-500">検索条件またはカテゴリを変更してください。</p>
    </div>
  );
}

function QuoteCartPanel({
  items,
  form,
  errors,
  showErrors,
  onFormChange,
  onTriggerValidation,
  onUpdateQuantity,
  onRemove,
  onClear,
  cartRef,
}: {
  items: QuoteCartItem[];
  form: QuoteRequestForm;
  errors: QuoteRequestErrors;
  showErrors: boolean;
  onFormChange: (field: keyof QuoteRequestForm, value: string) => void;
  onTriggerValidation: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  cartRef: React.RefObject<HTMLDivElement | null>;
}) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const unitPrice = getUnitPrice(item.product, item.quantity) ?? 0;
    return sum + unitPrice * item.quantity;
  }, 0);
  const shippingFee = getShippingFee(subtotal);
  const handlingFee = getHandlingFee(subtotal, shippingFee);
  const totalAmount = subtotal + shippingFee + handlingFee;

  const inquiryText = items
    .map((item) => {
      const unitPrice = getUnitPrice(item.product, item.quantity);
      return `・${item.product.nameJa} / 数量: ${item.quantity} / 想定単価: ${formatYen(unitPrice)}`;
    })
    .join(NEWLINE);

  const mailBody = [
    "下記商品の見積もりをお願いします。",
    "",
    `クリニック名: ${form.clinicName || "未入力"}`,
    `担当者名: ${form.contactName || "未入力"}`,
    `メールアドレス: ${form.email || "未入力"}`,
    `電話番号: ${form.phone || "未入力"}`,
    "",
    inquiryText,
    "",
    `合計数量: ${totalItems}`,
    `商品代金小計: ${formatYen(subtotal)}`,
    `送料: ${formatYen(shippingFee)}`,
    `手数料: ${formatYen(handlingFee)}`,
    `仮見積もり合計: ${formatYen(totalAmount)}`,
  ].join(NEWLINE);

  const hasErrors = Object.keys(errors).length > 0;
  const canSend =
    items.length > 0 &&
    form.clinicName.trim() !== "" &&
    form.contactName.trim() !== "" &&
    form.email.trim() !== "" &&
    form.phone.trim() !== "" &&
    !hasErrors;

  const mailtoHref = `mailto:info@example.com?subject=${encodeURIComponent(
    `美容製剤 見積もり依頼｜${form.clinicName || "未入力"}`
  )}&body=${encodeURIComponent(mailBody)}`;

  const clinicNameError = showErrors ? errors.clinicName : undefined;
  const contactNameError = showErrors ? errors.contactName : undefined;
  const emailError = showErrors ? errors.email : undefined;
  const phoneError = showErrors ? errors.phone : undefined;

  return (
    <div ref={cartRef} className="sticky top-6 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-[0.18em] text-slate-400">QUOTE CART</div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">仮見積もり</h2>
          </div>
          <div className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-slate-900 px-3 text-sm font-semibold text-white">
            {items.length}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white p-5">
        <div className="grid gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-[0.14em] text-slate-400">
              CLINIC NAME <span className="text-rose-500">※必須</span>
            </label>
            <input
              value={form.clinicName}
              onChange={(e) => onFormChange("clinicName", e.target.value)}
              placeholder="クリニック名を入力"
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm outline-none transition focus:bg-white ${
                clinicNameError
                  ? "border border-rose-300 bg-rose-50 focus:border-rose-400"
                  : "border border-slate-200 focus:border-slate-400"
              }`}
            />
            {clinicNameError ? <p className="mt-1.5 text-xs text-rose-500">{clinicNameError}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-[0.14em] text-slate-400">
              CONTACT PERSON <span className="text-rose-500">※必須</span>
            </label>
            <input
              value={form.contactName}
              onChange={(e) => onFormChange("contactName", e.target.value)}
              placeholder="担当者名を入力"
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm outline-none transition focus:bg-white ${
                contactNameError
                  ? "border border-rose-300 bg-rose-50 focus:border-rose-400"
                  : "border border-slate-200 focus:border-slate-400"
              }`}
            />
            {contactNameError ? <p className="mt-1.5 text-xs text-rose-500">{contactNameError}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-[0.14em] text-slate-400">
              EMAIL <span className="text-rose-500">※必須</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onFormChange("email", e.target.value)}
              placeholder="メールアドレスを入力"
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm outline-none transition focus:bg-white ${
                emailError
                  ? "border border-rose-300 bg-rose-50 focus:border-rose-400"
                  : "border border-slate-200 focus:border-slate-400"
              }`}
            />
            {emailError ? <p className="mt-1.5 text-xs text-rose-500">{emailError}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-[0.14em] text-slate-400">
              PHONE <span className="text-rose-500">※必須</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => onFormChange("phone", e.target.value)}
              placeholder="電話番号を入力"
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm outline-none transition focus:bg-white ${
                phoneError
                  ? "border border-rose-300 bg-rose-50 focus:border-rose-400"
                  : "border border-slate-200 focus:border-slate-400"
              }`}
            />
            {phoneError ? <p className="mt-1.5 text-xs text-rose-500">{phoneError}</p> : null}
          </div>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto p-5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            商品詳細から「見積もりに追加」でここに蓄積されます。
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const unitPrice = getUnitPrice(item.product, item.quantity);
              const lineTotal = unitPrice != null ? unitPrice * item.quantity : null;
              return (
                <div key={item.product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                      <img src={item.product.image} alt={item.product.nameJa} className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-400">{getCategoryLabel(item.product.category)}</div>
                      <div className="mt-1 line-clamp-2 text-base font-semibold text-slate-900">{item.product.nameJa}</div>
                      <div className="mt-2 text-sm text-slate-500">適用単価: {formatYen(unitPrice)}</div>
                      <div className="text-lg font-bold tracking-tight text-slate-900">{formatYen(lineTotal)}</div>
                    </div>
                    <button
                      onClick={() => onRemove(item.product.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-1.5">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="w-14 text-center text-base font-semibold">{item.quantity}</div>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm text-slate-500">数量に応じて単価自動切替</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>合計数量</span>
            <span className="font-semibold text-slate-900">{totalItems}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>商品代金小計</span>
            <span className="font-semibold text-slate-900">{formatYen(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>送料</span>
            <span className="font-semibold text-slate-900">{formatYen(shippingFee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>手数料（1%）</span>
            <span className="font-semibold text-slate-900">{formatYen(handlingFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-sm text-slate-500">仮見積もり合計</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900">{formatYen(totalAmount)}</span>
          </div>
        </div>

        <div
          className={`mb-3 rounded-2xl border px-4 py-3 text-xs ${
            showErrors && hasErrors ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          見積もり依頼の送信には、クリニック名・担当者名・メールアドレス・電話番号の入力が必要です。
        </div>

        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700">
          輸入関税、送料、手数料が別途かかります。
          為替の影響で価格が異なる場合もございますので、正式なお見積もりは上記を含めた内容で別途お送りいたします。
        </div>

        <div className="grid gap-3">
          <a
            href={canSend ? mailtoHref : undefined}
            onClick={(e) => {
              if (!canSend) {
                e.preventDefault();
                onTriggerValidation();
              }
            }}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition ${
              canSend ? "bg-slate-900 text-white hover:opacity-90" : "bg-slate-200 text-slate-400"
            }`}
          >
            <Send className="h-4 w-4" />
            見積もり依頼を送る
          </a>
          <button
            onClick={onClear}
            className={`inline-flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
              items.length > 0
                ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                : "pointer-events-none border-slate-200 bg-white text-slate-300"
            }`}
          >
            一覧をクリア
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name-asc");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quoteCart, setQuoteCart] = useState<QuoteCartItem[]>([]);
  const [quoteForm, setQuoteForm] = useState<QuoteRequestForm>({
    clinicName: "",
    contactName: "",
    email: "",
    phone: "",
  });

  const [showErrors, setShowErrors] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const cartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const rows = await fetchProducts();
        if (!mounted) return;
        setProducts(rows);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "商品データの取得に失敗しました。");
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const values = Array.from(new Set(products.map((item) => item.category).filter(Boolean)));
    return ["all", ...values];
  }, [products]);

  const categoryCounts = useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, currentCategory) => {
      acc[currentCategory] =
        currentCategory === "all"
          ? products.length
          : products.filter((item) => item.category === currentCategory).length;
      return acc;
    }, {});
  }, [categories, products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const rows = products.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const haystack = [
        item.nameJa,
        item.nameEn,
        item.category,
        item.brand,
        item.ingredient,
        item.manufacturer,
        item.country,
        ...(item.tags || []),
      ]
        .filter(Boolean)
        .join(NEWLINE)
        .toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesCategory && matchesQuery;
    });

    rows.sort((a, b) => {
      if (sortKey === "name-asc") return a.nameJa.localeCompare(b.nameJa, "ja");
      if (sortKey === "name-desc") return b.nameJa.localeCompare(a.nameJa, "ja");
      if (sortKey === "price-asc") {
        return (a.priceSmall ?? Number.MAX_SAFE_INTEGER) - (b.priceSmall ?? Number.MAX_SAFE_INTEGER);
      }
      return (b.priceSmall ?? -1) - (a.priceSmall ?? -1);
    });

    return rows;
  }, [products, query, category, sortKey]);

  const addToQuoteCart = (product: Product, quantity: number) => {
    setQuoteCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuoteQuantity = (productId: string, quantity: number) => {
    setQuoteCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  };

  const removeFromQuoteCart = (productId: string) => {
    setQuoteCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearQuoteCart = () => {
    setQuoteCart([]);
  };

  const quoteFormErrors = useMemo(() => validateQuoteRequestForm(quoteForm), [quoteForm]);

  const updateQuoteForm = (field: keyof QuoteRequestForm, value: string) => {
    setQuoteForm((prev) => ({ ...prev, [field]: value }));
  };

  const triggerQuoteValidation = () => {
    setShowErrors(true);
  };

  const scrollToCart = () => {
    setShowCartMobile(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const totalQuoteItems = quoteCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalQuoteSubtotal = quoteCart.reduce((sum, item) => {
    const unitPrice = getUnitPrice(item.product, item.quantity) ?? 0;
    return sum + unitPrice * item.quantity;
  }, 0);
  const totalQuoteShippingFee = getShippingFee(totalQuoteSubtotal);
  const totalQuoteHandlingFee = getHandlingFee(totalQuoteSubtotal, totalQuoteShippingFee);
  const totalQuoteAmount = totalQuoteSubtotal + totalQuoteShippingFee + totalQuoteHandlingFee;

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 md:py-10 xl:px-8">
        <div className="mb-8 overflow-hidden rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_14px_44px_rgba(15,23,42,0.05)] md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold tracking-[0.24em] text-slate-400">
                BEAUTY PRODUCT CATALOG
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                美容製剤カタログ
              </h1>
              <p className="mt-2 max-w-3xl text-slate-500">
                商品タップで詳細確認。カテゴリ・価格で比較しながら見積もり一覧へ追加し、そのまま依頼送信まで進められます。
              </p>
            </div>

            <button
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              フィルター
              <ChevronDown className={`h-4 w-4 transition ${showMobileFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className={`mt-6 space-y-4 ${showMobileFilters ? "block" : "hidden lg:block"}`}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="商品名・ブランド・主成分で検索"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="w-full lg:w-[220px]">
                <div className="relative">
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="name-asc">商品名 A→Z</option>
                    <option value="name-desc">商品名 Z→A</option>
                    <option value="price-asc">価格が低い順</option>
                    <option value="price-desc">価格が高い順</option>
                  </select>
                  <ArrowUpDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((item) => {
                const active = item === category;
                return (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <span>{item === "all" ? "全体" : getCategoryLabel(item)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {categoryCounts[item] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="mb-5 flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-slate-400">
                  CATALOG OVERVIEW
                </div>
                <div className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  {category === "all" ? "全商品一覧" : getCategoryLabel(category)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ProductBadge>{filtered.length}件表示</ProductBadge>
                <ProductBadge tone="subtle">
                  並び順:{" "}
                  {sortKey === "name-asc"
                    ? "A→Z"
                    : sortKey === "name-desc"
                      ? "Z→A"
                      : sortKey === "price-asc"
                        ? "価格昇順"
                        : "価格降順"}
                </ProductBadge>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                    <div className="h-44 animate-pulse bg-slate-100 md:h-48" />
                    <div className="space-y-2 p-4">
                      <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                      <div className="h-7 w-1/3 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} onClick={() => setSelected(product)} />
                ))}
              </motion.div>
            )}
          </div>

          <div className="hidden xl:block">
            <QuoteCartPanel
              items={quoteCart}
              form={quoteForm}
              errors={quoteFormErrors}
              showErrors={showErrors}
              onFormChange={updateQuoteForm}
              onTriggerValidation={triggerQuoteValidation}
              onUpdateQuantity={updateQuoteQuantity}
              onRemove={removeFromQuoteCart}
              onClear={clearQuoteCart}
              cartRef={cartRef}
            />
          </div>

          {showCartMobile ? (
            <div className="mt-6 xl:hidden">
              <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                <div>
                  <div className="text-xs font-semibold tracking-[0.14em] text-slate-400">MOBILE CART</div>
                  <div className="text-base font-bold text-slate-900">仮見積もりフォーム</div>
                </div>
                <button
                  onClick={() => setShowCartMobile(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  閉じる
                </button>
              </div>
              <QuoteCartPanel
                items={quoteCart}
                form={quoteForm}
                errors={quoteFormErrors}
                showErrors={showErrors}
                onFormChange={updateQuoteForm}
                onTriggerValidation={triggerQuoteValidation}
                onUpdateQuantity={updateQuoteQuantity}
                onRemove={removeFromQuoteCart}
                onClear={clearQuoteCart}
                cartRef={cartRef}
              />
            </div>
          ) : null}
        </div>
      </div>

      {!selected && totalQuoteItems > 0 ? (
        <button
          onClick={scrollToCart}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-3 text-left shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,23,42,0.18)] xl:hidden"
          aria-label="現在の合計見積もりを見る"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400">合計見積もり</div>
            <div className="text-sm font-bold text-slate-900">
              {totalQuoteItems}点 / {formatYen(totalQuoteAmount)}
            </div>
          </div>
        </button>
      ) : null}

      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onAddToCart={(product, quantity) => {
          addToQuoteCart(product, quantity);
          setSelected(null);
        }}
      />
    </div>
  );
}