# AI Agent Governance Guidelines - RekaKarbon Blockchain Module

This document defines the rules, architecture standards, and specific guidelines that **all AI Agents MUST follow** when developing, modifying, or testing Smart Contracts and infrastructure within the `blockchain/` directory.

---

## 🏗️ 1. Blockchain Architecture Specification

All work in the `blockchain/` module MUST adhere to the following standardized stack:

- **Package Manager**: **`pnpm`** (use `pnpm` commands across the monorepo).
- **Smart Contract**: Solidity (`^0.8.24`) using **OpenZeppelin Contracts `v5.0.0`**.
- **Development & Testing Framework**: **Hardhat** with TypeScript.
- **Target EVM & Node**: Target EVM **`paris`** (configured in `hardhat.config.ts`) to ensure full compatibility with **Hyperledger Besu v23.4.4** (Chain ID `1337`).
- **Backend Integration**: NestJS via `ethers` (v6).

> [!IMPORTANT]
> OpenZeppelin version MUST be **pinned at `v5.0.0`** (do not use `^5.x`) to prevent compiling Cancun EVM opcodes (`PUSH0`, `mcopy`) which are not supported on the target Hyperledger Besu dev network.

---

## 📜 2. Smart Contract Rules (`contracts/RekaKarbon.sol`)

1. **Multi-Asset Token Standard**: Implements ERC-1155 (`ERC1155`, `AccessControl`, `ERC1155Holder`).
   - `GLOBAL_RESERVE` (ID `0`): Global carbon insurance pool (automatically receives a 5% tax cut upon SPE-GRK minting).
   - `PTBAE_PU` (ID `1`): National Carbon Emission Quota issued by the Ministry of Environment and Forestry (`MINISTRY_ROLE`).
   - `SPE-GRK` (ID `>= 2`): GHG Emission Reduction Certificate generated via oracle verifier (`ORACLE_ROLE`).
2. **Role-Based Access Control (RBAC)**:
   - `DEFAULT_ADMIN_ROLE`: Authorized to freeze/unfreeze assets (`freezeAsset`, `unfreezeAsset`).
   - `MINISTRY_ROLE`: Authorized to issue emission quotas (`issueQuota`).
   - `ORACLE_ROLE`: Authorized to mint offset credits (`mintOffsetCredit`).
3. **Emergency & Insurance Mechanisms**:
   - Transfers between addresses are blocked automatically if `isFrozen == true` for the token asset.
   - Burning frozen tokens remains allowed exclusively for insurance claim redemption (`swapFrozenAsset`).

---

## 🧪 3. Testing & PR Quality Check Standards

Before finalizing any task or opening a PR touching the `blockchain/` directory, ensure the following commands pass locally:

1. **Compilation**:
   ```bash
   pnpm --filter @rekakarbon/blockchain run compile
   # or from within the blockchain directory:
   pnpm run compile
   ```
2. **Unit & Integration Tests**:
   ```bash
   pnpm --filter @rekakarbon/blockchain test
   # or from within the blockchain directory:
   pnpm test
   ```
3. **TypeScript Typecheck**:
   ```bash
   pnpm --filter @rekakarbon/blockchain run typecheck
   # or from within the blockchain directory:
   pnpm run typecheck
   ```

---

## 🔗 4. ABI Synchronization & Backend Integration Standards

1. **ABI Artifact Distribution**: After updating `RekaKarbon.sol` and running compilation, copy the JSON artifact from `artifacts/contracts/RekaKarbon.sol/RekaKarbon.json` into the NestJS backend workspace (`server/` or `src/blockchain/abi/`).
2. **Zero-Gas Transactions on Private Network**: State-changing function calls (e.g., `mint`, `issueQuota`) must include `{ gasPrice: 0 }` options when interacting with the Besu dev network.
3. **Numeric Data Types**: High-precision token values or carbon units MUST use `bigint` or `ethers.BigNumberish` to avoid numeric overflow in JavaScript/TypeScript backend code.

---

## 📝 5. Naming Conventions in Blockchain Module

1. **Solidity Contracts**: `PascalCase` (e.g., `RekaKarbon.sol`).
2. **Solidity Events & Structs**: `PascalCase` (e.g., `AssetFrozen`, `CarbonAsset`).
3. **Solidity Functions & Variables**: `camelCase` (e.g., `mintOffsetCredit`, `carbonAssets`).
4. **Solidity Constants**: `UPPER_SNAKE_CASE` (e.g., `MINISTRY_ROLE`, `GLOBAL_RESERVE`).
5. **Hardhat Scripts & Tests**: Test files suffix with `.test.ts` (e.g., `RekaKarbon.test.ts`).
