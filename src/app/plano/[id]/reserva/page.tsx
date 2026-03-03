"use client";
import { useMemo } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectOption } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatRateAM, formatPercent } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";
import { simulateAccumulation, generateAccumulationChart } from "@/lib/engine/emergency";
import type { ReserveAsset, AccumulationPhase, ReserveStage } from "@/store/types";

const STAGE_LABELS: Record<ReserveStage, string> = {
  1: "Estágio 1 – Gastos Fixos",
  2: "Estágio 2 – Fixos + Variáveis",
  3: "Estágio 3 – Renda Total",
};

function NumInput({ value, onChange, className }: { value: number; onChange: (v: number) => void; className?: string }) {
  return <CurrencyInput value={value} onChange={onChange} className={`h-8 ${className ?? ""}`} />;
}

export default function ReservaPage() {
  const { getActivePlan, updateEmergencyReserve } = usePlanStore();
  const plan = getActivePlan();

  if (!plan) return <HydrationBoundary><div className="text-center py-20 text-[hsl(var(--muted-foreground))]">Planejamento não encontrado.</div></HydrationBoundary>;

  const { emergencyReserve: er, indicators, client } = plan;

  const currentTotal = er.currentAssets.reduce((s, a) => s + a.value, 0);
  const progressToIdeal = er.idealReserve > 0 ? Math.min(100, (currentTotal / er.idealReserve) * 100) : 0;

  const simulation = useMemo(() => {
    if (er.phases.length === 0) return null;
    return simulateAccumulation(er.phases, er.targetRate);
  }, [er.phases, er.targetRate]);

  const chartData = useMemo(() => {
    if (er.phases.length === 0) return [];
    return generateAccumulationChart(er.phases, er.targetRate);
  }, [er.phases, er.targetRate]);

  const rateOptions = [
    { label: "Curto Prazo", value: indicators.shortRateMonthly },
    { label: "Médio Prazo", value: indicators.mediumRateMonthly },
    { label: "Longo Prazo", value: indicators.longRateMonthly },
  ];

  function addAsset() {
    const asset: ReserveAsset = { id: nanoid(), name: "", liquidity: "D+0", monthlyRate: indicators.shortRateMonthly, value: 0 };
    updateEmergencyReserve({ currentAssets: [...er.currentAssets, asset] });
  }
  function updateAsset(id: string, data: Partial<ReserveAsset>) {
    updateEmergencyReserve({ currentAssets: er.currentAssets.map((a) => a.id === id ? { ...a, ...data } : a) });
  }
  function removeAsset(id: string) {
    updateEmergencyReserve({ currentAssets: er.currentAssets.filter((a) => a.id !== id) });
  }

  function addPhase() {
    if (er.phases.length >= 3) return;
    const phase: AccumulationPhase = { id: nanoid(), months: 12, monthlyDeposit: 500, initialDeposit: 0 };
    updateEmergencyReserve({ phases: [...er.phases, phase] });
  }
  function updatePhase(id: string, data: Partial<AccumulationPhase>) {
    updateEmergencyReserve({ phases: er.phases.map((p) => p.id === id ? { ...p, ...data } : p) });
  }
  function removePhase(id: string) {
    updateEmergencyReserve({ phases: er.phases.filter((p) => p.id !== id) });
  }

  // Breakdown do multiplicador
  const factors: string[] = [];
  if (client.age >= 45) factors.push(`Idade ≥ 45 (+3)`);
  if (client.regime === "PJ") factors.push(`Regime PJ (+3)`);
  if (client.hasDependents) factors.push(`Dependentes (+3)`);

  return (
    <HydrationBoundary>
    <div className="space-y-8">
      <ModuleHeader
        title="Reserva de Emergência"
        description="Configure e simule a construção da reserva de emergência."
      />

      {/* Config da Reserva */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Configuração da Reserva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Estágio</label>
              <Select
                value={er.stage.toString()}
                onChange={(e) => updateEmergencyReserve({ stage: parseInt(e.target.value) as ReserveStage })}
              >
                {([1, 2, 3] as ReserveStage[]).map((s) => (
                  <SelectOption key={s} value={s.toString()}>{STAGE_LABELS[s]}</SelectOption>
                ))}
              </Select>
            </div>
          </div>

          {/* Multiplicador */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-blue-700">{er.multiplier}x</span>
              <span className="text-sm text-blue-600">multiplicador</span>
            </div>
            <p className="text-xs text-blue-500">
              Base 3 {factors.length > 0 ? `+ ${factors.join(" + ")}` : "(sem fatores adicionais)"}
            </p>
          </div>

          {/* Cards de reserva */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-[hsl(var(--border))] rounded-lg p-4 text-center">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Reserva Mínima (3x)</p>
              <p className="text-lg font-bold text-slate-700">{formatCurrency(er.minimumReserve)}</p>
            </div>
            <div className="border-2 border-blue-300 rounded-lg p-4 text-center bg-blue-50">
              <p className="text-xs text-blue-600 mb-1">Reserva Ideal ({er.multiplier}x)</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(er.idealReserve)}</p>
            </div>
            <div className="border border-[hsl(var(--border))] rounded-lg p-4 text-center">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Reserva Definida (7,5x)</p>
              <p className="text-lg font-bold text-slate-700">{formatCurrency(er.definedReserve)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reserva Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Reserva Atual</CardTitle>
            <Button size="sm" variant="outline" onClick={addAsset}>
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Adicionar Ativo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {er.currentAssets.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">Nenhum ativo cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
                    <th className="text-left py-2 pr-3">Nome</th>
                    <th className="text-left py-2 pr-3">Liquidez</th>
                    <th className="text-right py-2 pr-3">Rent. Mês</th>
                    <th className="text-right py-2 pr-3">Valor</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {er.currentAssets.map((asset) => (
                    <tr key={asset.id} className="border-b border-[hsl(var(--border))]/50">
                      <td className="py-2 pr-3">
                        <Input value={asset.name} onChange={(e) => updateAsset(asset.id, { name: e.target.value })} placeholder="Ex: CDB" className="h-8" />
                      </td>
                      <td className="py-2 pr-3">
                        <Input value={asset.liquidity} onChange={(e) => updateAsset(asset.id, { liquidity: e.target.value })} placeholder="D+0" className="h-8 w-20" />
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <div className="flex items-center gap-1 min-w-[100px]">
                          <NumInput
                            value={parseFloat((asset.monthlyRate * 100).toFixed(4))}
                            onChange={(v) => updateAsset(asset.id, { monthlyRate: v / 100 })}
                          />
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">%</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <NumInput value={asset.value} onChange={(v) => updateAsset(asset.id, { value: v })} className="min-w-[120px]" />
                      </td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAsset(asset.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-xs font-medium">
                    <td className="pt-2" colSpan={3}>Total atual</td>
                    <td className="pt-2 text-right font-semibold">{formatCurrency(currentTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Barra de progresso */}
          {er.idealReserve > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                <span>Progresso em relação à reserva ideal</span>
                <span>{formatPercent(progressToIdeal / 100)}</span>
              </div>
              <Progress value={progressToIdeal} />
              <div className="flex justify-between text-xs">
                <span className="text-[hsl(var(--muted-foreground))]">{formatCurrency(currentTotal)} atual</span>
                <span className="text-blue-600 font-medium">{formatCurrency(er.idealReserve)} ideal</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulação de Acúmulo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Simulação de Acúmulo</CardTitle>
            <Button size="sm" variant="outline" onClick={addPhase} disabled={er.phases.length >= 3}>
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Fase {er.phases.length + 1}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Taxa de rentabilidade */}
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Taxa de rentabilidade (a.m.)</label>
              <Select
                value={er.targetRate.toString()}
                onChange={(e) => updateEmergencyReserve({ targetRate: parseFloat(e.target.value) })}
                className="w-44"
              >
                {rateOptions.map((opt) => (
                  <SelectOption key={opt.label} value={opt.value.toString()}>
                    {opt.label} ({formatRateAM(opt.value)})
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>

          {/* Fases */}
          <div className="space-y-3">
            {er.phases.map((phase, idx) => (
              <div key={phase.id} className="border border-[hsl(var(--border))] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Fase {idx + 1}</span>
                  {er.phases.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePhase(phase.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Meses</label>
                    <NumInput value={phase.months} onChange={(v) => updatePhase(phase.id, { months: Math.max(1, Math.round(v)) })} />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Aporte Mensal (R$)</label>
                    <NumInput value={phase.monthlyDeposit} onChange={(v) => updatePhase(phase.id, { monthlyDeposit: v })} />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Aporte Inicial (R$)</label>
                    <NumInput value={phase.initialDeposit} onChange={(v) => updatePhase(phase.id, { initialDeposit: v })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resultado */}
          {simulation && (
            <>
              <Separator />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[hsl(var(--muted))] rounded-lg p-3 text-center">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Valor Final</p>
                  <p className="text-sm font-bold">{formatCurrency(simulation.finalValue)}</p>
                </div>
                <div className="bg-[hsl(var(--muted))] rounded-lg p-3 text-center">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Total Investido</p>
                  <p className="text-sm font-bold">{formatCurrency(simulation.totalInvested)}</p>
                </div>
                <div className="bg-[hsl(var(--muted))] rounded-lg p-3 text-center">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Ganho</p>
                  <p className="text-sm font-bold text-emerald-700">{formatCurrency(simulation.gain)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 mb-1">Líquido (IR 15%)</p>
                  <p className="text-sm font-bold text-blue-700">{formatCurrency(simulation.netValue)}</p>
                </div>
              </div>

              {/* Gráfico */}
              {chartData.length > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: "Meses", position: "insideBottom", offset: -2, fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v)} labelFormatter={(l) => `Mês ${l}`} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="value" name="Acumulado" stroke="#2563eb" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="invested" name="Investido" stroke="#94a3b8" dot={false} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </HydrationBoundary>
  );
}
