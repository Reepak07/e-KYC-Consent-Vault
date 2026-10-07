"use client";

import { useState } from "react";
import { isAddress } from "ethers";
import { connectWallet, getContract } from "@/lib/web3";
import { hashFile } from "@/lib/hash";

const CONTRACT_ADDRESS =
  "0xDD31b39B863E58C7e5a0001B95d3A876fa3220bd";

export default function Home() {
  const [activeTab, setActiveTab] = useState("issuer");

  // Wallet
  const [walletAddress, setWalletAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  // Issuer
  const [holderAddress, setHolderAddress] = useState("");
  const [issuerFile, setIssuerFile] = useState<File | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState("");

  // Holder
  const [verifierAddress, setVerifierAddress] = useState("");
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentMessage, setConsentMessage] = useState("");

  // Shared transaction
  const [transactionHash, setTransactionHash] = useState("");

  // Verifier
  const [verifyHolderAddress, setVerifyHolderAddress] = useState("");
  const [verifierFile, setVerifierFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<boolean | null>(null);

  // =========================
  // Connect MetaMask
  // =========================
  async function handleConnectWallet() {
    try {
      setConnecting(true);
      setError("");

      const result = await connectWallet();

      setWalletAddress(result.address);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect wallet.");
      }
    } finally {
      setConnecting(false);
    }
  }

  // =========================
  // Issuer
  // =========================
  async function handleIssueCredential() {
    try {
      setError("");
      setIssueSuccess("");
      setTransactionHash("");

      if (!holderAddress) {
        throw new Error(
          "Please enter the holder wallet address."
        );
      }

      if (!isAddress(holderAddress)) {
        throw new Error(
          "Please enter a valid Ethereum wallet address."
        );
      }

      if (!issuerFile) {
        throw new Error("Please select a document.");
      }

      setIssuing(true);

      const { signer, address } = await connectWallet();

      setWalletAddress(address);

      // Hash document in browser
      const documentHash = await hashFile(issuerFile);

      console.log(
        "Issuer document hash:",
        documentHash
      );

      const contract = await getContract(signer);

      const transaction = await contract.issueCredential(
        holderAddress,
        documentHash
      );

      setTransactionHash(transaction.hash);

      await transaction.wait();

      setIssueSuccess(
        "Credential successfully issued on the Sepolia blockchain."
      );
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to issue credential.");
      }
    } finally {
      setIssuing(false);
    }
  }

  // =========================
  // Holder Consent
  // =========================
  async function handleConsent(
    consentGiven: boolean
  ) {
    try {
      setError("");
      setConsentMessage("");
      setTransactionHash("");

      if (!verifierAddress) {
        throw new Error(
          "Please enter the verifier wallet address."
        );
      }

      if (!isAddress(verifierAddress)) {
        throw new Error(
          "Please enter a valid Ethereum wallet address."
        );
      }

      setConsentLoading(true);

      const { signer, address } =
        await connectWallet();

      setWalletAddress(address);

      const contract = await getContract(signer);

      const transaction =
        await contract.setConsent(
          verifierAddress,
          consentGiven
        );

      setTransactionHash(transaction.hash);

      await transaction.wait();

      setConsentMessage(
        consentGiven
          ? "Consent successfully granted to the verifier."
          : "Consent successfully revoked from the verifier."
      );
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to update consent."
        );
      }
    } finally {
      setConsentLoading(false);
    }
  }

  // =========================
  // Verifier
  // =========================
  async function handleVerifyCredential() {
    try {
      setError("");
      setVerificationResult(null);

      if (!verifyHolderAddress) {
        throw new Error(
          "Please enter the holder wallet address."
        );
      }

      if (!isAddress(verifyHolderAddress)) {
        throw new Error(
          "Please enter a valid holder wallet address."
        );
      }

      if (!verifierFile) {
        throw new Error(
          "Please select the document to verify."
        );
      }

      setVerifying(true);

      // Connect using the Verifier account
      const { signer, address } =
        await connectWallet();

      setWalletAddress(address);

      // Hash document in browser
      const documentHash =
        await hashFile(verifierFile);

      console.log(
        "Verifier document hash:",
        documentHash
      );

      const contract =
        await getContract(signer);

      // The connected wallet becomes msg.sender.
      // Therefore consent is checked for this verifier.
      const valid =
        await contract.isValid(
          verifyHolderAddress,
          documentHash
        );

      setVerificationResult(valid);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to verify credential."
        );
      }
    } finally {
      setVerifying(false);
    }
  }

  // =========================
  // Reset messages
  // =========================
  function resetMessages() {
    setError("");
    setConsentMessage("");
    setIssueSuccess("");
    setVerificationResult(null);
    setTransactionHash("");
  }

  const tabs = [
    {
      id: "issuer",
      label: "Issuer",
      number: "01",
      description: "Issue credential",
    },
    {
      id: "holder",
      label: "Holder",
      number: "02",
      description: "Manage consent",
    },
    {
      id: "verifier",
      label: "Verifier",
      number: "03",
      description: "Verify document",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070b14] text-white">

      {/* =========================
          HEADER
      ========================= */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <span className="text-lg font-black">
                K
              </span>
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">
                e-KYC & Consent Vault
              </h1>

              <p className="text-xs text-slate-400">
                Decentralized document verification
              </p>
            </div>

          </div>

          <button
            onClick={handleConnectWallet}
            disabled={connecting}
            className="rounded-xl border border-blue-500/30 bg-blue-600/10 px-4 py-2.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connecting
              ? "Connecting..."
              : walletAddress
                ? `${walletAddress.slice(
                    0,
                    6
                  )}...${walletAddress.slice(-4)}`
                : "Connect MetaMask"}
          </button>

        </div>

      </header>

      {/* =========================
          MAIN
      ========================= */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">

        {/* =========================
            HERO
        ========================= */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/15 via-slate-900 to-purple-600/10 p-7 sm:p-10">

          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />

          <div className="relative max-w-3xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300">

              <span className="h-2 w-2 rounded-full bg-green-400" />

              Sepolia Testnet

            </div>

            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">

              Secure digital credentials.

              <span className="block text-blue-400">
                Verify with consent.
              </span>

            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">

              Store only the document fingerprint on-chain.
              The Holder controls who can verify the
              credential, while the Verifier checks the
              document directly in the browser.

            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-300">

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                SHA-256 Hashing
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Ethereum Sepolia
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Holder Consent
              </span>

            </div>

          </div>

        </div>

        {/* =========================
            WORKFLOW
        ========================= */}
        <div className="my-8 grid gap-3 sm:grid-cols-3">

          {[
            [
              "01",
              "Issue",
              "Issuer stores the document hash.",
            ],
            [
              "02",
              "Consent",
              "Holder controls verifier access.",
            ],
            [
              "03",
              "Verify",
              "Verifier checks hash + consent.",
            ],
          ].map(
            ([number, title, description]) => (

              <div
                key={number}
                className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
              >

                <div className="mb-3 flex items-center gap-3">

                  <span className="text-xs font-bold text-blue-400">
                    {number}
                  </span>

                  <h3 className="font-semibold">
                    {title}
                  </h3>

                </div>

                <p className="text-sm leading-6 text-slate-400">
                  {description}
                </p>

              </div>

            )
          )}

        </div>

        {/* =========================
            CONTRACT
        ========================= */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Deployed Smart Contract
              </p>

              <p className="mt-2 break-all font-mono text-xs text-blue-300 sm:text-sm">
                {CONTRACT_ADDRESS}
              </p>

            </div>

            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500/40 hover:text-white"
            >
              View on Etherscan ↗
            </a>

          </div>

        </div>

        {/* =========================
            ERROR
        ========================= */}
        {error && (

          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">

            <span className="mr-2 font-bold">
              !
            </span>

            {error}

          </div>

        )}

        {/* =========================
            TABS
        ========================= */}
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
                  ? "bg-blue-600 shadow-lg shadow-blue-600/20"
                  : "hover:bg-white/5"
              }`}
            >

              <div className="text-[10px] font-bold opacity-70">
                {tab.number}
              </div>

              <div className="mt-1 text-sm font-bold sm:text-base">
                {tab.label}
              </div>

              <div className="mt-0.5 hidden text-xs opacity-70 sm:block">
                {tab.description}
              </div>

            </button>

          ))}

        </div>

        {/* =========================
            ROLE CARD
        ========================= */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 sm:p-8">

          {/* =========================
              ISSUER
          ========================= */}
          {activeTab === "issuer" && (

            <>

              <div className="mb-8">

                <div className="mb-3 inline-flex rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                  ROLE 01 · ISSUER
                </div>

                <h3 className="text-2xl font-bold">
                  Issue a credential
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">

                  Hash the document in the browser and store
                  its fingerprint on the Sepolia blockchain
                  for the selected Holder.

                </p>

              </div>

              <div className="space-y-5">

                {/* Holder address */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Holder Wallet Address
                  </label>

                  <input
                    type="text"
                    value={holderAddress}
                    onChange={(e) =>
                      setHolderAddress(
                        e.target.value
                      )
                    }
                    placeholder="0x..."
                    className="w-full rounded-xl border border-white/10 bg-[#070b14] px-4 py-3.5 font-mono text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/10"
                  />

                </div>

                {/* Document */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Document
                  </label>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#070b14] px-5 py-8 text-center transition hover:border-blue-500/50 hover:bg-blue-500/5">

                    <span className="text-2xl">
                      ↑
                    </span>

                    <span className="mt-2 text-sm font-semibold text-slate-200">
                      {issuerFile
                        ? issuerFile.name
                        : "Choose a document"}
                    </span>

                    <span className="mt-1 text-xs text-slate-500">

                      The file stays in your browser;
                      only its hash is stored on-chain.

                    </span>

                    <input
                      type="file"
                      onChange={(e) =>
                        setIssuerFile(
                          e.target.files?.[0] ||
                            null
                        )
                      }
                      className="hidden"
                    />

                  </label>

                </div>

                {/* Issue button */}
                <button
                  onClick={
                    handleIssueCredential
                  }
                  disabled={issuing}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {issuing
                    ? "Issuing Credential..."
                    : "Issue Credential"}

                </button>

                {/* Success */}
                {issueSuccess && (

                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">

                    ✓ {issueSuccess}

                  </div>

                )}

                {/* Transaction */}
                {transactionHash && (
                  <TransactionBox
                    hash={transactionHash}
                  />
                )}

              </div>

            </>

          )}

          {/* =========================
              HOLDER
          ========================= */}
          {activeTab === "holder" && (

            <>

              <div className="mb-8">

                <div className="mb-3 inline-flex rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300">
                  ROLE 02 · HOLDER
                </div>

                <h3 className="text-2xl font-bold">
                  Manage consent
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">

                  Decide whether a specific Verifier
                  is allowed to validate your credential.

                </p>

              </div>

              <div className="space-y-5">

                {/* Verifier address */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Verifier Wallet Address
                  </label>

                  <input
                    type="text"
                    value={verifierAddress}
                    onChange={(e) =>
                      setVerifierAddress(
                        e.target.value
                      )
                    }
                    placeholder="0x..."
                    className="w-full rounded-xl border border-white/10 bg-[#070b14] px-4 py-3.5 font-mono text-sm outline-none transition placeholder:text-slate-600 focus:border-green-500/70 focus:ring-2 focus:ring-green-500/10"
                  />

                </div>

                {/* Consent buttons */}
                <div className="grid gap-3 sm:grid-cols-2">

                  <button
                    onClick={() =>
                      handleConsent(true)
                    }
                    disabled={consentLoading}
                    className="rounded-xl bg-green-600 px-5 py-3.5 font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {consentLoading
                      ? "Processing..."
                      : "Give Consent"}

                  </button>

                  <button
                    onClick={() =>
                      handleConsent(false)
                    }
                    disabled={consentLoading}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {consentLoading
                      ? "Processing..."
                      : "Revoke Consent"}

                  </button>

                </div>

                {/* Consent message */}
                {consentMessage && (

                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">

                    ✓ {consentMessage}

                  </div>

                )}

                {/* Transaction */}
                {transactionHash && (
                  <TransactionBox
                    hash={transactionHash}
                  />
                )}

              </div>

            </>

          )}

          {/* =========================
              VERIFIER
          ========================= */}
          {activeTab === "verifier" && (

            <>

              <div className="mb-8">

                <div className="mb-3 inline-flex rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300">
                  ROLE 03 · VERIFIER
                </div>

                <h3 className="text-2xl font-bold">
                  Verify a credential
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">

                  Upload the document to calculate its
                  SHA-256 hash. The contract checks the
                  hash and your consent status.

                </p>

              </div>

              <div className="space-y-5">

                {/* Holder address */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Holder Wallet Address
                  </label>

                  <input
                    type="text"
                    value={verifyHolderAddress}
                    onChange={(e) =>
                      setVerifyHolderAddress(
                        e.target.value
                      )
                    }
                    placeholder="0x..."
                    className="w-full rounded-xl border border-white/10 bg-[#070b14] px-4 py-3.5 font-mono text-sm outline-none transition placeholder:text-slate-600 focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/10"
                  />

                </div>

                {/* Document */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Document to Verify
                  </label>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#070b14] px-5 py-8 text-center transition hover:border-purple-500/50 hover:bg-purple-500/5">

                    <span className="text-2xl">
                      ⌕
                    </span>

                    <span className="mt-2 text-sm font-semibold text-slate-200">

                      {verifierFile
                        ? verifierFile.name
                        : "Choose the document"}

                    </span>

                    <span className="mt-1 text-xs text-slate-500">
                      Hashing happens locally in the browser.
                    </span>

                    <input
                      type="file"
                      onChange={(e) => {
                        setVerifierFile(
                          e.target.files?.[0] ||
                            null
                        );

                        setVerificationResult(
                          null
                        );
                      }}
                      className="hidden"
                    />

                  </label>

                </div>

                {/* Verify button */}
                <button
                  onClick={
                    handleVerifyCredential
                  }
                  disabled={verifying}
                  className="w-full rounded-xl bg-purple-600 px-5 py-3.5 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {verifying
                    ? "Verifying..."
                    : "Verify Credential"}

                </button>

                {/* Valid */}
                {verificationResult ===
                  true && (

                  <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">

                    <div className="flex items-start gap-4">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-lg text-green-400">
                        ✓
                      </div>

                      <div>

                        <p className="text-xl font-bold text-green-400">
                          Credential Valid
                        </p>

                        <p className="mt-2 text-sm leading-6 text-green-300/80">

                          The document hash matches the
                          credential stored on-chain and
                          the Holder has granted consent
                          to this Verifier.

                        </p>

                      </div>

                    </div>

                  </div>

                )}

                {/* Invalid */}
                {verificationResult ===
                  false && (

                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">

                    <div className="flex items-start gap-4">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-lg text-red-400">
                        ×
                      </div>

                      <div>

                        <p className="text-xl font-bold text-red-400">
                          Credential Invalid
                        </p>

                        <p className="mt-2 text-sm leading-6 text-red-300/80">

                          Verification failed. The document
                          hash may not match, consent may
                          have been revoked, or the credential
                          may not be valid.

                        </p>

                      </div>

                    </div>

                  </div>

                )}

              </div>

            </>

          )}

        </div>

        {/* =========================
            PRIVACY NOTE
        ========================= */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-5 text-center">

          <p className="text-xs leading-5 text-slate-500">

            <span className="font-semibold text-slate-400">
              Privacy note:
            </span>{" "}

            the original document is not uploaded to the
            blockchain. Only its SHA-256 fingerprint is
            used for verification.

          </p>

        </div>

      </section>

      {/* =========================
          FOOTER
      ========================= */}
      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-slate-600">

        e-KYC & Consent Vault · Sepolia Testnet ·
        Smart contract deployed on Ethereum

      </footer>

    </main>
  );
}

// =========================
// Transaction Component
// =========================

function TransactionBox({
  hash,
}: {
  hash: string;
}) {
  return (

    <div className="rounded-xl border border-white/10 bg-[#070b14] p-4">

      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Transaction Hash
      </p>

      <a
        href={`https://sepolia.etherscan.io/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block break-all font-mono text-xs text-blue-400 underline decoration-blue-400/30 underline-offset-2 hover:text-blue-300"
      >
        {hash}
      </a>

    </div>

  );
}