/** Server-only environment variables. */

export function twelvedataApiKey(): string {
  return process.env.TWELVEDATA_API_KEY?.trim() || "demo";
}

export function corsfixApiKey(): string | undefined {
  const key = process.env.CORSFIX_API_KEY?.trim();
  return key || undefined;
}
