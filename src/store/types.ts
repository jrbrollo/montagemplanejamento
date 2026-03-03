// === ENUMS E TIPOS BASE ===

export type WorkRegime = "CLT" | "PJ" | "Concurso" | "Passiva";
export type IncomeType = "Ativa" | "Passiva";
export type ObjectivePriority = "Primordial" | "Secundário";
export type ReserveStage = 1 | 2 | 3;
export type PensionType = "VGBL" | "PGBL";
export type TaxRegime = "Regressivo" | "Progressivo";
export type PensionCombined =
  | "VGBL Regressivo"
  | "VGBL Progressivo"
  | "PGBL Regressivo"
  | "PGBL Progressivo";

// === OVERVIEW ===

export interface MarketIndicators {
  spikeDate: string;
  selic: number;
  ipca: number;
  incc: number;
  dollar: number;
  // Derivados (calculados automaticamente)
  cdi: number;
  shortMultiplier: number;
  mediumMultiplier: number;
  longMultiplier: number;
  shortRate: number;
  mediumRate: number;
  longRate: number;
  shortRateMonthly: number;
  mediumRateMonthly: number;
  longRateMonthly: number;
}

export interface Income {
  id: string;
  source: string;
  grossValue: number;
  type: IncomeType;
  notes?: string;
}

export interface Benefit {
  id: string;
  name: string;
  value: number;
  cost: number;
  description?: string;
}

export interface Objective {
  id: string;
  name: string;
  targetValue: number;
  targetYear: number;
  priority: ObjectivePriority;
  notes?: string;
}

export interface Asset {
  id: string;
  description: string;
  value: number;
}

export interface ExistingProduct {
  id: string;
  name: string;
  coverageOrValue: number;
  monthlyCost: number;
  description?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  age: number;
  regime: WorkRegime;
  hasDependents: boolean;
  hasUninsuredAssets: boolean;
  uninsuredAssetsValue?: number;
  incomes: Income[];
  benefits: Benefit[];
  objectives: Objective[];
  assets: Asset[];
  existingProducts: ExistingProduct[];
}

// === ORÇAMENTO ===

export interface BudgetLine {
  id: string;
  description: string;
  value: number;
}

export interface BudgetSide {
  incomes: BudgetLine[];
  investments: BudgetLine[];
  fixedExpenses: BudgetLine[];
  variableExpenses: BudgetLine[];
}

export interface Budget {
  current: BudgetSide;
  suggested: BudgetSide;
}

// === RESERVA DE EMERGÊNCIA ===

export interface ReserveAsset {
  id: string;
  name: string;
  liquidity: string;
  monthlyRate: number;
  value: number;
}

export interface AccumulationPhase {
  id: string;
  months: number;
  monthlyDeposit: number;
  initialDeposit: number;
}

export interface EmergencyReserve {
  stage: ReserveStage;
  baseValue: number;
  multiplier: number;
  minimumReserve: number;
  idealReserve: number;
  definedReserve: number;
  currentAssets: ReserveAsset[];
  phases: AccumulationPhase[];
  targetRate: number;
}

// === APOSENTADORIA ===

export interface RetirementPhase {
  id: string;
  years: number;
  monthlyDeposit: number;
}

export interface PensionPlan {
  realRate: number;
  type: PensionCombined;
  initialDeposit: number;
  phases: RetirementPhase[];
}

export interface OtherInvestmentsPlan {
  realRate: number;
  taxRate: number;
  initialDeposit: number;
  phases: RetirementPhase[];
}

export interface Retirement {
  startAge: number;
  retirementAge: number;
  uncertaintyMargin: number;
  pension: PensionPlan;
  otherInvestments: OtherInvestmentsPlan;
}

// === PLANO COMPLETO ===

export interface FinancialPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  client: ClientProfile;
  indicators: MarketIndicators;
  budget: Budget;
  emergencyReserve: EmergencyReserve;
  retirement: Retirement;
}
