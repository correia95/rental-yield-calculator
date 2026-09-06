export type RentFreq = 'weekly' | 'fortnightly' | 'monthly' | 'annually';
export const RENT_PER_YEAR: Record<RentFreq, number> = { weekly: 52, fortnightly: 26, monthly: 12, annually: 1 };

export interface Inputs {
  price: number; // property price / value
  purchaseCosts: number; // stamp duty, legals, building & pest, LMI etc. (0 to use price only)
  rent: number;
  rentFreq: RentFreq;
  vacancyWeeks: number; // per year
  // annual holding costs
  councilRates: number;
  water: number;
  insurance: number;
  strata: number; // body corporate / owners corp
  maintenance: number;
  pmFeePct: number; // property manager % of rent collected
  lettingFee: number; // one-off per year (approx)
  // finance
  loanAmount: number;
  interestRatePct: number;
}

export interface Result {
  annualRentFull: number;
  annualRentEffective: number; // after vacancy
  totalCosts: number; // excl. loan interest
  loanInterest: number;
  netOperatingIncome: number; // rent(effective) - costs (excl interest)
  cashflowBeforeTax: number; // NOI - loan interest
  grossYieldOnPrice: number; // %
  grossYieldOnTotal: number; // % incl purchase costs
  netYield: number; // % NOI / (price + purchase costs)
  weeklyCashflow: number;
  gearing: 'positive' | 'neutral' | 'negative';
  costBreakdown: { label: string; amount: number }[];
}

export function calculate(i: Inputs): Result {
  const annualRentFull = i.rent * RENT_PER_YEAR[i.rentFreq];
  const weeklyRent = annualRentFull / 52;
  const annualRentEffective = Math.max(0, annualRentFull - weeklyRent * i.vacancyWeeks);

  const pmFee = annualRentEffective * (i.pmFeePct / 100);
  const costItems: { label: string; amount: number }[] = [
    { label: 'Council rates', amount: i.councilRates },
    { label: 'Water', amount: i.water },
    { label: 'Insurance', amount: i.insurance },
    { label: 'Strata / body corporate', amount: i.strata },
    { label: 'Maintenance & repairs', amount: i.maintenance },
    { label: 'Property management fee', amount: pmFee },
    { label: 'Letting / re-letting fee', amount: i.lettingFee },
  ].filter((c) => c.amount > 0);

  const totalCosts = costItems.reduce((a, b) => a + b.amount, 0);
  const loanInterest = i.loanAmount * (i.interestRatePct / 100);

  const netOperatingIncome = annualRentEffective - totalCosts;
  const cashflowBeforeTax = netOperatingIncome - loanInterest;

  const total = i.price + i.purchaseCosts;
  const grossYieldOnPrice = i.price > 0 ? (annualRentFull / i.price) * 100 : 0;
  const grossYieldOnTotal = total > 0 ? (annualRentFull / total) * 100 : 0;
  const netYield = total > 0 ? (netOperatingIncome / total) * 100 : 0;

  const gearing = cashflowBeforeTax > 5 ? 'positive' : cashflowBeforeTax < -5 ? 'negative' : 'neutral';

  return {
    annualRentFull,
    annualRentEffective,
    totalCosts,
    loanInterest,
    netOperatingIncome,
    cashflowBeforeTax,
    grossYieldOnPrice,
    grossYieldOnTotal,
    netYield,
    weeklyCashflow: cashflowBeforeTax / 52,
    gearing,
    costBreakdown: costItems,
  };
}

export function fmtMoney(n: number, dp = 0): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function fmtPct(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}
