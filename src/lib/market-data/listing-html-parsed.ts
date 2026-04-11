/** Shape produced by an HTML listing quote parser (BCBA, etc.). */
export type ListingHtmlParsedQuote = {
  symbol: string;
  displayName: string | null;
  /** Parsed from the listing cell when possible (BCBA lists ARS or USD names). */
  currency: "ARS" | "USD";
  price: number;
  changeDayPct: number | null;
  volumeNominal: number | null;
  volumeMoneyArs: number | null;
  highDay: number | null;
  lowDay: number | null;
};
