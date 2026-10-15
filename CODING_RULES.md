# Admin Portal: Dedicated Coding & Architectural Rules

Location: `/root/cricket/admin`
Tech Stack: React 18, TypeScript, Vite, Material-UI (MUI), SWC, Serve

---

## 1. Architectural & Development Standards
1. **Reporting & Presentation Layer**:
   - The Admin portal is a dashboard and management UI. It displays reports, live odds, bets, and ledger balances.
   - It must NOT perform authoritative accounting or settlement calculations. Consume backend endpoints (`clientSummaries`, `/api/v1/match-bets/...`).
2. **Consolidated Financial Utilities**:
   - Commission and share calculations must be imported strictly from `src/utils/commissionUtils.ts`.
   - Do NOT duplicate commission math or create parallel utility scripts like `calculateMatchSummary.ts`.
3. **Type Safety & Zero-Warning Builds**:
   - Every API model and WebSocket event must have defined TypeScript interfaces.
   - Prohibit unvalidated `any` casts in ledger and match reporting tables.
4. **WebSocket Lifecycle & Resource Management**:
   - Join match rooms (`match:join`) on mount; leave rooms (`match:leave`) on unmount.
   - Debounce incoming high-frequency socket events to avoid UI freezes.

---

## 2. Docker & Deployment Rules
- NO host `node`, `npm`, `yarn`, `npx`.
- Development and builds run inside container `cricket_admin`.
- Production uses `serve -s dist -l 3030 --single` for React Router SPA deep linking without 404s.
