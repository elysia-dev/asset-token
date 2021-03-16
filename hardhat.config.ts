import "dotenv/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-solhint"
import "@nomiclabs/hardhat-etherscan"
import "hardhat-typechain";
// import "solidity-coverage"
// Gas-reporter's parser dependency makes Warning:
// Accessing non-existent property 'INVALID_ALT_NUMBER' of module exports inside circular dependency
import "hardhat-gas-reporter";



import { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.2",
    settings: {
      optimizer: {
        enabled: true
      }
    }
  },
  networks: {
    hardhat: {},
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.ADMIN || ''],
      chainId: 1,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.ADMIN || ''],
      chainId: 3,
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.ADMIN || ''],
      chainId: 42,
    },
    binanceTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [process.env.BINANCE_ADMIN || ''],
    },
    binanceMainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [process.env.BINANCE_ADMIN || ''],
    }
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'KRW',
      showTimeSpent: true
    }
  }
};

export default config;