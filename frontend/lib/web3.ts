import { BrowserProvider, Contract, Signer } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract";

const SEPOLIA_CHAIN_ID = "0xaa36a7";

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  // Ask MetaMask to let the user choose which account
  // the website should have access to.
  await window.ethereum.request({
    method: "wallet_requestPermissions",
    params: [
      {
        eth_accounts: {},
      },
    ],
  });

  // Make sure MetaMask is on Sepolia
  const chainId = await window.ethereum.request({
    method: "eth_chainId",
  });

  if (chainId !== SEPOLIA_CHAIN_ID) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  }

  const provider = new BrowserProvider(window.ethereum);

  const accounts = await provider.send("eth_accounts", []);

  if (!accounts || accounts.length === 0) {
    throw new Error("No MetaMask account connected.");
  }

  const signer = await provider.getSigner(accounts[0]);

  const address = await signer.getAddress();

  const network = await provider.getNetwork();

  if (network.chainId !== 11155111n) {
    throw new Error("Please switch MetaMask to Sepolia.");
  }

  return {
    provider,
    signer,
    address,
  };
}

export async function getContract(signer: Signer) {
  return new Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    signer
  );
}