import type { RetirementPhase, TaxRegime, PensionCombined } from "@/store/types";
import { futureValue, netAfterTax } from "./compound";
import { calculateEffectiveTaxRateMultiPhase, getRegressiveTaxRate } from "./tax";
import { annualToMonthly } from "./rates";

export interface PhaseResult {
  id: string;
  years: number;
  monthlyDeposit: number;
  cumulativeYears: number;
  startValue: number;
  finalValue: number;
  totalInvested: number;
  gain: number;
  effectiveTaxRate: number;
  netValue: number;
  estimatedMonthlyIncome: number; // netValue * 0.005 (regra dos 0.5%)
}

export interface RetirementResult {
  phases: PhaseResult[];
  total: {
    finalValue: number;
    totalInvested: number;
    netValue: number;
    effectiveTaxRate: number;
    estimatedMonthlyIncome: number;
    retirementAge: number;
  };
}

/**
 * Simula aposentadoria com múltiplas fases.
 * Cada fase tem anos e aporte mensal diferente.
 * O acumulado de uma fase vira o PV da próxima.
 *
 * Para previdência PGBL: IR incide sobre o valor TOTAL do resgate.
 * Para VGBL / outros: IR incide apenas sobre o GANHO.
 */
export function simulateRetirement(
  phases: RetirementPhase[],
  annualRate: number,
  initialDeposit: number,
  taxType: "VGBL" | "PGBL" | "outros",
  regime: TaxRegime,
  fixedTaxRate?: number
): RetirementResult {
  const monthlyRate = annualToMonthly(annualRate);
  let currentValue = initialDeposit;
  let globalTotalInvested = initialDeposit;
  let cumulativeYears = 0;
  const phaseResults: PhaseResult[] = [];

  // Calcula alíquota efetiva para todo o período (regressivo multi-fase)
  const phasesForTax = phases.map((p) => ({
    years: p.years,
    monthlyDeposit: p.monthlyDeposit,
  }));

  for (const phase of phases) {
    const phaseMonths = phase.years * 12;
    const startValue = currentValue;
    const phaseTotalInvested = phase.monthlyDeposit * phaseMonths;
    globalTotalInvested += phaseTotalInvested;
    cumulativeYears += phase.years;

    const fv = futureValue(monthlyRate, phaseMonths, -phase.monthlyDeposit, -startValue, 0);

    // Alíquota efetiva: considera apenas os aportes desta fase e anteriores
    let effectiveTaxRate: number;
    if (fixedTaxRate !== undefined) {
      effectiveTaxRate = fixedTaxRate;
    } else {
      const phasesUpToNow = phases.slice(0, phases.indexOf(phase) + 1).map((p) => ({
        years: p.years,
        monthlyDeposit: p.monthlyDeposit,
      }));
      effectiveTaxRate = calculateEffectiveTaxRateMultiPhase(phasesUpToNow, regime);
    }

    // Cálculo de IR e líquido
    let netValue: number;
    if (taxType === "PGBL") {
      // IR sobre o valor total (PGBL)
      netValue = fv * (1 - effectiveTaxRate);
    } else {
      // IR apenas sobre o ganho (VGBL / outros)
      netValue = netAfterTax(fv, globalTotalInvested, effectiveTaxRate);
    }

    const gain = Math.max(0, fv - globalTotalInvested);

    phaseResults.push({
      id: phase.id,
      years: phase.years,
      monthlyDeposit: phase.monthlyDeposit,
      cumulativeYears,
      startValue,
      finalValue: fv,
      totalInvested: globalTotalInvested,
      gain,
      effectiveTaxRate,
      netValue,
      estimatedMonthlyIncome: netValue * 0.005,
    });

    currentValue = fv;
  }

  // Totais finais (última fase)
  const lastPhase = phaseResults[phaseResults.length - 1];
  const finalEffectiveTaxRate = fixedTaxRate ?? calculateEffectiveTaxRateMultiPhase(phasesForTax, regime);

  let finalNetValue: number;
  if (taxType === "PGBL") {
    finalNetValue = currentValue * (1 - finalEffectiveTaxRate);
  } else {
    finalNetValue = netAfterTax(currentValue, globalTotalInvested, finalEffectiveTaxRate);
  }

  return {
    phases: phaseResults,
    total: {
      finalValue: currentValue,
      totalInvested: globalTotalInvested,
      netValue: finalNetValue,
      effectiveTaxRate: finalEffectiveTaxRate,
      estimatedMonthlyIncome: finalNetValue * 0.005,
      retirementAge: lastPhase?.cumulativeYears ?? 0,
    },
  };
}

/**
 * Compara VGBL vs PGBL para a mesma série de aportes.
 * PGBL: IR sobre valor total no resgate, mas há restituição durante acúmulo
 *       (simplificação: considera benefício fiscal de ~25% do aporte no IR)
 * VGBL: IR apenas sobre o ganho
 */
export function compareVGBLvsPGBL(params: {
  phases: RetirementPhase[];
  annualRate: number;
  initialDeposit: number;
  regime: TaxRegime;
}): {
  better: "VGBL" | "PGBL";
  vgblNet: number;
  pgblNet: number;
  advantage: number;
} {
  const vgblResult = simulateRetirement(
    params.phases,
    params.annualRate,
    params.initialDeposit,
    "VGBL",
    params.regime
  );

  const pgblResult = simulateRetirement(
    params.phases,
    params.annualRate,
    params.initialDeposit,
    "PGBL",
    params.regime
  );

  const vgblNet = vgblResult.total.netValue;
  const pgblNet = pgblResult.total.netValue;
  const better = pgblNet >= vgblNet ? "PGBL" : "VGBL";

  return {
    better,
    vgblNet,
    pgblNet,
    advantage: Math.abs(pgblNet - vgblNet),
  };
}

/**
 * Gera dados do gráfico de evolução do patrimônio.
 */
export function generateRetirementChart(
  phases: RetirementPhase[],
  annualRate: number,
  initialDeposit: number
): Array<{ year: number; value: number; invested: number }> {
  const monthlyRate = annualToMonthly(annualRate);
  const data: Array<{ year: number; value: number; invested: number }> = [];
  let currentValue = initialDeposit;
  let totalInvested = initialDeposit;
  let globalYear = 0;

  data.push({ year: 0, value: initialDeposit, invested: initialDeposit });

  for (const phase of phases) {
    for (let y = 1; y <= phase.years; y++) {
      // Simula 12 meses
      for (let m = 0; m < 12; m++) {
        currentValue = currentValue * (1 + monthlyRate) + phase.monthlyDeposit;
        totalInvested += phase.monthlyDeposit;
      }
      globalYear++;
      data.push({ year: globalYear, value: currentValue, invested: totalInvested });
    }
  }

  return data;
}
