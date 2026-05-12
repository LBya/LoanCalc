1. Fixing the Offset Fallacy (The Insights Engine)
You’ve fallen into the classic mortgage broker trap of conflating cash flow with interest minimisation. To give the user an honest assessment, your insights engine needs to separate the benefits of the offset account from the benefits of forced overpayment.
The Solution:
Decouple the Savings: Your code needs to run a shadow calculation in the background. Calculate what the loan would look like if they took out the $696k mortgage, had zero offset, but paid the $4,177 a month anyway.
The Real Insight: You will find that simply paying $4,177 a month on a $696k loan does most of the heavy lifting. The offset account is just icing on the cake.
Better Insight Phrasing: Update your JSON output to categorise this properly. Change your insight to something like: "Scenario A enforces a higher minimum repayment of $4,177. This forced cash-flow discipline, combined with your $110k offset, saves $251,593 compared to the Baseline." Don't let the offset steal the credit for the user's hard-earned cash flow.

How to Rebuild Your Calculator to Handle This
If you want your tool to actually provide value instead of pumping out vanilla bank-brochure numbers, you need to tear out the static tax logic and replace it with a dynamic engine.
Split the Income Inputs: You cannot ask for a single 'Income' figure. You must ask for salaryAtContribution and salaryAtWithdrawal.
Calculate the Entry Tax: Flat 15% on concessional contributions, or up to 30% if they trigger Division 293 (earning over $250k).
Calculate the Extraction Baseline Tax: Run standard ATO tax brackets on their salaryAtWithdrawal alone.
Calculate the Extraction Combined Tax: Run the ATO tax brackets on (salaryAtWithdrawal + FHSS Assessable Amount).
Isolate the FHSS Tax: Subtract Step 3 from Step 4. This is the gross tax triggered by the withdrawal.
Apply the 30% Offset: Subtract 30% of the FHSS Assessable Amount from the result in Step 5. If it drops below zero, floor it at zero.

For this one have an advanced tab for the FHSS otherwise assume median wage in and median wage out to calculate the standard. Also with asking for users salary we can now do some cool insights/ratios/risk weightings compared to the loan/repayments - brainstorm some of these