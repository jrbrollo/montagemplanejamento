/**
 * Engine de Taxas - Conversão e derivação de taxas de juros
 */

/** CDI = Selic - 0.10% (0.001 em decimal) */
export function calculateCDI(selic: number): number {
  return selic - 0.001;
}

/** Converte taxa anual para mensal: ((1 + annual)^(1/12)) - 1 */
export function annualToMonthly(annual: number): number {
  return Math.pow(1 + annual, 1 / 12) - 1;
}

/** Converte taxa mensal para anual: ((1 + monthly)^12) - 1 */
export function monthlyToAnnual(monthly: number): number {
  return Math.pow(1 + monthly, 12) - 1;
}

/** Deriva todas as taxas a partir dos indicadores base */
export function deriveRates(
  selic: number,
  shortMult: number,
  mediumMult: number,
  longMult: number
): {
  cdi: number;
  shortRate: number;
  mediumRate: number;
  longRate: number;
  shortRateMonthly: number;
  mediumRateMonthly: number;
  longRateMonthly: number;
} {
  const cdi = calculateCDI(selic);
  const shortRate = cdi * shortMult;
  const mediumRate = cdi * mediumMult;
  const longRate = cdi * longMult;

  return {
    cdi,
    shortRate,
    mediumRate,
    longRate,
    shortRateMonthly: annualToMonthly(shortRate),
    mediumRateMonthly: annualToMonthly(mediumRate),
    longRateMonthly: annualToMonthly(longRate),
  };
}
