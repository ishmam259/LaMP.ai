/**
 * Bangla for text the server sends in English: plan steps, loan options, approvals,
 * history, cash items, wallet checks and dates. `components/bangla-dom.tsx` runs every
 * text on screen through `toBangla` while Bangla is chosen. Text with no rule stays as it is
 * (names of suppliers, lenders, customers and medicines are meant to stay in English).
 * Numbers are shown in Bangla digits too, and "BDT 19,000" becomes "৳১৯,০০০" (see `bnNumbers`). This
 * is only what the screen shows; the server and the chat keep "BDT" and English digits.
 */

const MONTHS: Record<string, string> = {
  jan: "জানু", feb: "ফেব্রু", mar: "মার্চ", apr: "এপ্রিল", may: "মে", jun: "জুন",
  jul: "জুলাই", aug: "আগস্ট", sep: "সেপ্টে", oct: "অক্টো", nov: "নভে", dec: "ডিসে",
};
const DAYS: Record<string, string> = {
  sun: "রবি", mon: "সোম", tue: "মঙ্গল", wed: "বুধ", thu: "বৃহস্পতি", fri: "শুক্র", sat: "শনি",
};

/** Month and weekday names, wherever they appear ("Fri 16 Oct", "03 DEC 26"). */
function dates(s: string): string {
  return s
    .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi, (m) => MONTHS[m.toLowerCase()])
    .replace(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/gi, (m) => DAYS[m.toLowerCase()]);
}

const EXACT: Record<string, string> = {
  // cash items
  "Shop rent": "দোকান ভাড়া",
  Salaries: "বেতন",
  "Electricity and internet": "বিদ্যুৎ ও ইন্টারনেট",
  Electricity: "বিদ্যুৎ",
  // the cash table breaks long names over two lines
  "Electricity and": "বিদ্যুৎ ও", internet: "ইন্টারনেট", Shop: "দোকান", rent: "ভাড়া", order: "অর্ডার", invoice: "বিল",
  "Daily restock exceeds receipts": "প্রতিদিনের কেনা বিক্রির চেয়ে বেশি",
  "Cash:": "নগদ:",
  "Money in and out over the next 30 days, and the cash left at the end of each day":
    "আগামী 30 দিনের আয়-ব্যয় আর প্রতিদিন শেষে হাতে থাকা নগদ",
  // history parts
  App: "অ্যাপ", "Sign-in": "সাইন-ইন", Approvals: "অনুমোদন", Loans: "ঋণ", Customer: "ক্রেতা",
  "Follow-up": "ফলো-আপ", Alert: "সতর্কতা", Sharing: "শেয়ার", Stock: "স্টক", Scan: "স্ক্যান",
  Cash: "নগদ", Rules: "নিয়ম", Wallet: "ওয়ালেট", Orders: "অর্ডার", Suppliers: "সরবরাহকারী",
  Lender: "ঋণদাতা", Chat: "চ্যাট", History: "ইতিহাস", "Bill read": "বিল পড়া হয়েছে", Order: "অর্ডার",
  // plan and explanations
  Now: "এখন", Close: "বন্ধ", "To cover": "জোগাড় করতে হবে", equals: "সমান", minus: "বিয়োগ", plus: "যোগ",
  "Your order": "আপনার অর্ডার", "Same day": "একই দিনে", Loan: "ঋণ",
  "Smaller order": "ছোট অর্ডার", "Interest saved by ordering less": "কম অর্ডারে বাঁচানো সুদ",
  "Cash buffer to keep": "হাতে রাখার নগদ", "Amount to cover": "জোগাড় করার টাকা",
  "Send expiring stock back to suppliers": "মেয়াদ ফুরানো স্টক সরবরাহকারীকে ফেরত দিন",
  "Mobile-wallet loan, 3 months": "মোবাইল-ওয়ালেট ঋণ, 3 মাস",
  "Mobile-wallet loan": "মোবাইল-ওয়ালেট ঋণ",
  "Bank small-business loan": "ব্যাংকের ক্ষুদ্র ব্যবসা ঋণ",
  "Small-business loan": "ক্ষুদ্র ব্যবসা ঋণ",
  "Take a mobile-wallet loan": "মোবাইল-ওয়ালেট ঋণ নিন",
  "Every line will sell before expiry.": "সব ওষুধ মেয়াদের আগে বিক্রি হয়ে যাবে।",
  "Already sent: the return is with the suppliers.": "পাঠানো হয়েছে: ফেরত সরবরাহকারীর কাছে আছে।",
  "No expiring stock can go back to a supplier.": "মেয়াদ ফুরানো কোনো স্টক ফেরত দেওয়া যাবে না।",
  "You qualify.": "আপনি যোগ্য।",
  "The amount is outside this product's limits.": "টাকার অঙ্ক এই ঋণের সীমার বাইরে।",
  // loan catalogue
  "Small mobile-wallet loan": "ছোট মোবাইল-ওয়ালেট ঋণ",
  "Mobile-wallet Pay Later": "মোবাইল-ওয়ালেটে পরে পরিশোধ",
  "Bank loan from the government small-business fund": "সরকারি ক্ষুদ্র ব্যবসা তহবিল থেকে ব্যাংক ঋণ",
  "Bank small-business loan, no security needed": "জামানত ছাড়া ব্যাংকের ক্ষুদ্র ব্যবসা ঋণ",
  "Microfinance business loan": "ক্ষুদ্রঋণ প্রতিষ্ঠানের ব্যবসা ঋণ",
  "Credit from an online wholesale app": "অনলাইন পাইকারি অ্যাপে বাকি",
  "Bank through a mobile wallet": "মোবাইল ওয়ালেটের মাধ্যমে ব্যাংক",
  "Commercial bank": "বাণিজ্যিক ব্যাংক",
  "Microfinance institution": "ক্ষুদ্রঋণ প্রতিষ্ঠান",
  "Online wholesale app": "অনলাইন পাইকারি অ্যাপ",
  "Your supplier may not accept wallet payments.": "আপনার সরবরাহকারী হয়তো ওয়ালেটে টাকা নেন না।",
  "Your supplier may not sell on this app; its price isn't public.":
    "আপনার সরবরাহকারী হয়তো এই অ্যাপে বিক্রি করেন না; এর দামও প্রকাশিত নয়।",
  "a trade licence": "ট্রেড লাইসেন্স",
  "a clean credit record with Bangladesh Bank": "বাংলাদেশ ব্যাংকে পরিষ্কার ঋণের রেকর্ড",
  "membership of the microfinance institution": "ক্ষুদ্রঋণ প্রতিষ্ঠানের সদস্যপদ",
  "Pays your supplier now": "এখনই আপনার সরবরাহকারীকে টাকা দেয়",
  // approvals and results
  "LaMP will put money aside each day.": "LaMP প্রতিদিন কিছু টাকা আলাদা রাখবে।",
  "Backup plan: mobile-wallet loan": "বিকল্প পরিকল্পনা: মোবাইল-ওয়ালেট ঋণ",
  "No bill matches this payment.": "এই টাকার সাথে কোনো বিল মেলে না।",
  "Marked paid, but this payment isn't in your wallet.": "শোধ লেখা আছে, কিন্তু টাকাটা ওয়ালেটে নেই।",
  "Loan money arrived in your wallet.": "ঋণের টাকা ওয়ালেটে এসেছে।",
  "Send back expiring stock that suppliers will still take": "যে মেয়াদ ফুরানো স্টক সরবরাহকারী এখনো নেবে, তা ফেরত দিন",
  // lender's page
  Applications: "আবেদন", "No applications": "কোনো আবেদন নেই",
  "Nothing yet. A pharmacy appears here after it switches on sharing in its Credit record and approves a loan application in Approvals.":
    "এখনো কিছু নেই। কোনো ফার্মেসি ক্রেডিট রেকর্ড শেয়ার চালু করে অনুমোদন পাতায় ঋণের আবেদন অনুমোদন দিলে এখানে দেখা যাবে।",
  Approved: "অনুমোদিত", Declined: "নাকচ", Waiting: "অপেক্ষায়", "Sharing stopped": "শেয়ার বন্ধ",
  Amount: "টাকা", "On-time record": "সময়মতো শোধের রেকর্ড", "Chance of not repaying": "শোধ না করার সম্ভাবনা",
  "Share of each order paid": "প্রতি অর্ডারে কত অংশ দেয়", "Latest invoices": "সাম্প্রতিক বিল",
  Invoice: "বিল", Supplier: "সরবরাহকারী", Paid: "শোধ", "On time": "সময়মতো", Late: "দেরিতে",
  Decide: "সিদ্ধান্ত দিন", "Paid out": "টাকা দেওয়া হয়েছে", "What LaMP would lend": "LaMP কত ঋণ দেবে",
  "A usual lender would lend": "সাধারণ ঋণদাতা দিত", "Won't sell before expiry": "মেয়াদের আগে বিক্রি হবে না",
  "LaMP lends at most": "LaMP সর্বোচ্চ দেয়", "Order stock that won't sell before expiry": "যে স্টক মেয়াদের আগে বিক্রি হবে না",
  "Decision recorded.": "সিদ্ধান্ত রাখা হয়েছে।", "Couldn't record the decision.": "সিদ্ধান্ত রাখা গেল না।",
  // history sentences without numbers
  "Cash for the next 30 days worked out again": "আগামী 30 দিনের নগদ আবার হিসাব হয়েছে",
  "A lender opened its inbox": "একজন ঋণদাতা তার ইনবক্স খুলেছে",
  "Owner asked LaMP a question": "মালিক LaMP-কে প্রশ্ন করেছেন",
  "Owner locked the app": "মালিক অ্যাপ লক করেছেন",
  "Owner declined a suggestion": "মালিক একটি সাজেশন নাকচ করেছেন",
  "Lender approved the application": "ঋণদাতা আবেদন অনুমোদন করেছে",
  "Lender declined the application": "ঋণদাতা আবেদন নাকচ করেছে",
  "Ignored hidden instructions in a photo": "ছবির লুকানো নির্দেশ উপেক্ষা করা হয়েছে",
  "Owner saved a scan to the accounts": "মালিক স্ক্যান হিসাবে তুলেছেন",
  "Shop figures loaded": "দোকানের হিসাব লোড হয়েছে",
  "Shop figures loaded again": "দোকানের হিসাব আবার লোড হয়েছে",
  "Owner unlocked with the PIN": "মালিক পিন দিয়ে খুলেছেন",
  "Wrong PIN at a loan approval": "ঋণ অনুমোদনে ভুল পিন",
  "Owner paused LaMP": "মালিক LaMP থামিয়েছেন",
  "Owner resumed LaMP": "মালিক LaMP আবার চালু করেছেন",
  "Wrong PIN entered": "ভুল পিন দেওয়া হয়েছে",
  "Follow-up scheduled for the plan": "পরিকল্পনার ফলো-আপ ঠিক করা হয়েছে",
  "Follow-up due: the backup step is ready": "ফলো-আপের সময়: বিকল্প ধাপ তৈরি",
  "Follow-up no longer needed": "ফলো-আপ আর দরকার নেই",
  "Follow-up held: LaMP is paused": "ফলো-আপ আটকে আছে: LaMP থামানো",
  "Refused: LaMP is paused": "নাকচ: LaMP থামানো",
  "Refused: the loan breaks the borrowing limit": "নাকচ: ঋণটি ধারের সীমা ছাড়িয়ে যায়",
  "Held back a chat answer with a figure LaMP couldn't check": "যাচাই করা যায়নি এমন অঙ্কসহ একটি চ্যাট উত্তর আটকানো হয়েছে",
  "Something went wrong; LaMP noted it": "কিছু একটা ভুল হয়েছে; LaMP লিখে রেখেছে",
  "Supplier said no to more days": "সরবরাহকারী বাড়তি সময় দেননি",
  "Supplier didn't reply": "সরবরাহকারী উত্তর দেননি",
  // kinds of steps, as history says them
  "sending stock back": "স্টক ফেরত পাঠানো", "a smaller order": "ছোট অর্ডার",
  "asking for more days": "আরও সময় চাওয়া", "a loan application": "ঋণের আবেদন",
  "putting money aside": "টাকা আলাদা রাখা",
  // screen readers and small labels
  "Document type": "কাগজের ধরন", "the supplier": "সরবরাহকারী",
};

type Rule = [RegExp, (m: RegExpMatchArray) => string];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const AMT = "((?:−|-)?BDT [\\d,]+(?:\\.\\d+)?)";
const DATE = "(\\d{1,2} [A-Z][a-z]{2}|\\d{2} [A-Z]{3}(?: \\d{2})?)";

const RULES: Rule[] = [
  // several items in one line
  [/^(.+?); (.+)$/, (m) => `${tr(m[1])}; ${tr(m[2])}`],
  [new RegExp(`^${DATE}: pay ${AMT}$`), (m) => `${m[1]}: ${m[2]} দিতে হবে`],
  [new RegExp(`^${DATE}: (.+?) ${AMT}$`), (m) => `${m[1]}: ${tr(m[2])} ${m[3]}`],
  [new RegExp(`^(.+?) ${AMT}$`), (m) => (EXACT[m[1]] || /^Supplier /.test(m[1]) ? `${tr(m[1])} ${m[2]}` : "")],
  [/^(Supplier [A-Z]) order$/, (m) => `${m[1]}-এর অর্ডার`],
  [/^(Supplier [A-Z]) invoice ?([\w-]*)$/, (m) => `${m[1]}-এর বিল${m[2] ? " " + m[2] : ""}`],
  [/^(.+) due (.+)$/, (m) => `${tr(m[1])}, শোধ ${m[2]}`],
  [/^Suppliers ([A-Z](?:, [A-Z])*(?: and [A-Z])?)$/, (m) => `Supplier ${m[1].replace(" and ", " ও ")}`],
  // plan and options
  [/^Order fewer of the slow seller from (.+)$/, (m) => `${m[1]} থেকে ধীরে বিক্রি হওয়া ওষুধ কম অর্ডার করুন`],
  [new RegExp(`^Ask (.+?) for (\\d+) more days on ${AMT}$`), (m) => `${m[3]}-এর জন্য ${m[1]}-এর কাছে আরও ${m[2]} দিন সময় চান`],
  [new RegExp(`^Ask (.+?) for (\\d+) more days to pay ${AMT}\\.$`), (m) => `${m[3]} দিতে ${m[1]}-এর কাছে আরও ${m[2]} দিন সময় চান।`],
  [/^Ask (.+?) for (\d+) more days$/, (m) => `${m[1]}-এর কাছে আরও ${m[2]} দিন সময় চান`],
  [/^Asked (.+?) for (\d+) more days$/, (m) => `${m[1]}-এর কাছে আরও ${m[2]} দিন সময় চাওয়া হয়েছে`],
  [/^Bank pays (.+?) now, you repay in (\d+) days$/, (m) => `ব্যাংক এখনই ${tr(m[1])}-কে টাকা দেয়, আপনি ${m[2]} দিনে শোধ করেন`],
  [/^If (.+?) has(?:n't| not) agreed, apply for a mobile-wallet loan\.$/, (m) => `${m[1]} রাজি না হলে মোবাইল-ওয়ালেট ঋণের আবেদন করুন।`],
  [/^If (.+?) has(?:n't| not) agreed, (.+)$/, (m) => `${m[1]} রাজি না হলে, ${tr(cap(m[2]))}`],
  [/^Cut (\S+) from (\d+) to (\d+) boxes$/, (m) => `${m[1]} ${m[2]} থেকে কমিয়ে ${m[3]} বাক্স করুন`],
  [/^Order less of (.+): cut from (\d+) to (\d+) boxes\.$/, (m) => `${m[1]} কম অর্ডার করুন: ${m[2]} থেকে ${m[3]} বাক্স।`],
  [/^Only (\d+) of (\d+) boxes will sell before expiry\.$/, (m) => `${m[2]} বাক্সের মধ্যে মাত্র ${m[1]}টি মেয়াদের আগে বিক্রি হবে।`],
  [/^Suppliers don't pay cash for returns\. They lower your next bills, so this won't help on (.+)\.$/,
    (m) => `ফেরত দিলে সরবরাহকারী নগদ দেন না, পরের বিল কমান। তাই ${m[1]}-এ এটা কাজে আসবে না।`],
  [/^The shortfall on (.+?) isn't a supplier payment, so more days from a supplier won't help\.$/,
    (m) => `${m[1]}-এর ঘাটতি সরবরাহকারীর পাওনা নয়, তাই সরবরাহকারীর কাছে বাড়তি সময় নিয়ে লাভ নেই।`],
  [/^You paid (\d+) of (\d+) (?:supplier )?invoices on time\.$/, (m) => `${m[2]}টি বিলের মধ্যে ${m[1]}টি সময়মতো দিয়েছেন।`],
  [/^Needs a supplier you know well and at least (\d+%) of invoices paid on time\.$/,
    (m) => `চেনা সরবরাহকারী আর অন্তত ${m[1]} বিল সময়মতো দেওয়ার রেকর্ড লাগবে।`],
  [new RegExp(`^Loans (?:run )?from ${AMT} to ([\\d,]+)\\.$`), (m) => `${m[1]} থেকে ${m[2]} পর্যন্ত ঋণ।`],
  [/^The bank charges ([\d.]+%) of the order for (\d+) days\.$/, (m) => `ব্যাংক ${m[2]} দিনের জন্য অর্ডারের ${m[1]} নেয়।`],
  [/^Needs at least (\d+) paid invoices on record\.$/, (m) => `অন্তত ${m[1]}টি শোধ করা বিলের রেকর্ড লাগবে।`],
  [new RegExp(`^The smallest loan is ${AMT}, and the bank wants (\\d+) months of records\\.$`),
    (m) => `সবচেয়ে ছোট ঋণ ${m[1]}, আর ব্যাংক ${m[2]} মাসের রেকর্ড চায়।`],
  [/^[Tt]akes about (\d+) days, but you need the money in (\d+)\.?$/, (m) => `প্রায় ${m[1]} দিন লাগে, কিন্তু টাকা লাগবে ${m[2]} দিনের মধ্যে।`],
  [new RegExp(`^[Mm]inimum is ${AMT}\\.?$`), (m) => `সর্বনিম্ন ${m[1]}।`],
  [new RegExp(`^[Mm]aximum is ${AMT}\\.?$`), (m) => `সর্বোচ্চ ${m[1]}।`],
  [/^(\d+)–(\d+) days$/, (m) => `${m[1]}–${m[2]} দিন`],
  [/^(\d+)–(\d+) weeks$/, (m) => `${m[1]}–${m[2]} সপ্তাহ`],
  [/^Cash at the start of (.+)$/, (m) => `${m[1]}-এর শুরুতে নগদ`],
  [/^লাগবে: (.+)।$/, (m) => `লাগবে: ${m[1].split(", ").map(tr).join(", ")}।`],
  [/^(.+?) · (.+)$/, (m) => `${tr(m[1])} · ${tr(m[2])}`],
  // approvals and results
  [/^Request sent\. Waiting for (.+)\.$/, (m) => `অনুরোধ পাঠানো হয়েছে। ${m[1]}-এর উত্তরের অপেক্ষায়।`],
  [/^Loan application sent to (.+)\.$/, (m) => `${m[1]}-এর কাছে ঋণের আবেদন পাঠানো হয়েছে।`],
  [new RegExp(`^Return sent\\. Your next bills should be ${AMT} lower\\.$`), (m) => `ফেরত পাঠানো হয়েছে। পরের বিলগুলো ${m[1]} কম হওয়ার কথা।`],
  [new RegExp(`^(Supplier [A-Z]) order is now ${AMT}\\.$`), (m) => `${m[1]}-এর অর্ডার এখন ${m[2]}।`],
  [/^The supplier (.+)\.$/, (m) => `সরবরাহকারী ${m[1] === "declined" ? "রাজি হননি" : "উত্তর দেননি"}।`],
  [/^Chance of not repaying is ([\d.]+%), (under|above) the (\d+%) limit\.$/,
    (m) => `শোধ না করার সম্ভাবনা ${m[1]}, যা ${m[3]} সীমার ${m[2] === "under" ? "নিচে" : "ওপরে"}।`],
  [/^Needed by (.+)$/, (m) => `দরকার ${m[1]}-এর মধ্যে`],
  [new RegExp(`^How ${AMT} was worked out$`), (m) => `${m[1]} কীভাবে হিসাব হলো`],
  // wallet checks
  [new RegExp(`^${AMT} to (.+?) on (.+) has no bill$`), (m) => `${m[3]}-এ ${m[2]}-কে দেওয়া ${m[1]}-এর কোনো বিল নেই`],
  [new RegExp(`^([\\w-]+) paid twice: ask (.+?) for ${AMT} back$`), (m) => `${m[1]} দুবার শোধ হয়েছে: ${m[2]}-এর কাছে ${m[3]} ফেরত চান`],
  [/^([\w-]+) is marked paid but isn't in your wallet: check with (.+)$/, (m) => `${m[1]} শোধ লেখা আছে কিন্তু ওয়ালেটে নেই: ${m[2]}-এর সাথে মিলিয়ে নিন`],
  [/^Payment for ([\w-]+)\.$/, (m) => `${m[1]}-এর টাকা।`],
  [/^([A-Z]-\d+) (on time|late)$/, (m) => `${m[1]} ${m[2] === "late" ? "দেরিতে" : "সময়মতো"}`],
  // history
  [new RegExp(`^Short ${AMT} on (.+)$`), (m) => `${m[2]}-এ ${m[1]} ঘাটতি`],
  [new RegExp(`^(\\d+) batches worth ${AMT} expire soon$`), (m) => `${m[2]} মূল্যের ${m[1]}টি ব্যাচের মেয়াদ শিগগির শেষ`],
  [/^Suggested (.+)$/, (m) => `সাজেশন: ${tr(m[1])}`],
  [/^Owner approved (.+)$/, (m) => `মালিক অনুমোদন দিয়েছেন: ${tr(m[1])}`],
  [/^Done: (.+)$/, (m) => `সম্পন্ন: ${tr(m[1])}`],
  [/^Couldn't do (.+?): (.+)$/, (m) => `করা যায়নি: ${tr(m[1])} (${m[2]})`],
  [/^Refused: (.+) already has a loan against it$/, (m) => `নাকচ: ${m[1]}-এর বিপরীতে আগেই ঋণ আছে`],
  [/^(.+) said no to more days$/, (m) => `${m[1]} বাড়তি সময় দেননি`],
  [/^(.+) agreed to more days$/, (m) => `${m[1]} বাড়তি সময় দিতে রাজি`],
  [/^(.+) didn't answer about more days$/, (m) => `${m[1]} বাড়তি সময় নিয়ে উত্তর দেননি`],
  [new RegExp(`^Order cut from ${AMT} to ${AMT}$`), (m) => `অর্ডার ${m[1]} থেকে কমে ${m[2]}`],
  [new RegExp(`^Stock worth ${AMT} sent back to suppliers$`), (m) => `${m[1]}-এর স্টক সরবরাহকারীকে ফেরত পাঠানো হয়েছে`],
  [new RegExp(`^Set aside ${AMT}$`), (m) => `${m[1]} আলাদা রাখা হয়েছে`],
  [/^Credit record shared with (.+)$/, (m) => `${m[1]}-এর সাথে ক্রেডিট রেকর্ড শেয়ার করা হয়েছে`],
  [/^Stopped sharing with (.+)$/, (m) => `${m[1]}-এর সাথে শেয়ার বন্ধ`],
  [/^Blocked: (.+) has no permission to see the credit record$/, (m) => `আটকানো হয়েছে: ${m[1]}-এর ক্রেডিট রেকর্ড দেখার অনুমতি নেই`],
  [/^(.+) marked so it can't get a second loan$/, (m) => `${m[1]}-এ দ্বিতীয় ঋণ যাতে না হয় তা চিহ্নিত`],
  [new RegExp(`^Loan application for ${AMT} sent$`), (m) => `${m[1]}-এর ঋণের আবেদন পাঠানো হয়েছে`],
  [/^Read a (supplier invoice|sales book page)$/, (m) => (m[1] === "supplier invoice" ? "সরবরাহকারীর বিল পড়া হয়েছে" : "বিক্রির খাতার পাতা পড়া হয়েছে")],
  [/^Alert: (.+)$/, (m) => `সতর্কতা: ${tr(m[1])}`],
  [new RegExp(`^(.+?) promised to pay ${AMT} in one go$`), (m) => `${m[1]} একবারে ${m[2]} দেওয়ার কথা দিয়েছেন`],
  [new RegExp(`^(.+?) promised to pay ${AMT} in (\\d+) weekly parts$`), (m) => `${m[1]} সাপ্তাহিক ${m[3]} কিস্তিতে ${m[2]} দেওয়ার কথা দিয়েছেন`],
  [new RegExp(`^${AMT} arrived in the wallet$`), (m) => `${m[1]} ওয়ালেটে এসেছে`],
  [new RegExp(`^Send back stock worth ${AMT}$`), (m) => `${m[1]}-এর স্টক ফেরত দিন`],
  [new RegExp(`^Customers have owed ${AMT} for over a month$`), (m) => `ক্রেতাদের ${m[1]} এক মাসের বেশি বাকি`],
  [new RegExp(`^Backup plan ready: ${AMT} mobile-wallet loan(.*)$`), (m) => `বিকল্প পরিকল্পনা তৈরি: ${m[1]} মোবাইল-ওয়ালেট ঋণ${m[2]}`],
  // cash chart, medicine boxes, notifications
  [/^Cash for the next 30 days\. You run short on (.+)\.$/, (m) => `আগামী 30 দিনের নগদ। ${m[1]}-এ ঘাটতি হবে।`],
  [/^Cash for the next 30 days\.(.*)$/, (m) => `আগামী 30 দিনের নগদ।${m[1]}`],
  [/^(.+), box of (\d+)$/, (m) => `${m[1]}, ${m[2]}টির বাক্স`],
  [/^Notifications (.+)$/, (m) => `নোটিফিকেশন ${m[1]}`],
];

function tr(s: string): string {
  const exact = EXACT[s];
  if (exact) return exact;
  for (const [rx, f] of RULES) {
    const m = s.match(rx);
    if (m) {
      const out = f(m);
      if (out) return out;
    }
  }
  return s;
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bnDigits = (s: string) => s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
/**
 * Numbers in Bangla digits, and "BDT 19,000" as "৳১৯,০০০". Codes keep English digits: anything
 * joined to a letter or a hyphen (GL-7KQM-4XPA, D-20931, 4G), customer numbers ("Customer 003")
 * and medicine strengths ("500 mg"), which stay as printed on the box.
 */
export function bnNumbers(text: string): string {
  return text
    .replace(/(?<![A-Za-z])BDT (?=\d)/g, "৳")
    .replace(/(?<![A-Za-z0-9-]|Customer )\d[\d,]*(?:\.\d+)?(?![\d,.]*(?:[A-Za-z]|-[A-Za-z0-9]|\s?(?:mg|mcg|ml|g)\b))/g, bnDigits);
}

/** The Bangla for one piece of screen text; spaces around it are kept. */
export function toBangla(text: string): string {
  const core = text.trim();
  if (!core) return text;
  const out = bnNumbers(/[A-Za-z]{2}/.test(core) ? dates(tr(core)) : core);
  if (out === core) return text;
  const lead = text.slice(0, text.indexOf(core));
  return lead + out + text.slice(lead.length + core.length);
}
