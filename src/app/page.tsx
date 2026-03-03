"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, ChevronRight, TrendingUp, Calendar } from "lucide-react";
import { usePlanStore } from "@/store/usePlanStore";
import { HydrationBoundary } from "@/components/ui/hydration-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import type { FinancialPlan } from "@/store/types";

function getPlanStatus(plan: FinancialPlan) {
  const hasClient = plan.client.age > 0 && plan.clientName.length > 0;
  const hasBudget =
    plan.budget.current.incomes.length > 0 ||
    plan.budget.current.fixedExpenses.length > 0;
  const hasRetirement = plan.retirement.pension.phases.length > 0;
  if (hasClient && hasBudget && hasRetirement) return "completo";
  if (hasClient || hasBudget) return "parcial";
  return "novo";
}

export default function Home() {
  const router = useRouter();
  const { plans, createPlan, deletePlan, setActivePlan } = usePlanStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleCreate() {
    if (!newClientName.trim()) return;
    const id = createPlan(newClientName.trim());
    setIsCreating(false);
    setNewClientName("");
    router.push(`/plano/${id}/overview`);
  }

  function handleOpen(id: string) {
    setActivePlan(id);
    router.push(`/plano/${id}/overview`);
  }

  function handleDelete(id: string) {
    deletePlan(id);
    setDeletingId(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Planejamento Financeiro</h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Sistema de gestão</p>
            </div>
          </div>
          <Button onClick={() => setIsCreating(true)} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Planejamento
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <HydrationBoundary>
        {plans.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Nenhum planejamento ainda</h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">
              Crie o primeiro planejamento financeiro para começar.
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Criar Planejamento
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                {plans.length} planejamento{plans.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const status = getPlanStatus(plan);
                return (
                  <Card
                    key={plan.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group"
                    onClick={() => handleOpen(plan.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base truncate pr-2">
                          {plan.clientName}
                        </CardTitle>
                        <Badge
                          variant={
                            status === "completo"
                              ? "success"
                              : status === "parcial"
                              ? "warning"
                              : "secondary"
                          }
                          className="shrink-0"
                        >
                          {status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Criado em {formatDate(plan.createdAt)}</span>
                        </div>
                        {plan.client.age > 0 && (
                          <div className="text-xs">
                            {plan.client.age} anos · {plan.client.regime}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">Abrir planejamento</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(plan.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {/* Card de novo planejamento */}
              <Card
                className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border-dashed flex items-center justify-center min-h-[140px]"
                onClick={() => setIsCreating(true)}
              >
                <div className="text-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
                  <PlusCircle className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-sm font-medium">Novo planejamento</span>
                </div>
              </Card>
            </div>
          </div>
        )}
        </HydrationBoundary>
      </main>

      {/* Modal: Criar novo planejamento */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Planejamento Financeiro</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium block mb-2">Nome do cliente</label>
            <Input
              placeholder="Ex: João Silva"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsCreating(false); setNewClientName(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!newClientName.trim()}>
              Criar planejamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar exclusão */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir planejamento?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(var(--muted-foreground))] py-2">
            Esta ação não pode ser desfeita. O planejamento será removido permanentemente.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
