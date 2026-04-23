"use client";

import { useEffect } from "react";
import { useAccount, useBlockNumber, useReadContract } from "wagmi";
import { CHAIN_ID, CONTRACT_ADDRESS, confidentialLendAbi } from "~~/app/_components/confidentialLendConfig";

export const PoolStats = () => {
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ chainId: CHAIN_ID, watch: true });

  const { data: liquidity, refetch: refetchLiquidity } = useReadContract({
    address: CONTRACT_ADDRESS ? (CONTRACT_ADDRESS as `0x${string}`) : undefined,
    abi: confidentialLendAbi,
    functionName: "totalPoolLiquidity",
    args: [],
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  const { data: approved, refetch: refetchApproved } = useReadContract({
    address: CONTRACT_ADDRESS ? (CONTRACT_ADDRESS as `0x${string}`) : undefined,
    abi: confidentialLendAbi,
    functionName: "loanApproved",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(CONTRACT_ADDRESS && address) },
  });

  const { data: claimed, refetch: refetchClaimed } = useReadContract({
    address: CONTRACT_ADDRESS ? (CONTRACT_ADDRESS as `0x${string}`) : undefined,
    abi: confidentialLendAbi,
    functionName: "loanClaimed",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(CONTRACT_ADDRESS && address) },
  });

  useEffect(() => {
    if (!blockNumber) return;
    void refetchLiquidity();
    void refetchApproved();
    void refetchClaimed();
  }, [blockNumber, refetchLiquidity, refetchApproved, refetchClaimed]);

  useEffect(() => {
    const refresh = () => {
      void refetchLiquidity();
      void refetchApproved();
      void refetchClaimed();
    };
    window.addEventListener("blindlend:state-updated", refresh);
    return () => window.removeEventListener("blindlend:state-updated", refresh);
  }, [refetchLiquidity, refetchApproved, refetchClaimed]);

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
      <h2 className="text-xl font-bold text-slate-900">Pool Stats</h2>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Total Pool Liquidity</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900">
          {typeof liquidity === "bigint" ? liquidity.toString() : "-"}
        </p>
      </div>

      <table className="mt-4 w-full overflow-hidden rounded-2xl border border-slate-200 text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Wallet</th>
            <th className="px-3 py-2 text-left font-semibold">Loan Approved</th>
            <th className="px-3 py-2 text-left font-semibold">Loan Claimed</th>
          </tr>
        </thead>
        <tbody className="bg-white text-slate-700">
          <tr>
            <td className="px-3 py-2">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "-"}</td>
            <td className="px-3 py-2">{typeof approved === "boolean" ? (approved ? "Yes" : "No") : "Not finalized"}</td>
            <td className="px-3 py-2">{typeof claimed === "boolean" ? (claimed ? "Yes" : "No") : "No"}</td>
          </tr>
        </tbody>
      </table>
    </aside>
  );
};
