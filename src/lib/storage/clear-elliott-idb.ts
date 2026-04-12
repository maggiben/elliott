import { deleteDB } from "idb";
import { invalidateElliottPortfolioDbConnection } from "./portfolio-db";
import { invalidateElliottMarketCacheDbConnection } from "./market-cache-db";

const DB_NAME = "elliott-portfolio";

/** Deletes portfolio, quote cache, FX cache, and chart series for this origin. */
export async function clearElliottIndexedDb(): Promise<void> {
  invalidateElliottPortfolioDbConnection();
  invalidateElliottMarketCacheDbConnection();
  await deleteDB(DB_NAME);
}
