"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
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
import {
  memo,
  useEffect,
  useRef,
  type MutableRefObject,
} from "react";
import type { NetWorthHistoryPoint } from "@/lib/storage/market-cache-db";

type ChartMountProps = {
  chartRef: MutableRefObject<IChartApi | null>;
  seriesRef: MutableRefObject<ISeriesApi<SeriesType> | null>;
};

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
      color: "#a78bfa",
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

export type NetWorthChartProps = {
  points: NetWorthHistoryPoint[];
  displayCurrency: string;
};

export function NetWorthChart({ points, displayCurrency }: NetWorthChartProps) {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const cur = displayCurrency.trim().toUpperCase() || "USD";
  const series = points.filter((p) => p.currency === cur);

  useEffect(() => {
    const line = seriesRef.current;
    if (!line) return;
    const data = series.map((p) => ({
      time: Math.floor(p.t / 1000) as UTCTimestamp,
      value: p.value,
    }));
    line.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [series]);

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Net worth history
      </Typography>
      {/* {series.length < 2 ? (
        <Typography variant="body2" color="text.secondary">
          {series.length === 0
            ? "No samples yet for this book currency. Open the app again on another day after quotes load."
            : "At least two days of samples are needed to draw a line."}
        </Typography>
      ) : null} */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 180,
          borderRadius: 1,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          opacity: series.length < 2 ? 0.45 : 1,
        }}
      >
        <LightweightChartMount chartRef={chartRef} seriesRef={seriesRef} />
      </Box>
    </Stack>
  );
}
