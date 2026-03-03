/**
 * Engine de Juros Compostos - Replica funções financeiras do Excel
 */

/**
 * Replica FV (Future Value) do Excel.
 * FV(rate, nper, pmt, pv, type)
 * @param rate  Taxa por período
 * @param nper  Número de períodos
 * @param pmt   Pagamento por período (negativo = depósito)
 * @param pv    Valor presente (negativo = depósito inicial)
 * @param type  0 = fim do período, 1 = início do período
 * @returns Valor futuro (positivo = valor acumulado)
 */
export function futureValue(
  rate: number,
  nper: number,
  pmt: number,
  pv: number = 0,
  type: 0 | 1 = 0
): number {
  if (nper === 0) return -pv;
  if (rate === 0) return -(pv + pmt * nper);
  const pvFactor = Math.pow(1 + rate, nper);
  const pmtFactor = type === 1 ? 1 + rate : 1;
  return -(pv * pvFactor + pmt * pmtFactor * ((pvFactor - 1) / rate));
}

/**
 * Replica PMT (Payment) do Excel.
 * Calcula o pagamento periódico necessário para atingir um valor presente.
 * @param rate  Taxa por período
 * @param nper  Número de períodos
 * @param pv    Valor presente
 * @returns Pagamento por período
 */
export function payment(rate: number, nper: number, pv: number): number {
  if (nper === 0) return 0;
  if (rate === 0) return -pv / nper;
  const pvFactor = Math.pow(1 + rate, nper);
  return -(pv * rate * pvFactor) / (pvFactor - 1);
}

/**
 * Calcula valor líquido após IR sobre o ganho de capital.
 * @param finalValue    Valor bruto final
 * @param totalInvested Total investido (sem rendimento)
 * @param taxRate       Alíquota de IR (ex: 0.15 = 15%)
 * @returns Valor líquido após IR
 */
export function netAfterTax(
  finalValue: number,
  totalInvested: number,
  taxRate: number
): number {
  const gain = Math.max(0, finalValue - totalInvested);
  return finalValue - gain * taxRate;
}

/**
 * Calcula o total investido em múltiplas fases.
 * @param initialDeposit  Depósito inicial
 * @param phases          Array de { months, monthlyDeposit }
 */
export function calculateTotalInvested(
  initialDeposit: number,
  phases: Array<{ months: number; monthlyDeposit: number }>
): number {
  return phases.reduce(
    (total, phase) => total + phase.monthlyDeposit * phase.months,
    initialDeposit
  );
}
