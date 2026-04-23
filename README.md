# BlindLend

> Private DeFi credit scoring powered by Zama FHEVM - Zama Mainnet S2 Hackathon

## What it does

BlindLend enables on-chain credit scoring without data exposure. A borrower submits their encrypted monthly income, existing debt, and loan request. The smart contract computes a credit score using Fully Homomorphic Encryption (FHE), approves or rejects the loan - and the raw financial figures are never visible on-chain, not even to the protocol itself.

## The problem it solves

Traditional DeFi lending is either over-collateralised (inefficient) or relies on centralised credit data (privacy-destroying). ConfidentialLend uses FHE to enable undercollateralised lending based on verifiable financial data that stays private.

## How FHE is used

| FHE Operation | Where used |
|---------------|------------|
| `FHE.fromExternal` | Validates ZK proof of encrypted inputs |
| `FHE.gt`, `FHE.lt`, `FHE.ge` | Compares encrypted income/debt thresholds |
| `FHE.add` | Aggregates sub-scores into final credit score |
| `FHE.select` | Conditional loan approval without plaintext branching |
| `FHE.makePubliclyDecryptable` | Marks score for off-chain KMS reveal |
| `FHE.checkSignatures` | Verifies Zama KMS decryption proof on-chain |
| `FHE.allow` / `FHE.allowThis` | ACL permission management |

## Architecture

```text
User (browser)
  -> Encrypts inputs client-side (fhevm SDK)
     -> Sends encrypted inputs + ZKPoK to ConfidentialLend.sol
        -> FHE arithmetic computes score on-chain (ciphertext only)
           -> User requests reveal -> KMS decrypts off-chain
              -> Decryption proof verified on-chain -> loan decision finalised
```

## Smart contract

- `ConfidentialLend.sol` - deployed on Sepolia at `<CONTRACT_ADDRESS>`
- Inherits `ZamaEthereumConfig` for automatic FHEVM coprocessor configuration

## Tech stack

- **Smart contract**: Solidity 0.8.24 + fhevm-solidity + OpenZeppelin Confidential Contracts
- **Development**: Hardhat + @fhevm/hardhat-plugin
- **Frontend**: React + Vite + wagmi + viem + fhevm-react-template
- **Network**: Ethereum Sepolia testnet
- **KMS**: Zama Relayer at `https://relayer.testnet.zama.org`

## Setup

### Prerequisites
- Node.js v18 or v20 (even LTS only)
- MetaMask with Sepolia ETH
- Infura API key

### Installation

```bash
git clone <repo>
cd confidentiallend
npm install
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
```

### Deploy

```bash
npx hardhat deploy --network sepolia --tags ConfidentialLend
```

Copy the contract address into `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0x...
VITE_INFURA_API_KEY=your_key
```

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

### Run tests

```bash
npx hardhat test                    # local (fhevm mock)
npx hardhat test --network sepolia  # Sepolia live
```

## Demo walkthrough

1. Connect MetaMask (Sepolia)
2. Fill in income, debt, and loan amount - inputs are encrypted in your browser before submission
3. Click "Submit Application" - a single on-chain tx carries encrypted data + ZK proof
4. Click "Reveal My Decision" - triggers off-chain KMS decryption via Zama relayer
5. Loan decision (score + approved/rejected) appears - your raw figures were never on-chain

## FHE constraints handled

- `FHE.div` does not support encrypted divisors - credit scoring uses `FHE.select` threshold comparisons instead of ratio division
- No branching on encrypted booleans - all conditional logic uses `FHE.select`
- Replay protection implemented on `finalizeLoanDecision` using `keccak256(decryptionProof)`

## Contract addresses (Sepolia)

| Contract | Address |
|----------|---------|
| ConfidentialLend | `<YOUR_DEPLOYED_ADDRESS>` |
| cUSDC Mock (for demo) | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` |
| Underlying USDC Mock | `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF` |
| FHEVM Executor | `0x92C920834Ec8941d2C77D188936E1f7A6f49c127` |
| ACL Contract | `0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D` |
| KMS Verifier | `0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A` |
| Input Verifier | `0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0` |

## License

BSD-3-Clause-Clear
