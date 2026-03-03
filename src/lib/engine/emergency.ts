import type { WorkRegime, ReserveStage, BudgetSide, AccumulationPhase } from "@/store/types";
import { futureValue, netAfterTax } from "./compound";

/**
 * Calcula o multiplicador de reserva de emergência baseado no perfil do cliente.
 * Base 3 + 3 por fator de risco:
 *   - Idade >= 45
 *   - Regime PJ
 *   - Tem dependentes
 * Máximo: 12
 */
export function calculateMultiplier(
  age: number,
  regime: WorkRegime,
  hasDependents: boolean
): number {
  let factors = 0;
  if (age >= 45) factors++;
  if (regime === "PJ") factors++;
  if (hasDependents) factors++;
  return 3 + 3 * factors;
}

/**
 * Calcula o valor base da reserva conforme estágio.
 * Estágio 1: apenas gastos fixos
 * Estágio 2: fixos + variáveis
 * Estágio 3: renda total
 */
export function calculateBaseValue(
  stage: ReserveStage,
  budget: BudgetSide
): number {
  const fixed = budget.fixedExpenses.reduce((sum, l) => sum + l.value, 0);
  const variable = budget.variableExpenses.reduce((sum, l) => sum + l.value, 0);
  const income = budget.incomes.reduce((sum, l) => sum + l.value, 0);

  switch (stage) {
    case 1:
      return fixed;
    case 2:
      return fixed + variable;
    case 3:
      return income;
  }
}

/**
 * Simula o acúmulo da reserva em múltiplas fases.
 * Cada fase usa FV com o acumulado da fase anterior como PV.
 * IR: 15% sobre o ganho.
 */
export function simulateAccumulation(
  phases: AccumulationPhase[],
  monthlyRate: number
): {
  finalValue: number;
  totalInvested: number;
  gain: number;
  netValue: number;
  phaseResults: Array<{
    months: number;
    initialDeposit: number;
    monthlyDeposit: number;
    startValue: number;
    finalValue: number;
  }>;
} {
  let currentValue = 0;
  let totalInvested = 0;
  const phaseResults = [];

  for (const phase of phases) {
    const { months, monthlyDeposit, initialDeposit } = phase;
    const startValue = currentValue + initialDeposit;
    totalInvested += initialDeposit + monthlyDeposit * months;

    // FV: pv negativo (já acumulado), pmt negativo (aportes mensais)
    const fv = futureValue(monthlyRate, months, -monthlyDeposit, -startValue, 0);

    phaseResults.push({
      months,
      initialDeposit,
      monthlyDeposit,
      startValue,
      finalValue: fv,
    });

    currentValue = fv;
  }

  const gain = Math.max(0, currentValue - totalInvested);
  const netValue = netAfterTax(currentValue, totalInvested, 0.15);

  return {
    finalValue: currentValue,
    totalInvested,
    gain,
    netValue,
    phaseResults,
  };
}

/**
 * Gera os dados do gráfico de evolução mensal da reserva.
 */
export function generateAccumulationChart(
  phases: AccumulationPhase[],
  monthlyRate: number
): Array<{ month: number; value: number; invested: number }> {
  const data: Array<{ month: number; value: number; invested: number }> = [];
  let currentValue = 0;
  let totalInvested = 0;
  let globalMonth = 0;

  for (const phase of phases) {
    const { months, monthlyDeposit, initialDeposit } = phase;
    currentValue += initialDeposit;
    totalInvested += initialDeposit;

    for (let m = 1; m <= months; m++) {
      currentValue = currentValue * (1 + monthlyRate) + monthlyDeposit;
      totalInvested += monthlyDeposit;
      globalMonth++;
      data.push({ month: globalMonth, value: currentValue, invested: totalInvested });
    }
  }

  return data;
}
