# MyOwnVault (SafeLedger) 🛡️

A secure, zero-knowledge, 100% offline Personal Wealth Ledger and Credential Vault.

---

## 🔒 Critical Security & Data Privacy Architecture

- **Absolute Local-First Execution**: No remote database syncing, telemetry, or external API hooks. Fully functional 100% offline. A strict Content Security Policy (`connect-src 'none'`) enforces zero network calls at the browser runtime.
- **Zero-Knowledge Cryptography**:
  - Keys derived using WebCrypto **PBKDF2-SHA256 with exactly 600,000 iterations** and a locally generated cryptographic salt.
  - Decoupled **AES-GCM-256 Data Encryption Key (DEK)** wrapped under password and recovery slots.
  - Built-in client-side **RFC 6238 TOTP engine** for generating offline 2FA codes.
- **Memory & Clipboard Sanitation**:
  - **5-Minute Inactivity Auto-Lock**: Automatically purges cryptographic keys and plain text state from memory and resets to the login interface.
  - **30-Second Clipboard Auto-Wipe**: Copies automatically trigger a background task that overwrites the system clipboard with null data after 30 seconds.
- **Fault-Tolerance & Anti-Lockout**:
  - **BIP-39 Mnemonic**: 12-word cryptographic seed phrase for offline master key recovery.
  - **Duress Login (Decoy Profile)**: Separate alternate duress password opens a believable decoy vault with plausible dummy data.
  - **Local Rollback Snapshots**: Maintains up to 3 rolling encrypted snapshots in IndexedDB to guard against accidental overwrites.
  - **Smart Delta Merge**: Client-side backup importer highlights row conflicts using local timestamps.

---

## 💎 Features & Modules

1. **Banking Hub**: Nickname, institution, account numbers, IFSC/SWIFT/routing, credentials, transaction passwords, ATM PINs, balances, support lines, and smart portal links.
2. **Credit Portfolios**: Complete card numbers, expiry (calendar + manual input), CVVs, net banking credentials, transaction PINs, limits, balances, and payment maturity dates.
3. **Mutual Funds**: Instrument titles, folio references, asset categories (Equity/Debt/Hybrid), fractional units, average costs, NAV, auto-computed valuations, nominees, and encrypted statement blob attachments.
4. **Direct Equities**: Tickers, depository participant (NSDL/CDSL/DTCC), brokers, trading IDs, passwords, integrated TOTP secrets, volume, cost basis, and total valuations.
5. **Retirement, Pension & PF**: Portfolios (EPF, PPF, NPS, 401(k), IRA, Superannuation), UAN/PAN/SSN references, credentials, employer contributions, balances, and lock-in dates.
6. **Tangible & Fixed Assets**: Real estate, motor vehicles, fixed deposits, government bonds, registration IDs, yield at maturity, appraised valuations, and physical coordinates.
7. **Insurance & Risk Portfolios**: Policy Name, Provider (LIC, Max Life, Geico, Allianz, Star Health, etc.), Policy Number, Policy Type (Term Life, Health, Motor, Endowment/ULIP), Total Sum Assured / Coverage Amount, Premium Installment Value, Premium Due Date (Calendar + Manual), Current Cash Surrender Value (defaults to 0 for Term/Health), Primary Nominee, Support/Claims Line, Encrypted Digital Policy Attachment, Claims Portal Smart Link.
8. **Liabilities & Debt Schedules**: Aggregate borrowed principal, unpaid balances, APRs, fixed monthly installments (EMI), payment deadlines, and high-interest repayment flags.
9. **Precious Commodities**: Physical gold, silver, platinum purity designations, weight, cost basis, estimated realizable values, and vault coordinates.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
git clone <repo-url>
cd MyOwnVault
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Test Suite
Run the offline unit & cryptographic test suite:
```bash
npm test
```

### Production Build
```bash
npm run build
```
The static site bundle is created in `dist/`.

---

## 🌐 Zero-Backend Static Site Deployments (Gate 3)

Because MyOwnVault is 100% offline and stores encrypted data purely in the client's IndexedDB, it can be deployed to any zero-backend static site host.

### 1. Render (Static Site Mode)
This repository includes a pre-configured [`render.yaml`](./render.yaml):
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `./dist`
- **Zero-Backend Security Headers**: Configured with strict CSP (`connect-src 'none'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.
- To deploy: In Render, select **New + Blueprint**, connect `https://github.com/adk113/MyOwnVault`, and Render will automatically provision the static site.

### 2. GitHub Pages (Automated CI/CD)
This repository includes an automated GitHub Actions deployment workflow ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)):
1. Navigate to your repository **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Every push to `main` will automatically run tests, build the bundle, and deploy to your GitHub Pages URL!

### 3. Mobile Deployment (Expo / Capacitor)
- For native mobile biometrics (FaceID/TouchID), hook into `expo-local-authentication` and `expo-secure-store` via the pluggable biometric adapter interface in [`src/crypto/biometric.js`](./src/crypto/biometric.js).
