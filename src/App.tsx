import { useEffect, useMemo, useState } from 'react';
import { Inputs, RentFreq, calculate, fmtMoney, fmtPct } from './calc';

interface Form {
  price: string;
  purchaseCosts: string;
  rent: string;
  rentFreq: RentFreq;
  vacancyWeeks: string;
  councilRates: string;
  water: string;
  insurance: string;
  strata: string;
  maintenance: string;
  pmFeePct: string;
  lettingFee: string;
  loanAmount: string;
  interestRatePct: string;
}

const DEFAULT: Form = {
  price: '650000',
  purchaseCosts: '35000',
  rent: '580',
  rentFreq: 'weekly',
  vacancyWeeks: '2',
  councilRates: '1800',
  water: '1200',
  insurance: '1500',
  strata: '0',
  maintenance: '2000',
  pmFeePct: '7',
  lettingFee: '600',
  loanAmount: '520000',
  interestRatePct: '6.2',
};

const n = (s: string) => {
  const v = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(v) ? v : 0;
};

function readInitial(): Form {
  const p = new URLSearchParams(window.location.search);
  const keys = Object.keys(DEFAULT) as (keyof Form)[];
  const out = { ...DEFAULT };
  let any = false;
  for (const k of keys) {
    const v = p.get(k);
    if (v !== null) {
      (out as Record<string, string>)[k] = v;
      any = true;
    }
  }
  if (!any) {
    try {
      const raw = localStorage.getItem('yield.form');
      if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
  }
  return out;
}

export default function App() {
  const [form, setForm] = useState<Form>(readInitial);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('yield.form', JSON.stringify(form));
    } catch {
      /* ignore */
    }
    const p = new URLSearchParams(form as unknown as Record<string, string>);
    window.history.replaceState(null, '', `?${p}`);
    setCopied(false);
  }, [form]);

  const inputs: Inputs = useMemo(
    () => ({
      price: n(form.price),
      purchaseCosts: n(form.purchaseCosts),
      rent: n(form.rent),
      rentFreq: form.rentFreq,
      vacancyWeeks: n(form.vacancyWeeks),
      councilRates: n(form.councilRates),
      water: n(form.water),
      insurance: n(form.insurance),
      strata: n(form.strata),
      maintenance: n(form.maintenance),
      pmFeePct: n(form.pmFeePct),
      lettingFee: n(form.lettingFee),
      loanAmount: n(form.loanAmount),
      interestRatePct: n(form.interestRatePct),
    }),
    [form],
  );
  const r = useMemo(() => calculate(inputs), [inputs]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Rental yield', url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* ignore */
    }
  };

  const gearingText = {
    positive: 'Positively geared — the rent covers all costs and the loan interest, with cash left over.',
    neutral: 'Roughly cash-flow neutral before tax.',
    negative: 'Negatively geared — you top it up from your own pocket. The shortfall may be partly deductible against your income.',
  }[r.gearing];

  return (
    <div className="app">
      <header className="hero">
        <h1>Rental Yield Calculator</h1>
        <p className="tagline">Work out the gross and net rental yield on an investment property, plus your weekly cash flow before tax.</p>
      </header>

      <div className="cols">
        <section className="form">
          <h2>The property</h2>
          <Money label="Property price / value" v={form.price} on={(x) => set('price', x)} />
          <Money label="Purchase costs (stamp duty, legals…)" v={form.purchaseCosts} on={(x) => set('purchaseCosts', x)} hint="0 to use price only" />
          <div className="two">
            <Money label="Rent" v={form.rent} on={(x) => set('rent', x)} />
            <Select label="per" v={form.rentFreq} on={(x) => set('rentFreq', x as RentFreq)} opts={['weekly', 'fortnightly', 'monthly', 'annually']} />
          </div>
          <Plain label="Vacancy" suffix="weeks / yr" v={form.vacancyWeeks} on={(x) => set('vacancyWeeks', x)} />

          <h2>Annual costs</h2>
          <div className="two">
            <Money label="Council rates" v={form.councilRates} on={(x) => set('councilRates', x)} />
            <Money label="Water" v={form.water} on={(x) => set('water', x)} />
          </div>
          <div className="two">
            <Money label="Insurance" v={form.insurance} on={(x) => set('insurance', x)} />
            <Money label="Strata / body corp" v={form.strata} on={(x) => set('strata', x)} />
          </div>
          <div className="two">
            <Money label="Maintenance" v={form.maintenance} on={(x) => set('maintenance', x)} />
            <Plain label="Manager fee" suffix="% of rent" v={form.pmFeePct} on={(x) => set('pmFeePct', x)} />
          </div>
          <Money label="Letting / re-letting fee (per yr)" v={form.lettingFee} on={(x) => set('lettingFee', x)} />

          <h2>Loan (optional)</h2>
          <div className="two">
            <Money label="Loan amount" v={form.loanAmount} on={(x) => set('loanAmount', x)} />
            <Plain label="Interest rate" suffix="%" v={form.interestRatePct} on={(x) => set('interestRatePct', x)} />
          </div>
          <p className="note">Interest only, for a like-for-like yield comparison. Principal repayments aren’t a “cost” — they build equity.</p>
        </section>

        <section className="result" aria-live="polite">
          <div className="yields">
            <div className="y">
              <strong>{fmtPct(r.grossYieldOnPrice)}</strong>
              <span>Gross yield (on price)</span>
            </div>
            <div className="y">
              <strong>{fmtPct(r.grossYieldOnTotal)}</strong>
              <span>Gross yield (incl. buying costs)</span>
            </div>
            <div className="y primary">
              <strong>{fmtPct(r.netYield)}</strong>
              <span>Net yield</span>
            </div>
          </div>

          <div className={`cashflow ${r.gearing}`}>
            <span>Weekly cash flow (before tax)</span>
            <strong>{fmtMoney(r.weeklyCashflow)}</strong>
            <span>{fmtMoney(r.cashflowBeforeTax)} / year</span>
          </div>
          <p className="gearing-note">{gearingText}</p>

          <table className="breakdown">
            <tbody>
              <tr><th>Rent collected (after {n(form.vacancyWeeks)} wks vacancy)</th><td>{fmtMoney(r.annualRentEffective)}</td></tr>
              {r.costBreakdown.map((c) => (
                <tr key={c.label} className="cost"><th>{c.label}</th><td>−{fmtMoney(c.amount)}</td></tr>
              ))}
              <tr className="sub"><th>Net operating income</th><td>{fmtMoney(r.netOperatingIncome)}</td></tr>
              {r.loanInterest > 0 && <tr className="cost"><th>Loan interest</th><td>−{fmtMoney(r.loanInterest)}</td></tr>}
              <tr className="total"><th>Cash flow before tax</th><td>{fmtMoney(r.cashflowBeforeTax)}</td></tr>
            </tbody>
          </table>

          <button className="share" onClick={share}>{copied ? 'Link copied ✓' : 'Share this calculation'}</button>
        </section>
      </div>

      <p className="disclaimer">
        Estimates only, before tax. Ignores depreciation deductions, capital growth, capital gains
        tax, land tax and your marginal tax rate — all of which materially change the real return.
        Not financial or tax advice.
      </p>

      <section className="explainer">
        <h2>Gross yield vs net yield</h2>
        <p>
          <strong>Gross rental yield</strong> is the annual rent divided by the property price,
          as a percentage. It’s the number quoted in listings and it ignores every cost.{' '}
          <strong>Net yield</strong> takes out council rates, insurance, strata, management fees,
          maintenance and vacancy — so it’s a truer picture of the income return before financing
          and tax.
        </p>
        <table>
          <thead><tr><th></th><th>Formula</th></tr></thead>
          <tbody>
            <tr><td>Gross yield</td><td>(weekly rent × 52) ÷ property price × 100</td></tr>
            <tr><td>Net yield</td><td>(annual rent − annual costs) ÷ (price + buying costs) × 100</td></tr>
          </tbody>
        </table>
        <h3>What’s a good rental yield in Australia?</h3>
        <p>
          Capital-city houses often sit around <strong>2.5–4% gross</strong>, units a bit higher,
          and regional or smaller properties can reach <strong>5%+</strong>. A high yield usually
          means lower expected capital growth, and vice versa — investors trade the two off.
        </p>
        <h3>FAQ</h3>
        <h4>Is a 5% rental yield good?</h4>
        <p>For an Australian capital city, a 5% gross yield is strong. In higher-growth suburbs 3% is common because buyers are paying for expected price growth rather than income.</p>
        <h4>Does yield include the mortgage?</h4>
        <p>No. Yield measures the property’s income return independent of how you finance it. Your <em>cash flow</em> depends on the loan, which is shown separately here.</p>
        <h4>What is negative gearing?</h4>
        <p>When the property’s costs (including loan interest) exceed the rent, it’s negatively geared. In Australia that annual loss can generally be offset against your other taxable income.</p>
        <footer>General information only. Speak to a licensed adviser and an accountant before investing.</footer>
      </section>
    </div>
  );
}

function Money({ label, v, on, hint }: { label: string; v: string; on: (x: string) => void; hint?: string }) {
  return (
    <label className="field">
      <span>{label}{hint && <em> · {hint}</em>}</span>
      <div className="ibox"><i>$</i><input inputMode="decimal" value={v} onChange={(e) => on(e.target.value)} /></div>
    </label>
  );
}
function Plain({ label, suffix, v, on }: { label: string; suffix: string; v: string; on: (x: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="ibox"><input inputMode="decimal" value={v} onChange={(e) => on(e.target.value)} /><i className="suf">{suffix}</i></div>
    </label>
  );
}
function Select({ label, v, on, opts }: { label: string; v: string; on: (x: string) => void; opts: string[] }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={v} onChange={(e) => on(e.target.value)}>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
    </label>
  );
}
