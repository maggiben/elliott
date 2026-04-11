"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import {
  ColorType,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type UTCTimestamp,
} from "lightweight-charts";
import { useAtom } from "jotai";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import { assetKindUiLabelLong } from "@/lib/format/asset-kind";
import type { AssetKind } from "@/lib/market-data/types";
import {
  useCryptoChartSeries,
  useEquityChartSeries,
} from "@/lib/queries/use-chart-series";
import { chartDaysAtom, chartSelectionAtom } from "@/state/ui-atoms";

function chartKindChipColor(kind: AssetKind): "secondary" | "primary" | "success" {
  if (kind === "crypto") return "secondary";
  if (kind === "fixed_income") return "success";
  return "primary";
}

type ChartMountProps = {
  chartRef: MutableRefObject<IChartApi | null>;
  seriesRef: MutableRefObject<ISeriesApi<SeriesType> | null>;
};

/**
 * Isolated mount so React does not reconcile the chart container on parent updates.
 * lightweight-charts appends DOM under the container; a re-render of an empty <Box />
 * would clear those nodes.
 */
const LightweightChartMount = memo(function LightweightChartMount({
  chartRef,
  seriesRef,
}: ChartMountProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#12151c" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.12)" },
        horzLines: { color: "rgba(148,163,184,0.12)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    const line = chart.addSeries(LineSeries, {
      color: "#7dd3c0",
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = line;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [chartRef, seriesRef]);

  return (
    <Box
      ref={containerRef}
      sx={{ position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
});

export function PriceChart() {
  const [selection] = useAtom(chartSelectionAtom);
  const [days, setDays] = useAtom(chartDaysAtom);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);

  const cryptoQ = useCryptoChartSeries(
    selection?.kind === "crypto" ? selection.symbol : null,
    days,
  );

  const equityQ = useEquityChartSeries(
    selection?.kind === "equity" ? selection.symbol : null,
    days,
    selection?.kind === "equity" ? selection.exchange : null,
  );

  const loading =
    selection?.kind === "crypto" ? cryptoQ.isLoading : equityQ.isLoading;
  const error =
    selection?.kind === "crypto" ? cryptoQ.isError : equityQ.isError;
  const series = useMemo(() => {
    if (selection?.kind === "crypto") return cryptoQ.data ?? [];
    if (selection?.kind === "equity") return equityQ.data ?? [];
    return [];
  }, [selection?.kind, cryptoQ.data, equityQ.data]);
  const showChartLoader = loading && series.length === 0;
  const showChartError = error && series.length === 0;

  useEffect(() => {
    const line = seriesRef.current;
    if (!line) return;
    const data = series.map((p) => ({
      time: p.timeSec as UTCTimestamp,
      value: p.value,
    }));
    line.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [series]);

  if (!selection) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a row in the table to load a chart.
      </Typography>
    );
  }

  if (selection.kind === "fixed_income") {
    return (
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flexWrap: "wrap",
            rowGap: 0.5,
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {selection.displayName
              ? `${selection.displayName} (${selection.symbol.toUpperCase()})`
              : selection.symbol.toUpperCase()}
          </Typography>
          <Chip
            size="small"
            label={assetKindUiLabelLong(selection.kind)}
            color={chartKindChipColor(selection.kind)}
            variant="outlined"
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          There is no market price history for term deposits. The table uses your
          TNA and dates (simple interest, ACT/365-style day count) to mark the
          position to model value.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box
        sx={
          {
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1,
          } satisfies SxProps<Theme>
        }
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flexWrap: "wrap",
            rowGap: 0.5,
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {selection.displayName
              ? `${selection.displayName} (${selection.symbol.toUpperCase()})`
              : selection.symbol.toUpperCase()}
          </Typography>
          <Chip
            size="small"
            label={assetKindUiLabelLong(selection.kind)}
            color={chartKindChipColor(selection.kind)}
            variant="outlined"
          />
        </Stack>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={days}
          onChange={(_, v) => {
            if (v !== null) setDays(v);
          }}
        >
          <ToggleButton value={7}>7d</ToggleButton>
          <ToggleButton value={30}>30d</ToggleButton>
          <ToggleButton value={90}>90d</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 320,
          borderRadius: 1,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <LightweightChartMount chartRef={chartRef} seriesRef={seriesRef} />
        {showChartLoader ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(11,13,16,0.55)",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : null}
        {showChartError ? (
          <Typography
            variant="body2"
            color="error"
            sx={{ position: "relative", zIndex: 2, p: 2 }}
          >
            Could not load history (rate limit, CORS, or symbol).
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}
