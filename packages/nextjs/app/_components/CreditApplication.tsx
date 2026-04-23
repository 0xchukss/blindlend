"use client";

import { useMemo, useState } from "react";
import { useFhevm } from "@fhevm-sdk";
import { decodeEventLog, toHex } from "viem";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  confidentialLendAbi,
} from "~~/app/_components/confidentialLendConfig";

type DecisionState = {
  clearScore: number;
  clearLoanAmount: bigint;
  approved: boolean;
} | null;

function getClearValueByHandle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearValues: Record<string, any>,
  handle: `0x${string}`,
) {
  return clearValues[handle] ?? clearValues[handle.toLowerCase()];
}

function toHexValue(value: Uint8Array | `0x${string}`): `0x${string}` {
  return typeof value === "string" ? value : toHex(value);
}

export const CreditApplication = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [monthlyIncome, setMonthlyIncome] = useState("8000");
  const [existingDebt, setExistingDebt] = useState("500");
  const [loanAmount, setLoanAmount] = useState("5000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [decision, setDecision] = useState<DecisionState>(null);

  const provider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as Window & { ethereum?: unknown }).ethereum;
  }, []);

  const { instance, status: fheStatus, error: fheError } = useFhevm({
    provider: provider as never,
    chainId: chain?.id,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: Boolean(address && chain?.id === CHAIN_ID),
  });

  const disabled = !address || !publicClient || !instance || !CONTRACT_ADDRESS || chain?.id !== CHAIN_ID;
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

  const { data: claimableAmount, refetch: refetchClaimableAmount } = useReadContract({
    address: CONTRACT_ADDRESS ? (CONTRACT_ADDRESS as `0x${string}`) : undefined,
    abi: confidentialLendAbi,
    functionName: "claimableLoanAmount",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(CONTRACT_ADDRESS && address && chain?.id === CHAIN_ID) },
  });

  const { data: loanClaimed, refetch: refetchLoanClaimed } = useReadContract({
    address: CONTRACT_ADDRESS ? (CONTRACT_ADDRESS as `0x${string}`) : undefined,
    abi: confidentialLendAbi,
    functionName: "loanClaimed",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(CONTRACT_ADDRESS && address && chain?.id === CHAIN_ID) },
  });

  const submitCreditApplication = async () => {
    if (disabled || !address) return;
    setIsSubmitting(true);
    setStatus("Encrypting application data in your browser...");
    try {
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add64(BigInt(monthlyIncome));
      input.add64(BigInt(existingDebt));
      input.add64(BigInt(loanAmount));
      const { handles, inputProof } = await input.encrypt();
      const h0 = toHexValue(handles[0]);
      const h1 = toHexValue(handles[1]);
      const h2 = toHexValue(handles[2]);
      const proofHex = toHexValue(inputProof);

      setStatus("Submitting encrypted credit application...");
      const submitHash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: confidentialLendAbi,
        functionName: "submitCreditApplication",
        args: [h0, h1, h2, proofHex],
      });
      await publicClient.waitForTransactionReceipt({ hash: submitHash });
      setApplicationSubmitted(true);
      setDecision(null);
      setStatus("Application submitted - data encrypted");
    } catch (error) {
      setStatus(`Submission failed: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const revealLoanDecision = async () => {
    if (disabled || !address) return;
    setIsRevealing(true);
    setStatus("Requesting reveal on-chain...");
    try {
      const revealHash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: confidentialLendAbi,
        functionName: "revealLoanDecision",
        args: [],
      });
      const revealReceipt = await publicClient.waitForTransactionReceipt({ hash: revealHash });

      let scoreHandle = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
      for (const log of revealReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: confidentialLendAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "DecisionRevealRequested") {
            scoreHandle = decoded.args.scoreHandle as `0x${string}`;
          }
        } catch {
          // Ignore unrelated logs.
        }
      }

      const loanHandle = (await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: confidentialLendAbi,
        functionName: "getEncryptedLoanBalance",
        args: [address],
      })) as `0x${string}`;

      if (scoreHandle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        scoreHandle = (await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: confidentialLendAbi,
          functionName: "getEncryptedScore",
          args: [address],
        })) as `0x${string}`;
      }

      setStatus("Decrypting publicly decryptable handles through Zama relayer...");
      const results = await instance.publicDecrypt([scoreHandle, loanHandle]);
      const scoreValue = getClearValueByHandle(results.clearValues, scoreHandle);
      const loanValue = getClearValueByHandle(results.clearValues, loanHandle);
      const clearScore = Number(scoreValue);
      const clearLoanAmount = BigInt(loanValue);

      setStatus("Finalizing decision with on-chain proof verification...");
      const finalizeHash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: confidentialLendAbi,
        functionName: "finalizeLoanDecision",
        args: [clearScore, clearLoanAmount, results.decryptionProof as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash: finalizeHash });

      setDecision({
        clearScore,
        clearLoanAmount,
        approved: clearScore >= 60,
      });
      await refetchClaimableAmount();
      await refetchLoanClaimed();
      window.dispatchEvent(new Event("blindlend:state-updated"));
      setStatus("Loan decision finalized.");
    } catch (error) {
      setStatus(`Reveal/finalize failed: ${(error as Error).message}`);
    } finally {
      setIsRevealing(false);
    }
  };

  const claimLoan = async () => {
    if (disabled) return;
    setIsClaiming(true);
    setStatus("Submitting claim transaction...");
    try {
      const claimHash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: confidentialLendAbi,
        functionName: "claimLoan",
        args: [],
      });
      await publicClient!.waitForTransactionReceipt({ hash: claimHash });
      await refetchClaimableAmount();
      await refetchLoanClaimed();
      window.dispatchEvent(new Event("blindlend:state-updated"));
      setStatus("Loan claimed successfully.");
    } catch (error) {
      setStatus(`Claim failed: ${(error as Error).message}`);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
      <h2 className="text-2xl font-bold text-slate-900">Credit Application</h2>
      <p className="mt-2 text-sm text-slate-600">
        Submit encrypted income, debt, and loan request. The scoring happens with FHE on-chain.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="text-sm font-medium text-slate-700">
          Monthly Income (USD)
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-amber-300 transition focus:ring-2"
            min={0}
            onChange={e => setMonthlyIncome(e.target.value)}
            type="number"
            value={monthlyIncome}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Existing Debt (USD)
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-amber-300 transition focus:ring-2"
            min={0}
            onChange={e => setExistingDebt(e.target.value)}
            type="number"
            value={existingDebt}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Loan Amount (USD)
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-amber-300 transition focus:ring-2"
            min={0}
            onChange={e => setLoanAmount(e.target.value)}
            type="number"
            value={loanAmount}
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || isSubmitting}
          onClick={submitCreditApplication}
          type="button"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>

        <button
          className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || !applicationSubmitted || isRevealing}
          onClick={revealLoanDecision}
          type="button"
        >
          {isRevealing ? "Revealing..." : "Reveal My Decision"}
        </button>
      </div>

      <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Your income and debt were never visible on-chain. Only you can see this score.
      </p>

      {status && <p className="mt-4 text-sm text-slate-700">{status}</p>}
      <p className="mt-2 text-xs text-slate-500">
        FHE instance: {fheStatus}
        {fheError ? ` (${fheError.message})` : ""}
      </p>
      {disabledReason && <p className="mt-2 text-xs text-amber-700">Actions disabled: {disabledReason}</p>}

      {decision && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Credit Score</p>
          <p className="text-3xl font-extrabold text-slate-900">{decision.clearScore}</p>
          <p className="mt-2 text-sm text-slate-700">Loan Amount (clear): {decision.clearLoanAmount.toString()}</p>
          <p className="mt-2 text-base font-bold text-slate-900">
            {decision.approved ? "APPROVED" : "REJECTED"}
          </p>
          {decision.approved && (
            <div className="mt-4">
              <button
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isClaiming || loanClaimed === true || (claimableAmount ?? 0n) === 0n}
                onClick={claimLoan}
                type="button"
              >
                {loanClaimed ? "Loan Claimed" : isClaiming ? "Claiming..." : "Claim Loan"}
              </button>
              <p className="mt-2 text-xs text-slate-600">
                Claimable amount: {typeof claimableAmount === "bigint" ? claimableAmount.toString() : "-"}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
