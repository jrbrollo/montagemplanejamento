"use client";
import { useMemo } from "react";
import { PlusCircle, Trash2, Info } from "lucide-react";
import { nanoid } from "nanoid";
import { usePlanStore } from "@/store/usePlanStore";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatRateAA, formatRateAM, formatPercent } from "@/lib/formatters";
import type {
  Income,
  Benefit,
  Objective,
  Asset,
  ExistingProduct,
  WorkRegime,
  IncomeType,
  ObjectivePriority,
} from "@/store/types";

// Input numérico simples (armazena como decimal)
function NumInput({
  value,
  onChange,
  suffix,
  placeholder,
  className,
  isPercent,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  placeholder?: string;
  className?: string;
  isPercent?: boolean;
  disabled?: boolean;
}) {
  const display = isPercent ? (value * 100).toFixed(2) : value.toString();
  return (
    <div className={`relative flex items-center ${className ?? ""}`}>
      <input
        type="number"
        step={isPercent ? "0.01" : "any"}
        value={display}
        disabled={disabled}
        placeholder={placeholder}
        className={`flex h-9 w-full rounded-md border border-[hsl(var(--input))] px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:bg-[hsl(var(--muted))] disabled:opacity-70 ${suffix ? "pr-12" : ""}`}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(isPercent ? v / 100 : v);
        }}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 text-xs text-[hsl(var(--muted-foreground))]">
          {suffix}
        </span>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const { getActivePlan, updateClient, updateIndicators } = usePlanStore();
  const plan = getActivePlan();

  if (!plan) return <div className="text-center py-20 text-[hsl(var(--muted-foreground))]">Planejamento não encontrado.</div>;

  const { client, indicators } = plan;

  // ── Indicadores ──────────────────────────────────────────────────
  const derivedRows = [
    { label: "CDI a.a.", value: formatRateAA(indicators.cdi) },
    { label: "Curto Prazo a.a.", value: formatRateAA(indicators.shortRate) },
    { label: "Médio Prazo a.a.", value: formatRateAA(indicators.mediumRate) },
    { label: "Longo Prazo a.a.", value: formatRateAA(indicators.longRate) },
    { label: "Curto Prazo a.m.", value: formatRateAM(indicators.shortRateMonthly) },
    { label: "Médio Prazo a.m.", value: formatRateAM(indicators.mediumRateMonthly) },
    { label: "Longo Prazo a.m.", value: formatRateAM(indicators.longRateMonthly) },
  ];

  // ── Client helpers ───────────────────────────────────────────────
  function addIncome() {
    const income: Income = { id: nanoid(), source: "", grossValue: 0, type: "Ativa" };
    updateClient({ incomes: [...client.incomes, income] });
  }
  function updateIncome(id: string, data: Partial<Income>) {
    updateClient({ incomes: client.incomes.map((i) => (i.id === id ? { ...i, ...data } : i)) });
  }
  function removeIncome(id: string) {
    updateClient({ incomes: client.incomes.filter((i) => i.id !== id) });
  }

  function addBenefit() {
    const benefit: Benefit = { id: nanoid(), name: "", value: 0, cost: 0 };
    updateClient({ benefits: [...client.benefits, benefit] });
  }
  function updateBenefit(id: string, data: Partial<Benefit>) {
    updateClient({ benefits: client.benefits.map((b) => (b.id === id ? { ...b, ...data } : b)) });
  }
  function removeBenefit(id: string) {
    updateClient({ benefits: client.benefits.filter((b) => b.id !== id) });
  }

  function addObjective() {
    const obj: Objective = {
      id: nanoid(),
      name: "",
      targetValue: 0,
      targetYear: new Date().getFullYear() + 5,
      priority: "Primordial",
    };
    updateClient({ objectives: [...client.objectives, obj] });
  }
  function updateObjective(id: string, data: Partial<Objective>) {
    updateClient({ objectives: client.objectives.map((o) => (o.id === id ? { ...o, ...data } : o)) });
  }
  function removeObjective(id: string) {
    updateClient({ objectives: client.objectives.filter((o) => o.id !== id) });
  }

  function addAsset() {
    const asset: Asset = { id: nanoid(), description: "", value: 0 };
    updateClient({ assets: [...client.assets, asset] });
  }
  function updateAsset(id: string, data: Partial<Asset>) {
    updateClient({ assets: client.assets.map((a) => (a.id === id ? { ...a, ...data } : a)) });
  }
  function removeAsset(id: string) {
    updateClient({ assets: client.assets.filter((a) => a.id !== id) });
  }

  function addProduct() {
    const prod: ExistingProduct = { id: nanoid(), name: "", coverageOrValue: 0, monthlyCost: 0 };
    updateClient({ existingProducts: [...client.existingProducts, prod] });
  }
  function updateProduct(id: string, data: Partial<ExistingProduct>) {
    updateClient({ existingProducts: client.existingProducts.map((p) => (p.id === id ? { ...p, ...data } : p)) });
  }
  function removeProduct(id: string) {
    updateClient({ existingProducts: client.existingProducts.filter((p) => p.id !== id) });
  }

  const totalAssets = client.assets.reduce((s, a) => s + a.value, 0);
  const totalIncome = client.incomes.reduce((s, i) => s + i.grossValue, 0);

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Overview"
        description="Dados do cliente, indicadores de mercado e patrimônio."
      />

      {/* Indicadores de Mercado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Indicadores de Mercado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Data de referência</label>
              <Input
                type="date"
                value={indicators.spikeDate}
                onChange={(e) => updateIndicators({ spikeDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Selic a.a. (%)</label>
              <NumInput value={indicators.selic} onChange={(v) => updateIndicators({ selic: v })} isPercent suffix="%" />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">IPCA a.a. (%)</label>
              <NumInput value={indicators.ipca} onChange={(v) => updateIndicators({ ipca: v })} isPercent suffix="%" />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">INCC a.a. (%)</label>
              <NumInput value={indicators.incc} onChange={(v) => updateIndicators({ incc: v })} isPercent suffix="%" />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Dólar (R$)</label>
              <NumInput value={indicators.dollar} onChange={(v) => updateIndicators({ dollar: v })} />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Mult. Curto Prazo</label>
              <NumInput value={indicators.shortMultiplier} onChange={(v) => updateIndicators({ shortMultiplier: v })} />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Mult. Médio Prazo</label>
              <NumInput value={indicators.mediumMultiplier} onChange={(v) => updateIndicators({ mediumMultiplier: v })} />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Mult. Longo Prazo</label>
              <NumInput value={indicators.longMultiplier} onChange={(v) => updateIndicators({ longMultiplier: v })} />
            </div>
          </div>

          <Separator />

          {/* Taxas derivadas */}
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Taxas derivadas automaticamente
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {derivedRows.map((row) => (
                <div key={row.label} className="bg-[hsl(var(--muted))] rounded-md px-3 py-2">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{row.label}</p>
                  <p className="text-sm font-semibold text-blue-700">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Nome</label>
              <Input
                value={client.name}
                onChange={(e) => updateClient({ name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Idade</label>
              <NumInput
                value={client.age}
                onChange={(v) => updateClient({ age: Math.max(0, Math.round(v)) })}
                placeholder="30"
              />
            </div>
            <div>
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Regime</label>
              <Select
                value={client.regime}
                onChange={(e) => updateClient({ regime: e.target.value as WorkRegime })}
              >
                <SelectOption value="CLT">CLT</SelectOption>
                <SelectOption value="PJ">PJ</SelectOption>
                <SelectOption value="Concurso">Concurso</SelectOption>
                <SelectOption value="Passiva">Renda Passiva</SelectOption>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Switch
                checked={client.hasDependents}
                onCheckedChange={(v) => updateClient({ hasDependents: v })}
              />
              <label className="text-sm">Possui dependentes</label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={client.hasUninsuredAssets}
                onCheckedChange={(v) => updateClient({ hasUninsuredAssets: v })}
              />
              <label className="text-sm">Bens sem seguro</label>
            </div>
          </div>

          {client.hasUninsuredAssets && (
            <div className="max-w-xs">
              <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Valor dos bens sem seguro (R$)</label>
              <NumInput
                value={client.uninsuredAssetsValue ?? 0}
                onChange={(v) => updateClient({ uninsuredAssetsValue: v })}
                placeholder="0"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rendas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Rendas</CardTitle>
            <Button size="sm" variant="outline" onClick={addIncome}>
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Adicionar Renda
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.incomes.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
              Nenhuma renda cadastrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
                    <th className="text-left py-2 pr-4">Fonte</th>
                    <th className="text-right py-2 pr-4">Valor Bruto</th>
                    <th className="text-left py-2 pr-4">Tipo</th>
                    <th className="text-right py-2 pr-4">% Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {client.incomes.map((income) => (
                    <tr key={income.id} className="border-b border-[hsl(var(--border))]/50">
                      <td className="py-2 pr-4">
                        <Input
                          value={income.source}
                          onChange={(e) => updateIncome(income.id, { source: e.target.value })}
                          placeholder="Ex: Salário"
                          className="h-8"
                        />
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <NumInput
                          value={income.grossValue}
                          onChange={(v) => updateIncome(income.id, { grossValue: v })}
                          className="min-w-[120px]"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <Select
                          value={income.type}
                          onChange={(e) => updateIncome(income.id, { type: e.target.value as IncomeType })}
                          className="h-8 text-xs"
                        >
                          <SelectOption value="Ativa">Ativa</SelectOption>
                          <SelectOption value="Passiva">Passiva</SelectOption>
                        </Select>
                      </td>
                      <td className="py-2 pr-4 text-right text-xs text-[hsl(var(--muted-foreground))]">
                        {totalIncome > 0 ? formatPercent(income.grossValue / totalIncome) : "—"}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeIncome(income.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-xs font-medium">
                    <td className="pt-2">Total</td>
                    <td className="pt-2 text-right font-semibold">{formatCurrency(totalIncome)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefícios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Benefícios</CardTitle>
            <Button size="sm" variant="outline" onClick={addBenefit}>
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.benefits.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">Nenhum benefício cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
                    <th className="text-left py-2 pr-4">Nome</th>
                    <th className="text-right py-2 pr-4">Valor</th>
                    <th className="text-right py-2 pr-4">Custo</th>
                    <th className="text-left py-2 pr-4">Descrição</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {client.benefits.map((b) => (
                    <tr key={b.id} className="border-b border-[hsl(var(--border))]/50">
                      <td className="py-2 pr-4">
                        <Input value={b.name} onChange={(e) => updateBenefit(b.id, { name: e.target.value })} placeholder="Ex: VA" className="h-8" />
                      </td>
                      <td className="py-2 pr-4">
                        <NumInput value={b.value} onChange={(v) => updateBenefit(b.id, { value: v })} className="min-w-[100px]" />
                      </td>
                      <td className="py-2 pr-4">
                        <NumInput value={b.cost} onChange={(v) => updateBenefit(b.id, { cost: v })} className="min-w-[100px]" />
                      </td>
                      <td className="py-2 pr-4">
                        <Input value={b.description ?? ""} onChange={(e) => updateBenefit(b.id, { description: e.target.value })} placeholder="Opcional" className="h-8" />
                      </td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeBenefit(b.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objetivos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Objetivos</CardTitle>
            <Button size="sm" variant="outline" onClick={addObjective}>
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.objectives.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">Nenhum objetivo cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
                    <th className="text-left py-2 pr-4">Nome</th>
                    <th className="text-right py-2 pr-4">Valor Alvo</th>
                    <th className="text-right py-2 pr-4">Ano</th>
                    <th className="text-left py-2 pr-4">Prioridade</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {client.objectives.map((o) => (
                    <tr key={o.id} className="border-b border-[hsl(var(--border))]/50">
                      <td className="py-2 pr-4">
                        <Input value={o.name} onChange={(e) => updateObjective(o.id, { name: e.target.value })} placeholder="Ex: Casa própria" className="h-8" />
                      </td>
                      <td className="py-2 pr-4">
                        <NumInput value={o.targetValue} onChange={(v) => updateObjective(o.id, { targetValue: v })} className="min-w-[120px]" />
                      </td>
                      <td className="py-2 pr-4">
                        <NumInput value={o.targetYear} onChange={(v) => updateObjective(o.id, { targetYear: Math.round(v) })} className="min-w-[90px]" />
                      </td>
                      <td className="py-2 pr-4">
                        <Select
                          value={o.priority}
                          onChange={(e) => updateObjective(o.id, { priority: e.target.value as ObjectivePriority })}
                          className="h-8 text-xs"
                        >
                          <SelectOption value="Primordial">Primordial</SelectOption>
                          <SelectOption value="Secundário">Secundário</SelectOption>
                        </Select>
                      </td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeObjective(o.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patrimônio */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Patrimônio</CardTitle>
            <Button size="sm" variant="outline" onClick={addAsset}>
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.assets.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">Nenhum patrimônio cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
                    <th className="text-left py-2 pr-4">Descrição</th>
                    <th className="text-right py-2 pr-4">Valor</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {client.assets.map((a) => (
                    <tr key={a.id} className="border-b border-[hsl(var(--border))]/50">
                      <td className="py-2 pr-4">
                        <Input value={a.description} onChange={(e) => updateAsset(a.id, { description: e.target.value })} placeholder="Ex: Imóvel" className="h-8" />
                      </td>
                      <td className="py-2 pr-4">
                        <NumInput value={a.value} onChange={(v) => updateAsset(a.id, { value: v })} className="min-w-[120px]" />
                      </td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAsset(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-xs font-medium">
                    <td className="pt-2">Total</td>
                    <td className="pt-2 text-right font-semibold">{formatCurrency(totalAssets)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produtos Preexistentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Produtos Preexistentes</CardTitle>
            <Button size="sm" variant="outline" onClick={addProduct}>
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.existingProducts.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">Nenhum produto preexistente cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
                    <th className="text-left py-2 pr-4">Nome</th>
                    <th className="text-right py-2 pr-4">Cobertura / Valor</th>
                    <th className="text-right py-2 pr-4">Custo Mensal</th>
                    <th className="text-left py-2 pr-4">Descrição</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {client.existingProducts.map((p) => (
                    <tr key={p.id} className="border-b border-[hsl(var(--border))]/50">
                      <td className="py-2 pr-4">
                        <Input value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} placeholder="Ex: Seguro de vida" className="h-8" />
                      </td>
                      <td className="py-2 pr-4">
                        <NumInput value={p.coverageOrValue} onChange={(v) => updateProduct(p.id, { coverageOrValue: v })} className="min-w-[120px]" />
                      </td>
                      <td className="py-2 pr-4">
                        <NumInput value={p.monthlyCost} onChange={(v) => updateProduct(p.id, { monthlyCost: v })} className="min-w-[100px]" />
                      </td>
                      <td className="py-2 pr-4">
                        <Input value={p.description ?? ""} onChange={(e) => updateProduct(p.id, { description: e.target.value })} placeholder="Opcional" className="h-8" />
                      </td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeProduct(p.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
