/**
 * Formatadores padrão para o sistema de planejamento financeiro.
 * Todos os valores monetários em BRL, todos os percentuais em pt-BR.
 */

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentOneDecimalFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Formata valor como moeda BRL: R$ 1.234,56 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Formata valor compacto: R$ 1,2M */
export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value);
}

/** Formata percentual: 10,50% (a partir de 0.105) */
export function formatPercent(value: number): string {
  return percentFormatter.format(value);
}

/** Formata percentual com 1 casa decimal: 10,5% */
export function formatPercentShort(value: number): string {
  return percentOneDecimalFormatter.format(value);
}

/** Formata percentual para exibição de taxa: "10,50% a.a." */
export function formatRateAA(value: number): string {
  return `${percentFormatter.format(value)} a.a.`;
}

/** Formata percentual para exibição de taxa mensal: "0,84% a.m." */
export function formatRateAM(value: number): string {
  return `${percentFormatter.format(value)} a.m.`;
}

/**
 * Converte string no formato brasileiro para number.
 * Ex: "1.234,56" → 1234.56
 */
export function parseBRCurrency(value: string): number {
  const cleaned = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converte string de percentual para decimal.
 * Ex: "10,50" → 0.105
 */
export function parseBRPercent(value: string): number {
  const cleaned = value.replace("%", "").replace(",", ".").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed / 100;
}

/** Formata número como decimal brasileiro sem símbolo: "1.234,56" */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Formata data ISO para exibição pt-BR: "03/03/2026" */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("pt-BR");
}
