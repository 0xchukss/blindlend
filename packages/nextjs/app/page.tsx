import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,_#050505_0%,_#111111_50%,_#050505_100%)] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_22%,_rgba(250,204,21,0.28),_transparent_35%),radial-gradient(circle_at_75%_70%,_rgba(245,158,11,0.18),_transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(250,204,21,0.28)_1px,transparent_1px)] [background-size:22px_22px]" />
      <section className="relative z-10 mx-auto max-w-4xl px-8 py-14 text-center">
        <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
          your credit score is not Zero,
        </h1>
        <p className="mt-2 text-6xl font-black italic tracking-tight text-amber-300 md:text-7xl">it is your secret</p>
        <p className="mx-auto mt-8 max-w-2xl text-base text-slate-300 md:text-lg">
          BlindLend lets you prove creditworthiness privately with fully homomorphic encryption on Sepolia.
        </p>
        <Link
          className="mt-8 inline-flex items-center justify-center rounded-full bg-amber-300 px-8 py-3 text-sm font-bold text-black transition hover:bg-amber-200"
          href="/lend"
        >
          Launch App
        </Link>
      </section>
    </main>
  );
}
