---
title: "LoanCalc"
description: "Interactive Australian home loan scenario comparison tool with real financial modeling"
hero: "See the True Cost of Your Home Loan Before You Sign"
tldr: "Compare up to 4 loan repayment strategies side-by-side with offset accounts, FHSS, stamp duty, LMI, and APRA stress testing — all running client-side with zero data leaving your browser."
narrative: |
  Buying a home is the biggest financial decision most Australians will make, yet the tools available to understand loan options are frustratingly simplistic. Online mortgage calculators give you a single monthly repayment number and stop there. They don't show how an offset account changes your trajectory over 30 years. They don't model the First Home Super Saver Scheme with actual ATO tax brackets. They don't warn you when your debt-to-income ratio crosses into dangerous territory. And they certainly don't let you compare multiple strategies side-by-side to find the one that saves you tens of thousands of dollars.

  LoanCalc is a client-side React SPA that puts a full financial reality engine in your browser. Start by entering a property price, deposit, interest rate, and loan term. Add up to 4 scenarios — maybe one with an offset account, one with extra repayments, one using FHSS for a couple. The engine runs a month-by-month amortization for each, applying offset balances (static or growing), extra repayments, stamp duty by state, LMI calculations, and full FHSS tax decomposition using ATO marginal brackets.

  The comparison table surfaces everything that matters: repayments, total interest, loan term, interest saved, and time saved versus baseline. Expand into advanced metrics like effective rate, interest-free months, and offset efficiency per dollar. The affordability panel calculates debt-to-income ratio, repayment stress as a percentage of take-home pay, years of salary consumed by interest, and an overall risk rating — because knowing you can technically afford the repayments isn't the same as knowing you should take the loan.

  Under the hood, the calculation engine is a set of pure JavaScript functions with zero dependencies and zero side effects. Every module — amortization, offset, extra repayments, FHSS, stamp duty, LMI, tax brackets, shadow decomposition — is independently testable. The engine is fully decoupled from the React UI, orchestrated through a single useCalculator hook that memoizes the entire pipeline. Built with Vite, Tailwind CSS 4, and Recharts, deployed as a static SPA on Render. No backend, no accounts, no tracking. Your numbers stay in your browser.
features:
  - "Side-by-side comparison of up to 4 loan scenarios with live calculations"
  - "Offset account simulation with static balances, monthly growth, and annual percentage growth"
  - "First Home Super Saver (FHSS) modeling with full ATO tax bracket decomposition"
  - "Stamp duty calculator with state-based FHB exemptions (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)"
  - "Lenders Mortgage Insurance (LMI) calculation based on loan-to-value ratio"
  - "Affordability metrics: debt-to-income ratio, repayment stress, risk rating"
  - "APRA stress test showing repayment impact at +2% and +3% rate buffers"
  - "Honest offset decomposition isolating true offset benefit via shadow amortization"
  - "Multi-applicant support for couples with per-person FHSS and salary inputs"
  - "Balance trajectory chart with offset overlays and scenario visibility toggles"
  - "Dynamic text insights comparing scenarios with plain-English trade-off analysis"
  - "Monthly, fortnightly, and weekly repayment frequency views"
  - "Calculation popovers explaining every metric with formulas and ATO references"
  - "Dark/light theme with system preference detection"
  - "Export log to clipboard for sharing scenarios with brokers or partners"
  - "Pure JS calculation engine — fully decoupled from UI, independently testable"
  - "Zero backend — all computation runs client-side, no data leaves the browser"
techStack:
  - "React 18"
  - "Vite 6"
  - "Recharts"
  - "Tailwind CSS 4"
  - "Vitest"
  - "Pure JavaScript (ES2022+)"
  - "Render (Static SPA)"
links:
  live: "https://loancalc.lachlan-byatt.workers.dev"
author: "locky"
publishDate: "2025-05-13"
featured: true
extensions: {}
---
