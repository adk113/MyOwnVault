/**
 * Offline dictionary of major financial & governmental institutions -> official portal URLs.
 * Bundled in the app; never fetched. URLs are the institutions' primary public sites/login
 * gateways – edit any auto-filled link if your institution uses a different entry point.
 *
 * Tuple: [name, url, kinds, ...aliases]
 * kinds: b=bank c=card issuer k=broker m=mutual fund/AMC r=retirement/gov l=lender i=insurer/depository
 */
const RAW = [
  // ── India · banks ─────────────────────────────────────────────
  ['State Bank of India', 'https://www.onlinesbi.sbi/', 'bcl', 'SBI', 'SBI Bank'],
  ['HDFC Bank', 'https://www.hdfcbank.com/', 'bcl', 'HDFC'],
  ['ICICI Bank', 'https://www.icicibank.com/', 'bcl', 'ICICI'],
  ['Axis Bank', 'https://www.axisbank.com/', 'bcl', 'Axis'],
  ['Kotak Mahindra Bank', 'https://www.kotak.com/', 'bcl', 'Kotak', 'Kotak Bank'],
  ['Punjab National Bank', 'https://www.pnbindia.in/', 'bl', 'PNB'],
  ['Bank of Baroda', 'https://www.bankofbaroda.in/', 'bcl', 'BoB', 'BOB'],
  ['Canara Bank', 'https://canarabank.com/', 'bcl'],
  ['Union Bank of India', 'https://www.unionbankofindia.co.in/', 'bl', 'Union Bank'],
  ['Bank of India', 'https://bankofindia.co.in/', 'bl', 'BOI'],
  ['Indian Bank', 'https://www.indianbank.in/', 'bl'],
  ['IDFC FIRST Bank', 'https://www.idfcfirstbank.com/', 'bcl', 'IDFC', 'IDFC First'],
  ['Yes Bank', 'https://www.yesbank.in/', 'bcl'],
  ['IndusInd Bank', 'https://www.indusind.com/', 'bcl', 'Indusind'],
  ['Federal Bank', 'https://www.federalbank.co.in/', 'bcl'],
  ['RBL Bank', 'https://www.rblbank.com/', 'bcl', 'RBL'],
  ['Standard Chartered India', 'https://www.sc.com/in/', 'bcl', 'Standard Chartered', 'StanChart'],
  ['India Post Payments Bank', 'https://www.ippbonline.com/', 'b', 'IPPB'],
  ['India Post (Post Office Savings)', 'https://www.indiapost.gov.in/', 'br', 'Post Office', 'India Post'],
  ['SBI Card', 'https://www.sbicard.com/', 'c', 'SBI Cards'],
  ['American Express India', 'https://www.americanexpress.com/in/', 'c', 'Amex India'],
  ['Bajaj Finserv', 'https://www.bajajfinserv.in/', 'cl', 'Bajaj Finance'],
  ['Tata Capital', 'https://www.tatacapital.com/', 'l'],
  ['LIC Housing Finance', 'https://www.lichousing.com/', 'l', 'LICHFL'],
  // ── India · brokers & depositories ────────────────────────────
  ['Zerodha', 'https://kite.zerodha.com/', 'k', 'Kite'],
  ['Groww', 'https://groww.in/', 'km'],
  ['Upstox', 'https://upstox.com/', 'k'],
  ['Angel One', 'https://www.angelone.in/', 'k', 'Angel Broking'],
  ['ICICI Direct', 'https://www.icicidirect.com/', 'k', 'ICICI Securities'],
  ['HDFC Securities', 'https://www.hdfcsec.com/', 'k', 'HDFC Sec'],
  ['Kotak Securities', 'https://www.kotaksecurities.com/', 'k'],
  ['5paisa', 'https://www.5paisa.com/', 'k', 'Five Paisa'],
  ['Motilal Oswal', 'https://www.motilaloswal.com/', 'k'],
  ['Sharekhan', 'https://www.sharekhan.com/', 'k'],
  ['Paytm Money', 'https://www.paytmmoney.com/', 'km'],
  ['Dhan', 'https://dhan.co/', 'k'],
  ['Fyers', 'https://fyers.in/', 'k'],
  ['SBI Securities', 'https://www.sbisecurities.in/', 'k'],
  ['Axis Direct', 'https://simplehai.axisdirect.in/', 'k'],
  ['NSDL', 'https://nsdl.co.in/', 'i', 'National Securities Depository'],
  ['CDSL', 'https://www.cdslindia.com/', 'i', 'Central Depository Services'],
  // ── India · AMCs & registrars ─────────────────────────────────
  ['SBI Mutual Fund', 'https://www.sbimf.com/', 'm', 'SBI MF'],
  ['HDFC Mutual Fund', 'https://www.hdfcfund.com/', 'm', 'HDFC MF', 'HDFC AMC'],
  ['ICICI Prudential Mutual Fund', 'https://www.icicipruamc.com/', 'm', 'ICICI Pru MF', 'ICICI Prudential AMC'],
  ['Axis Mutual Fund', 'https://www.axismf.com/', 'm', 'Axis MF'],
  ['Nippon India Mutual Fund', 'https://mf.nipponindiaim.com/', 'm', 'Nippon India', 'Reliance Mutual Fund'],
  ['Kotak Mutual Fund', 'https://www.kotakmf.com/', 'm', 'Kotak MF'],
  ['Aditya Birla Sun Life Mutual Fund', 'https://mutualfund.adityabirlacapital.com/', 'm', 'ABSL', 'Birla Sun Life'],
  ['UTI Mutual Fund', 'https://www.utimf.com/', 'm', 'UTI'],
  ['DSP Mutual Fund', 'https://www.dspim.com/', 'm', 'DSP'],
  ['Mirae Asset Mutual Fund', 'https://www.miraeassetmf.co.in/', 'm', 'Mirae Asset'],
  ['Franklin Templeton India', 'https://www.franklintempletonindia.com/', 'm', 'Franklin Templeton'],
  ['Tata Mutual Fund', 'https://www.tatamutualfund.com/', 'm', 'Tata MF'],
  ['PPFAS Mutual Fund', 'https://amc.ppfas.com/', 'm', 'Parag Parikh', 'Parag Parikh Flexi Cap'],
  ['Quant Mutual Fund', 'https://quantmutual.com/', 'm'],
  ['Motilal Oswal Mutual Fund', 'https://www.motilaloswalmf.com/', 'm'],
  ['CAMS', 'https://www.camsonline.com/', 'm', 'Computer Age Management Services'],
  ['KFintech', 'https://mfs.kfintech.com/', 'm', 'Karvy', 'KFin Technologies'],
  ['MF Central', 'https://www.mfcentral.com/', 'm'],
  // ── India · retirement, tax, insurers ─────────────────────────
  ['EPFO (Employees\' Provident Fund)', 'https://unifiedportal-mem.epfindia.gov.in/memberinterface/', 'r', 'EPF', 'EPFO', 'PF', 'Provident Fund', 'UAN'],
  ['NPS (Protean CRA)', 'https://cra-nsdl.com/CRA/', 'r', 'NPS', 'National Pension System', 'Protean'],
  ['NPS (KFintech CRA)', 'https://npscra.kfintech.com/', 'r', 'NPS KFintech'],
  ['NPS Trust', 'https://www.npstrust.org.in/', 'r'],
  ['PPF (via India Post / Banks)', 'https://www.indiapost.gov.in/', 'r', 'PPF', 'Public Provident Fund'],
  ['Income Tax India', 'https://www.incometax.gov.in/', 'r', 'Income Tax Department', 'ITR'],
  ['Life Insurance Corporation of India', 'https://licindia.in/', 'ri', 'LIC'],
  ['HDFC Life', 'https://www.hdfclife.com/', 'ri'],
  ['ICICI Prudential Life Insurance', 'https://www.iciciprulife.com/', 'ri', 'ICICI Pru Life'],
  ['SBI Life Insurance', 'https://www.sbilife.co.in/', 'ri', 'SBI Life'],
  ['Max Life Insurance', 'https://www.maxlifeinsurance.com/', 'ri', 'Max Life'],
  ['Star Health Insurance', 'https://www.starhealth.in/', 'ri', 'Star Health'],
  ['Care Health Insurance', 'https://www.careinsurance.com/', 'ri', 'Religare Health'],
  ['Bajaj Allianz Life Insurance', 'https://www.bajajallianzlife.com/', 'ri', 'Bajaj Allianz'],
  ['Tata AIA Life Insurance', 'https://www.tataaia.com/', 'ri', 'Tata AIA'],
  ['Allianz', 'https://www.allianz.com/', 'ri', 'Allianz SE'],
  ['Geico', 'https://www.geico.com/', 'ri', 'GEICO'],
  ['Progressive', 'https://www.progressive.com/', 'ri'],
  ['State Farm', 'https://www.statefarm.com/', 'ri'],
  ['Prudential Financial', 'https://www.prudential.com/', 'ri', 'Prudential'],
  // ── United States ─────────────────────────────────────────────
  ['Chase', 'https://www.chase.com/', 'bcl', 'JPMorgan Chase', 'JP Morgan Chase'],
  ['Bank of America', 'https://www.bankofamerica.com/', 'bcl', 'BofA', 'BoA'],
  ['Wells Fargo', 'https://www.wellsfargo.com/', 'bcl'],
  ['Citibank', 'https://www.citi.com/', 'bcl', 'Citi'],
  ['Capital One', 'https://www.capitalone.com/', 'bcl'],
  ['U.S. Bank', 'https://www.usbank.com/', 'bcl', 'US Bank'],
  ['PNC Bank', 'https://www.pnc.com/', 'bl', 'PNC'],
  ['TD Bank', 'https://www.td.com/us/en/personal-banking', 'bl', 'TD'],
  ['Ally Bank', 'https://www.ally.com/', 'bl', 'Ally'],
  ['Discover', 'https://www.discover.com/', 'bc', 'Discover Bank'],
  ['American Express', 'https://www.americanexpress.com/', 'c', 'Amex'],
  ['Synchrony Bank', 'https://www.synchrony.com/', 'bc', 'Synchrony'],
  ['Barclays US', 'https://www.barclaysus.com/', 'bc'],
  ['Navy Federal Credit Union', 'https://www.navyfederal.org/', 'bcl', 'Navy Federal'],
  ['USAA', 'https://www.usaa.com/', 'bcl'],
  ['Charles Schwab', 'https://www.schwab.com/', 'kmr', 'Schwab'],
  ['Fidelity Investments', 'https://www.fidelity.com/', 'kmr', 'Fidelity', 'Fidelity NetBenefits'],
  ['Vanguard', 'https://investor.vanguard.com/', 'kmr'],
  ['E*TRADE', 'https://us.etrade.com/', 'k', 'ETrade', 'E-Trade'],
  ['Robinhood', 'https://robinhood.com/', 'k'],
  ['Interactive Brokers', 'https://www.interactivebrokers.com/', 'k', 'IBKR'],
  ['Merrill Edge', 'https://www.merrilledge.com/', 'k', 'Merrill Lynch'],
  ['T. Rowe Price', 'https://www.troweprice.com/', 'mr', 'T Rowe Price'],
  ['BlackRock', 'https://www.blackrock.com/', 'm', 'iShares'],
  ['Empower', 'https://www.empower.com/', 'r', 'Empower Retirement'],
  ['Principal Financial', 'https://www.principal.com/', 'r', 'Principal'],
  ['DTCC', 'https://www.dtcc.com/', 'i', 'Depository Trust & Clearing Corporation'],
  ['Social Security Administration', 'https://www.ssa.gov/', 'r', 'SSA', 'Social Security', 'mySSA'],
  ['Internal Revenue Service', 'https://www.irs.gov/', 'r', 'IRS'],
  ['Federal Student Aid', 'https://studentaid.gov/', 'l', 'Student Loans', 'FAFSA'],
  ['Nelnet', 'https://www.nelnet.com/', 'l'],
  ['Sallie Mae', 'https://www.salliemae.com/', 'l'],
  ['SoFi', 'https://www.sofi.com/', 'bkl'],
  ['Rocket Mortgage', 'https://www.rocketmortgage.com/', 'l', 'Quicken Loans'],
  ['Mr. Cooper', 'https://www.mrcooper.com/', 'l'],
  // ── United Kingdom & global ───────────────────────────────────
  ['HSBC', 'https://www.hsbc.com/', 'bcl'],
  ['Barclays', 'https://www.barclays.co.uk/', 'bcl', 'Barclays UK'],
  ['Lloyds Bank', 'https://www.lloydsbank.com/', 'bcl', 'Lloyds'],
  ['NatWest', 'https://www.natwest.com/', 'bcl'],
  ['Santander UK', 'https://www.santander.co.uk/', 'bcl', 'Santander'],
  ['Monzo', 'https://monzo.com/', 'b'],
  ['Revolut', 'https://www.revolut.com/', 'bc'],
  ['Hargreaves Lansdown', 'https://www.hl.co.uk/', 'k', 'HL'],
  ['NS&I', 'https://www.nsandi.com/', 'br', 'National Savings and Investments'],
  ['NEST Pensions', 'https://www.nestpensions.org.uk/', 'r', 'NEST'],
  ['HM Revenue & Customs', 'https://www.gov.uk/government/organisations/hm-revenue-customs', 'r', 'HMRC'],
];

export const INSTITUTIONS = RAW.map(([name, url, kinds, ...aliases]) => ({ name, url, kinds, aliases }));

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const INDEX = INSTITUTIONS.map((i) => ({
  ...i,
  keys: [i.name, ...i.aliases].map(norm),
}));

/** Exact (case/punctuation-insensitive) name or alias match -> institution or null. */
export function matchInstitution(text) {
  const q = norm(text || '');
  if (!q) return null;
  return INDEX.find((i) => i.keys.includes(q)) || null;
}

/** Ranked suggestions for a partially typed name. `kind` boosts relevant institutions. */
export function searchInstitutions(text, kind, limit = 6) {
  const q = norm(text || '');
  if (!q) return [];
  const scored = [];
  for (const i of INDEX) {
    let best = 0;
    for (const k of i.keys) {
      if (k === q) best = Math.max(best, 100);
      else if (k.startsWith(q)) best = Math.max(best, 70);
      else if (k.split(' ').some((w) => w.startsWith(q))) best = Math.max(best, 50);
      else if (k.includes(q)) best = Math.max(best, 30);
    }
    if (best) scored.push({ i, s: best + (kind && i.kinds.includes(kind) ? 15 : 0) });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.i);
}
