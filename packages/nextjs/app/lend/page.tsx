import { CreditApplication } from "../_components/CreditApplication";
import { PoolStats } from "../_components/PoolStats";

export default function LendPage() {
  return (
    <div className="w-full bg-[radial-gradient(circle_at_top,_#fde68a_0%,_#f8fafc_35%,_#e2e8f0_100%)] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 rounded-3xl border border-amber-200 bg-white/70 p-6 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">BlindLend</p>
            <h1 className="mt-1 text-3xl font-black leading-tight md:text-4xl">
              Private credit scoring powered by FHE
            </h1>
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white/75 p-6 shadow-xl backdrop-blur">
          <h2 className="text-2xl font-bold">Private credit scoring powered by FHE</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Borrowers submit encrypted income, debt, and loan request. The protocol computes a score on-chain, then
            finalizes approval using verified decryption proofs.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <CreditApplication />
          <PoolStats />
        </section>

        <footer className="mt-10 pb-4 text-center text-sm text-slate-600">
          Built on Zama FHEVM - Sepolia Testnet
        </footer>
      </div>
    </div>
  );
}
