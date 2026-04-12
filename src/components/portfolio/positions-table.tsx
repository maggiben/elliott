"use client";

import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useSetAtom } from "jotai";
import { memo, useCallback } from "react";
import { positionQuoteKey } from "@/lib/market-data/types";
import type { MarketData } from "@/lib/market-data/types";
import { assetKindUiLabel } from "@/lib/format/asset-kind";
import type { AssetKind } from "@/lib/market-data/types";
import { formatPercentPoints, formatQuoteMoney } from "@/lib/format/numbers";
import type { PortfolioPosition } from "@/lib/portfolio/types";
import { chartSelectionAtom, positionDialogAtom } from "@/state/ui-atoms";

type RowProps = {
  position: PortfolioPosition;
  quote?: MarketData;
  onSelect: (p: PortfolioPosition, quote?: MarketData) => void;
  onEdit: (id: string) => void;
  valueByPositionId?: Record<string, number>;
  bookDisplayCurrency?: string;
};

function kindChipColor(kind: AssetKind): "secondary" | "primary" | "success" {
  if (kind === "crypto") return "secondary";
  if (kind === "fixed_income") return "success";
  return "primary";
}

const Row = memo(function Row({
  position,
  quote,
  onSelect,
  onEdit,
  valueByPositionId,
  bookDisplayCurrency,
}: RowProps) {
  const nativeValue =
    quote && Number.isFinite(quote.price)
      ? position.quantity * quote.price
      : null;
  const unified =
    valueByPositionId !== undefined &&
    bookDisplayCurrency !== undefined &&
    valueByPositionId[position.id] !== undefined;
  const value = unified ? valueByPositionId[position.id] : nativeValue;
  const quoteCur = quote?.currency ?? "USD";
  const valueCurrency = unified ? bookDisplayCurrency : quoteCur;
  const ch = quote?.change24hPct;

  const sym = position.symbol.trim().toUpperCase();
  const storedName = position.name?.trim();
  const quoteName =
    quote?.displayName?.trim() &&
    quote.displayName.trim().toUpperCase() !== sym
      ? quote.displayName.trim()
      : undefined;
  const subtitle = storedName || quoteName;
  const exchange = position.exchange?.trim();
  const apy =
    position.kind === "crypto" &&
    position.cryptoApyPct !== undefined &&
    Number.isFinite(position.cryptoApyPct)
      ? position.cryptoApyPct
      : null;

  return (
    <TableRow
      hover
      sx={{ cursor: "pointer" }}
      onClick={() => onSelect(position, quote)}
    >
      <TableCell>
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", alignItems: "center" }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {sym}
          </Typography>
          <Chip
            size="small"
            label={assetKindUiLabel(position.kind)}
            color={kindChipColor(position.kind)}
            variant="outlined"
            sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: "0.7rem" } }}
          />
        </Stack>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary" component="div">
            {subtitle}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>
        {exchange ? (
          <Typography variant="body2" color="text.secondary">
            {exchange}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">{position.quantity}</TableCell>
      <TableCell align="right">
        {quote
          ? position.kind === "fixed_income"
            ? `×${quote.price.toFixed(4)}`
            : formatQuoteMoney(quote.price, quoteCur)
          : "—"}
      </TableCell>
      <TableCell align="right">
        {value !== null && Number.isFinite(value)
          ? formatQuoteMoney(value, valueCurrency)
          : "—"}
      </TableCell>
      <TableCell align="right">
        {apy !== null ? formatPercentPoints(apy) : "—"}
      </TableCell>
      <TableCell align="right">
        {ch !== null && ch !== undefined && Number.isFinite(ch)
          ? formatPercentPoints(ch)
          : "—"}
      </TableCell>
      <TableCell align="right">
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(position.id);
          }}
        >
          Edit
        </Button>
      </TableCell>
    </TableRow>
  );
});

export const PositionsTable = memo(function PositionsTable({
  positions,
  quotes,
  valueByPositionId,
  bookDisplayCurrency,
}: {
  positions: PortfolioPosition[];
  quotes: Record<string, MarketData | undefined>;
  /** When the book is unified, holding values in `bookDisplayCurrency`. */
  valueByPositionId?: Record<string, number>;
  bookDisplayCurrency?: string;
}) {
  const setSelection = useSetAtom(chartSelectionAtom);
  const setDialog = useSetAtom(positionDialogAtom);

  const onSelect = useCallback(
    (p: PortfolioPosition, quote?: MarketData) => {
      const sym = p.symbol.trim().toUpperCase();
      const fromQuote = quote?.displayName?.trim();
      const quoteName =
        fromQuote && fromQuote.toUpperCase() !== sym ? fromQuote : undefined;
      const displayName = quoteName || p.name?.trim() || undefined;
      setSelection({
        symbol: p.symbol,
        kind: p.kind,
        exchange: p.exchange?.trim() || undefined,
        displayName,
        ...(p.kind === "fixed_income" ? { positionId: p.id } : {}),
      });
    },
    [setSelection],
  );

  const onEdit = useCallback(
    (id: string) => {
      setDialog({ mode: "edit", id });
    },
    [setDialog],
  );

  if (positions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No positions yet. Add one to start tracking.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Position</TableCell>
            <TableCell>Exchange</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Value</TableCell>
            <TableCell align="right">APY</TableCell>
            <TableCell align="right">24h</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {positions.map((p) => (
            <Row
              key={p.id}
              position={p}
              quote={quotes[positionQuoteKey(p)]}
              onSelect={onSelect}
              onEdit={onEdit}
              valueByPositionId={valueByPositionId}
              bookDisplayCurrency={bookDisplayCurrency}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});
