# Security Policy - RekaKarbon

The RekaKarbon engineering team takes the security, reliability, and cryptographic integrity of our digital MRV (dMRV) and carbon exchange ecosystem seriously. Because RekaKarbon facilitates sovereign carbon certificate issuance, fiscal tax synchronization, machine learning telemetry, and smart contract settlement, we maintain proactive defenses to safeguard against tampering, fraud, and unauthorized access.

This document outlines our vulnerability disclosure process, supported versions, domain-specific security scope, and response timelines.

---

## 🛡️ Supported Versions

We provide active security patches and updates for the following versions:

| Version           | Supported | Status                   | Security Patch Policy                                                   |
| :---------------- | :-------: | :----------------------- | :---------------------------------------------------------------------- |
| **`1.0.x-pilot`** |    ✅     | **Current Active Pilot** | Actively receiving vulnerability patches and critical security updates. |
| `< 1.0.0`         |    ❌     | Deprecated / Development | No longer supported. Please upgrade to the latest pilot release.        |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, flaw, or potential exploit in RekaKarbon, **do NOT open a public GitHub issue, pull request, or discussion**. Public disclosure before a fix is available puts users, institutions, and carbon market participants at risk.

Please report vulnerabilities using one of the following confidential channels:

### 1. GitHub Private Security Advisory (Preferred)

The most secure and encrypted reporting mechanism is GitHub's built-in private vulnerability advisory:

1. Navigate to the repository's **[Security Tab](https://github.com/SYNETRATECH/RekaKarbon/security)**.
2. Under "Security", click on **"Report a vulnerability"** (or **"Advisories"**).
3. Fill out the report form with full reproduction steps and click **Submit report**.
4. Our security response team will review and collaborate with you directly inside the private advisory workspace.

### 2. Direct Security Contact (Fallback Email)

If you cannot submit via GitHub Security Advisories, send an encrypted or direct email to our security point of contact:

- **Email**: `farrel.apeiron@gmail.com`
- **Subject Line**: `[SECURITY] Vulnerability Report: RekaKarbon - <Short Description>`

### What to Include in Your Report

To accelerate triage and verification, please include:

- **Component Affected**: Specify whether the vulnerability affects the frontend (`client/`), NestJS API (`server/`), Besu smart contracts (`blockchain/`), or ML pipeline (`ml/`).
- **Severity & Impact**: Your estimate of the severity (Critical, High, Medium, Low) and potential real-world consequences (e.g., unauthorized token minting, authentication bypass, sensor spoofing).
- **Steps to Reproduce**: Detailed, step-by-step instructions or scripts to reliably replicate the vulnerability.
- **Proof of Concept (PoC)**: Minimal reproducible code snippet, transaction payload, or request trace.
- **Suggested Mitigation**: Any recommendations or pull request patches you believe resolve the vulnerability (optional).

---

## ⏱️ Response Timelines & SLA

Our core engineering team commits to the following Service Level Agreements for reported security issues:

| Milestone                        | Target Response Time  | Action                                                                           |
| :------------------------------- | :-------------------- | :------------------------------------------------------------------------------- |
| **Initial Acknowledgment**       | **< 48 hours**        | Confirm receipt of the report and assign a primary security reviewer.            |
| **Triage & Severity Assessment** | **< 5 business days** | Verify reproducibility, evaluate systemic impact, and determine CVSS score.      |
| **Hotfix & Private Patching**    | **14 – 30 days**      | Develop, test, and audit the remediation patch in an isolated environment.       |
| **Coordinated Disclosure**       | **Upon Release**      | Deploy the patch, release a security advisory, and publicly credit the reporter. |

---

## 🔍 In-Scope Security Domains

RekaKarbon’s architecture encompasses four distinct technology layers, each with specific threat surfaces:

### 1. ⛓️ Consortium Blockchain & Smart Contracts (`blockchain/`)

- **ERC-1155 Token Integrity**: Vulnerabilities allowing unauthorized minting, transfer, burning, or balance manipulation of `PTBAE-PU` (allowance tokens) or `SPE-GRK` (offset certificates).
- **Buffer Reserve Invariants**: Flaws that bypass the mandatory 5% global buffer pool contribution on forestry carbon issuance.
- **Access Control & Reentrancy**: Violations of OpenZeppelin `AccessControl` roles (`DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `ORACLE_ROLE`) or reentrancy bugs in treasury settlement.
- **QBFT Consensus Fault Tolerance**: Exploits affecting validator node communication or transaction mempool manipulation in the Hyperledger Besu cluster.

### 2. ⚙️ Backend API & Database (`server/`)

- **Authentication & RBAC Bypass**: Vulnerabilities circumventing `JwtAuthGuard` or `RolesGuard` enabling unauthorized access across the four isolated portals (`KTH`, `EMITTER`, `AUDITOR`, `REGULATOR`).
- **Cryptographic Envelope Integrity**: Tampering with standardized API response envelopes or forgery of SHA-256 verification hashes.
- **Database & Query Injection**: SQL injection or improper relation traversal via Prisma ORM / PostgreSQL.
- **Fiscal & Tax Data Tampering**: Forgery of DJP e-Faktur validation proofs or unverified emission calculation submissions.

### 3. 🌿 Machine Learning & dMRV Engine (`ml/`)

- **ONNX Model Deserialization**: Arbitrary code execution or heap corruption via manipulated ONNX runtime model files.
- **Adversarial Telemetry Spoofing**: Crafted inputs designed to systematically evade the Isolation Forest anomaly detector while reporting fraudulent emissions.
- **Stoichiometric Calculation Subversion**: Exploiting numerical instability or physical unit boundary checks in combustion thermodynamics calculations.

### 4. 🎨 Frontend Application (`client/`)

- **Cross-Site Scripting (XSS)**: Malicious script execution through user-supplied project descriptions, audit remarks, or telemetry graphs.
- **Client-Side Key Leakage**: Exposure of administrative credentials, private signing keys, or unredacted internal tokens in client bundles.

---

## 🚫 Out-of-Scope Vulnerabilities

The following types of activities and non-impact reports are strictly **out of scope**:

- **Denial of Service (DoS/DDoS)**: Volumetric flooding attacks against local development ports (`localhost:3000`, `localhost:5173`, `localhost:8545`) or public staging endpoints.
- **Social Engineering & Phishing**: Attacks targeting project contributors, students, or institutional staff.
- **Theoretical Vulnerabilities**: Flaws reported without a working Proof of Concept (PoC) demonstrating practical impact.
- **Third-Party Dependency Scanner Dumps**: Automated reports from vulnerability scanners without evidence that the vulnerable dependency path is reachable and exploitable in RekaKarbon.
- **Local Attacks Requiring Physical Root Access**: Exploits that require physical possession of an unlocked developer workstation.

---

## 🤝 Responsible Disclosure & Safe Harbor

We fully support security researchers who conduct their testing ethically:

- If you make a good-faith effort to avoid privacy violations, data destruction, and service interruption during your research, **we will not pursue legal action against you**.
- We request that you give us a reasonable opportunity to investigate and remediate the vulnerability before publicly discussing or publishing any details.
- Once a fix is verified and deployed, researchers will be permanently acknowledged in our **Security Hall of Fame** and the official GitHub release notes.

---

## 🔐 Contributor Security Guidelines

All engineers contributing code to RekaKarbon MUST follow these essential security standards:

1. **Zero Secret Leaks**: Never commit `.env` files, private keys, Besu keystores, or database credentials. Use `.gitignore` and run pre-commit hooks (`husky` + `lint-staged`).
2. **Deterministic Typing & Validation**: Validate all incoming DTOs using `class-validator` (server) and `zod` (client). Never rely solely on client-side validation for critical actions.
3. **Smart Contract Auditing**: Run static analysis (`slither`) and Hardhat unit tests covering revert conditions and permission boundaries prior to opening pull requests.
4. **Dependency Auditing**: Regularly run `pnpm audit` and `poetry run pip-audit` to detect known vulnerabilities in third-party libraries.
