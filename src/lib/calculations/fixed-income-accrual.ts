/**
 * Simple-interest accrual (e.g. Argentine plazo fijo TNA): value factor on principal
 * is 1 + (TNA%/100) × (elapsedDays/365), elapsed from start through min(today, maturity).
 */

function parseIsoDateOnly(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (![y, mo, d].every((n) => Number.isFinite(n))) return null;
  const t = Date.UTC(y, mo, d);
  return Number.isFinite(t) ? t : null;
}

function utcDayStartMs(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function fixedIncomeAccruedMultiplier(params: {
  annualRatePct: number;
  startDate: string;
  maturityDate: string;
  nowMs?: number;
}): number | null {
  const startRaw = parseIsoDateOnly(params.startDate);
  const matRaw = parseIsoDateOnly(params.maturityDate);
  if (startRaw === null || matRaw === null) return null;
  const startDay = utcDayStartMs(startRaw);
  const matDay = utcDayStartMs(matRaw);
  if (matDay < startDay) return null;

  const r = params.annualRatePct;
  if (!Number.isFinite(r) || r < 0) return null;

  const nowDay = utcDayStartMs(params.nowMs ?? Date.now());
  if (nowDay < startDay) return 1;

  const evalDay = Math.min(nowDay, matDay);
  const elapsedDays = Math.max(
    0,
    Math.floor((evalDay - startDay) / 86_400_000),
  );

  return 1 + (r / 100) * (elapsedDays / 365);
}
