import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INITIAL_SUPPLY: bigint = 1_000_000_000n;

const GooseTokenModule = buildModule("GooseTokenModule", (m) => {
  const gooseToken = m.contract("GooseToken", [INITIAL_SUPPLY, []]);

  return { lock: gooseToken };
});

export default GooseTokenModule;
