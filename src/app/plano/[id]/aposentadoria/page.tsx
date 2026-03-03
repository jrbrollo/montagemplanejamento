"use client";
import { useMemo } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import {
  AreaChart,
  Area,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent, formatCurrencyCompact } from "@/lib/formatters";
import { simulateRetirement, compareVGBLvsPGBL, generateRetirementChart } from "@/lib/engine/retirement";
import type { RetirementPhase, PensionCombined, TaxRegime } from "@/store/types";

function NumInput({ value, onChange, className, suffix }: { value: number; onChange: (v: number) => void; className?: string; suffix?: string }) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        step="any"
        value={value}
        className={`flex h-8 w-full rounded-md border border-[hsl(var(--input))] px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] ${suffix ? "pr-8" : ""} ${className ?? ""}`}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
      />
      {suffix && <span className="pointer-events-none absolute right-2 text-xs text-[hsl(var(--muted-foreground))]">{suffix}</span>}
    </div>
  );
}

const PENSION_TYPES: PensionCombined[] = [
  "VGBL Regressivo",
  "VGBL Progressivo",
  "PGBL Regressivo",
  "PGBL Progressivo",
];

interface PhaseTableProps {
  phases: RetirementPhase[];
  annualRate: number;
  initialDeposit: number;
  taxType: "VGBL" | "PGBL" | "outros";
  regime: TaxRegime;
  fixedTaxRate?: number;
  maxPhases?: number;
  onAddPhase: () => void;
  onUpdatePhase: (id: string, data: Partial<RetirementPhase>) => void;
  onRemovePhase: (id: string) => void;
}

function PhaseTable({
  phases,
  annualRate,
  initialDeposit,
  taxType,
  regime,
  fixedTaxRate,
  maxPhases = 9,
  onAddPhase,
  onUpdatePhase,
  onRemovePhase,
}: PhaseTableProps) {
  const result = useMemo(() => {
    if (phases.length === 0) return null;
    return simulateRetirement(phases, annualRate, initialDeposit, taxType, regime, fixedTaxRate);
  }, [phases, annualRate, initialDeposit, taxType, regime, fixedTaxRate]);

  const chartData = useMemo(() => {
    if (phases.length === 0) return [];
    return generateRetirementChart(phases, annualRate, initialDeposit);
  }, [phases, annualRate, initialDeposit]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <th className="text-left py-2 pr-3">Fase</th>
              <th className="text-right py-2 pr-3">Anos</th>
              <th className="text-right py-2 pr-3">Aporte Mensal</th>
              <th className="text-right py-2 pr-3">Anos Acum.</th>
              <th className="text-right py-2 pr-3">Valor Final</th>
              <th className="text-right py-2 pr-3">Total Invest.</th>
              <th className="text-right py-2 pr-3">Alíq. IR</th>
              <th className="text-right py-2 pr-3">Líquido</th>
              <th className="text-right py-2 pr-3">Renda Mês</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {phases.map((phase, idx) => {
              const phaseResult = result?.phases[idx];
              return (
                <tr key={phase.id} className="border-b border-[hsl(var(--border))]/50">
                  <td className="py-2 pr-3 font-medium">{idx + 1}</td>
                  <td className="py-2 pr-3">
                    <NumInput value={phase.years} onChange={(v) => onUpdatePhase(phase.id, { years: Math.max(1, Math.round(v)) })} className="w-16" />
                  </td>
                  <td className="py-2 pr-3">
                    <NumInput value={phase.monthlyDeposit} onChange={(v) => onUpdatePhase(phase.id, { monthlyDeposit: v })} className="w-24" />
                  </td>
                  <td className="py-2 pr-3 text-right text-[hsl(var(--muted-foreground))]">
                    {phaseResult?.cumulativeYears ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-medium">
                    {phaseResult ? formatCurrencyCompact(phaseResult.finalValue) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right text-[hsl(var(--muted-foreground))]">
                    {phaseResult ? formatCurrencyCompact(phaseResult.totalInvested) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {phaseResult ? formatPercent(phaseResult.effectiveTaxRate) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-medium text-blue-700">
                    {phaseResult ? formatCurrencyCompact(phaseResult.netValue) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-medium text-emerald-700">
                    {phaseResult ? formatCurrency(phaseResult.estimatedMonthlyIncome) : "—"}
                  </td>
                  <td className="py-2">
                    {phases.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemovePhase(phase.id)}>
                        <Trash2 className="h-3 w-3 text-[hsl(var(--destructive))]" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button size="sm" variant="outline" onClick={onAddPhase} disabled={phases.length >= maxPhases}>
        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
        Adicionar Fase {phases.length + 1}
      </Button>

      {/* Totais */}
      {result && (
        <>
          <Separator />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[hsl(var(--muted))] rounded-lg p-3 text-center">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Valor Final</p>
              <p className="text-sm font-bold">{formatCurrency(result.total.finalValue)}</p>
            </div>
            <div className="bg-[hsl(var(--muted))] rounded-lg p-3 text-center">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Total Investido</p>
              <p className="text-sm font-bold">{formatCurrency(result.total.totalInvested)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 mb-1">Líquido Final</p>
              <p className="text-sm font-bold text-blue-700">{formatCurrency(result.total.netValue)}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-xs text-emerald-600 mb-1">Renda Mensal Est.</p>
              <p className="text-sm font-bold text-emerald-700">{formatCurrency(result.total.estimatedMonthlyIncome)}</p>
            </div>
          </div>

          {/* Gráfico */}
          {chartData.length > 0 && (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: "Anos", position: "insideBottom", offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v)} labelFormatter={(l) => `Ano ${l}`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="value" name="Acumulado" stroke="#2563eb" fill="url(#gradValue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="invested" name="Investido" stroke="#94a3b8" fill="none" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AposentadoriaPage() {
  const { getActivePlan, updateRetirement } = usePlanStore();
  const plan = getActivePlan();

  if (!plan) return <div className="text-center py-20 text-[hsl(var(--muted-foreground))]">Planejamento não encontrado.</div>;

  const { retirement: ret, client } = plan;

  const pensionTaxType = ret.pension.type.startsWith("VGBL") ? "VGBL" : "PGBL";
  const pensionRegime: TaxRegime = ret.pension.type.includes("Regressivo") ? "Regressivo" : "Progressivo";

  const comparison = useMemo(() => {
    if (ret.pension.phases.length === 0) return null;
    return compareVGBLvsPGBL({
      phases: ret.pension.phases,
      annualRate: ret.pension.realRate,
      initialDeposit: ret.pension.initialDeposit,
      regime: pensionRegime,
    });
  }, [ret.pension.phases, ret.pension.realRate, ret.pension.initialDeposit, pensionRegime]);

  function addPensionPhase() {
    if (ret.pension.phases.length >= 9) return;
    const phase: RetirementPhase = { id: nanoid(), years: 5, monthlyDeposit: 200 };
    updateRetirement({ pension: { ...ret.pension, phases: [...ret.pension.phases, phase] } });
  }
  function updatePensionPhase(id: string, data: Partial<RetirementPhase>) {
    updateRetirement({ pension: { ...ret.pension, phases: ret.pension.phases.map((p) => p.id === id ? { ...p, ...data } : p) } });
  }
  function removePensionPhase(id: string) {
    if (ret.pension.phases.length <= 1) return;
    updateRetirement({ pension: { ...ret.pension, phases: ret.pension.phases.filter((p) => p.id !== id) } });
  }

  function addOtherPhase() {
    if (ret.otherInvestments.phases.length >= 9) return;
    const phase: RetirementPhase = { id: nanoid(), years: 5, monthlyDeposit: 100 };
    updateRetirement({ otherInvestments: { ...ret.otherInvestments, phases: [...ret.otherInvestments.phases, phase] } });
  }
  function updateOtherPhase(id: string, data: Partial<RetirementPhase>) {
    updateRetirement({ otherInvestments: { ...ret.otherInvestments, phases: ret.otherInvestments.phases.map((p) => p.id === id ? { ...p, ...data } : p) } });
  }
  function removeOtherPhase(id: string) {
    if (ret.otherInvestments.phases.length <= 1) return;
    updateRetirement({ otherInvestments: { ...ret.otherInvestments, phases: ret.otherInvestments.phases.filter((p) => p.id !== id) } });
  }

  return (
    <div className="space-y-6">
      <ModuleHeader title="Aposentadoria" description="Planejamento de previdência e outros investimentos." />

      {/* Config geral */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Idade Atual</label>
              <div className="flex h-9 items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 text-sm">{client.age} anos</div>
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Idade Aposentadoria</label>
              <NumInput value={ret.retirementAge} onChange={(v) => updateRetirement({ retirementAge: Math.round(v) })} suffix="anos" />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Margem de Incerteza</label>
              <div className="relative flex items-center">
                <NumInput value={ret.uncertaintyMargin * 100} onChange={(v) => updateRetirement({ uncertaintyMargin: v / 100 })} suffix="%" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="previdencia">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="previdencia">Previdência</TabsTrigger>
          <TabsTrigger value="outros">Outros Investimentos</TabsTrigger>
          <TabsTrigger value="comparacao">Comparação VGBL/PGBL</TabsTrigger>
        </TabsList>

        {/* Tab Previdência */}
        <TabsContent value="previdencia">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Previdência Privada</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Rentabilidade Real a.a.</label>
                  <NumInput value={ret.pension.realRate * 100} onChange={(v) => updateRetirement({ pension: { ...ret.pension, realRate: v / 100 } })} suffix="%" />
                </div>
                <div>
                  <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Tipo</label>
                  <Select
                    value={ret.pension.type}
                    onChange={(e) => updateRetirement({ pension: { ...ret.pension, type: e.target.value as PensionCombined } })}
                  >
                    {PENSION_TYPES.map((t) => (
                      <SelectOption key={t} value={t}>{t}</SelectOption>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Aporte Inicial (R$)</label>
                  <NumInput value={ret.pension.initialDeposit} onChange={(v) => updateRetirement({ pension: { ...ret.pension, initialDeposit: v } })} />
                </div>
              </div>
              <Separator />
              <PhaseTable
                phases={ret.pension.phases}
                annualRate={ret.pension.realRate}
                initialDeposit={ret.pension.initialDeposit}
                taxType={pensionTaxType}
                regime={pensionRegime}
                onAddPhase={addPensionPhase}
                onUpdatePhase={updatePensionPhase}
                onRemovePhase={removePensionPhase}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Outros Investimentos */}
        <TabsContent value="outros">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Outros Investimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Rentabilidade Real a.a.</label>
                  <NumInput value={ret.otherInvestments.realRate * 100} onChange={(v) => updateRetirement({ otherInvestments: { ...ret.otherInvestments, realRate: v / 100 } })} suffix="%" />
                </div>
                <div>
                  <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Alíquota IR fixa</label>
                  <NumInput value={ret.otherInvestments.taxRate * 100} onChange={(v) => updateRetirement({ otherInvestments: { ...ret.otherInvestments, taxRate: v / 100 } })} suffix="%" />
                </div>
                <div>
                  <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Aporte Inicial (R$)</label>
                  <NumInput value={ret.otherInvestments.initialDeposit} onChange={(v) => updateRetirement({ otherInvestments: { ...ret.otherInvestments, initialDeposit: v } })} />
                </div>
              </div>
              <Separator />
              <PhaseTable
                phases={ret.otherInvestments.phases}
                annualRate={ret.otherInvestments.realRate}
                initialDeposit={ret.otherInvestments.initialDeposit}
                taxType="outros"
                regime="Regressivo"
                fixedTaxRate={ret.otherInvestments.taxRate}
                onAddPhase={addOtherPhase}
                onUpdatePhase={updateOtherPhase}
                onRemovePhase={removeOtherPhase}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Comparação */}
        <TabsContent value="comparacao">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Comparação VGBL vs PGBL</CardTitle>
            </CardHeader>
            <CardContent>
              {!comparison ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">Configure a previdência para ver a comparação.</p>
              ) : (
                <div className="space-y-6">
                  {/* Melhor opção */}
                  <div className="text-center py-4">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Melhor opção para este perfil</p>
                    <Badge variant="success" className="text-base px-6 py-2">
                      {comparison.better}
                    </Badge>
                    <p className="text-sm text-emerald-700 mt-2">
                      Vantagem de <strong>{formatCurrency(comparison.advantage)}</strong>
                    </p>
                  </div>
                  <Separator />
                  {/* Tabela comparativa */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-lg p-4 border-2 ${comparison.better === "VGBL" ? "border-emerald-400 bg-emerald-50" : "border-[hsl(var(--border))]"}`}>
                      <h4 className="font-semibold text-sm mb-3">VGBL</h4>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">IR sobre o ganho</p>
                      <p className="text-lg font-bold mt-2">{formatCurrency(comparison.vgblNet)}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">líquido final</p>
                    </div>
                    <div className={`rounded-lg p-4 border-2 ${comparison.better === "PGBL" ? "border-emerald-400 bg-emerald-50" : "border-[hsl(var(--border))]"}`}>
                      <h4 className="font-semibold text-sm mb-3">PGBL</h4>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">IR sobre o valor total</p>
                      <p className="text-lg font-bold mt-2">{formatCurrency(comparison.pgblNet)}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">líquido final</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
