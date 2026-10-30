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

The e-KYC & Consent Vault is a blockchain-based decentralized application (DApp) designed to provide secure digital credential verification using cryptographic hashing, IPFS storage, and user-controlled consent.

The application allows an issuer to register a digital credential for a holder, enables the holder to manage verifier access through consent, and allows a verifier to validate the authenticity of a document.

The application generates a Keccak-256 hash of the uploaded document in the browser. The document is uploaded to IPFS through Pinata, while its cryptographic hash is stored on the Ethereum Sepolia blockchain through a smart contract.

During verification, the verifier uploads the document, generates its hash, and checks it against the blockchain record. Verification also depends on the credential's validity status and the holder's consent.

This approach provides tamper-evident document verification while avoiding the storage of the original document directly on the blockchain.

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
                 ISSUER
                    |
                    v
             Upload Document
                    |
          +---------+---------+
          |                   |
          v                   v
    Generate Hash       Upload to Pinata
    (Keccak-256)              |
          |                   v
          |                IPFS CID
          |
          v
    Ethereum Sepolia
          |
          v
    Credential Record
    - Document Hash
    - Issuer Address
    - Issue Timestamp
    - Validity Status
          |
          v
         HOLDER
          |
          v
    Give / Revoke Consent
          |
          v
        VERIFIER
          |
          v
     Upload Document
          |
          v
    Generate Keccak-256 Hash
          |
          v
    Compare with Blockchain
          |
          v
    Check Validity + Consent
          |
      +---+---+
      |       |
      v       v
    Valid   Invalid
