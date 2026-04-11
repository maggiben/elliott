"use client";

import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { useCoingeckoExchangeRates } from "@/lib/queries/use-coingecko-exchange-rates";
import { PriceChart } from "@/components/charts/price-chart";
import { AppShell } from "@/components/layout/app-shell";
import { AllocationList } from "@/components/portfolio/allocation-list";
import { AllocationPieChart } from "@/components/portfolio/allocation-pie-chart";
import { KpiCards } from "@/components/portfolio/kpi-cards";
import { OpportunitiesPanel } from "@/components/portfolio/opportunities-panel";
import { PositionDialog } from "@/components/portfolio/position-dialog";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { computePortfolioKpis } from "@/lib/calculations/portfolio-kpis";
import { detectOpportunities } from "@/lib/opportunities/rules";
import { positionQuoteKey } from "@/lib/market-data/types";
import { usePortfolioQuotes } from "@/lib/queries/use-portfolio-quotes";
import { portfolioAtom } from "@/state/portfolio-atoms";
import {
  chartSelectionAtom,
  portfolioDisplayCurrencyAtom,
} from "@/state/ui-atoms";

export function Dashboard() {
  const portfolio = useAtomValue(portfolioAtom);
  const [selection, setSelection] = useAtom(chartSelectionAtom);
  const displayCurrency = useAtomValue(portfolioDisplayCurrencyAtom);
  const quotesQuery = usePortfolioQuotes(portfolio);
  const fxQuery = useCoingeckoExchangeRates(portfolio.length > 0);

  const quotes = useMemo(
    () => quotesQuery.data ?? {},
    [quotesQuery.data],
  );

  const btcRates = fxQuery.isSuccess ? fxQuery.data : undefined;

  const kpis = useMemo(
    () =>
      computePortfolioKpis(portfolio, quotes, {
        displayCurrency,
        btcDenominatedRates: btcRates,
      }),
    [portfolio, quotes, displayCurrency, btcRates],
  );

  const valueByPositionId = useMemo(() => {
    if (kpis.hasMixedCurrencies) return undefined;
    return Object.fromEntries(
      kpis.allocation.map((s) => [s.id, s.value] as const),
    );
  }, [kpis.allocation, kpis.hasMixedCurrencies]);

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
      ...(p.kind === "fixed_income" ? { positionId: p.id } : {}),
    });
  }, [portfolio, selection, setSelection, quotes]);

  useEffect(() => {
    if (!selection) return;
    const selEx =
      selection.kind === "equity"
        ? selection.exchange?.trim().toUpperCase() ?? ""
        : "";
    const p =
      selection.kind === "fixed_income" && selection.positionId
        ? portfolio.find((x) => x.id === selection.positionId)
        : portfolio.find((x) => {
            if (x.kind !== selection.kind) return false;
            if (
              x.symbol.trim().toUpperCase() !==
              selection.symbol.trim().toUpperCase()
            )
              return false;
            if (selection.kind !== "equity") return true;
            const posEx = x.exchange?.trim().toUpperCase() ?? "";
            return posEx === selEx;
          });
    const key = p
      ? positionQuoteKey(p)
      : positionQuoteKey({
          id: selection.positionId ?? "",
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
      if (
        selection.kind === "fixed_income" &&
        selection.positionId &&
        s.positionId !== selection.positionId
      )
        return s;
      return { ...s, displayName: resolved };
    });
  }, [quotes, portfolio, selection, setSelection]);

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h1">Portfolio</Typography>
          <Typography variant="body2" color="text.secondary">
            Quotes: CoinGecko and Binance (crypto), TwelveData (equities), BCBA
            listing pages where configured. Book currency uses CoinGecko
            exchange rates (BTC cross) to align ARS, USD, and other majors.
            Portfolio state stays in your browser.
          </Typography>
        </Stack>

        {quotesQuery.isError ? (
          <Alert severity="warning">
            Live quotes failed to refresh. Check your connection or API limits.
            {quotesQuery.data && Object.keys(quotesQuery.data).length > 0
              ? " Showing the last saved prices from this device until a refresh succeeds."
              : null}
          </Alert>
        ) : null}

        <KpiCards kpis={kpis} positionsCount={portfolio.length} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                Holdings
              </Typography>
              <PositionsTable
                positions={portfolio}
                quotes={quotes}
                valueByPositionId={valueByPositionId}
                bookDisplayCurrency={kpis.displayCurrency}
              />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                  Assets
                </Typography>
                <AllocationList
                  slices={kpis.allocation}
                  weightsDisabled={kpis.hasMixedCurrencies}
                />
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                  Asset concentration
                </Typography>
                <AllocationPieChart
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
