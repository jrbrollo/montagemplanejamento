import type {
  MarketIndicators,
  ClientProfile,
  EmergencyReserve,
  Retirement,
  Budget,
  WorkRegime,
  PensionCombined,
  ReserveStage,
} from "@/store/types";
import { deriveRates } from "@/lib/engine/rates";
import { nanoid } from "nanoid";

export const DEFAULT_INDICATORS: MarketIndicators = (() => {
  const selic = 0.105;
  const shortMult = 1.05;
  const mediumMult = 1.3;
  const longMult = 1.5;
  const derived = deriveRates(selic, shortMult, mediumMult, longMult);
  return {
    spikeDate: new Date().toISOString().split("T")[0],
    selic,
    ipca: 0.045,
    incc: 0.05,
    dollar: 5.4,
    shortMultiplier: shortMult,
    mediumMultiplier: mediumMult,
    longMultiplier: longMult,
    ...derived,
  };
})();

export const DEFAULT_CLIENT: Omit<ClientProfile, "id"> = {
  name: "",
  age: 30,
  regime: "CLT" as WorkRegime,
  hasDependents: false,
  hasUninsuredAssets: false,
  incomes: [],
  benefits: [],
  objectives: [],
  assets: [],
  existingProducts: [],
};

export const DEFAULT_BUDGET: Budget = {
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
};

export const DEFAULT_EMERGENCY_RESERVE: EmergencyReserve = {
  stage: 3 as ReserveStage,
  baseValue: 0,
  multiplier: 3,
  minimumReserve: 0,
  idealReserve: 0,
  definedReserve: 0,
  currentAssets: [],
  phases: [
    {
      id: nanoid(),
      months: 12,
      monthlyDeposit: 500,
      initialDeposit: 0,
    },
  ],
  targetRate: 0, // will be set from indicators.shortRateMonthly
};

export const DEFAULT_RETIREMENT: Retirement = {
  startAge: 30,
  retirementAge: 55,
  uncertaintyMargin: 0.02,
  pension: {
    realRate: 0.08,
    type: "VGBL Regressivo" as PensionCombined,
    initialDeposit: 0,
    phases: [{ id: nanoid(), years: 10, monthlyDeposit: 200 }],
  },
  otherInvestments: {
    realRate: 0.08,
    taxRate: 0.15,
    initialDeposit: 0,
    phases: [{ id: nanoid(), years: 10, monthlyDeposit: 100 }],
  },
};
