


## Overview
* Develop an interactive, web-based Proof of Concept (POC) financial calculator for advanced home loan scenario modeling.
* Project Type: Hobby Project / Minimum Viable Product (MVP)
* Priority: N/A
* Estimated effort: N/A
* The application will leverage highly documented frameworks to empower AI-assisted development, enabling users to visually compare 3-4 complex loan repayment strategies simultaneously.

## Requirements
1. Base Repayment Calculation Engine
   * *Why:* To compute standard principal and interest loan amortization schedules using standard formulas, serving as the baseline for comparison.
2. Adjustable Loan Lifetime Scenarios
   * *Why:* To allow users to dynamically extend or shorten the loan term and immediately see the impact on periodic repayments and total interest.
3. Dynamic Deposit & FHBSS Integration
   * *Why:* To model the impact of increased deposits and First Home Buyer Super Saver Scheme (FHBSS) contributions utilizing a generalized, worst-case tax rate assumption.
4. Split Offset Account Simulation
   * *Why:* To calculate interest savings and loan term reductions when varying amounts of funds are held in offset accounts against the principal.
5. Early & Extra Repayment Modeling
   * *Why:* To evaluate the effect of recurring or lump-sum additional payments on the overarching "time to paid off" and "total paid" metrics.
6. Side-by-Side Comparison Output (TLDR)
   * *Why:* To present a concise, multi-column summary comparing key metrics across 3 to 4 distinct user-configured scenarios simultaneously.
7. Interactive Graphical Trajectory
   * *Why:* To visually plot and map the loan balance over time for both the baseline and modeled scenarios in a single, unified view.
8. Dynamic Text Insights
   * *Why:* To automatically generate plain-text highlights emphasizing the specific monetary and time-based differences across the selected scenarios.

## Technical Requirements
* **Hosting / Infrastructure**
  * Preferable deployment via self-hosting or Render (`onrender.com`).
* **Framework / Tech Stack**
  * Utilize feature-rich, highly standardized frontend and charting libraries optimized for AI-assisted programming (e.g., extensive documentation availability).
* **Logic / Calculations**
  * FHBSS logic must default to a generalized "worst-case" tax rate.
  * FHBSS thresholds, tax rates, and regulatory rules are to be hard-coded.
  * System logic must facilitate manual code updates corresponding to yearly ATO policy changes.
* **Reference Links / Templates**
  * Visual trajectory logic inspiration: `https://figura.com.au/calculators/repayments`
  * TLDR comparison layout inspiration: `https://www.bigdream.com.au/salary-compare`
* **Assets**
  * N/A
* **Integration**
  * N/A
* **Security / Storage**
  * N/A

## Success Criteria
* Req #1 is met when the base calculator's outputs for standard monthly repayments are successfully verified against existing external tools.
* Req #2 and #5 are met when the user can input alternative loan terms or extra repayments, dynamically updating the comparative amortization schedule.
* Req #3 is met when the tool applies the generalized worst-case tax rate to FHBSS calculations, accurately adjusting the required baseline loan.
* Req #4 is met when offset inputs demonstrably reduce the calculated interest per period and visually shorten the overall loan lifecycle.
* Req #6 is met when the UI successfully outputs a side-by-side comparative table supporting a maximum of 3 to 4 scenarios.
* Req #7 is met when the application renders an interactive line graph plotting the balance curves for all active scenarios.
* Req #8 is met when the tool outputs accurate, dynamic text explicitly stating the differences in total cost or timeframe between the scenarios.

## Timeline
* TBD

## Stakeholders
* **N/A** – Role TBD

## Open Questions
* Are there specific mobile-responsiveness expectations for the side-by-side view, given that comparing 4 scenarios requires significant screen real estate?
* Will the dynamic text summaries be generated purely via deterministic mathematical statements, or should an LLM integration be considered for natural language generation?