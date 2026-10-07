import { expect } from "chai";
import { network } from "hardhat";

describe("KycVault", function () {
  async function deployKycVault() {
    const { ethers } = await network.connect();

    const [issuer, holder, verifier] = await ethers.getSigners();

    const KycVault = await ethers.getContractFactory("KycVault");
    const kycVault = await KycVault.deploy();

    await kycVault.waitForDeployment();

    return {
      kycVault,
      issuer,
      holder,
      verifier,
      ethers,
    };
  }

  it("should issue a credential", async function () {
    const { kycVault, issuer, holder, ethers } =
      await deployKycVault();

    const documentHash = ethers.keccak256(
      ethers.toUtf8Bytes("KYC Document 1")
    );

    await kycVault
      .connect(issuer)
      .issueCredential(holder.address, documentHash);

    const credential =
      await kycVault.getCredential(holder.address);

    expect(credential.hash).to.equal(documentHash);
    expect(credential.issuer).to.equal(issuer.address);
    expect(credential.valid).to.equal(true);
  });

  it("should return true when consent and hash both match", async function () {
    const { kycVault, issuer, holder, verifier, ethers } =
      await deployKycVault();

    const documentHash = ethers.keccak256(
      ethers.toUtf8Bytes("KYC Document 1")
    );

    // Issuer issues credential
    await kycVault
      .connect(issuer)
      .issueCredential(holder.address, documentHash);

    // Holder gives consent to verifier
    await kycVault
      .connect(holder)
      .setConsent(verifier.address, true);

    // Verifier checks the credential
    const result = await kycVault
      .connect(verifier)
      .isValid(holder.address, documentHash);

    expect(result).to.equal(true);
  });

  it("should return false for the wrong document hash", async function () {
    const { kycVault, issuer, holder, verifier, ethers } =
      await deployKycVault();

    const correctHash = ethers.keccak256(
      ethers.toUtf8Bytes("Correct Document")
    );

    const wrongHash = ethers.keccak256(
      ethers.toUtf8Bytes("Wrong Document")
    );

    await kycVault
      .connect(issuer)
      .issueCredential(holder.address, correctHash);

    await kycVault
      .connect(holder)
      .setConsent(verifier.address, true);

    const result = await kycVault
      .connect(verifier)
      .isValid(holder.address, wrongHash);

    expect(result).to.equal(false);
  });

  it("should return false when consent is not given", async function () {
    const { kycVault, issuer, holder, verifier, ethers } =
      await deployKycVault();

    const documentHash = ethers.keccak256(
      ethers.toUtf8Bytes("KYC Document")
    );

    await kycVault
      .connect(issuer)
      .issueCredential(holder.address, documentHash);

    // No consent from holder

    const result = await kycVault
      .connect(verifier)
      .isValid(holder.address, documentHash);

    expect(result).to.equal(false);
  });

  it("should allow holder to revoke consent", async function () {
    const { kycVault, issuer, holder, verifier, ethers } =
      await deployKycVault();

    const documentHash = ethers.keccak256(
      ethers.toUtf8Bytes("KYC Document")
    );

    await kycVault
      .connect(issuer)
      .issueCredential(holder.address, documentHash);

    await kycVault
      .connect(holder)
      .setConsent(verifier.address, true);

    let result = await kycVault
      .connect(verifier)
      .isValid(holder.address, documentHash);

    expect(result).to.equal(true);

    // Holder revokes consent
    await kycVault
      .connect(holder)
      .setConsent(verifier.address, false);

    result = await kycVault
      .connect(verifier)
      .isValid(holder.address, documentHash);

    expect(result).to.equal(false);
  });
});