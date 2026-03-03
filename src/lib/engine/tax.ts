import type { TaxRegime } from "@/store/types";

/**
 * Tabela regressiva de IR para previdência privada.
 * Prazo de acumulação → alíquota.
 */
export const REGRESSIVE_TABLE = [
  { maxYears: 2, rate: 0.35 },
  { maxYears: 4, rate: 0.30 },
  { maxYears: 6, rate: 0.25 },
  { maxYears: 8, rate: 0.20 },
  { maxYears: 10, rate: 0.15 },
  { maxYears: Infinity, rate: 0.10 },
];

/**
 * Retorna a alíquota de IR regressiva para um dado prazo de acumulação.
 */
export function getRegressiveTaxRate(years: number): number {
  const entry = REGRESSIVE_TABLE.find((e) => years <= e.maxYears);
  return entry?.rate ?? 0.10;
}

/**
 * Calcula a alíquota efetiva de IR para previdência regressiva,
 * considerando que cada aporte tem uma "idade" diferente.
 *
 * Lógica: Simula os aportes mês a mês. Cada mês de aporte tem
 * uma alíquota correspondente ao prazo total - mês do aporte.
 * A alíquota efetiva é a média ponderada pelo valor de cada aporte.
 *
 * @param totalMonths   Total de meses de acumulação
 * @param monthlyDeposit  Aporte mensal (simplificação: uniforme)
 * @param regime        Regressivo | Progressivo
 */
export function calculateEffectiveTaxRate(
  totalMonths: number,
  monthlyDeposit: number,
  regime: TaxRegime
): number {
  if (regime === "Progressivo") {
    // Tabela progressiva: alíquota sobre a renda mensal de resgate
    // Para simplificação no MVP, usamos 15% como estimativa conservadora
    return 0.15;
  }

  // Regime Regressivo: cada aporte tem alíquota pela sua "idade" no resgate
  if (totalMonths === 0 || monthlyDeposit === 0) return 0.35;

  let weightedTax = 0;
  let totalDeposited = 0;

  for (let month = 1; month <= totalMonths; month++) {
    const yearsOld = (totalMonths - month) / 12; // idade do aporte no resgate
    const taxRate = getRegressiveTaxRate(yearsOld);
    weightedTax += taxRate * monthlyDeposit;
    totalDeposited += monthlyDeposit;
  }

  return totalDeposited > 0 ? weightedTax / totalDeposited : 0.35;
}

/**
 * Calcula IR efetivo para múltiplas fases com aportes diferentes.
 * Cada fase tem seu próprio prazo de acumulação (crescente).
 */
export function calculateEffectiveTaxRateMultiPhase(
  phases: Array<{ years: number; monthlyDeposit: number }>,
  regime: TaxRegime
): number {
  if (regime === "Progressivo") return 0.15;

  const totalYears = phases.reduce((sum, p) => sum + p.years, 0);
  if (totalYears === 0) return 0.35;

  // Reconstrói cronograma de aportes com idade acumulada
  let weightedTax = 0;
  let totalDeposited = 0;
  let monthOffset = 0;
  const totalMonths = totalYears * 12;

  for (const phase of phases) {
    const phaseMonths = phase.years * 12;
    for (let m = 1; m <= phaseMonths; m++) {
      const absoluteMonth = monthOffset + m;
      const yearsOld = (totalMonths - absoluteMonth) / 12;
      const taxRate = getRegressiveTaxRate(yearsOld);
      weightedTax += taxRate * phase.monthlyDeposit;
      totalDeposited += phase.monthlyDeposit;
    }
    monthOffset += phaseMonths;
  }

  return totalDeposited > 0 ? weightedTax / totalDeposited : 0.35;
}
