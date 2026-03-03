"use client";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { HydrationBoundary } from "@/components/ui/hydration-boundary";
import { usePlanStore } from "@/store/usePlanStore";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { simulateRetirement } from "@/lib/engine/retirement";
import { generateRetirementChart } from "@/lib/engine/retirement";

export default function ResumoPage() {
  const { getActivePlan, getTotalMonthlyInvestment } = usePlanStore();
  const plan = getActivePlan();
  const totalMonthly = getTotalMonthlyInvestment();

  if (!plan) return <div className="text-center py-20 text-[hsl(var(--muted-foreground))]">Planejamento não encontrado.</div>;

  const { client, retirement: ret, emergencyReserve: er, budget } = plan;

  // Renda total
  const totalIncome = budget.current.incomes.reduce((s, l) => s + l.value, 0);
  const savingsRate = totalIncome > 0 ? totalMonthly / totalIncome : 0;
  const savingsTargetRate = 0.2; // 20%

  // Reserva atual vs meta
  const currentReserve = er.currentAssets.reduce((s, a) => s + a.value, 0);
  const reserveProgress = er.idealReserve > 0 ? Math.min(100, (currentReserve / er.idealReserve) * 100) : 0;

  // Aposentadoria - pensão
  const pensionResult = useMemo(() => {
    if (ret.pension.phases.length === 0) return null;
    const taxType = ret.pension.type.startsWith("VGBL") ? "VGBL" : "PGBL";
    const regime = ret.pension.type.includes("Regressivo") ? "Regressivo" : "Progressivo";
    return simulateRetirement(ret.pension.phases, ret.pension.realRate, ret.pension.initialDeposit, taxType as "VGBL" | "PGBL", regime);
  }, [ret.pension]);

  // Outros investimentos
  const otherResult = useMemo(() => {
    if (ret.otherInvestments.phases.length === 0) return null;
    return simulateRetirement(ret.otherInvestments.phases, ret.otherInvestments.realRate, ret.otherInvestments.initialDeposit, "outros", "Regressivo", ret.otherInvestments.taxRate);
  }, [ret.otherInvestments]);

  // Dados para o gráfico timeline
  const chartData = useMemo(() => {
    const pensionChart = generateRetirementChart(ret.pension.phases, ret.pension.realRate, ret.pension.initialDeposit);
    const otherChart = generateRetirementChart(ret.otherInvestments.phases, ret.otherInvestments.realRate, ret.otherInvestments.initialDeposit);
    const maxYears = Math.max(pensionChart.length, otherChart.length);
    return Array.from({ length: maxYears }, (_, i) => ({
      year: i,
      previdencia: pensionChart[i]?.value ?? 0,
      outros: otherChart[i]?.value ?? 0,
      total: (pensionChart[i]?.value ?? 0) + (otherChart[i]?.value ?? 0),
    }));
  }, [ret.pension, ret.otherInvestments]);

  // Aportes mensais por linha
  const reserveMonthly = er.phases[0]?.monthlyDeposit ?? 0;
  const pensionMonthly = ret.pension.phases.reduce((s, p) => s + p.monthlyDeposit, 0);
  const otherMonthly = ret.otherInvestments.phases.reduce((s, p) => s + p.monthlyDeposit, 0);

  // Renda total na aposentadoria
  const totalRetirementIncome =
    (pensionResult?.total.estimatedMonthlyIncome ?? 0) +
    (otherResult?.total.estimatedMonthlyIncome ?? 0);

  return (
    <div className="space-y-8">
      <ModuleHeader title="Resumo" description="Visão consolidada do planejamento financeiro." />

      {/* Investimento Mensal Total */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-sm text-blue-600 font-medium mb-2">Investimento Mensal Total</p>
          <p className="text-4xl font-bold text-blue-800">{formatCurrency(totalMonthly)}</p>
          {totalIncome > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              {formatPercent(savingsRate)} da renda mensal
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabela de alocação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Alocação Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
                <th className="text-left py-2">Destino</th>
                <th className="text-right py-2">Valor Mensal</th>
                <th className="text-right py-2">% da Renda</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Reserva de Emergência", value: reserveMonthly, color: "text-amber-700" },
                { label: "Aposentadoria – Previdência", value: pensionMonthly, color: "text-blue-700" },
                { label: "Aposentadoria – Outros Invest.", value: otherMonthly, color: "text-indigo-700" },
                { label: "Segurança Financeira", value: null, color: "text-[hsl(var(--muted-foreground))]" },
              ].map((row) => (
                <tr key={row.label} className="border-b border-[hsl(var(--border))]/50">
                  <td className={`py-2.5 ${row.color}`}>{row.label}</td>
                  <td className="py-2.5 text-right font-medium">
                    {row.value !== null ? formatCurrency(row.value) : <span className="text-[hsl(var(--muted-foreground))]">—</span>}
                  </td>
                  <td className="py-2.5 text-right text-xs text-[hsl(var(--muted-foreground))]">
                    {row.value !== null && totalIncome > 0 ? formatPercent(row.value / totalIncome) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold text-sm">
                <td className="pt-3">Total</td>
                <td className="pt-3 text-right">{formatCurrency(totalMonthly)}</td>
                <td className="pt-3 text-right text-xs">
                  {totalIncome > 0 ? formatPercent(savingsRate) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Taxa de poupança */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Taxa de Poupança</span>
              <span className={savingsRate >= savingsTargetRate ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                {formatPercent(savingsRate)} / {formatPercent(savingsTargetRate)} ideal
              </span>
            </div>
            <Progress value={Math.min(100, (savingsRate / savingsTargetRate) * 100)} />
          </div>

          {/* Reserva de emergência */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Reserva de Emergência</span>
              <span className="text-[hsl(var(--muted-foreground))] text-xs">
                {formatCurrency(currentReserve)} / {formatCurrency(er.idealReserve)} ({er.multiplier}x)
              </span>
            </div>
            <Progress value={reserveProgress} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Idade de Aposentadoria</p>
              <p className="font-semibold text-lg">{ret.retirementAge} anos</p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Renda Mensal Estimada</p>
              <p className="font-semibold text-lg text-emerald-700">{formatCurrency(totalRetirementIncome)}</p>
            </div>
            {pensionResult && (
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Patrimônio (Previdência)</p>
                <p className="font-semibold">{formatCurrency(pensionResult.total.netValue)}</p>
              </div>
            )}
            {otherResult && (
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Patrimônio (Outros)</p>
                <p className="font-semibold">{formatCurrency(otherResult.total.netValue)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Evolução Projetada do Patrimônio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: "Anos", position: "insideBottom", offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v)} labelFormatter={(l) => `Ano ${l}`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="previdencia" name="Previdência" stroke="#7c3aed" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="outros" name="Outros" stroke="#059669" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
