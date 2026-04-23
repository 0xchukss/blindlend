// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialLend is ZamaEthereumConfig {
    // Encrypted credit score per borrower (0-100 scale, stored as euint8)
    mapping(address => euint8) private _creditScores;

    // Encrypted loan balance owed per borrower (in cUSDC wei units)
    mapping(address => euint64) private _loanBalances;

    // Encrypted collateral deposited per borrower
    mapping(address => euint64) private _collateralBalances;

    // Plain-text loan approval status (true = approved) - revealed after FHE decision
    mapping(address => bool) public loanApproved;
    mapping(address => uint64) public claimableLoanAmount;
    mapping(address => bool) public loanClaimed;

    // Pool total liquidity (plaintext, for demo display purposes only)
    uint256 public totalPoolLiquidity;

    // Error handler per user
    mapping(address => uint8) public lastErrorCode; // 0 = no error, 1 = score too low, 2 = debt too high

    // Replay protection for score reveals
    mapping(bytes32 => bool) private _usedDecryptionProofs;

    event ApplicationSubmitted(address indexed borrower, uint256 timestamp);
    event DecisionRevealRequested(address indexed borrower, bytes32 scoreHandle);
    event LoanDecisionFinalized(address indexed borrower, uint8 score, bool approved);
    event LoanClaimed(address indexed borrower, uint64 amount);
    event CollateralDeposited(address indexed user, uint256 timestamp);

    constructor() {
        // Demo liquidity for UI display.
        totalPoolLiquidity = 1_000_000e6;
    }

    function submitCreditApplication(
        externalEuint64 encryptedMonthlyIncome,
        externalEuint64 encryptedExistingDebt,
        externalEuint64 encryptedLoanAmount,
        bytes calldata inputProof
    ) external {
        euint64 monthlyIncome = FHE.fromExternal(encryptedMonthlyIncome, inputProof);
        euint64 existingDebt = FHE.fromExternal(encryptedExistingDebt, inputProof);
        euint64 loanAmount = FHE.fromExternal(encryptedLoanAmount, inputProof);

        euint8 incomeScore =
            FHE.select(FHE.gt(monthlyIncome, FHE.asEuint64(5000)), FHE.asEuint8(40), FHE.asEuint8(20));
        euint8 debtScore = FHE.select(FHE.lt(existingDebt, FHE.asEuint64(1000)), FHE.asEuint8(40), FHE.asEuint8(10));
        euint8 loanSizeScore =
            FHE.select(FHE.lt(loanAmount, FHE.asEuint64(10000)), FHE.asEuint8(20), FHE.asEuint8(5));

        euint8 score = FHE.add(FHE.add(incomeScore, debtScore), loanSizeScore);
        _creditScores[msg.sender] = score;
        FHE.allowThis(_creditScores[msg.sender]);
        FHE.allow(_creditScores[msg.sender], msg.sender);

        ebool approved = FHE.ge(score, FHE.asEuint8(60));
        _loanBalances[msg.sender] = FHE.select(approved, loanAmount, FHE.asEuint64(0));
        FHE.allowThis(_loanBalances[msg.sender]);
        FHE.allow(_loanBalances[msg.sender], msg.sender);

        // Reset last error until decision is finalized with clear proof.
        lastErrorCode[msg.sender] = 0;

        emit ApplicationSubmitted(msg.sender, block.timestamp);
    }

    function revealLoanDecision() external {
        FHE.makePubliclyDecryptable(_creditScores[msg.sender]);
        FHE.makePubliclyDecryptable(_loanBalances[msg.sender]);

        emit DecisionRevealRequested(msg.sender, FHE.toBytes32(_creditScores[msg.sender]));
    }

    function finalizeLoanDecision(uint8 clearScore, uint64 clearLoanAmount, bytes calldata decryptionProof) external {
        bytes32 proofHash = keccak256(decryptionProof);
        require(!_usedDecryptionProofs[proofHash], "Proof already used");
        _usedDecryptionProofs[proofHash] = true;

        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(_creditScores[msg.sender]);
        handles[1] = FHE.toBytes32(_loanBalances[msg.sender]);

        bytes memory cleartexts = abi.encode(clearScore, clearLoanAmount);
        FHE.checkSignatures(handles, cleartexts, decryptionProof);

        bool approved = clearScore >= 60;
        loanApproved[msg.sender] = approved;

        if (approved) {
            lastErrorCode[msg.sender] = 0;
            claimableLoanAmount[msg.sender] = clearLoanAmount;
            loanClaimed[msg.sender] = false;
            if (totalPoolLiquidity >= clearLoanAmount) {
                totalPoolLiquidity -= clearLoanAmount;
            }
        } else {
            // Keep two demo error classes visible in UI.
            lastErrorCode[msg.sender] = clearScore < 40 ? 2 : 1;
            claimableLoanAmount[msg.sender] = 0;
            loanClaimed[msg.sender] = false;
        }

        emit LoanDecisionFinalized(msg.sender, clearScore, approved);
    }

    function depositCollateral(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        _collateralBalances[msg.sender] = FHE.add(_collateralBalances[msg.sender], amount);
        FHE.allowThis(_collateralBalances[msg.sender]);
        FHE.allow(_collateralBalances[msg.sender], msg.sender);

        emit CollateralDeposited(msg.sender, block.timestamp);
    }

    function claimLoan() external {
        require(loanApproved[msg.sender], "Loan not approved");
        require(!loanClaimed[msg.sender], "Loan already claimed");

        uint64 amount = claimableLoanAmount[msg.sender];
        require(amount > 0, "No claimable loan");

        loanClaimed[msg.sender] = true;
        emit LoanClaimed(msg.sender, amount);
    }

    function getEncryptedScore(address user) external view returns (euint8) {
        return _creditScores[user];
    }

    function getEncryptedLoanBalance(address user) external view returns (euint64) {
        return _loanBalances[user];
    }

    function getEncryptedCollateralBalance(address user) external view returns (euint64) {
        return _collateralBalances[user];
    }

    function getEncryptedScoreHandle(address user) external view returns (bytes32) {
        return FHE.toBytes32(_creditScores[user]);
    }

    function getEncryptedLoanHandle(address user) external view returns (bytes32) {
        return FHE.toBytes32(_loanBalances[user]);
    }
}
