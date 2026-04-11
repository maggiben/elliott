"use client";

import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { PortfolioKpis } from "@/lib/calculations/portfolio-kpis";
import { formatPercentFromRatio, formatUsd } from "@/lib/format/numbers";

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
      <Stack spacing={0.5}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h2" sx={{ fontSize: "1.35rem", fontWeight: 600 }}>
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

export function KpiCards({
  kpis,
  positionsCount,
}: {
  kpis: PortfolioKpis;
  positionsCount: number;
}) {
  const pnlHint =
    kpis.pnlPct !== null
      ? formatPercentFromRatio(kpis.pnlPct)
      : "Add average cost to track PnL";

  const dayHint =
    kpis.dayChangePct !== null
      ? formatPercentFromRatio(kpis.dayChangePct)
      : "Live 24h change needs quotes";

  const mixedHint =
    "USD and ARS positions cannot be summed; see each row for local currency.";

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          label="Net value"
          value={
            kpis.hasMixedCurrencies
              ? "—"
              : formatUsd(kpis.totalValueUsd)
          }
          hint={kpis.hasMixedCurrencies ? mixedHint : undefined}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          label="Unrealized PnL"
          value={
            kpis.pnlUsd !== null ? formatUsd(kpis.pnlUsd) : "—"
          }
          hint={
            kpis.hasMixedCurrencies
              ? mixedHint
              : pnlHint
          }
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          label="24h (est.)"
          value={
            kpis.dayChangeUsd !== null ? formatUsd(kpis.dayChangeUsd) : "—"
          }
          hint={
            kpis.hasMixedCurrencies
              ? mixedHint
              : dayHint
          }
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          label="Positions"
          value={String(positionsCount)}
          hint="Rows in your book"
        />
      </Grid>
    </Grid>
  );
}
