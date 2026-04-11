"use client";

import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { PriceChart } from "@/components/charts/price-chart";
import { AppShell } from "@/components/layout/app-shell";
import { AllocationList } from "@/components/portfolio/allocation-list";
import { KpiCards } from "@/components/portfolio/kpi-cards";
import { OpportunitiesPanel } from "@/components/portfolio/opportunities-panel";
import { PositionDialog } from "@/components/portfolio/position-dialog";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { computePortfolioKpis } from "@/lib/calculations/portfolio-kpis";
import { detectOpportunities } from "@/lib/opportunities/rules";
import { positionQuoteKey } from "@/lib/market-data/types";
import { usePortfolioQuotes } from "@/lib/queries/use-portfolio-quotes";
import { portfolioAtom } from "@/state/portfolio-atoms";
import { chartSelectionAtom } from "@/state/ui-atoms";

export function Dashboard() {
  const portfolio = useAtomValue(portfolioAtom);
  const [selection, setSelection] = useAtom(chartSelectionAtom);
  const quotesQuery = usePortfolioQuotes(portfolio);

  const quotes = useMemo(
    () => quotesQuery.data ?? {},
    [quotesQuery.data],
  );

  const kpis = useMemo(
    () => computePortfolioKpis(portfolio, quotes),
    [portfolio, quotes],
  );

  const opportunities = useMemo(
    () => detectOpportunities(kpis, portfolio, quotes),
    [kpis, portfolio, quotes],
  );

  useEffect(() => {
    if (portfolio.length === 0) {
      setSelection(null);
      return;
    }
    if (selection !== null) return;
    const p = portfolio[0];
    const key = positionQuoteKey(p);
    const q = quotes[key];
    const sym = p.symbol.trim().toUpperCase();
    const fromQuote = q?.displayName?.trim();
    const quoteName =
      fromQuote && fromQuote.toUpperCase() !== sym ? fromQuote : undefined;
    setSelection({
      symbol: p.symbol,
      kind: p.kind,
      exchange: p.exchange?.trim() || undefined,
      displayName: quoteName || p.name?.trim(),
    });
  }, [portfolio, selection, setSelection, quotes]);

  useEffect(() => {
    if (!selection) return;
    const selEx =
      selection.kind === "equity"
        ? selection.exchange?.trim().toUpperCase() ?? ""
        : "";
    const p = portfolio.find((x) => {
      if (x.kind !== selection.kind) return false;
      if (
        x.symbol.trim().toUpperCase() !== selection.symbol.trim().toUpperCase()
      )
        return false;
      if (selection.kind !== "equity") return true;
      const posEx = x.exchange?.trim().toUpperCase() ?? "";
      return posEx === selEx;
    });
    const key = positionQuoteKey({
      kind: selection.kind,
      symbol: selection.symbol,
      exchange: selection.exchange,
    });
    const q = quotes[key];
    const sym = selection.symbol.trim().toUpperCase();
    const fromQuote = q?.displayName?.trim();
    const quoteName =
      fromQuote && fromQuote.toUpperCase() !== sym ? fromQuote : undefined;
    const resolved = quoteName || p?.name?.trim();
    if (!resolved || resolved === selection.displayName) return;
    setSelection((s) => {
      if (
        !s ||
        s.kind !== selection.kind ||
        s.symbol.trim().toUpperCase() !== sym
      )
        return s;
      if (selection.kind === "equity") {
        const selEx = selection.exchange?.trim().toUpperCase() ?? "";
        const sEx = s.exchange?.trim().toUpperCase() ?? "";
        if (selEx !== sEx) return s;
      }
      return { ...s, displayName: resolved };
    });
  }, [quotes, portfolio, selection, setSelection]);

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h1">Portfolio</Typography>
          <Typography variant="body2" color="text.secondary">
            Quotes: CoinGecko and Binance (crypto), TwelveData (equities).
            Portfolio state stays in your browser.
          </Typography>
        </Stack>

        {quotesQuery.isError ? (
          <Alert severity="warning">
            Live quotes failed to refresh. Check your connection or API limits.
          </Alert>
        ) : null}

        <KpiCards kpis={kpis} positionsCount={portfolio.length} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                Holdings
              </Typography>
              <PositionsTable positions={portfolio} quotes={quotes} />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                  Allocation
                </Typography>
                <AllocationList
                  slices={kpis.allocation}
                  weightsDisabled={kpis.hasMixedCurrencies}
                />
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                  Opportunities
                </Typography>
                <OpportunitiesPanel items={opportunities} />
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <PriceChart />
        </Paper>
      </Stack>
      <PositionDialog />
    </AppShell>
  );
}
