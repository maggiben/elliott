/**
 * Squarified treemaps (Bruls, Huizing, van Wijk). Layout logic adapted from
 * d3-hierarchy (BSD 3-Clause, Copyright 2010-2023 Mike Bostock).
 */

export const SQUARIFY_PHI = (1 + Math.sqrt(5)) / 2;

export type SquarifyMutable = {
  value: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

type Row = {
  value: number;
  dice: boolean;
  children: SquarifyMutable[];
};

function treemapDice(
  parent: Row,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  const nodes = parent.children;
  const n = nodes.length;
  const k = parent.value ? (x1 - x0) / parent.value : 0;
  for (let i = 0; i < n; i++) {
    const node = nodes[i]!;
    node.y0 = y0;
    node.y1 = y1;
    node.x0 = x0;
    x0 += node.value * k;
    node.x1 = x0;
  }
}

function treemapSlice(
  parent: Row,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  const nodes = parent.children;
  const n = nodes.length;
  const k = parent.value ? (y1 - y0) / parent.value : 0;
  for (let i = 0; i < n; i++) {
    const node = nodes[i]!;
    node.x0 = x0;
    node.x1 = x1;
    node.y0 = y0;
    y0 += node.value * k;
    node.y1 = y0;
  }
}

export function squarifyRatio(
  ratio: number,
  parent: { value: number; children: SquarifyMutable[] },
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  const nodes = parent.children;
  let i0 = 0;
  let i1 = 0;
  const n = nodes.length;
  let value = parent.value;

  while (i0 < n) {
    const dx = x1 - x0;
    const dy = y1 - y0;

    let sumValue = 0;
    do {
      if (i1 >= n) return;
      sumValue = nodes[i1]!.value;
      i1 += 1;
    } while (!sumValue && i1 < n);

    if (!sumValue) return;

    let minValue = sumValue;
    let maxValue = sumValue;
    const alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
    let beta = sumValue * sumValue * alpha;
    let minRatio = Math.max(maxValue / beta, beta / minValue);

    for (; i1 < n; i1 += 1) {
      const nodeValue = nodes[i1]!.value;
      sumValue += nodeValue;
      if (nodeValue < minValue) minValue = nodeValue;
      if (nodeValue > maxValue) maxValue = nodeValue;
      beta = sumValue * sumValue * alpha;
      const newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) {
        sumValue -= nodeValue;
        break;
      }
      minRatio = newRatio;
    }

    const row: Row = {
      value: sumValue,
      dice: dx < dy,
      children: nodes.slice(i0, i1),
    };

    if (row.dice) {
      const yTop = y0;
      const yBot = value ? y0 + (dy * sumValue) / value : y1;
      treemapDice(row, x0, yTop, x1, yBot);
      y0 = yBot;
    } else {
      const xLeft = x0;
      const xRight = value ? x0 + (dx * sumValue) / value : x1;
      treemapSlice(row, xLeft, y0, xRight, y1);
      x0 = xRight;
    }

    value -= sumValue;
    i0 = i1;
  }
}

/**
 * Assigns `x0,y0,x1,y1` to each item (mutating the objects in `items`).
 */
export function layoutSquarifiedTreemap<T extends SquarifyMutable>(
  items: T[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  ratio = SQUARIFY_PHI,
): void {
  const positive = items.filter((i) => i.value > 0);
  const sum = positive.reduce((a, b) => a + b.value, 0);
  if (positive.length === 0 || sum <= 0) return;
  const parent = { value: sum, children: positive };
  squarifyRatio(ratio, parent, x0, y0, x1, y1);
}
