# rental-yield-calculator

Gross and net rental yield calculator for Australian investment property. Enter the price, rent,
running costs and (optionally) the loan to get gross yield, net yield, pre-tax weekly cash flow,
a positive/negative gearing verdict, and a full cost breakdown. Shareable URL, client-side only.

**Live:** https://rental-yield-calculator.correia95.workers.dev/

## Stack

- React 18 + TypeScript + Vite, no runtime deps beyond React
- Static-assets Cloudflare Worker

## Engine

[`src/calc.ts`](src/calc.ts): gross yield = annual rent ÷ price; net yield = (effective rent −
annual costs) ÷ (price + buying costs); cash flow = NOI − interest-only loan interest.
Management fee is a % of rent actually collected (after vacancy). Verified against a worked
example ($650k / $580pw → 4.64% gross, 2.90% net, −$238/wk).

## Develop / deploy

```bash
npm install
npm run dev
npm run deploy
```
