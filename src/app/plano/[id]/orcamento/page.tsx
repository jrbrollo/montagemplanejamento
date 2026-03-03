"use client";
import { useMemo } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { usePlanStore } from "@/store/usePlanStore";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { BudgetLine, BudgetSide } from "@/store/types";

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      step="any"
      value={value}
      className="flex h-8 w-full rounded-md border border-[hsl(var(--input))] px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
      onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
    />
  );
}

interface BudgetSectionProps {
  title: string;
  lines: BudgetLine[];
  totalIncome: number;
  onAdd: () => void;
  onUpdate: (id: string, data: Partial<BudgetLine>) => void;
  onRemove: (id: string) => void;
  sectionColor?: string;
}

function BudgetSection({ title, lines, totalIncome, onAdd, onUpdate, onRemove, sectionColor = "" }: BudgetSectionProps) {
  const total = lines.reduce((s, l) => s + l.value, 0);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${sectionColor || "text-[hsl(var(--muted-foreground))]"}`}>{title}</h3>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onAdd}>
          <PlusCircle className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      {lines.length === 0 ? (
        <p className="text-xs text-[hsl(var(--muted-foreground))] italic pl-1">Vazio</p>
      ) : (
        <div className="space-y-1">
          {lines.map((line) => (
            <div key={line.id} className="flex items-center gap-2">
              <Input
                value={line.description}
                onChange={(e) => onUpdate(line.id, { description: e.target.value })}
                placeholder="Descrição"
                className="h-8 text-xs flex-1"
              />
              <div className="w-28">
                <NumInput value={line.value} onChange={(v) => onUpdate(line.id, { value: v })} />
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))] w-12 text-right shrink-0">
                {totalIncome > 0 ? formatPercent(line.value / totalIncome) : "—"}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemove(line.id)}>
                <Trash2 className="h-3 w-3 text-[hsl(var(--destructive))]" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {lines.length > 0 && (
        <div className="flex justify-between text-xs font-medium pt-1 mt-1 border-t border-[hsl(var(--border))]/50">
          <span>Subtotal</span>
          <span>{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  );
}

interface BudgetColumnProps {
  title: string;
  side: BudgetSide;
  onUpdate: (side: Partial<BudgetSide>) => void;
}

function BudgetColumn({ title, side, onUpdate }: BudgetColumnProps) {
  const totalIncome = side.incomes.reduce((s, l) => s + l.value, 0);
  const totalInvestments = side.investments.reduce((s, l) => s + l.value, 0);
  const totalFixed = side.fixedExpenses.reduce((s, l) => s + l.value, 0);
  const totalVariable = side.variableExpenses.reduce((s, l) => s + l.value, 0);
  const balance = totalIncome - totalInvestments - totalFixed - totalVariable;

  function addLine(key: keyof BudgetSide) {
    const newLine: BudgetLine = { id: nanoid(), description: "", value: 0 };
    onUpdate({ [key]: [...side[key], newLine] });
  }
  function updateLine(key: keyof BudgetSide, id: string, data: Partial<BudgetLine>) {
    onUpdate({ [key]: (side[key] as BudgetLine[]).map((l) => (l.id === id ? { ...l, ...data } : l)) });
  }
  function removeLine(key: keyof BudgetSide, id: string) {
    onUpdate({ [key]: (side[key] as BudgetLine[]).filter((l) => l.id !== id) });
  }

  return (
    <Card className="flex-1 min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <BudgetSection
          title="Rendas"
          lines={side.incomes}
          totalIncome={totalIncome}
          onAdd={() => addLine("incomes")}
          onUpdate={(id, d) => updateLine("incomes", id, d)}
          onRemove={(id) => removeLine("incomes", id)}
          sectionColor="text-emerald-700"
        />
        <Separator />
        <BudgetSection
          title="Investimentos"
          lines={side.investments}
          totalIncome={totalIncome}
          onAdd={() => addLine("investments")}
          onUpdate={(id, d) => updateLine("investments", id, d)}
          onRemove={(id) => removeLine("investments", id)}
          sectionColor="text-blue-700"
        />
        <Separator />
        <BudgetSection
          title="Gastos Fixos"
          lines={side.fixedExpenses}
          totalIncome={totalIncome}
          onAdd={() => addLine("fixedExpenses")}
          onUpdate={(id, d) => updateLine("fixedExpenses", id, d)}
          onRemove={(id) => removeLine("fixedExpenses", id)}
          sectionColor="text-orange-700"
        />
        <Separator />
        <BudgetSection
          title="Gastos Variáveis"
          lines={side.variableExpenses}
          totalIncome={totalIncome}
          onAdd={() => addLine("variableExpenses")}
          onUpdate={(id, d) => updateLine("variableExpenses", id, d)}
          onRemove={(id) => removeLine("variableExpenses", id)}
          sectionColor="text-red-700"
        />
        <Separator />
        {/* Saldo */}
        <div className={`flex justify-between font-semibold text-sm p-2 rounded-md ${balance >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          <span>Saldo</span>
          <span>{formatCurrency(balance)}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-[hsl(var(--muted-foreground))]">
          <span>Renda: {formatCurrency(totalIncome)}</span>
          <span>Fixos: {formatCurrency(totalFixed)}</span>
          <span>Invest.: {formatCurrency(totalInvestments)}</span>
          <span>Variáveis: {formatCurrency(totalVariable)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrcamentoPage() {
  const { getActivePlan, updateBudget } = usePlanStore();
  const plan = getActivePlan();

  if (!plan) return <div className="text-center py-20 text-[hsl(var(--muted-foreground))]">Planejamento não encontrado.</div>;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Orçamento"
        description="Fluxo de caixa atual e sugerido."
      />
      <div className="flex gap-4 flex-col lg:flex-row">
        <BudgetColumn
          title="Fluxo de Caixa Atual"
          side={plan.budget.current}
          onUpdate={(data) => updateBudget({ current: { ...plan.budget.current, ...data } })}
        />
        <BudgetColumn
          title="Fluxo de Caixa Sugerido"
          side={plan.budget.suggested}
          onUpdate={(data) => updateBudget({ suggested: { ...plan.budget.suggested, ...data } })}
        />
      </div>
    </div>
  );
}
