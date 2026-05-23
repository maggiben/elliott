"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import dynamic from "next/dynamic";

function ChartFallback() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 200,
      }}
      aria-hidden
    >
      <CircularProgress size={28} />
    </Box>
  );
}

export const NetWorthChart = dynamic(
  () =>
    import("@/components/charts/net-worth-chart").then((m) => m.NetWorthChart),
  { loading: () => <ChartFallback />, ssr: false },
);

export const PriceChart = dynamic(
  () => import("@/components/charts/price-chart").then((m) => m.PriceChart),
  { loading: () => <ChartFallback />, ssr: false },
);

export const AllocationPieChart = dynamic(
  () =>
    import("@/components/portfolio/allocation-pie-chart").then(
      (m) => m.AllocationPieChart,
    ),
  { loading: () => <ChartFallback />, ssr: false },
);

export const PortfolioTreemap = dynamic(
  () =>
    import("@/components/portfolio/portfolio-treemap").then(
      (m) => m.PortfolioTreemap,
    ),
  { loading: () => <ChartFallback />, ssr: false },
);

export const PositionDialog = dynamic(
  () =>
    import("@/components/portfolio/position-dialog").then((m) => m.PositionDialog),
  { ssr: false },
);
