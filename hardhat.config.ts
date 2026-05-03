import { HardhatUserConfig } from 'hardhat/config';
import "@nomicfoundation/hardhat-toolbox";
import type { type } from 'node:os';

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // ──────────────────────────────────────────
    // Ganache GUI  (mặc định port 7545)
    // Mở Ganache Desktop → New Workspace → port 7545
    // ──────────────────────────────────────────
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      // Dán private key tài khoản #0 từ Ganache vào đây
      accounts: [
        "0x2d81eb4e74bd73c2877c210d6de2f31bf7254ea2d119f2e25d1b5cb00dca51ea"
      ],
    },

    // ──────────────────────────────────────────
    // Ganache CLI  (port 8545)
    // Chạy: npx ganache --port 8545 --chainId 1337
    // ──────────────────────────────────────────
    ganacheCli: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      accounts: [
        "0x2d81eb4e74bd73c2877c210d6de2f31bf7254ea2d119f2e25d1b5cb00dca51ea"
      ],
    },

    // Hardhat built-in network (dùng khi test tự động)
    hardhat: {
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
