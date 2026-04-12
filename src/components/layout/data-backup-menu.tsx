"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {
  buildElliottBackupV1,
  parseElliottBackupJson,
  persistElliottBackup,
} from "@/lib/portfolio/backup";
import {
  loadExchangeRatesCache,
  loadQuotesCache,
} from "@/lib/storage/market-cache-db";
import { clearElliottIndexedDb } from "@/lib/storage/clear-elliott-idb";
import { portfolioAtom, portfolioHydratedAtom } from "@/state/portfolio-atoms";
import {
  chartSelectionAtom,
  portfolioDisplayCurrencyAtom,
  positionDialogAtom,
} from "@/state/ui-atoms";

function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataBackupMenu() {
  const queryClient = useQueryClient();
  const portfolio = useAtomValue(portfolioAtom);
  const hydrated = useAtomValue(portfolioHydratedAtom);
  const bookCurrency = useAtomValue(portfolioDisplayCurrencyAtom);
  const setPortfolio = useSetAtom(portfolioAtom);
  const setBookCurrency = useSetAtom(portfolioDisplayCurrencyAtom);
  const setChartSelection = useSetAtom(chartSelectionAtom);
  const setPositionDialog = useSetAtom(positionDialogAtom);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [message, setMessage] = useState<{
    title: string;
    body: string;
    severity: "success" | "error";
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const closeMenu = () => setMenuAnchor(null);

  const handleExport = useCallback(async () => {
    closeMenu();
    const [quotes, exchangeRates] = await Promise.all([
      loadQuotesCache(),
      loadExchangeRatesCache(),
    ]);
    const payload = buildElliottBackupV1({
      portfolio,
      bookCurrency,
      quotes,
      exchangeRates,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(
      `elliott-backup-${stamp}.json`,
      JSON.stringify(payload, null, 2),
    );
  }, [portfolio, bookCurrency]);

  const handleImportPick = useCallback(() => {
    closeMenu();
    fileRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const text = await file.text();
      const parsed = parseElliottBackupJson(text);
      if (!parsed.ok) {
        setMessage({
          title: "Import failed",
          body: parsed.error,
          severity: "error",
        });
        return;
      }
      const { data } = parsed;
      setPortfolio(data.portfolio);
      if (data.bookCurrency) setBookCurrency(data.bookCurrency);
      setChartSelection(null);
      setPositionDialog(null);
      try {
        await persistElliottBackup(data);
        queryClient.clear();
        setMessage({
          title: "Import complete",
          body:
            data.portfolio.length === 0
              ? "Portfolio is empty. Add positions or import another file."
              : `Restored ${data.portfolio.length} position(s). Quotes will refresh from the network.`,
          severity: "success",
        });
      } catch (err) {
        setMessage({
          title: "Import failed",
          body:
            err instanceof Error
              ? err.message
              : "Could not write to IndexedDB.",
          severity: "error",
        });
      }
    },
    [
      queryClient,
      setBookCurrency,
      setChartSelection,
      setPortfolio,
      setPositionDialog,
    ],
  );

  const handleClearRequest = useCallback(() => {
    closeMenu();
    setClearOpen(true);
  }, []);

  const handleClearConfirm = useCallback(async () => {
    setClearOpen(false);
    try {
      await clearElliottIndexedDb();
      queryClient.clear();
      window.location.reload();
    } catch {
      setMessage({
        title: "Could not clear data",
        body: "IndexedDB may be blocked. Check site permissions and try again.",
        severity: "error",
      });
    }
  }, [queryClient]);

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={onFileChange}
      />
      <Button
        size="small"
        variant="outlined"
        disabled={!hydrated}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
      >
        Data
      </Button>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleExport} disabled={!hydrated}>
          Export JSON…
        </MenuItem>
        <MenuItem onClick={handleImportPick} disabled={!hydrated}>
          Import JSON…
        </MenuItem>
        <MenuItem onClick={handleClearRequest} disabled={!hydrated}>
          Clear local data…
        </MenuItem>
      </Menu>

      <Dialog open={clearOpen} onClose={() => setClearOpen(false)}>
        <DialogTitle>Clear all local data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes your portfolio, cached quotes, and chart snapshots from
            this browser. Export a JSON file first if you want to keep a copy.
            The page will reload.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearOpen(false)}>Cancel</Button>
          <Button onClick={handleClearConfirm} color="error" variant="contained">
            Clear and reload
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={message !== null} onClose={() => setMessage(null)}>
        <DialogTitle
          color={message?.severity === "error" ? "error" : "success"}
        >
          {message?.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{message?.body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessage(null)} variant="contained" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
