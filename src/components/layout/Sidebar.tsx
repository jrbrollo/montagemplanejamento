"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Shield,
  PiggyBank,
  FileText,
  ChevronLeft,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/usePlanStore";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  moduleKey: "overview" | "orcamento" | "reserva" | "aposentadoria" | "resumo";
}

function getModuleStatus(plan: ReturnType<typeof usePlanStore.getState>["plans"][0], moduleKey: NavItem["moduleKey"]): "preenchido" | "parcial" | "vazio" {
  if (!plan) return "vazio";
  switch (moduleKey) {
    case "overview":
      return plan.client.name && plan.client.age > 0 ? "preenchido" : "vazio";
    case "orcamento":
      if (plan.budget.current.incomes.length > 0 && plan.budget.current.fixedExpenses.length > 0) return "preenchido";
      if (plan.budget.current.incomes.length > 0 || plan.budget.current.fixedExpenses.length > 0) return "parcial";
      return "vazio";
    case "reserva":
      return plan.emergencyReserve.currentAssets.length > 0 ? "preenchido" : "vazio";
    case "aposentadoria":
      if (plan.retirement.pension.phases.length > 0 && plan.retirement.retirementAge > 0) return "preenchido";
      return "parcial";
    case "resumo":
      return "vazio";
    default:
      return "vazio";
  }
}

const STATUS_COLORS = {
  preenchido: "bg-emerald-500",
  parcial: "bg-amber-400",
  vazio: "bg-slate-300",
};

interface SidebarProps {
  planId: string;
}

export function Sidebar({ planId }: SidebarProps) {
  const pathname = usePathname();
  const { plans, activePlanId } = usePlanStore();
  const plan = plans.find((p) => p.id === planId) ?? plans.find((p) => p.id === activePlanId);

  const navItems: NavItem[] = [
    { label: "Overview", href: `/plano/${planId}/overview`, icon: LayoutDashboard, moduleKey: "overview" },
    { label: "Orçamento", href: `/plano/${planId}/orcamento`, icon: Wallet, moduleKey: "orcamento" },
    { label: "Reserva de Emergência", href: `/plano/${planId}/reserva`, icon: Shield, moduleKey: "reserva" },
    { label: "Aposentadoria", href: `/plano/${planId}/aposentadoria`, icon: PiggyBank, moduleKey: "aposentadoria" },
    { label: "Resumo", href: `/plano/${planId}/resumo`, icon: FileText, moduleKey: "resumo" },
  ];

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-500 rounded-md p-1.5">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Planejamento</span>
        </div>
      </div>

      {/* Cliente */}
      {plan && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs text-slate-400 mb-0.5">Cliente</p>
          <p className="text-sm font-medium truncate">{plan.clientName}</p>
          {plan.client.age > 0 && (
            <p className="text-xs text-slate-400">{plan.client.age} anos · {plan.client.regime}</p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          const status = plan ? getModuleStatus(plan, item.moduleKey) : "vazio";
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              <div className={cn("h-2 w-2 rounded-full shrink-0", STATUS_COLORS[status])} />
            </Link>
          );
        })}
      </nav>

      {/* Back */}
      <div className="px-2 py-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Todos os planejamentos
        </Link>
      </div>
    </aside>
  );
}
