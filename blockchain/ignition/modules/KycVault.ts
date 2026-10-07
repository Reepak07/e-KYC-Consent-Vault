import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("KycVaultModule", (m) => {
  const kycVault = m.contract("KycVault");

  return { kycVault };
});