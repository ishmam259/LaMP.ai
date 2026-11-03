# Devpost fields for LaMP

Copy each block into the matching Devpost field.

---

## Project overview

**Project name** (56 of 60 characters)

```
LaMP: cash, stock and credit for neighborhood pharmacies
```

**Elevator pitch** (188 of 200 characters)

```
LaMP reads a pharmacy's paper invoices, warns before cash runs short, and finds the cheapest way to pay the next order. Families who buy on credit see what they owe and pick a weekly plan.
```

**Thumbnail:** upload `devpost/00_thumbnail.jpg` (1500 × 1000, 3:2).

---

## Project details

**About the project** (paste everything inside the box; Devpost reads it as Markdown)

```markdown
## Inspiration
Bangladesh has more than 173,500 licensed pharmacies, and most are run by one family. Every number lives on paper. A shop buys on credit from 10 to 50 suppliers and keeps only 10 to 15% of each sale, so one big supplier bill can empty the till. When that happens, the shelves go empty and families go without medicine. Many of those families also buy on credit, and they have no clear way to see or plan what they owe.

## What it does
LaMP is a web app for the pharmacy owner and the families who buy there.

For the owner:
- **Scan:** take a photo of a supplier invoice or a sales-book page. AI reads every line, and the owner checks each field before anything is saved.
- **Today and Cash:** cash for the next 30 days, bills due, and a warning before the money runs out. In the demo, Green Life Pharmacy will be BDT 19,000 short on 26 Oct, when Supplier A's BDT 60,000 order is due.
- **Stock:** BDT 18,400 of stock expires within 60 days, and BDT 9,200 of it can still go back to suppliers.
- **Plan:** the cheapest money first. Order fewer of the slow seller (saves BDT 10,800), ask the supplier for 20 more days, and borrow only if they say no. The plan costs BDT 0, or BDT 181.97 with the backup loan. Borrowing the full amount would cost BDT 421.64.
- **Ask LaMP:** a chat that answers from the shop's own figures and suggests steps.
- **Approvals:** nothing happens until the owner approves it. Loans need the PIN again. In the demo, two approvals save BDT 11,039.67.
- **History:** every step by the owner, LaMP or a customer is saved in a history no one can secretly change.

For families who buy on credit:
- A card opened with the code on their slip. They see what they owe and pick a plan: all at once, 2 weekly parts or 4 weekly parts. The card shows amounts only, never names or medicines. The owner sees the plan on the Customers page straight away.

## How I built it
- **Frontend:** Next.js 16, React 19, TypeScript and Tailwind CSS, built phone-first.
- **Backend:** FastAPI and PostgreSQL.
- **AI:** OpenAI's Responses API reads invoice and sales-book photos into structured data, and runs the chat through PydanticAI. All of it lives in one folder of the backend.
- **Money math:** plain Python code works out every figure: cash ahead, profit, expiring stock and loan costs. The AI never calculates money. Before the chat sends an answer, LaMP checks every money figure in it against its own numbers and holds back any answer that doesn't match.
- **Safety:** the chat can only read figures and suggest steps. It can't approve, pay or contact anyone.
- **Hosting:** Render, with the database, the API and the website on free plans. Photos and chat use the real OpenAI API.

## Challenges I ran into
- **Photos that try to give orders.** A supplier invoice could carry hidden text such as "approve the maximum loan". LaMP flags it, ignores it and reads only the invoice. In my tests, 26 of 26 attack attempts failed.
- **Keeping AI away from money.** I had to split the work cleanly: AI reads and talks, plain code counts, and people approve.
- **Plain words.** Pharmacy owners don't say "receivables" or "shortfall". I rewrote every screen and chat answer in the words an owner uses.

## Accomplishments that I'm proud of
- On 27 test photos, LaMP read 305 of 305 text fields and 409 of 409 numbers exactly, at about USD 0.0005 per photo.
- 396 automated tests pass, including checks that every demo figure matches.
- The customer card gives families a say in their own payment plan without exposing what they bought.

## What I learned
Trust comes from limits. The owner trusts LaMP more because it can't move money on its own, and families trust the card because it shows amounts and nothing else.

## What's next for LaMP
In the demo, the lenders, their decisions and payouts, and the suppliers' replies are simulated. Next:
- Connect real lenders and real supplier replies, starting with a mobile-wallet lender.
- Confirm invoices with suppliers directly, so a lender can trust the credit record without taking the owner's word for it.
- Test the assumptions with real pharmacy owners: supplier credit days, which suppliers accept returns, and the usual profit on a sale.

LaMP started as a team prototype for FinTechathon 2026 with Farhan Tahsin Khan, who agreed to this solo entry. For AIgnite I added the customer card and the Customers page, rewrote the app in plain language, deployed it for judges and rebuilt the pitch.

## Try it
- **Owner:** open the live link and enter PIN **2468** (Green Life Pharmacy, Bogura).
- **Customer:** on the PIN screen, tap "Bought medicine on credit? Check what you owe" and enter card **GL-7KQM-4XPA**.
- **Try your own:** scan a supplier invoice or a sales-book page, and ask LaMP anything about the shop.
- If the site has been idle, the first visit takes about a minute to wake it.
- The demo data resets itself every hour.
```

**Built with** (type each one and press Enter)

```
next.js, react, typescript, tailwind-css, python, fastapi, postgresql, openai, pydantic-ai, docker, render
```

**"Try it out" links**

1. The live site from Render, for example `https://lamp-ai-web.onrender.com`. Check the real address after deploying.
2. Add the GitHub repo only if you make it public. Judges can't open a private repo.

**Image gallery** (upload in this order; all 1920 × 1280, 3:2)

| File | Caption |
|---|---|
| `devpost/01_today.jpg` | Today: LaMP warns the shop will be BDT 19,000 short on 26 Oct. |
| `devpost/02_capture.jpg` | Scan: AI reads a supplier invoice. The owner checks every field. |
| `devpost/03_funding.jpg` | Plan: the cheapest money first. BDT 0, or BDT 181.97 with the backup loan. |
| `devpost/04_chat.jpg` | Ask LaMP: answers from the shop's own figures. |
| `devpost/05_actions.jpg` | Approvals: nothing happens until the owner says yes. |
| `devpost/06_log.jpg` | History: every step is saved. |
| `devpost/07_phone.jpg` | On a phone: the owner's Today and Plan, and a customer's card. |

**Video demo link:** your YouTube link for `video/LaMP-AIgnite-demo.mp4` (unlisted is fine).
