"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { CHAIN_ID } from "~~/app/_components/confidentialLendConfig";

function shortAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const ConnectWallet = () => {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    setMounted(true);
  }, []);

  const chainLabel = useMemo(() => {
    if (!chain) return "No network";
    if (chain.id === CHAIN_ID) return "Sepolia";
    return `Wrong network (${chain.id})`;
  }, [chain]);

  if (!mounted) {
    return <div className="h-9 w-40" aria-hidden="true" />;
  }

  return (
    <div className="flex items-center gap-3">
      {isConnected ? (
        <>
          <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            {chainLabel}
          </span>
          <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {shortAddress(address)}
          </span>
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
            onClick={() => disconnect()}
            type="button"
          >
            Disconnect
          </button>
          {chain?.id !== CHAIN_ID && (
            <button
              className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-amber-300"
              onClick={() => switchChain({ chainId: CHAIN_ID })}
              type="button"
            >
              Switch To Sepolia
            </button>
          )}
        </>
      ) : (
        <>
          {connectors.slice(0, 1).map(connector => (
            <button
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              key={connector.uid}
              onClick={() => connect({ connector })}
              type="button"
            >
              {isPending ? "Connecting..." : `Connect ${connector.name}`}
            </button>
          ))}
        </>
      )}
    </div>
  );
};
