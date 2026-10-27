
"use client";

import { useState } from "react";
import { isAddress } from "ethers";
import { connectWallet, getContract } from "@/lib/web3";
import { hashFile } from "@/lib/hash";

const CONTRACT_ADDRESS =
  "0xDD31b39B863E58C7e5a0001B95d3A876fa3220bd";

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

type Tab = "issuer" | "holder" | "verifier";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("issuer");

  // Wallet
  const [walletAddress, setWalletAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  // Issuer
  const [holderAddress, setHolderAddress] = useState("");
  const [issuerFile, setIssuerFile] = useState<File | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [documentHashValue, setDocumentHashValue] = useState("");

  // Holder
  const [verifierAddress, setVerifierAddress] = useState("");
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentMessage, setConsentMessage] = useState("");

  // Transactions
  const [transactionHash, setTransactionHash] = useState("");

  // Verifier
  const [verifyHolderAddress, setVerifyHolderAddress] = useState("");
  const [verifierFile, setVerifierFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<boolean | null>(null);

  async function handleConnectWallet() {
    try {
      setConnecting(true);
      setError("");

      const result = await connectWallet();
      setWalletAddress(result.address);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect wallet."
      );
    } finally {
      setConnecting(false);
    }
  }

  // ISSUER: hash document, upload to IPFS, issue hash on-chain.
  async function handleIssueCredential() {
    try {
      setError("");
      setIssueSuccess("");
      setTransactionHash("");
      setIpfsCid("");
      setDocumentHashValue("");

      if (!holderAddress || !isAddress(holderAddress)) {
        throw new Error("Please enter a valid Holder wallet address.");
      }

      if (!issuerFile) {
        throw new Error("Please select a document.");
      }

      setIssuing(true);

      const { signer, address } = await connectWallet();
      setWalletAddress(address);

      // 1. Calculate Keccak-256 over the exact document bytes.
      const documentHash = await hashFile(issuerFile);
      setDocumentHashValue(documentHash);

      // 2. Upload the document to Pinata through our server API.
      const formData = new FormData();
      formData.append("file", issuerFile);

      const uploadResponse = await fetch("/api/pinata/upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || "IPFS upload failed.");
      }

      if (!uploadResult.cid) {
        throw new Error("Pinata did not return an IPFS CID.");
      }

      setIpfsCid(uploadResult.cid);

      // 3. Store the hash on the existing Sepolia smart contract.
      const contract = await getContract(signer);
      const transaction = await contract.issueCredential(
        holderAddress,
        documentHash
      );

      setTransactionHash(transaction.hash);
      await transaction.wait();

      setIssueSuccess(
        "Credential issued successfully. Document uploaded to IPFS."
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to issue credential."
      );
    } finally {
      setIssuing(false);
    }
  }

  // HOLDER: grant or revoke verifier consent.
  async function handleConsent(consentGiven: boolean) {
    try {
      setError("");
      setConsentMessage("");
      setTransactionHash("");

      if (!verifierAddress || !isAddress(verifierAddress)) {
        throw new Error("Please enter a valid Verifier wallet address.");
      }

      setConsentLoading(true);

      const { signer, address } = await connectWallet();
      setWalletAddress(address);

      const contract = await getContract(signer);
      const transaction = await contract.setConsent(
        verifierAddress,
        consentGiven
      );

      setTransactionHash(transaction.hash);
      await transaction.wait();

      setConsentMessage(
        consentGiven
          ? "Consent successfully granted to the Verifier."
          : "Consent successfully revoked from the Verifier."
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to update consent."
      );
    } finally {
      setConsentLoading(false);
    }
  }

  // VERIFIER: hash the supplied document and ask the contract to validate it.
  async function handleVerifyCredential() {
    try {
      setError("");
      setTransactionHash("");
      setVerificationResult(null);

      if (!verifyHolderAddress || !isAddress(verifyHolderAddress)) {
        throw new Error("Please enter a valid Holder wallet address.");
      }

      if (!verifierFile) {
        throw new Error("Please select the document to verify.");
      }

      setVerifying(true);

      const { signer, address } = await connectWallet();
      setWalletAddress(address);

      // Must use the same Keccak-256 function used by the Issuer.
      const documentHash = await hashFile(verifierFile);
      const contract = await getContract(signer);

      const valid = await contract.isValid(
        verifyHolderAddress,
        documentHash
      );

      setVerificationResult(Boolean(valid));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to verify credential."
      );
    } finally {
      setVerifying(false);
    }
  }

  function resetMessages() {
    setError("");
    setConsentMessage("");
    setIssueSuccess("");
    setVerificationResult(null);
    setTransactionHash("");
  }

  const tabs: { id: Tab; number: string; label: string; description: string }[] = [
    {
      id: "issuer",
      number: "01",
      label: "Issuer",
      description: "Issue credential",
    },
    {
      id: "holder",
      number: "02",
      label: "Holder",
      description: "Manage consent",
    },
    {
      id: "verifier",
      number: "03",
      label: "Verifier",
      description: "Verify document",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <h1 className="text-lg font-bold">e-KYC &amp; Consent Vault</h1>
            <p className="text-xs text-slate-400">
              Decentralized document verification
            </p>
          </div>

          <button
            onClick={handleConnectWallet}
            disabled={connecting}
            className="rounded-xl border border-blue-500/30 bg-blue-600/10 px-4 py-2.5 text-sm font-semibold text-blue-300 hover:bg-blue-600 hover:text-white disabled:opacity-60"
          >
            {connecting
              ? "Connecting..."
              : walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Connect MetaMask"}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/15 via-slate-900 to-purple-600/10 p-7 sm:p-10">
          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300">
            Sepolia Testnet
          </span>

          <h2 className="mt-5 text-4xl font-black sm:text-5xl">
            Secure digital credentials.
            <span className="block text-blue-400">Verify with consent.</span>
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">
            Documents are uploaded to IPFS. Their Keccak-256 fingerprints
            are stored on the blockchain, while Holders control verifier
            consent.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Keccak-256 Hashing
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Pinata IPFS
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Ethereum Sepolia
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Holder Consent
            </span>
          </div>
        </div>

        <div className="my-8 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Deployed Smart Contract
          </p>
          <p className="mt-2 break-all font-mono text-sm text-blue-300">
            {CONTRACT_ADDRESS}
          </p>
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-blue-400 underline"
          >
            View on Etherscan
          </a>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                resetMessages();
              }}
              className={`rounded-xl px-3 py-3 text-left transition sm:px-5 ${
                activeTab === tab.id
                  ? "bg-blue-600"
                  : "hover:bg-white/5"
              }`}
            >
              <div className="text-[10px] font-bold opacity-70">
                {tab.number}
              </div>
              <div className="mt-1 text-sm font-bold sm:text-base">
                {tab.label}
              </div>
              <div className="mt-1 hidden text-xs opacity-70 sm:block">
                {tab.description}
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl sm:p-8">
          {/* ISSUER */}
          {activeTab === "issuer" && (
            <div>
              <RoleHeading
                label="ROLE 01 · ISSUER"
                title="Issue a credential"
                description="Upload the document to IPFS and record its Keccak-256 fingerprint on Sepolia."
              />

              <div className="space-y-5">
                <Field label="Holder Wallet Address">
                  <input
                    type="text"
                    value={holderAddress}
                    onChange={(e) => setHolderAddress(e.target.value)}
                    placeholder="0x..."
                    className={inputClass}
                  />
                </Field>

                <Field label="Document to Issue">
                  <input
                    type="file"
                    onChange={(e) => {
                      setIssuerFile(e.target.files?.[0] ?? null);
                      setIpfsCid("");
                      setDocumentHashValue("");
                      setIssueSuccess("");
                    }}
                    className={fileClass}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    The document will be uploaded to IPFS. Do not use
                    unencrypted sensitive identity documents.
                  </p>
                </Field>

                <button
                  onClick={handleIssueCredential}
                  disabled={issuing}
                  className={primaryButton}
                >
                  {issuing ? "Uploading / Issuing..." : "Upload & Issue Credential"}
                </button>

                {documentHashValue && (
                  <ResultField
                    label="Keccak-256 Document Hash"
                    value={documentHashValue}
                  />
                )}

                {ipfsCid && (
                  <div className="break-words rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <p className="text-xs font-semibold uppercase text-blue-300">
                      IPFS Content Identifier (CID)
                    </p>
                    <p className="mt-2 font-mono text-sm">{ipfsCid}</p>
                    <a
                      href={`${IPFS_GATEWAY}${encodeURIComponent(ipfsCid)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm text-blue-400 underline"
                    >
                      Open IPFS gateway
                    </a>
                    <p className="mt-2 text-xs text-slate-500">
                      This link is not an access-control mechanism. Anyone
                      who obtains the CID may be able to retrieve the file.
                    </p>
                  </div>
                )}

                {issueSuccess && (
                  <Message success>{issueSuccess}</Message>
                )}
              </div>
            </div>
          )}

          {/* HOLDER */}
          {activeTab === "holder" && (
            <div>
              <RoleHeading
                label="ROLE 02 · HOLDER"
                title="Manage consent"
                description="Grant or revoke permission for a specific Verifier wallet to validate your credential."
              />

              <div className="space-y-5">
                <Field label="Verifier Wallet Address">
                  <input
                    type="text"
                    value={verifierAddress}
                    onChange={(e) => setVerifierAddress(e.target.value)}
                    placeholder="0x..."
                    className={inputClass}
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => handleConsent(true)}
                    disabled={consentLoading}
                    className="rounded-xl bg-green-600 px-5 py-3.5 font-semibold hover:bg-green-500 disabled:opacity-60"
                  >
                    {consentLoading ? "Processing..." : "Give Consent"}
                  </button>

                  <button
                    onClick={() => handleConsent(false)}
                    disabled={consentLoading}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                  >
                    {consentLoading ? "Processing..." : "Revoke Consent"}
                  </button>
                </div>

                {consentMessage && <Message success>{consentMessage}</Message>}
              </div>
            </div>
          )}

          {/* VERIFIER */}
          {activeTab === "verifier" && (
            <div>
              <RoleHeading
                label="ROLE 03 · VERIFIER"
                title="Verify a credential"
                description="Select the document you received. Its Keccak-256 hash will be checked against the blockchain, along with your consent status."
              />

              <div className="space-y-5">
                <Field label="Holder Wallet Address">
                  <input
                    type="text"
                    value={verifyHolderAddress}
                    onChange={(e) => setVerifyHolderAddress(e.target.value)}
                    placeholder="0x..."
                    className={inputClass}
                  />
                </Field>

                <Field label="Document to Verify">
                  <input
                    type="file"
                    onChange={(e) => {
                      setVerifierFile(e.target.files?.[0] ?? null);
                      setVerificationResult(null);
                    }}
                    className={fileClass}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Verification hashes the selected file locally. Select
                    the exact original file.
                  </p>
                </Field>

                <button
                  onClick={handleVerifyCredential}
                  disabled={verifying}
                  className="w-full rounded-xl bg-purple-600 px-5 py-3.5 font-semibold hover:bg-purple-500 disabled:opacity-60"
                >
                  {verifying ? "Verifying..." : "Verify Credential"}
                </button>

                {verificationResult === true && (
                  <Message success>
                    Credential Valid — the document hash matches and the
                    connected Verifier has consent from the Holder.
                  </Message>
                )}

                {verificationResult === false && (
                  <Message>
                    Credential Invalid — the hash may not match, the
                    credential may be invalid, or Holder consent may be
                    missing or revoked.
                  </Message>
                )}
              </div>
            </div>
          )}

          {transactionHash && (
            <div className="mt-6">
              <TransactionBox hash={transactionHash} />
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-5 text-center text-xs leading-6 text-slate-400">
          Privacy note: the document is stored off-chain on IPFS. The
          current smart contract stores the document hash on-chain, not the
          file or its IPFS CID. IPFS does not make uploaded files private.
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-slate-600">
        e-KYC &amp; Consent Vault · Sepolia Testnet
      </footer>
    </main>
  );
}

// Reusable UI components

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#070b14] px-4 py-3.5 font-mono text-sm outline-none placeholder:text-slate-600 focus:border-blue-500/70";

const fileClass =
  "block w-full rounded-xl border border-white/10 bg-[#070b14] p-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-semibold file:text-white";

const primaryButton =
  "w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

function RoleHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 inline-flex rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
        {label}
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function ResultField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="break-all rounded-xl border border-white/10 bg-[#070b14] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-xs text-blue-300">{value}</p>
    </div>
  );
}

function Message({
  children,
  success = false,
}: {
  children: React.ReactNode;
  success?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        success
          ? "border-green-500/20 bg-green-500/10 text-green-300"
          : "border-red-500/20 bg-red-500/10 text-red-300"
      }`}
    >
      {children}
    </div>
  );
}

function TransactionBox({ hash }: { hash: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#070b14] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Transaction Hash
      </p>
      <a
        href={`https://sepolia.etherscan.io/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block break-all font-mono text-xs text-blue-400 underline"
      >
        {hash}
      </a>
    </div>
  );
}
