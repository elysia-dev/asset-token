import "dotenv/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "hardhat-gas-reporter";

import { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
  solidity: "0.7.4",
  networks: {
    hardhat: {},
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: { mnemonic: process.env.MNEMONIC },
      chainId: 3,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
  },
};

export default config;