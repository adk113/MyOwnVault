import { emptyVault, newId } from './schema.js';

/**
 * Pre-configured decoy profile shown when the Duress Password is entered.
 * All values are obviously fictional (test card numbers, round balances) yet plausible.
 */
export function buildDecoyVault() {
  const now = Date.now();
  const mk = (o) => ({ id: newId(), createdAt: now - 86_400_000 * 40, updatedAt: now - 86_400_000 * 3, ...o });
  const in2 = new Date(Date.now() + 86_400_000 * 12).toISOString().slice(0, 10);
  const v = emptyVault();
  v.items.banking = [
    mk({ nickname: 'Everyday Savings', institution: 'HDFC Bank', accountNumber: '50100234567891', routing: 'HDFC0000123', userId: 'saver2291', password: 'Blue-Sky-4421!', balance: 48250, portalNickname: 'HDFC NetBanking', portalUrl: 'https://www.hdfcbank.com/' }),
    mk({ nickname: 'Travel Fund', institution: 'ICICI Bank', accountNumber: '000401556677', routing: 'ICIC0000004', userId: 'travel_fund', password: 'Fund#8821x', balance: 21600, portalNickname: 'ICICI iMobile', portalUrl: 'https://www.icicibank.com/' }),
  ];
  v.items.credit = [
    mk({ nickname: 'Rewards Card', institution: 'SBI Card', cardNumber: '4111111111111111', expiry: '2028-08-31', cvv: '123', creditLimit: 150000, outstanding: 8400, dueDate: in2, portalUrl: 'https://www.sbicard.com/' }),
  ];
  v.items.mutual = [
    mk({ title: 'Index Fund – Direct Growth', institution: 'UTI Mutual Fund', folio: '1234567/89', category: 'Equity', units: 420.5, avgCost: 118, nav: 142.3, valuation: 59837.15, portalUrl: 'https://www.utimf.com/' }),
  ];
  v.items.equities = [
    mk({ ticker: 'INFY', depository: 'NSDL', institution: 'Zerodha', userId: 'ZX1234', password: 'Trade-9988#', quantity: 40, avgCost: 1380, valuation: 61200, portalUrl: 'https://kite.zerodha.com/' }),
  ];
  v.items.retirement = [
    mk({ name: 'EPF', institution: "EPFO (Employees' Provident Fund)", accountRef: '100200300400', userId: '100200300400', password: 'Epf@2024ok', balance: 215000, portalUrl: 'https://unifiedportal-mem.epfindia.gov.in/memberinterface/' }),
  ];
  v.items.assets = [
    mk({ name: 'Family Car', category: 'Motor Vehicles', registrationId: 'KA01AB1234', currentValue: 420000, location: 'Home garage' }),
  ];
  v.items.liabilities = [
    mk({ title: 'Car Loan', institution: 'HDFC Bank', reference: 'CL-77821', principal: 600000, balance: 310000, apr: 9.2, emi: 11200, paymentDeadline: in2 }),
  ];
  v.items.insurance = [
    mk({ policyName: 'Term Life Shield 1Cr', provider: 'HDFC Life', policyNumber: '8877665544', policyType: 'Term Life', sumAssured: 10000000, premium: 14500, premiumDue: in2, cashSurrenderValue: 0, nominee: 'Spouse', support: '1800-266-9777', portalNickname: 'HDFC Life Portal', portalUrl: 'https://www.hdfclife.com/' }),
  ];
  v.items.commodities = [
    mk({ description: '10 g gold coin', metal: 'Gold', purity: '24K', weight: 10, weightUnit: 'Grams', costBasis: 61000, estValue: 72000, location: 'Bank locker' }),
  ];
  return v;
}
