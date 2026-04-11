"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import type { CoinGeckoSearchCoin } from "@/lib/api/coingecko";
import type { TwelveDataSymbolHit } from "@/lib/api/twelvedata";
import type { AssetKind } from "@/lib/market-data/types";
import {
  addPosition,
  normalizePortfolioSymbol,
  removePosition,
  updatePosition,
} from "@/lib/portfolio/mutations";
import type { PortfolioPosition } from "@/lib/portfolio/types";
import { useSymbolSuggestions } from "@/lib/queries/use-symbol-suggestions";
import { portfolioAtom } from "@/state/portfolio-atoms";
import {
  type PositionDialogState,
  positionDialogAtom,
} from "@/state/ui-atoms";

type FormState = {
  symbol: string;
  kind: AssetKind;
  quantity: string;
  avgCostUsd: string;
  name: string;
  exchange: string;
};

const emptyForm: FormState = {
  symbol: "",
  kind: "crypto",
  quantity: "",
  avgCostUsd: "",
  name: "",
  exchange: "",
};

function parseNum(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function initialForm(
  dialog: PositionDialogState,
  portfolio: PortfolioPosition[],
): FormState {
  if (dialog.mode === "create") return { ...emptyForm };
  const p = portfolio.find((x) => x.id === dialog.id);
  if (!p) return { ...emptyForm };
  return {
    symbol: p.symbol,
    kind: p.kind,
    quantity: String(p.quantity),
    avgCostUsd: p.avgCostUsd !== undefined ? String(p.avgCostUsd) : "",
    name: p.name ?? "",
    exchange: p.exchange ?? "",
  };
}

function PositionDialogInner({
  dialog,
  portfolio,
  onClose,
}: {
  dialog: PositionDialogState;
  portfolio: PortfolioPosition[];
  onClose: () => void;
}) {
  const setPortfolio = useSetAtom(portfolioAtom);
  const [form, setForm] = useState<FormState>(() =>
    initialForm(dialog, portfolio),
  );
  const [symbolInput, setSymbolInput] = useState(() => form.symbol);
  const [debouncedQuery, setDebouncedQuery] = useState(form.symbol);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(symbolInput), 300);
    return () => window.clearTimeout(t);
  }, [symbolInput]);

  const suggest = useSymbolSuggestions(form.kind, debouncedQuery);
  const cryptoOptions = useMemo(
    () =>
      form.kind === "crypto"
        ? (suggest.options as CoinGeckoSearchCoin[])
        : [],
    [form.kind, suggest.options],
  );
  const equityOptions = useMemo(
    () =>
      form.kind === "equity"
        ? (suggest.options as TwelveDataSymbolHit[])
        : [],
    [form.kind, suggest.options],
  );

  const editing = useMemo(() => {
    if (dialog.mode !== "edit") return null;
    return portfolio.find((p) => p.id === dialog.id) ?? null;
  }, [dialog, portfolio]);

  const handleSave = () => {
    const sym = normalizePortfolioSymbol(symbolInput);
    const qty = parseNum(form.quantity);
    if (!sym || qty === null || qty <= 0) return;
    const costRaw = form.avgCostUsd.trim();
    const avgCostUsd = costRaw ? parseNum(costRaw) : undefined;
    if (costRaw && (avgCostUsd === null || avgCostUsd === undefined || avgCostUsd < 0))
      return;

    const exchangeTrim = form.exchange.trim();
    const exchange = exchangeTrim || undefined;

    if (dialog.mode === "create") {
      setPortfolio((prev) =>
        addPosition(prev, {
          symbol: sym,
          kind: form.kind,
          quantity: qty,
          avgCostUsd: avgCostUsd ?? undefined,
          name: form.name.trim() || undefined,
          exchange,
        }),
      );
    } else if (editing) {
      setPortfolio((prev) =>
        updatePosition(prev, editing.id, {
          symbol: sym,
          kind: form.kind,
          quantity: qty,
          avgCostUsd: avgCostUsd ?? undefined,
          name: form.name.trim() || undefined,
          exchange,
        }),
      );
    }
    onClose();
  };

  const handleDelete = () => {
    if (dialog.mode === "edit" && editing) {
      setPortfolio((prev) => removePosition(prev, editing.id));
    }
    onClose();
  };

  const handleKindChange = (kind: AssetKind) => {
    setForm((f) => ({
      ...f,
      kind,
      symbol: "",
      name: "",
      exchange: "",
    }));
    setSymbolInput("");
    setDebouncedQuery("");
  };

  const symbolField =
    form.kind === "crypto" ? (
      <Autocomplete<CoinGeckoSearchCoin, false, false, true>
        freeSolo
        options={cryptoOptions}
        filterOptions={(x) => x}
        loading={suggest.isLoading}
        inputValue={symbolInput}
        onInputChange={(_, v, reason) => {
          setSymbolInput(v);
          if (reason === "input") {
            setForm((f) => ({
              ...f,
              symbol: normalizePortfolioSymbol(v),
            }));
          }
        }}
        onChange={(_, v) => {
          if (typeof v === "string") {
            setSymbolInput(v);
            setForm((f) => ({
              ...f,
              symbol: normalizePortfolioSymbol(v),
            }));
            return;
          }
          if (v) {
            setSymbolInput(v.symbol);
            setForm((f) => ({
              ...f,
              symbol: v.symbol,
              name: f.name.trim() ? f.name : v.name,
              exchange: "",
            }));
          }
        }}
        getOptionLabel={(o) =>
          typeof o === "string" ? o : `${o.symbol} — ${o.name}`
        }
        isOptionEqualToValue={(a, b) => {
          if (typeof a === "string" || typeof b === "string") return a === b;
          return a.id === b.id;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Symbol"
            placeholder="Search coin or ticker (CoinGecko)"
            required
            helperText="Suggestions are cryptocurrencies only."
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {suggest.isLoading ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
    ) : (
      <Autocomplete<TwelveDataSymbolHit, false, false, true>
        freeSolo
        options={equityOptions}
        filterOptions={(x) => x}
        loading={suggest.isLoading}
        inputValue={symbolInput}
        onInputChange={(_, v, reason) => {
          setSymbolInput(v);
          if (reason === "input") {
            setForm((f) => ({
              ...f,
              symbol: normalizePortfolioSymbol(v),
            }));
          }
        }}
        onChange={(_, v) => {
          if (typeof v === "string") {
            setSymbolInput(v);
            setForm((f) => ({
              ...f,
              symbol: normalizePortfolioSymbol(v),
            }));
            return;
          }
          if (v) {
            setSymbolInput(v.symbol);
            setForm((f) => ({
              ...f,
              symbol: v.symbol,
              name: f.name.trim() ? f.name : v.instrumentName,
              exchange: v.exchange,
            }));
          }
        }}
        getOptionLabel={(o) =>
          typeof o === "string"
            ? o
            : `${o.symbol} — ${o.instrumentName} (${o.exchange})`
        }
        isOptionEqualToValue={(a, b) => {
          if (typeof a === "string" || typeof b === "string") return a === b;
          return a.symbol === b.symbol && a.exchange === b.exchange;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Symbol"
            placeholder="Search ticker or company (TwelveData)"
            required
            helperText="Suggestions are stocks & funds (TwelveData), not crypto."
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {suggest.isLoading ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
    );

  return (
    <>
      <DialogTitle>
        {dialog.mode === "edit" ? "Edit position" : "Add position"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="kind-label">Asset class</InputLabel>
            <Select
              labelId="kind-label"
              label="Asset class"
              value={form.kind}
              onChange={(e) =>
                handleKindChange(e.target.value as AssetKind)
              }
            >
              <MenuItem value="crypto">Cryptocurrency</MenuItem>
              <MenuItem value="equity">Stock / ETF (equity)</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            Search and quotes: CoinGecko / Binance (crypto), TwelveData
            (equities).
          </Typography>
          {symbolField}
          <TextField
            label="Exchange / venue (optional)"
            value={form.exchange}
            onChange={(e) =>
              setForm((f) => ({ ...f, exchange: e.target.value }))
            }
            fullWidth
            helperText={
              form.kind === "equity"
                ? "TwelveData exchange code when needed (e.g. BCBA for local listings)."
                : "e.g. a specific venue; crypto quotes use aggregated spot prices."
            }
          />
          <TextField
            label="Quantity"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            type="number"
            fullWidth
            required
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
          <TextField
            label="Average cost (USD, optional)"
            value={form.avgCostUsd}
            onChange={(e) =>
              setForm((f) => ({ ...f, avgCostUsd: e.target.value }))
            }
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
          <TextField
            label="Name (optional)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            helperText="Company or asset name; filled from search unless you override."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Box>
            {dialog.mode === "edit" ? (
              <Button color="error" onClick={handleDelete}>
                Remove
              </Button>
            ) : null}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>
              Save
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </>
  );
}

export function PositionDialog() {
  const [dialog, setDialog] = useAtom(positionDialogAtom);
  const portfolio = useAtomValue(portfolioAtom);
  const open = dialog !== null;
  const handleClose = () => setDialog(null);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      {dialog ? (
        <PositionDialogInner
          key={
            dialog.mode === "edit" ? dialog.id : `create-${dialog.nonce}`
          }
          dialog={dialog}
          portfolio={portfolio}
          onClose={handleClose}
        />
      ) : null}
    </Dialog>
  );
}
