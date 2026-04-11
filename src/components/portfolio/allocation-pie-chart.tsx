"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { PieChart } from "@mui/x-charts/PieChart";
import { useMemo, useState } from "react";
import type { AllocationSlice } from "@/lib/calculations/portfolio-kpis";
import { formatQuoteMoney } from "@/lib/format/numbers";

function sliceLabel(s: AllocationSlice): string {
  const ex = s.exchange ? ` · ${s.exchange}` : "";
  return `${s.symbol}${ex}`;
}

export function AllocationPieChart({
  slices,
  weightsDisabled,
}: {
  slices: AllocationSlice[];
  weightsDisabled?: boolean;
}) {
  const [showLegend, setShowLegend] = useState(false);

  const chart = useMemo(() => {
    if (weightsDisabled) {
      return null;
    }
    const positive = slices.filter((s) => s.value > 0);
    const total = positive.reduce((acc, s) => acc + s.value, 0);
    if (positive.length === 0 || total <= 0) {
      return null;
    }
    const currency = positive[0]!.currency;
    const data = positive.map((s) => ({
      id: s.id,
      value: s.value,
      label: sliceLabel(s),
    }));
    return {
      data,
      total,
      currency,
    };
  }, [slices, weightsDisabled]);

  if (slices.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Add positions to see allocation.
      </Typography>
    );
  }

  if (weightsDisabled || !chart) {
    return (
      <Typography variant="body2" color="text.secondary">
        Unify book currency (wait for FX rates) to chart allocation by value.
      </Typography>
    );
  }

  const { data, total, currency } = chart;

  const plotHeight = showLegend ? 220 : 260;

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showLegend}
            onChange={(_, checked) => setShowLegend(checked)}
            slotProps={{
              input: { "aria-label": "Show allocation legend" },
            }}
          />
        }
        label={
          <Typography variant="caption" color="text.secondary">
            Legend
          </Typography>
        }
        labelPlacement="start"
        sx={{
          m: 0,
          mx: 0,
          justifyContent: "flex-end",
          width: 1,
        }}
      />
      <Box
        sx={{
          width: 1,
          minHeight: plotHeight + (showLegend ? 100 : 8),
          maxWidth: 1,
          overflow: "hidden",
        }}
      >
        <PieChart
          title="Portfolio allocation by market value"
          height={plotHeight}
          hideLegend={!showLegend}
          series={[
            {
              id: "allocation",
              data,
              valueFormatter: (item) => {
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return `${formatQuoteMoney(item.value, currency)} (${pct.toFixed(1)}%)`;
              },
              arcLabel: (item) =>
                total > 0 && item.value / total >= 0.08
                  ? `${((item.value / total) * 100).toFixed(0)}%`
                  : "",
              arcLabelMinAngle: 12,
              paddingAngle: 1,
              cornerRadius: 2,
            },
          ]}
          margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
          sx={{
            width: 1,
            maxWidth: 1,
            ...(!showLegend
              ? {
                  justifyItems: "center",
                  alignItems: "center",
                }
              : {}),
          }}
          slotProps={
            showLegend
              ? {
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "bottom", horizontal: "center" },
                    sx: {
                      maxHeight: 96,
                      overflowX: "hidden",
                      overflowY: "auto",
                      width: "100%",
                      justifyContent: "center",
                      marginBlock: 0,
                      marginInline: 0,
                      pr: 0.5,
                    },
                  },
                }
              : undefined
          }
        />
      </Box>
    </Stack>
  );
}
