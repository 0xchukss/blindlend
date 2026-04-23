"use client";

export const SEPOLIA_ADDRESSES = {
  FHEVM_EXECUTOR: "0x92C920834Ec8941d2C77D188936E1f7A6f49c127",
  ACL_CONTRACT: "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D",
  KMS_VERIFIER: "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A",
  INPUT_VERIFIER: "0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0",
  RELAYER_URL: "https://relayer.testnet.zama.org",
  CHAIN_ID: 11155111,
  cUSDC_MOCK: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
  USDC_MOCK_UNDERLYING: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
} as const;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS || "";

export const RELAYER_URL =
  process.env.NEXT_PUBLIC_RELAYER_URL || process.env.VITE_RELAYER_URL || SEPOLIA_ADDRESSES.RELAYER_URL;

export const CHAIN_ID =
  Number(process.env.NEXT_PUBLIC_CHAIN_ID || process.env.VITE_CHAIN_ID || SEPOLIA_ADDRESSES.CHAIN_ID) ||
  SEPOLIA_ADDRESSES.CHAIN_ID;

export const confidentialLendAbi = [
  {
    type: "event",
    name: "ApplicationSubmitted",
    inputs: [
      { indexed: true, name: "borrower", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "DecisionRevealRequested",
    inputs: [
      { indexed: true, name: "borrower", type: "address" },
      { indexed: false, name: "scoreHandle", type: "bytes32" },
    ],
  },
  {
    type: "event",
    name: "LoanDecisionFinalized",
    inputs: [
      { indexed: true, name: "borrower", type: "address" },
      { indexed: false, name: "score", type: "uint8" },
      { indexed: false, name: "approved", type: "bool" },
    ],
  },
  {
    type: "event",
    name: "LoanClaimed",
    inputs: [
      { indexed: true, name: "borrower", type: "address" },
      { indexed: false, name: "amount", type: "uint64" },
    ],
  },
  {
    type: "event",
    name: "CollateralDeposited",
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "submitCreditApplication",
    stateMutability: "nonpayable",
    inputs: [
      { name: "encryptedMonthlyIncome", type: "bytes32" },
      { name: "encryptedExistingDebt", type: "bytes32" },
      { name: "encryptedLoanAmount", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revealLoanDecision",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "finalizeLoanDecision",
    stateMutability: "nonpayable",
    inputs: [
      { name: "clearScore", type: "uint8" },
      { name: "clearLoanAmount", type: "uint64" },
      { name: "decryptionProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "depositCollateral",
    stateMutability: "nonpayable",
    inputs: [
      { name: "encryptedAmount", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimLoan",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "getEncryptedScore",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getEncryptedLoanBalance",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getEncryptedCollateralBalance",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "totalPoolLiquidity",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "loanApproved",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "claimableLoanAmount",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    type: "function",
    name: "loanClaimed",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
