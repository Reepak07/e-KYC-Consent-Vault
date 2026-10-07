# e-KYC & Consent Vault

A blockchain-based decentralized application (DApp) for secure digital credential verification using document hashing, user-controlled consent, and Ethereum Sepolia smart contracts.

## Live Demo

**Live Application:**  
https://e-kyc-consent-vault.vercel.app

**GitHub Repository:**  
https://github.com/Reepak07/e-KYC-Consent-Vault

**Smart Contract:**  
https://sepolia.etherscan.io/address/0xDD31b39B863E58C7e5a0001B95d3A876fa3220bd

## Project Overview

The e-KYC & Consent Vault is a decentralized document verification system that allows an issuer to register a digital credential for a holder, enables the holder to control verifier access through consent, and allows an authorized verifier to validate the authenticity of a document.

Instead of storing the actual document on the blockchain, the application generates a SHA-256 hash of the document in the user's browser. Only this cryptographic fingerprint is stored on-chain.

This approach helps preserve document privacy while providing tamper-evident verification.

## Objectives

- Store a verifiable document fingerprint on the blockchain.
- Allow an issuer to issue digital credentials to a holder.
- Give holders control over verifier consent.
- Allow verifiers to verify documents without accessing the original document.
- Detect document modifications using cryptographic hashing.
- Demonstrate a practical blockchain-based KYC verification workflow.

## System Roles

### 1. Issuer

The issuer creates and registers a credential for a holder.

Responsibilities:

- Enter the holder's wallet address.
- Upload the document.
- Generate the document hash in the browser.
- Store the hash on the Sepolia blockchain.
- Maintain the credential's validity status.

### 2. Holder

The holder owns the credential and controls access to verification.

Responsibilities:

- Enter the verifier's wallet address.
- Give consent to a verifier.
- Revoke consent whenever required.

### 3. Verifier

The verifier checks whether a document is authentic and authorized for verification.

Responsibilities:

- Enter the holder's wallet address.
- Upload the document received from the holder.
- Generate its hash in the browser.
- Verify the document against the blockchain record.

## System Workflow

```text
Issuer
   |
   | Upload Document
   v
Generate SHA-256 Hash
   |
   v
Sepolia Blockchain
   |
   | Document Hash
   | Issuer Address
   | Issue Timestamp
   | Validity Status
   | Consent Information
   |
   v
Holder
   |
   | Give / Revoke Consent
   v
Verifier
   |
   | Upload Document
   v
Generate SHA-256 Hash
   |
   v
Compare with Blockchain Hash
   |
   +-----------------------+
   |                       |
   v                       v
Hash + Consent Match    Mismatch / No Consent
   |                       |
   v                       v
Credential Valid       Credential Invalid
