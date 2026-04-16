"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AllocationSlice } from "@/lib/calculations/portfolio-kpis";
import {
  layoutSquarifiedTreemapWithFloor,
} from "@/lib/charts/treemap-squarify";
import { formatQuoteMoney } from "@/lib/format/numbers";
import type { MarketData } from "@/lib/market-data/types";
import { positionQuoteKey } from "@/lib/market-data/types";
import type { AssetKind } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";

const KIND_LABEL: Record<AssetKind, string> = {
  crypto: "CRYPTO",
  equity: "EQUITIES",
  fixed_income: "FIXED INCOME",
};

const GROUP_LABEL_H = 15;
const OUTER_PAD = 2;
const TILE_GAP = 1;
const CHART_HEIGHT = 320;
/** So small exchange / venue bands stay legible vs a dominant group. */
const GROUP_LAYOUT_MIN_SHARE = 0.055;
/** Within a group, tiny positions still get a readable tile. */
const LEAF_LAYOUT_MIN_SHARE = 0.045;

export type TreemapAssetFilter = "all" | AssetKind;

type LeafLayout = {
  id: string;
  value: number;
  symbol: string;
  changePct: number | null;
  detail: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

type GroupLayout = {
  value: number;
  label: string;
  leaves: LeafLayout[];
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Diverging heat: red (down) → neutral → green (up), similar to market heatmaps. */
function changeToFill(pct: number | null): string {
  if (pct === null || !Number.isFinite(pct)) return "#3d4450";
  const cap = 3;
  const t = Math.max(-1, Math.min(1, pct / cap));
  if (Math.abs(t) < 0.04) return "#2c3139";
  if (t < 0) {
    const u = -t;
    const r = Math.round(lerp(55, 229, u));
    const g = Math.round(lerp(62, 72, u));
    const b = Math.round(lerp(70, 52, u));
    return `rgb(${r},${g},${b})`;
  }
  const u = t;
  const r = Math.round(lerp(55, 76, u));
  const g = Math.round(lerp(62, 175, u));
  const b = Math.round(lerp(70, 80, u));
  return `rgb(${r},${g},${b})`;
}

function sliceDetail(
  slice: AllocationSlice,
  quote: MarketData | undefined,
): string {
  const ex = slice.exchange ? ` · ${slice.exchange}` : "";
  const base = `${slice.symbol}${ex} — ${formatQuoteMoney(slice.value, slice.currency)}`;
  const ch = quote?.change24hPct;
  if (ch !== null && ch !== undefined && Number.isFinite(ch)) {
    return `${base} · 24h ${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`;
  }
  return `${base} · 24h n/a`;
}

function buildGroups(
  portfolio: PortfolioPosition[],
  slices: AllocationSlice[],
  quotes: Record<string, MarketData | undefined>,
): { label: string; leaves: Omit<LeafLayout, "x0" | "x1" | "y0" | "y1">[] }[] {
  const byKind = new Map<
    AssetKind,
    Omit<LeafLayout, "x0" | "x1" | "y0" | "y1">[]
  >();
  for (const slice of slices) {
    if (slice.value <= 0) continue;
    const p = portfolio.find((x) => x.id === slice.id);
    if (!p) continue;
    const q = quotes[positionQuoteKey(p)];
    const ch = q?.change24hPct ?? null;
    const ex = slice.exchange ? ` · ${slice.exchange}` : "";
    const leaf = {
      id: slice.id,
      value: slice.value,
      symbol: `${slice.symbol}${ex}`,
      changePct: ch,
      detail: sliceDetail(slice, q),
    };
    const list = byKind.get(slice.kind) ?? [];
    list.push(leaf);
    byKind.set(slice.kind, list);
  }

  const order: AssetKind[] = ["equity", "crypto", "fixed_income"];
  const groups: {
    label: string;
    leaves: Omit<LeafLayout, "x0" | "x1" | "y0" | "y1">[];
  }[] = [];
  for (const kind of order) {
    const leaves = byKind.get(kind);
    if (!leaves?.length) continue;
    leaves.sort((a, b) => b.value - a.value);
    groups.push({ label: KIND_LABEL[kind], leaves });
  }
  return groups;
}

/** Finer grouping when drilling into a single asset class (venue, quote ccy, etc.). */
function subgroupLabel(kind: AssetKind, key: string): string {
  if (kind === "equity") return key;
  if (kind === "crypto") return `CRYPTO · ${key}`;
  return `FIXED INCOME · ${key}`;
}

function buildSubgroups(
  kind: AssetKind,
  portfolio: PortfolioPosition[],
  slices: AllocationSlice[],
  quotes: Record<string, MarketData | undefined>,
): { label: string; leaves: Omit<LeafLayout, "x0" | "x1" | "y0" | "y1">[] }[] {
  const bySub = new Map<
    string,
    Omit<LeafLayout, "x0" | "x1" | "y0" | "y1">[]
  >();
  for (const slice of slices) {
    if (slice.kind !== kind || slice.value <= 0) continue;
    const p = portfolio.find((x) => x.id === slice.id);
    if (!p) continue;
    const q = quotes[positionQuoteKey(p)];
    const ch = q?.change24hPct ?? null;
    let subKey: string;
    if (kind === "equity") {
      subKey = (p.exchange?.trim() || slice.exchange?.trim() || "Venue n/a").toUpperCase();
    } else if (kind === "crypto") {
      subKey = (q?.currency?.trim().toUpperCase() || "Quote ccy n/a");
    } else {
      subKey = (
        p.fixedIncomeCurrency?.trim().toUpperCase() ||
        slice.currency.trim().toUpperCase() ||
        "Currency"
      );
    }
    const leaf = {
      id: slice.id,
      value: slice.value,
      symbol: `${slice.symbol}`,
      changePct: ch,
      detail: sliceDetail(slice, q),
    };
    const list = bySub.get(subKey) ?? [];
    list.push(leaf);
    bySub.set(subKey, list);
  }

  const entries = [...bySub.entries()].map(([key, leaves]) => ({
    key,
    leaves,
    total: leaves.reduce((a, l) => a + l.value, 0),
  }));
  entries.sort((a, b) => b.total - a.total);
  for (const e of entries) {
    e.leaves.sort((a, b) => b.value - a.value);
  }
  return entries.map((e) => ({
    label: subgroupLabel(kind, e.key),
    leaves: e.leaves,
  }));
}

function layoutGroups(
  groups: {
    label: string;
    leaves: Omit<LeafLayout, "x0" | "x1" | "y0" | "y1">[];
  }[],
  width: number,
  height: number,
): GroupLayout[] {
  const summaries: GroupLayout[] = groups.map((g) => ({
    value: g.leaves.reduce((a, l) => a + l.value, 0),
    label: g.label,
    leaves: g.leaves.map((l) => ({
      ...l,
      x0: 0,
      x1: 0,
      y0: 0,
      y1: 0,
    })),
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
  }));

  layoutSquarifiedTreemapWithFloor(summaries, 0, 0, width, height, {
    minValueShareOfTotal: GROUP_LAYOUT_MIN_SHARE,
  });

  for (const s of summaries) {
    const ix0 = s.x0 + OUTER_PAD;
    const iy0 = s.y0 + OUTER_PAD + GROUP_LABEL_H;
    const ix1 = s.x1 - OUTER_PAD;
    const iy1 = s.y1 - OUTER_PAD;
    if (ix1 > ix0 && iy1 > iy0 && s.leaves.length > 0) {
      layoutSquarifiedTreemapWithFloor(s.leaves, ix0, iy0, ix1, iy1, {
        minValueShareOfTotal: LEAF_LAYOUT_MIN_SHARE,
      });
    }
  }

  return summaries;
}

function HeaderRow({
  filterSelectId,
  viewFilter,
  setAssetFilter,
  kindsPresent,
}: {
  filterSelectId: string;
  viewFilter: TreemapAssetFilter;
  setAssetFilter: (v: TreemapAssetFilter) => void;
  kindsPresent: ReadonlySet<AssetKind>;
}) {
  const subtitle =
    viewFilter === "all"
      ? "Tile area is market value in your book currency; color is 24h % change (or neutral when unavailable). Grouped by asset class."
      : viewFilter === "equity"
        ? "Full-width view: tiles grouped by exchange / venue, sized by market value."
        : viewFilter === "crypto"
          ? "Full-width view: tiles grouped by quote currency from live data."
          : "Full-width view: tiles grouped by position currency.";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "flex-start" },
        justifyContent: "space-between",
        gap: 2,
        width: 1,
        minWidth: 0,
      }}
    >
      <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Holdings heatmap
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
      <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
        <InputLabel id={`${filterSelectId}-label`}>View</InputLabel>
        <Select
          labelId={`${filterSelectId}-label`}
          id={filterSelectId}
          label="View"
          value={viewFilter}
          onChange={(e) =>
            setAssetFilter(e.target.value as TreemapAssetFilter)
          }
        >
          <MenuItem value="all">All asset classes</MenuItem>
          {kindsPresent.has("equity") ? (
            <MenuItem value="equity">{KIND_LABEL.equity} only</MenuItem>
          ) : null}
          {kindsPresent.has("crypto") ? (
            <MenuItem value="crypto">{KIND_LABEL.crypto} only</MenuItem>
          ) : null}
          {kindsPresent.has("fixed_income") ? (
            <MenuItem value="fixed_income">{KIND_LABEL.fixed_income} only</MenuItem>
          ) : null}
        </Select>
      </FormControl>
    </Box>
  );
}

export function PortfolioTreemap({
  portfolio,
  quotes,
  slices,
  hasMixedCurrencies,
}: {
  portfolio: PortfolioPosition[];
  quotes: Record<string, MarketData | undefined>;
  slices: AllocationSlice[];
  hasMixedCurrencies: boolean;
}) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [assetFilter, setAssetFilter] = useState<TreemapAssetFilter>("all");
  const [size, setSize] = useState({ w: 800, h: CHART_HEIGHT });

  const measureWidth = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = Math.max(200, Math.floor(el.getBoundingClientRect().width));
    setSize((prev) =>
      prev.w === w && prev.h === CHART_HEIGHT ? prev : { w, h: CHART_HEIGHT },
    );
  }, []);

  useLayoutEffect(() => {
    measureWidth();
  }, [measureWidth]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      measureWidth();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureWidth]);

  const groupsAll = useMemo(
    () => buildGroups(portfolio, slices, quotes),
    [portfolio, slices, quotes],
  );

  const kindsPresent = useMemo(() => {
    const s = new Set<AssetKind>();
    for (const slice of slices) {
      if (slice.value > 0) s.add(slice.kind);
    }
    return s;
  }, [slices]);

  /** If the portfolio no longer has that class, fall back to the combined view. */
  const viewFilter: TreemapAssetFilter =
    assetFilter !== "all" && !kindsPresent.has(assetFilter)
      ? "all"
      : assetFilter;

  const laidOut = useMemo(() => {
    if (viewFilter === "all") {
      return layoutGroups(groupsAll, size.w, size.h);
    }
    const sub = buildSubgroups(viewFilter, portfolio, slices, quotes);
    return layoutGroups(sub, size.w, size.h);
  }, [viewFilter, groupsAll, portfolio, slices, quotes, size.w, size.h]);

  const filterSelectId = "portfolio-treemap-asset-filter";

  const border = theme.palette.divider;
  const groupBand = theme.palette.action.hover;

  if (slices.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Add positions to see the holdings heatmap.
      </Typography>
    );
  }

  if (hasMixedCurrencies) {
    return (
      <Typography variant="body2" color="text.secondary">
        Unify book currency (wait for FX rates) to size tiles by market value and
        color by 24h change.
      </Typography>
    );
  }

  if (groupsAll.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No quotable holdings with positive value yet.
      </Typography>
    );
  }

  const filterMismatch = viewFilter !== "all" && laidOut.length === 0;

  if (filterMismatch) {
    return (
      <Stack spacing={1.5}>
        <HeaderRow
          filterSelectId={filterSelectId}
          viewFilter={viewFilter}
          setAssetFilter={setAssetFilter}
          kindsPresent={kindsPresent}
        />
        <Typography variant="body2" color="text.secondary">
          No holdings in this category with a positive value to chart.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ width: 1, minWidth: 0 }}>
      <HeaderRow
        filterSelectId={filterSelectId}
        viewFilter={viewFilter}
        setAssetFilter={setAssetFilter}
        kindsPresent={kindsPresent}
      />

      <Box
        ref={containerRef}
        sx={{
          width: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={
            viewFilter === "all"
              ? "Portfolio treemap by asset class and market value"
              : `Portfolio treemap for ${KIND_LABEL[viewFilter]}`
          }
          style={{ display: "block" }}
        >
          {laidOut.map((g) => (
            <g key={g.label}>
              <rect
                x={g.x0}
                y={g.y0}
                width={g.x1 - g.x0}
                height={g.y1 - g.y0}
                fill={groupBand}
                stroke={border}
                strokeWidth={1}
              >
                <title>
                  {g.leaves.length
                    ? `${g.label}: ${g.leaves.map((l) => l.symbol).join(", ")}`
                    : g.label}
                </title>
              </rect>
              <text
                x={g.x0 + 6}
                y={g.y0 + 12}
                fill={theme.palette.text.secondary}
                fontSize={10}
                fontWeight={600}
                style={{ fontFamily: theme.typography.fontFamily }}
              >
                {g.label}
              </text>
              {g.leaves.map((leaf) => {
                const x = leaf.x0 + TILE_GAP / 2;
                const y = leaf.y0 + TILE_GAP / 2;
                const w = Math.max(0, leaf.x1 - leaf.x0 - TILE_GAP);
                const h = Math.max(0, leaf.y1 - leaf.y0 - TILE_GAP);
                if (w < 1 || h < 1) return null;
                const coarse = viewFilter === "all";
                const showFullLabel =
                  w >= (coarse ? 40 : 32) && h >= (coarse ? 32 : 26);
                const showCompactLabel =
                  !showFullLabel && w >= 20 && h >= 12;
                const pct =
                  leaf.changePct !== null && Number.isFinite(leaf.changePct)
                    ? `${leaf.changePct >= 0 ? "+" : ""}${leaf.changePct.toFixed(2)}%`
                    : "—";
                const symShort =
                  leaf.symbol.length > 12
                    ? `${leaf.symbol.slice(0, 10)}…`
                    : leaf.symbol;
                return (
                  <g key={leaf.id}>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx={1}
                      fill={changeToFill(leaf.changePct)}
                      stroke={border}
                      strokeWidth={0.75}
                    >
                      <title>{leaf.detail}</title>
                    </rect>
                    {showFullLabel ? (
                      <>
                        <text
                          x={x + w / 2}
                          y={y + h / 2 - 5}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.92)"
                          fontSize={11}
                          fontWeight={600}
                          style={{ fontFamily: theme.typography.fontFamily }}
                        >
                          {leaf.symbol.length > 14
                            ? `${leaf.symbol.slice(0, 12)}…`
                            : leaf.symbol}
                        </text>
                        <text
                          x={x + w / 2}
                          y={y + h / 2 + 9}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.78)"
                          fontSize={10}
                          style={{ fontFamily: theme.typography.fontFamily }}
                        >
                          {pct}
                        </text>
                      </>
                    ) : showCompactLabel ? (
                      <text
                        x={x + w / 2}
                        y={y + h / 2 + 4}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.9)"
                        fontSize={9}
                        fontWeight={600}
                        style={{ fontFamily: theme.typography.fontFamily }}
                      >
                        {`${symShort} ${pct}`}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          ← Down 24h
        </Typography>
        <Box
          sx={{
            height: 10,
            width: 120,
            borderRadius: 0.5,
            background: `linear-gradient(90deg, rgb(229,72,52) 0%, #2c3139 50%, rgb(76,175,80) 100%)`,
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Up 24h →
        </Typography>
      </Box>
    </Stack>
  );
}
