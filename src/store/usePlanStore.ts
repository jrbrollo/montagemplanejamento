"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  FinancialPlan,
  ClientProfile,
  MarketIndicators,
  Budget,
  EmergencyReserve,
  Retirement,
} from "./types";
import {
  DEFAULT_INDICATORS,
  DEFAULT_CLIENT,
  DEFAULT_BUDGET,
  DEFAULT_EMERGENCY_RESERVE,
  DEFAULT_RETIREMENT,
} from "@/data/defaults";
import { deriveRates } from "@/lib/engine/rates";
import { calculateMultiplier, calculateBaseValue } from "@/lib/engine/emergency";

function createDefaultPlan(clientName: string): FinancialPlan {
  const id = nanoid();
  const now = new Date().toISOString();
  const clientId = nanoid();

  return {
    id,
    createdAt: now,
    updatedAt: now,
    clientName,
    client: {
      ...DEFAULT_CLIENT,
      id: clientId,
      name: clientName,
    },
    indicators: { ...DEFAULT_INDICATORS },
    budget: {
      current: {
        incomes: [],
        investments: [],
        fixedExpenses: [],
        variableExpenses: [],
      },
      suggested: {
        incomes: [],
        investments: [],
        fixedExpenses: [],
        variableExpenses: [],
      },
    },
    emergencyReserve: {
      ...DEFAULT_EMERGENCY_RESERVE,
      targetRate: DEFAULT_INDICATORS.shortRateMonthly,
    },
    retirement: {
      ...DEFAULT_RETIREMENT,
      startAge: DEFAULT_CLIENT.age,
    },
  };
}

/** Recalcula campos derivados da reserva de emergência */
function recalcReserve(plan: FinancialPlan): EmergencyReserve {
  const { client, emergencyReserve, budget } = plan;
  const multiplier = calculateMultiplier(client.age, client.regime, client.hasDependents);
  const baseValue = calculateBaseValue(emergencyReserve.stage, budget.current);
  return {
    ...emergencyReserve,
    multiplier,
    baseValue,
    minimumReserve: baseValue * 3,
    idealReserve: baseValue * multiplier,
    definedReserve: baseValue * 7.5,
  };
}

interface PlanStore {
  plans: FinancialPlan[];
  activePlanId: string | null;

  // Getters
  getActivePlan: () => FinancialPlan | null;
  getTotalMonthlyInvestment: () => number;

  // Ações de plano
  createPlan: (clientName: string) => string;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string) => void;

  // Updates por módulo
  updateClient: (data: Partial<ClientProfile>) => void;
  updateIndicators: (data: Partial<MarketIndicators>) => void;
  updateBudget: (data: Partial<Budget>) => void;
  updateEmergencyReserve: (data: Partial<EmergencyReserve>) => void;
  updateRetirement: (data: Partial<Retirement>) => void;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      plans: [],
      activePlanId: null,

      getActivePlan: () => {
        const { plans, activePlanId } = get();
        return plans.find((p) => p.id === activePlanId) ?? null;
      },

      getTotalMonthlyInvestment: () => {
        const plan = get().getActivePlan();
        if (!plan) return 0;
        const reservePhase = plan.emergencyReserve.phases[0];
        const reserveMonthly = reservePhase?.monthlyDeposit ?? 0;
        const pensionMonthly = plan.retirement.pension.phases.reduce(
          (sum, p) => sum + p.monthlyDeposit,
          0
        );
        const otherMonthly = plan.retirement.otherInvestments.phases.reduce(
          (sum, p) => sum + p.monthlyDeposit,
          0
        );
        return reserveMonthly + pensionMonthly + otherMonthly;
      },

      createPlan: (clientName: string) => {
        const plan = createDefaultPlan(clientName);
        set((state) => ({
          plans: [...state.plans, plan],
          activePlanId: plan.id,
        }));
        return plan.id;
      },

      deletePlan: (id: string) => {
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== id),
          activePlanId: state.activePlanId === id ? null : state.activePlanId,
        }));
      },

      setActivePlan: (id: string) => {
        set({ activePlanId: id });
      },

      updateClient: (data: Partial<ClientProfile>) => {
        set((state) => {
          const plans = state.plans.map((plan) => {
            if (plan.id !== state.activePlanId) return plan;
            const updatedPlan = {
              ...plan,
              client: { ...plan.client, ...data },
              updatedAt: new Date().toISOString(),
            };
            return {
              ...updatedPlan,
              clientName: data.name ?? updatedPlan.clientName,
              emergencyReserve: recalcReserve(updatedPlan),
            };
          });
          return { plans };
        });
      },

      updateIndicators: (data: Partial<MarketIndicators>) => {
        set((state) => {
          const plans = state.plans.map((plan) => {
            if (plan.id !== state.activePlanId) return plan;

            const merged = { ...plan.indicators, ...data };

            // Recalcula taxas derivadas se selic ou multiplicadores mudarem
            const derived = deriveRates(
              merged.selic,
              merged.shortMultiplier,
              merged.mediumMultiplier,
              merged.longMultiplier
            );

            const updatedIndicators = { ...merged, ...derived };

            return {
              ...plan,
              indicators: updatedIndicators,
              emergencyReserve: {
                ...plan.emergencyReserve,
                targetRate: updatedIndicators.shortRateMonthly,
              },
              updatedAt: new Date().toISOString(),
            };
          });
          return { plans };
        });
      },

      updateBudget: (data: Partial<Budget>) => {
        set((state) => {
          const plans = state.plans.map((plan) => {
            if (plan.id !== state.activePlanId) return plan;
            const updatedPlan = {
              ...plan,
              budget: { ...plan.budget, ...data },
              updatedAt: new Date().toISOString(),
            };
            return {
              ...updatedPlan,
              emergencyReserve: recalcReserve(updatedPlan),
            };
          });
          return { plans };
        });
      },

      updateEmergencyReserve: (data: Partial<EmergencyReserve>) => {
        set((state) => {
          const plans = state.plans.map((plan) => {
            if (plan.id !== state.activePlanId) return plan;
            const updatedPlan = {
              ...plan,
              emergencyReserve: { ...plan.emergencyReserve, ...data },
              updatedAt: new Date().toISOString(),
            };
            // Recalcula campos derivados
            return {
              ...updatedPlan,
              emergencyReserve: recalcReserve(updatedPlan),
            };
          });
          return { plans };
        });
      },

      updateRetirement: (data: Partial<Retirement>) => {
        set((state) => {
          const plans = state.plans.map((plan) => {
            if (plan.id !== state.activePlanId) return plan;
            return {
              ...plan,
              retirement: { ...plan.retirement, ...data },
              updatedAt: new Date().toISOString(),
            };
          });
          return { plans };
        });
      },
    }),
    {
      name: "brauna-planner-data",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
