"use client";

import { useMemo, useState } from "react";
import { useFhevm } from "@fhevm/sdk";
import { toHex } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { CHAIN_ID, CONTRACT_ADDRESS, confidentialLendAbi } from "~~/app/_components/confidentialLendConfig";

export const CollateralDeposit = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("1000");
  const [status, setStatus] = useState("");
  const [balanceHandle, setBalanceHandle] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  const provider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as Window & { ethereum?: unknown }).ethereum;
  }, []);

  const { instance } = useFhevm({
    provider: provider as never,
    chainId: chain?.id,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: Boolean(address && chain?.id === CHAIN_ID),
  });

  const disabled = !address || !instance || !publicClient || !CONTRACT_ADDRESS || chain?.id !== CHAIN_ID;
  const disabledReason = !address
    ? "Connect wallet first."
    : chain?.id !== CHAIN_ID
      ? "Switch wallet network to Sepolia."
      : !CONTRACT_ADDRESS
        ? "Missing contract address env."
        : !instance
          ? "FHE instance not ready yet."
          : !publicClient
            ? "RPC client not ready."
            : "";

  const toHexValue = (value: Uint8Array | `0x${string}`): `0x${string}` => {
    return typeof value === "string" ? value : toHex(value);
  };

  const onDeposit = async () => {
    if (disabled || !address) return;
    setIsDepositing(true);
    setStatus("Encrypting collateral amount...");
    try {
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add64(BigInt(amount));
      const { handles, inputProof } = await input.encrypt();
      const handle = toHexValue(handles[0]);
      const proofHex = toHexValue(inputProof);

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: confidentialLendAbi,
        functionName: "depositCollateral",
        args: [handle, proofHex],
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const newHandle = (await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: confidentialLendAbi,
        functionName: "getEncryptedCollateralBalance",
        args: [address],
      })) as `0x${string}`;
      setBalanceHandle(newHandle);
      setStatus("Collateral deposited with encrypted balance update.");
    } catch (error) {
      setStatus(`Collateral deposit failed: ${(error as Error).message}`);
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
      <h2 className="text-xl font-bold text-slate-900">Deposit Collateral</h2>
      <p className="mt-2 text-sm text-slate-600">
        Deposit amount is encrypted client-side before sending to the contract.
      </p>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Amount
        <input
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-amber-300 transition focus:ring-2"
          min={0}
          onChange={e => setAmount(e.target.value)}
          type="number"
          value={amount}
        />
      </label>

      <button
        className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || isDepositing}
        onClick={onDeposit}
        type="button"
      >
        {isDepositing ? "Depositing..." : "Encrypt & Deposit"}
      </button>

      {status && <p className="mt-4 text-sm text-slate-700">{status}</p>}
      {disabledReason && <p className="mt-2 text-xs text-amber-700">Actions disabled: {disabledReason}</p>}
      {balanceHandle && (
        <p className="mt-2 break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Encrypted balance handle: {balanceHandle}
        </p>
      )}
    </section>
  );
};
